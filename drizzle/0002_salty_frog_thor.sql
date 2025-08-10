ALTER TABLE "propertis_post" RENAME COLUMN "name" TO "authorName";--> statement-breakpoint
DROP INDEX "name_idx";--> statement-breakpoint
ALTER TABLE "propertis_post" ADD COLUMN "content" varchar(256);