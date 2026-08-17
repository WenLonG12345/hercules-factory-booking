CREATE TABLE `package_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`total_credits` integer,
	`price_cents` integer DEFAULT 0 NOT NULL,
	`validity_days` integer DEFAULT 90 NOT NULL,
	`description` text,
	`is_active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `customer_packages` ADD `plan_id` text REFERENCES package_plans(id);