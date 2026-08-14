CREATE TABLE `request_rate_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`window_start` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `request_rate_limits_key_window_idx` ON `request_rate_limits` (`key`,`window_start`);--> statement-breakpoint
DROP INDEX `waitlist_email_idx`;--> statement-breakpoint
ALTER TABLE `waitlist_entries` ADD `verified_at` text;--> statement-breakpoint
ALTER TABLE `waitlist_entries` ADD `management_token_hash` text;--> statement-breakpoint
CREATE UNIQUE INDEX `waitlist_email_ci_idx` ON `waitlist_entries` (lower("email"));--> statement-breakpoint
CREATE UNIQUE INDEX `waitlist_management_token_idx` ON `waitlist_entries` (`management_token_hash`);--> statement-breakpoint
ALTER TABLE `landing_events` ADD `event_key` text;--> statement-breakpoint
CREATE UNIQUE INDEX `landing_events_event_key_idx` ON `landing_events` (`event_key`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `landing_events_name_created_idx` ON `landing_events` (`event_name`,`created_at`);--> statement-breakpoint
PRAGMA defer_foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_survey_responses` (
	`id` text PRIMARY KEY NOT NULL,
	`waitlist_id` text NOT NULL,
	`training_frequency` text NOT NULL,
	`device` text NOT NULL,
	`logging_method` text NOT NULL,
	`progression_method` text NOT NULL,
	`interview_opt_in` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`waitlist_id`) REFERENCES `waitlist_entries`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_survey_responses`("id", "waitlist_id", "training_frequency", "device", "logging_method", "progression_method", "interview_opt_in", "created_at", "updated_at")
SELECT survey_responses."id", survey_responses."waitlist_id", survey_responses."training_frequency", survey_responses."device", survey_responses."logging_method", survey_responses."progression_method", survey_responses."interview_opt_in", survey_responses."created_at", survey_responses."created_at"
FROM `survey_responses`
INNER JOIN `waitlist_entries` ON waitlist_entries."id" = survey_responses."waitlist_id";--> statement-breakpoint
DROP TABLE `survey_responses`;--> statement-breakpoint
ALTER TABLE `__new_survey_responses` RENAME TO `survey_responses`;--> statement-breakpoint
PRAGMA defer_foreign_keys=OFF;--> statement-breakpoint
CREATE UNIQUE INDEX `survey_waitlist_idx` ON `survey_responses` (`waitlist_id`);
