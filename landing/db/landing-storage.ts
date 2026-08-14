import type { ClientMetricInput, SurveyInput, WaitlistInput } from "../app/lib/input";
import { hashSessionToken } from "../app/lib/session";

const DAY_MS = 24 * 60 * 60 * 1000;
const PENDING_RETENTION_DAYS = 14;
const DATA_RETENTION_DAYS = 365;

function isoBefore(now: Date, days: number) {
  return new Date(now.getTime() - days * DAY_MS).toISOString();
}

export async function purgeExpiredData(db: D1Database, now = new Date()) {
  const pendingCutoff = isoBefore(now, PENDING_RETENTION_DAYS);
  const dataCutoff = isoBefore(now, DATA_RETENTION_DAYS);
  const rateLimitCutoff = Math.floor(now.getTime() / 1000) - 60 * 60;

  await db.batch([
    db.prepare("DELETE FROM survey_responses WHERE created_at < ?").bind(dataCutoff),
    db.prepare("DELETE FROM landing_events WHERE created_at < ?").bind(dataCutoff),
    db.prepare(`DELETE FROM waitlist_entries
      WHERE (verified_at IS NULL AND created_at < ?)
         OR (verified_at IS NOT NULL AND created_at < ?)`)
      .bind(pendingCutoff, dataCutoff),
    db.prepare("DELETE FROM request_rate_limits WHERE window_start < ?").bind(rateLimitCutoff),
  ]);
}

export async function storeWaitlist(
  db: D1Database,
  input: WaitlistInput,
  sessionToken: string,
) {
  const now = new Date();
  const id = crypto.randomUUID();
  const tokenHash = await hashSessionToken(sessionToken);
  const timestamp = now.toISOString();
  const eventId = crypto.randomUUID();
  const eventKey = `waitlist:${id}`;
  const eventProperties = JSON.stringify({
    page_version: "landing-v1",
    channel_code: input.channelCode,
  });

  const [insert] = await db.batch([
    db.prepare(`INSERT OR IGNORE INTO waitlist_entries
      (id, email, consent_version, consented_at, verified_at, channel_code, management_token_hash, created_at)
      VALUES (?, ?, ?, ?, NULL, ?, ?, ?)`)
      .bind(id, input.email, input.consentVersion, timestamp, input.channelCode, tokenHash, timestamp),
    db.prepare(`INSERT OR IGNORE INTO landing_events
      (id, event_name, event_key, properties_json, created_at)
      SELECT ?, 'waitlist_submit', ?, ?, ?
      FROM waitlist_entries
      WHERE id = ? AND management_token_hash = ?`)
      .bind(eventId, eventKey, eventProperties, timestamp, id, tokenHash),
  ]);

  return { created: insert.meta.changes === 1 };
}

export async function storeSurvey(
  db: D1Database,
  input: SurveyInput,
  sessionToken: string,
) {
  const tokenHash = await hashSessionToken(sessionToken);
  const waitlist = await db
    .prepare("SELECT id FROM waitlist_entries WHERE management_token_hash = ? LIMIT 1")
    .bind(tokenHash)
    .first<{ id: string }>();

  if (!waitlist) return { authorized: false };

  const timestamp = new Date().toISOString();
  const statements = [
    db.prepare(`INSERT INTO survey_responses
      (id, waitlist_id, training_frequency, device, logging_method, progression_method, interview_opt_in, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(waitlist_id) DO UPDATE SET
        training_frequency = excluded.training_frequency,
        device = excluded.device,
        logging_method = excluded.logging_method,
        progression_method = excluded.progression_method,
        interview_opt_in = excluded.interview_opt_in,
        updated_at = excluded.updated_at`)
      .bind(
        crypto.randomUUID(),
        waitlist.id,
        input.trainingFrequency,
        input.device,
        input.loggingMethod,
        input.progressionMethod,
        input.interviewOptIn ? 1 : 0,
        timestamp,
        timestamp,
      ),
    db.prepare(`INSERT OR IGNORE INTO landing_events
      (id, event_name, event_key, properties_json, created_at)
      VALUES (?, 'survey_complete', ?, ?, ?)`)
      .bind(
        crypto.randomUUID(),
        `survey:${waitlist.id}`,
        JSON.stringify({ page_version: "landing-v1" }),
        timestamp,
      ),
  ];

  if (input.interviewOptIn) {
    statements.push(
      db.prepare(`INSERT OR IGNORE INTO landing_events
        (id, event_name, event_key, properties_json, created_at)
        VALUES (?, 'interview_opt_in', ?, ?, ?)`)
        .bind(
          crypto.randomUUID(),
          `interview:${waitlist.id}`,
          JSON.stringify({ page_version: "landing-v1" }),
          timestamp,
        ),
    );
  }

  await db.batch(statements);
  return { authorized: true };
}

export async function deleteWaitlistBySession(db: D1Database, sessionToken: string) {
  const tokenHash = await hashSessionToken(sessionToken);

  const [, deletion] = await db.batch([
    db.prepare(`DELETE FROM survey_responses
      WHERE waitlist_id IN (
        SELECT id FROM waitlist_entries WHERE management_token_hash = ?
      )`).bind(tokenHash),
    db.prepare("DELETE FROM waitlist_entries WHERE management_token_hash = ?").bind(tokenHash),
  ]);

  return { deleted: deletion.meta.changes === 1 };
}

export async function storeClientMetric(db: D1Database, input: ClientMetricInput) {
  const eventKey = `client:${input.eventId}`;
  await db
    .prepare(`INSERT INTO landing_events
      (id, event_name, event_key, properties_json, created_at)
      SELECT ?, ?, ?, ?, ?
      WHERE NOT EXISTS (
        SELECT 1 FROM landing_events WHERE event_key = ?
      )`)
    .bind(
      crypto.randomUUID(),
      input.name,
      eventKey,
      JSON.stringify(input.properties),
      new Date().toISOString(),
      eventKey,
    )
    .run();
}

export async function consumeRateLimit(
  db: D1Database,
  visitorToken: string,
  route: string,
  limit: number,
) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const windowStart = nowSeconds - (nowSeconds % 60);
  const key = await hashSessionToken(`${visitorToken}:${route}`);
  const insertion = await db.prepare(`INSERT INTO request_rate_limits
    (id, key, window_start)
    SELECT ?, ?, ?
    WHERE (
      SELECT count(*) FROM request_rate_limits
      WHERE key = ? AND window_start = ?
    ) < ?`)
    .bind(crypto.randomUUID(), key, windowStart, key, windowStart, limit)
    .run();
  return insertion.meta.changes === 1;
}
