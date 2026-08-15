CREATE TABLE `testimonials` (
	`id` text PRIMARY KEY NOT NULL,
	`author` text NOT NULL,
	`rating` integer DEFAULT 5 NOT NULL,
	`quote` text NOT NULL,
	`source` text DEFAULT 'Google' NOT NULL,
	`reviewed_at` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `landing_page_content` ADD `testimonials_title` text DEFAULT 'What members say' NOT NULL;