import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const waitlistEntries = sqliteTable(
  "waitlist_entries",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    consentVersion: text("consent_version").notNull(),
    consentedAt: text("consented_at").notNull(),
    verifiedAt: text("verified_at"),
    channelCode: text("channel_code").notNull(),
    managementTokenHash: text("management_token_hash"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("waitlist_email_ci_idx").on(sql`lower(${table.email})`),
    uniqueIndex("waitlist_management_token_idx").on(table.managementTokenHash),
  ],
);

export const surveyResponses = sqliteTable(
  "survey_responses",
  {
    id: text("id").primaryKey(),
    waitlistId: text("waitlist_id")
      .notNull()
      .references(() => waitlistEntries.id, { onDelete: "cascade" }),
    trainingFrequency: text("training_frequency").notNull(),
    device: text("device").notNull(),
    loggingMethod: text("logging_method").notNull(),
    progressionMethod: text("progression_method").notNull(),
    interviewOptIn: integer("interview_opt_in", { mode: "boolean" }).notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [uniqueIndex("survey_waitlist_idx").on(table.waitlistId)],
);

export const landingEvents = sqliteTable(
  "landing_events",
  {
    id: text("id").primaryKey(),
    eventName: text("event_name").notNull(),
    eventKey: text("event_key"),
    propertiesJson: text("properties_json").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("landing_events_event_key_idx").on(table.eventKey),
    index("landing_events_name_created_idx").on(table.eventName, table.createdAt),
  ],
);

// 배포 플랫폼이 예약 작업을 지원하지 않으므로 정리 실행 시각을 남긴다.
// 요청 시점 정리가 매 쓰기마다 반복되지 않게 하는 게이트로 쓴다.
// TASK-0001 / WF-09 참조.
export const maintenanceRuns = sqliteTable("maintenance_runs", {
  name: text("name").primaryKey(),
  lastRunAt: integer("last_run_at").notNull(),
});

export const requestRateLimits = sqliteTable(
  "request_rate_limits",
  {
    id: text("id").primaryKey(),
    key: text("key").notNull(),
    windowStart: integer("window_start").notNull(),
  },
  (table) => [index("request_rate_limits_key_window_idx").on(table.key, table.windowStart)],
);
