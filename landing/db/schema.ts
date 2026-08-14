import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const waitlistEntries = sqliteTable(
  "waitlist_entries",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    consentVersion: text("consent_version").notNull(),
    consentedAt: text("consented_at").notNull(),
    channelCode: text("channel_code").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [uniqueIndex("waitlist_email_idx").on(table.email)],
);

export const surveyResponses = sqliteTable(
  "survey_responses",
  {
    id: text("id").primaryKey(),
    waitlistId: text("waitlist_id").notNull(),
    trainingFrequency: text("training_frequency").notNull(),
    device: text("device").notNull(),
    loggingMethod: text("logging_method").notNull(),
    progressionMethod: text("progression_method").notNull(),
    interviewOptIn: integer("interview_opt_in", { mode: "boolean" }).notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [uniqueIndex("survey_waitlist_idx").on(table.waitlistId)],
);

export const landingEvents = sqliteTable("landing_events", {
  id: text("id").primaryKey(),
  eventName: text("event_name").notNull(),
  propertiesJson: text("properties_json").notNull(),
  createdAt: text("created_at").notNull(),
});
