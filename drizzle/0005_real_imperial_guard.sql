CREATE TABLE `pricing_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`price_cents` integer NOT NULL,
	`unit` text,
	`features` text,
	`highlight` integer DEFAULT false NOT NULL,
	`whatsapp_message` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`zh` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `landing_page_content` ADD `pricing_title` text DEFAULT 'Pricing' NOT NULL;