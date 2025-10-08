CREATE TABLE "ytweet_post" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"content" varchar(256) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"profilePicture" varchar(256),
	"authorName" varchar(256) NOT NULL,
	"updatedAt" timestamp with time zone
);
