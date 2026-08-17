import type { ClientMetricInput, SurveyInput, WaitlistInput } from "../app/lib/input";
import { createSessionToken, hashSessionToken } from "../app/lib/session";

const DAY_MS = 24 * 60 * 60 * 1000;
const PENDING_RETENTION_DAYS = 14;
const DATA_RETENTION_DAYS = 365;

function isoBefore(now: Date, days: number) {
  return new Date(now.getTime() - days * DAY_MS).toISOString();
}

function isoAfter(now: Date, days: number) {
  return new Date(now.getTime() + days * DAY_MS).toISOString();
}

const RETENTION_PURGE_NAME = "retention_purge";
// 요청 시점 정리가 매 쓰기마다 돌지 않도록 두는 최소 간격이다.
const PURGE_MIN_INTERVAL_MS = 6 * 60 * 60 * 1000;

/**
 * 정리를 실행하고 실행 시각을 기록한다.
 *
 * 배포 플랫폼이 예약 작업을 지원하지 않으므로 두 경로가 이 함수를 부른다.
 * 인증된 외부 스케줄러는 `force: true`로 즉시 실행하고, 요청 시점 정리는
 * 최소 간격이 지났을 때만 실행한다. TASK-0001 / WF-09 참조.
 *
 * 실행했으면 true, 간격이 남아 건너뛰었으면 false를 반환한다.
 */
export async function runRetentionPurge(
  db: D1Database,
  options: { force?: boolean; now?: Date } = {},
) {
  const now = options.now ?? new Date();
  const nowSeconds = Math.floor(now.getTime() / 1000);

  if (!options.force) {
    const previous = await db
      .prepare("SELECT last_run_at FROM maintenance_runs WHERE name = ?")
      .bind(RETENTION_PURGE_NAME)
      .first<{ last_run_at: number }>();
    const elapsedMs = previous ? (nowSeconds - previous.last_run_at) * 1000 : Infinity;
    if (elapsedMs < PURGE_MIN_INTERVAL_MS) return false;
  }

  await purgeExpiredData(db, now);
  await db
    .prepare(`INSERT INTO maintenance_runs (name, last_run_at) VALUES (?, ?)
      ON CONFLICT(name) DO UPDATE SET last_run_at = excluded.last_run_at`)
    .bind(RETENTION_PURGE_NAME, nowSeconds)
    .run();
  return true;
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

  // 확인 토큰은 원문을 저장하지 않는다. 해시만 남기고 원문은 메일 링크에만 실린다.
  const confirmationToken = createSessionToken();
  const confirmationHash = await hashSessionToken(confirmationToken);
  const confirmationExpiresAt = isoAfter(now, PENDING_RETENTION_DAYS);

  const [insert] = await db.batch([
    db.prepare(`INSERT OR IGNORE INTO waitlist_entries
      (id, email, consent_version, consented_at, verified_at, channel_code, management_token_hash,
       confirmation_token_hash, confirmation_expires_at, created_at)
      VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, ?)`)
      .bind(
        id, input.email, input.consentVersion, timestamp, input.channelCode, tokenHash,
        confirmationHash, confirmationExpiresAt, timestamp,
      ),
    db.prepare(`INSERT OR IGNORE INTO landing_events
      (id, event_name, event_key, properties_json, created_at)
      SELECT ?, 'waitlist_submit', ?, ?, ?
      FROM waitlist_entries
      WHERE id = ? AND management_token_hash = ?`)
      .bind(eventId, eventKey, eventProperties, timestamp, id, tokenHash),
  ]);

  const created = insert.meta.changes === 1;
  // 중복 등록이면 새 토큰을 발급하지 않는다. 기존 확인 링크가 그대로 유효하다.
  return { created, confirmationToken: created ? confirmationToken : null };
}

/**
 * 확인 토큰을 소비해 항목을 확인 상태로 만든다.
 *
 * 성공 시 토큰 해시를 지워 링크 재사용을 막는다. 만료·위조·재사용은 모두
 * 같은 결과(false)로 처리해 응답으로 이메일 존재 여부를 추론할 수 없게 한다.
 */
export async function confirmWaitlistByToken(
  db: D1Database,
  token: string,
  now = new Date(),
) {
  const tokenHash = await hashSessionToken(token);
  const timestamp = now.toISOString();
  const eventId = crypto.randomUUID();

  const entry = await db
    .prepare(`SELECT id, channel_code FROM waitlist_entries
      WHERE confirmation_token_hash = ?
        AND verified_at IS NULL
        AND confirmation_expires_at > ?`)
    .bind(tokenHash, timestamp)
    .first<{ id: string; channel_code: string }>();

  if (!entry) return { confirmed: false };

  const eventProperties = JSON.stringify({
    page_version: "landing-v1",
    channel_code: entry.channel_code,
  });

  const [update] = await db.batch([
    db.prepare(`UPDATE waitlist_entries
      SET verified_at = ?, confirmation_token_hash = NULL, confirmation_expires_at = NULL
      WHERE confirmation_token_hash = ? AND verified_at IS NULL`)
      .bind(timestamp, tokenHash),
    db.prepare(`INSERT OR IGNORE INTO landing_events
      (id, event_name, event_key, properties_json, created_at)
      VALUES (?, 'waitlist_confirm', ?, ?, ?)`)
      .bind(eventId, `waitlist_confirm:${entry.id}`, eventProperties, timestamp),
  ]);

  return { confirmed: update.meta.changes === 1 };
}

/** 확인된 대기자 수만 센다. 미확인 항목은 수요 신호로 세지 않는다. */
export async function countVerifiedWaitlist(db: D1Database) {
  const row = await db
    .prepare("SELECT count(*) AS verified FROM waitlist_entries WHERE verified_at IS NOT NULL")
    .first<{ verified: number }>();
  return { verified: row?.verified ?? 0 };
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
