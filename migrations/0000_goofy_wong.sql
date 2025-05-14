CREATE TABLE "leaderboard" (
	"id" serial PRIMARY KEY NOT NULL,
	"nickname" varchar(50) NOT NULL,
	"difficulty" varchar(10) NOT NULL,
	"time_seconds" integer NOT NULL,
	"puzzle_id" varchar(100) NOT NULL,
	"board_snapshot" text NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
