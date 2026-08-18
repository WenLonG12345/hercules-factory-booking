CREATE TABLE `ledger_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`direction` text NOT NULL,
	`slug` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ledger_categories_slug_unique` ON `ledger_categories` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `ledger_categories_name_idx` ON `ledger_categories` (`direction`,`name`);--> statement-breakpoint
CREATE INDEX `ledger_categories_direction_idx` ON `ledger_categories` (`direction`);--> statement-breakpoint
CREATE TABLE `ledger_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`direction` text NOT NULL,
	`category_id` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`customer_id` text,
	`coach_id` text,
	`invoice_id` text,
	`vendor` text,
	`notes` text,
	`receipt_url` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `ledger_categories`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`coach_id`) REFERENCES `coaches`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ledger_entries_invoice_id_unique` ON `ledger_entries` (`invoice_id`);--> statement-breakpoint
CREATE INDEX `ledger_entries_date_idx` ON `ledger_entries` (`date`);--> statement-breakpoint
CREATE INDEX `ledger_entries_direction_idx` ON `ledger_entries` (`direction`);--> statement-breakpoint
CREATE INDEX `ledger_entries_category_idx` ON `ledger_entries` (`category_id`);--> statement-breakpoint
DROP TABLE `expenses`;
--> statement-breakpoint
-- Starter categories. The admin owns the list from here: rename, archive or add.
INSERT INTO `ledger_categories` (`id`, `name`, `direction`, `slug`, `sort_order`, `is_archived`, `created_at`, `updated_at`) VALUES
	(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random())%4+1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))), 'Package Sale', 'income', 'package_sale', 0, 0, unixepoch(), unixepoch()),
	(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random())%4+1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))), 'Per Entry', 'income', NULL, 1, 0, unixepoch(), unixepoch()),
	(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random())%4+1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))), 'Merchandise', 'income', NULL, 2, 0, unixepoch(), unixepoch()),
	(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random())%4+1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))), 'Drinks', 'income', NULL, 3, 0, unixepoch(), unixepoch()),
	(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random())%4+1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))), 'Promo', 'income', NULL, 4, 0, unixepoch(), unixepoch()),
	(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random())%4+1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))), 'Other Income', 'income', NULL, 5, 0, unixepoch(), unixepoch()),
	(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random())%4+1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))), 'Rent', 'expense', NULL, 6, 0, unixepoch(), unixepoch()),
	(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random())%4+1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))), 'Utilities', 'expense', NULL, 7, 0, unixepoch(), unixepoch()),
	(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random())%4+1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))), 'Coach Salary', 'expense', 'coach_salary', 8, 0, unixepoch(), unixepoch()),
	(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random())%4+1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))), 'Marketing', 'expense', NULL, 9, 0, unixepoch(), unixepoch()),
	(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random())%4+1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))), 'Equipment', 'expense', NULL, 10, 0, unixepoch(), unixepoch()),
	(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random())%4+1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))), 'Cleaning', 'expense', NULL, 11, 0, unixepoch(), unixepoch()),
	(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random())%4+1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))), 'Maintenance', 'expense', NULL, 12, 0, unixepoch(), unixepoch()),
	(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random())%4+1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))), 'Other Expense', 'expense', NULL, 13, 0, unixepoch(), unixepoch());
