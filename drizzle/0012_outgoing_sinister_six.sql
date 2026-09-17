PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `invoice_items` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`description` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`package_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`package_id`) REFERENCES `customer_packages`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `invoice_items_invoice_idx` ON `invoice_items` (`invoice_id`);--> statement-breakpoint
CREATE INDEX `invoice_items_package_idx` ON `invoice_items` (`package_id`);--> statement-breakpoint
-- Every invoice so far sold exactly one thing: carry it over as its one line.
INSERT INTO `invoice_items` (`id`, `invoice_id`, `sort_order`, `description`, `amount_cents`, `package_id`, `created_at`, `updated_at`)
SELECT
	lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6))),
	`id`,
	0,
	coalesce(`description`, 'Membership'),
	`subtotal_cents`,
	`package_id`,
	`created_at`,
	`updated_at`
FROM `invoices`;--> statement-breakpoint
-- SQLite cannot drop a column that sits in a foreign key, so the table is
-- rebuilt without `package_id`, `description`, `valid_from`, `valid_until`.
CREATE TABLE `__new_invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_number` text NOT NULL,
	`customer_id` text NOT NULL,
	`subtotal_cents` integer NOT NULL,
	`discount_cents` integer DEFAULT 0 NOT NULL,
	`total_cents` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`payment_method` text,
	`issue_date` text NOT NULL,
	`due_date` text,
	`paid_date` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_invoices` (`id`, `invoice_number`, `customer_id`, `subtotal_cents`, `discount_cents`, `total_cents`, `status`, `payment_method`, `issue_date`, `due_date`, `paid_date`, `notes`, `created_at`, `updated_at`)
SELECT `id`, `invoice_number`, `customer_id`, `subtotal_cents`, `discount_cents`, `total_cents`, `status`, `payment_method`, `issue_date`, `due_date`, `paid_date`, `notes`, `created_at`, `updated_at` FROM `invoices`;--> statement-breakpoint
DROP TABLE `invoices`;--> statement-breakpoint
ALTER TABLE `__new_invoices` RENAME TO `invoices`;--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_invoice_number_unique` ON `invoices` (`invoice_number`);--> statement-breakpoint
CREATE INDEX `invoices_customer_idx` ON `invoices` (`customer_id`);--> statement-breakpoint
CREATE INDEX `invoices_paid_date_idx` ON `invoices` (`paid_date`);--> statement-breakpoint
CREATE INDEX `invoices_status_idx` ON `invoices` (`status`);--> statement-breakpoint
PRAGMA foreign_keys=ON;
