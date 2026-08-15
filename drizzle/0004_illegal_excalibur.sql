CREATE TABLE `promotions` (
	`id` text PRIMARY KEY NOT NULL,
	`image_url` text NOT NULL,
	`title` text NOT NULL,
	`whatsapp_message` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `landing_page_content` ADD `promotions_title` text DEFAULT 'Promotions' NOT NULL;