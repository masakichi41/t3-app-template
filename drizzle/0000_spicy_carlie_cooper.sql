CREATE TABLE "template_account" (
	"userId" varchar(255) NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"providerAccountId" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(255),
	"scope" varchar(255),
	"id_token" text,
	"session_state" varchar(255),
	CONSTRAINT "template_account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "template_note" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"title" varchar(255) DEFAULT '' NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT '2025-10-16T05:47:00.474Z' NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "template_session" (
	"sessionToken" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "template_user" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"email" varchar(255),
	"emailVerified" timestamp with time zone,
	"image" varchar(255)
);
--> statement-breakpoint
ALTER TABLE "template_account" ADD CONSTRAINT "template_account_userId_template_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."template_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_note" ADD CONSTRAINT "template_note_userId_template_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."template_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_session" ADD CONSTRAINT "template_session_userId_template_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."template_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "template_account" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "template_session" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "session_expires_idx" ON "template_session" USING btree ("expires");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_unique" ON "template_user" USING btree ("email");