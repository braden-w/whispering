CREATE TABLE "assistant_config" (
	"user_id" text NOT NULL,
	"id" text NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"last_accessed_at" timestamp NOT NULL,
	CONSTRAINT "assistant_config_user_id_id_pk" PRIMARY KEY("user_id","id"),
	CONSTRAINT "assistant_config_user_id_url_unique" UNIQUE("user_id","url")
);
--> statement-breakpoint
ALTER TABLE "assistant_config" ADD CONSTRAINT "assistant_config_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;