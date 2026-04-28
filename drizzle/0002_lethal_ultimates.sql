CREATE TABLE "user_check_ins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"scope" varchar(64) DEFAULT 'daily' NOT NULL,
	"check_in_date" date NOT NULL,
	"time_zone" varchar(64) DEFAULT 'Asia/Hong_Kong' NOT NULL,
	"source" varchar(32) DEFAULT 'manual' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_check_ins" ADD CONSTRAINT "user_check_ins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_check_ins_user_scope_date_idx" ON "user_check_ins" USING btree ("user_id","scope","check_in_date");--> statement-breakpoint
CREATE INDEX "user_check_ins_user_scope_created_idx" ON "user_check_ins" USING btree ("user_id","scope","created_at");--> statement-breakpoint
CREATE INDEX "user_check_ins_scope_date_idx" ON "user_check_ins" USING btree ("scope","check_in_date");