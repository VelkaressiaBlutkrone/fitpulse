ALTER TABLE `waitlist_entries` ADD `confirmation_token_hash` text;--> statement-breakpoint
ALTER TABLE `waitlist_entries` ADD `confirmation_expires_at` text;--> statement-breakpoint
CREATE UNIQUE INDEX `waitlist_confirmation_token_idx` ON `waitlist_entries` (`confirmation_token_hash`);