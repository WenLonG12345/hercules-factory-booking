DROP INDEX "auth_session_token_unique";--> statement-breakpoint
DROP INDEX "auth_user_email_unique";--> statement-breakpoint
DROP INDEX "customer_packages_customer_idx";--> statement-breakpoint
DROP INDEX "customer_packages_expiry_idx";--> statement-breakpoint
DROP INDEX "customers_phone_idx";--> statement-breakpoint
DROP INDEX "customers_name_idx";--> statement-breakpoint
DROP INDEX "customers_date_joined_idx";--> statement-breakpoint
DROP INDEX "invoices_invoice_number_unique";--> statement-breakpoint
DROP INDEX "invoices_customer_idx";--> statement-breakpoint
DROP INDEX "invoices_paid_date_idx";--> statement-breakpoint
DROP INDEX "invoices_status_idx";--> statement-breakpoint
DROP INDEX "ledger_categories_slug_unique";--> statement-breakpoint
DROP INDEX "ledger_categories_name_idx";--> statement-breakpoint
DROP INDEX "ledger_categories_direction_idx";--> statement-breakpoint
DROP INDEX "ledger_entries_invoice_id_unique";--> statement-breakpoint
DROP INDEX "ledger_entries_date_idx";--> statement-breakpoint
DROP INDEX "ledger_entries_direction_idx";--> statement-breakpoint
DROP INDEX "ledger_entries_category_idx";--> statement-breakpoint
DROP INDEX "session_attendees_unique_idx";--> statement-breakpoint
DROP INDEX "session_attendees_customer_idx";--> statement-breakpoint
DROP INDEX "sessions_date_idx";--> statement-breakpoint
DROP INDEX "sessions_coach_slot_idx";--> statement-breakpoint
ALTER TABLE `customers` ALTER COLUMN "phone" TO "phone" text;--> statement-breakpoint
CREATE UNIQUE INDEX `auth_session_token_unique` ON `auth_session` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `auth_user_email_unique` ON `auth_user` (`email`);--> statement-breakpoint
CREATE INDEX `customer_packages_customer_idx` ON `customer_packages` (`customer_id`);--> statement-breakpoint
CREATE INDEX `customer_packages_expiry_idx` ON `customer_packages` (`expiry_date`);--> statement-breakpoint
CREATE INDEX `customers_phone_idx` ON `customers` (`phone`);--> statement-breakpoint
CREATE INDEX `customers_name_idx` ON `customers` (`name`);--> statement-breakpoint
CREATE INDEX `customers_date_joined_idx` ON `customers` (`date_joined`);--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_invoice_number_unique` ON `invoices` (`invoice_number`);--> statement-breakpoint
CREATE INDEX `invoices_customer_idx` ON `invoices` (`customer_id`);--> statement-breakpoint
CREATE INDEX `invoices_paid_date_idx` ON `invoices` (`paid_date`);--> statement-breakpoint
CREATE INDEX `invoices_status_idx` ON `invoices` (`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `ledger_categories_slug_unique` ON `ledger_categories` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `ledger_categories_name_idx` ON `ledger_categories` (`direction`,`name`);--> statement-breakpoint
CREATE INDEX `ledger_categories_direction_idx` ON `ledger_categories` (`direction`);--> statement-breakpoint
CREATE UNIQUE INDEX `ledger_entries_invoice_id_unique` ON `ledger_entries` (`invoice_id`);--> statement-breakpoint
CREATE INDEX `ledger_entries_date_idx` ON `ledger_entries` (`date`);--> statement-breakpoint
CREATE INDEX `ledger_entries_direction_idx` ON `ledger_entries` (`direction`);--> statement-breakpoint
CREATE INDEX `ledger_entries_category_idx` ON `ledger_entries` (`category_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `session_attendees_unique_idx` ON `session_attendees` (`session_id`,`customer_id`);--> statement-breakpoint
CREATE INDEX `session_attendees_customer_idx` ON `session_attendees` (`customer_id`);--> statement-breakpoint
CREATE INDEX `sessions_date_idx` ON `sessions` (`date`);--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_coach_slot_idx` ON `sessions` (`date`,`start_time`,`coach_id`);--> statement-breakpoint
ALTER TABLE `customers` ADD `ic` text;