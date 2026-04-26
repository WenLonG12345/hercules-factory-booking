ALTER TABLE "auth_user" ADD COLUMN "role" text DEFAULT 'customer' NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "auth_user_id" text;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_auth_user_id_auth_user_id_fk" FOREIGN KEY ("auth_user_id") REFERENCES "public"."auth_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "customers_auth_user_id_idx" ON "customers" USING btree ("auth_user_id");