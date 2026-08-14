CREATE TABLE `landing_events` (
	`id` text PRIMARY KEY NOT NULL,
	`event_name` text NOT NULL,
	`properties_json` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `survey_responses` (
	`id` text PRIMARY KEY NOT NULL,
	`waitlist_id` text NOT NULL,
	`training_frequency` text NOT NULL,
	`device` text NOT NULL,
	`logging_method` text NOT NULL,
	`progression_method` text NOT NULL,
	`interview_opt_in` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `survey_waitlist_idx` ON `survey_responses` (`waitlist_id`);--> statement-breakpoint
CREATE TABLE `waitlist_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`consent_version` text NOT NULL,
	`consented_at` text NOT NULL,
	`channel_code` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `waitlist_email_idx` ON `waitlist_entries` (`email`);