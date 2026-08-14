import { env } from "cloudflare:workers";
import type { MetricInput, SurveyInput, WaitlistInput } from "../app/lib/input";

let schemaPromise: Promise<void> | null = null;

function database() {
  if (!env.DB) throw new Error("waitlist_storage_unavailable");
  return env.DB;
}

async function initializeSchema() {
  const db = database();
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS waitlist_entries (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL COLLATE NOCASE UNIQUE,
      consent_version TEXT NOT NULL,
      consented_at TEXT NOT NULL,
      channel_code TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS survey_responses (
      id TEXT PRIMARY KEY,
      waitlist_id TEXT NOT NULL UNIQUE,
      training_frequency TEXT NOT NULL,
      device TEXT NOT NULL,
      logging_method TEXT NOT NULL,
      progression_method TEXT NOT NULL,
      interview_opt_in INTEGER NOT NULL,
      created_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS landing_events (
      id TEXT PRIMARY KEY,
      event_name TEXT NOT NULL,
      properties_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS landing_events_name_created_idx ON landing_events (event_name, created_at)"),
  ]);
}

async function ensureSchema() {
  schemaPromise ??= initializeSchema();
  try {
    await schemaPromise;
  } catch (error) {
    schemaPromise = null;
    throw error;
  }
}

export async function storeWaitlist(input: WaitlistInput) {
  await ensureSchema();
  const db = database();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const insert = await db
    .prepare(`INSERT OR IGNORE INTO waitlist_entries
      (id, email, consent_version, consented_at, channel_code, created_at)
      VALUES (?, ?, ?, ?, ?, ?)`)
    .bind(id, input.email, input.consentVersion, now, input.channelCode, now)
    .run();
  const row = await db
    .prepare("SELECT id FROM waitlist_entries WHERE email = ? LIMIT 1")
    .bind(input.email)
    .first<{ id: string }>();

  if (!row) throw new Error("waitlist_write_failed");
  return { id: row.id, created: insert.meta.changes === 1 };
}

export async function storeSurvey(input: SurveyInput) {
  await ensureSchema();
  const db = database();
  const waitlist = await db
    .prepare("SELECT id FROM waitlist_entries WHERE id = ? LIMIT 1")
    .bind(input.waitlistId)
    .first<{ id: string }>();
  if (!waitlist) throw new Error("waitlist_not_found");

  const now = new Date().toISOString();
  await db
    .prepare(`INSERT INTO survey_responses
      (id, waitlist_id, training_frequency, device, logging_method, progression_method, interview_opt_in, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(waitlist_id) DO UPDATE SET
        training_frequency = excluded.training_frequency,
        device = excluded.device,
        logging_method = excluded.logging_method,
        progression_method = excluded.progression_method,
        interview_opt_in = excluded.interview_opt_in`)
    .bind(
      crypto.randomUUID(),
      input.waitlistId,
      input.trainingFrequency,
      input.device,
      input.loggingMethod,
      input.progressionMethod,
      input.interviewOptIn ? 1 : 0,
      now,
    )
    .run();
}

export async function storeMetric(input: MetricInput) {
  await ensureSchema();
  await database()
    .prepare("INSERT INTO landing_events (id, event_name, properties_json, created_at) VALUES (?, ?, ?, ?)")
    .bind(
      crypto.randomUUID(),
      input.name,
      JSON.stringify(input.properties),
      new Date().toISOString(),
    )
    .run();
}
