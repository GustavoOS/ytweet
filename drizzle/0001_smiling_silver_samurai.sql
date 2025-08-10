CREATE TABLE "propertis_post" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"name" varchar(256),
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"profilePicture" varchar(256),
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "name_idx" ON "propertis_post" USING btree ("name");