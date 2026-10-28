CREATE TABLE "meeting_discussed" (
	"meeting_id" bigint NOT NULL,
	"card_id" bigint NOT NULL,
	"marked_by" bigint NOT NULL,
	"marked_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "meeting_discussed_meeting_id_card_id_pk" PRIMARY KEY("meeting_id","card_id")
);
--> statement-breakpoint
ALTER TABLE "meeting_cards" ADD COLUMN "discussed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "focus_card_id" bigint;--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "focus_by" bigint;--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "focus_since" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "meeting_discussed" ADD CONSTRAINT "meeting_discussed_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_discussed" ADD CONSTRAINT "meeting_discussed_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_discussed" ADD CONSTRAINT "meeting_discussed_marked_by_users_id_fk" FOREIGN KEY ("marked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_focus_card_id_cards_id_fk" FOREIGN KEY ("focus_card_id") REFERENCES "public"."cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_focus_by_users_id_fk" FOREIGN KEY ("focus_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_focus_check" CHECK (("meetings"."focus_card_id" IS NULL AND "meetings"."focus_by" IS NULL AND "meetings"."focus_since" IS NULL)
        OR ("meetings"."focus_card_id" IS NOT NULL AND "meetings"."focus_by" IS NOT NULL AND "meetings"."focus_since" IS NOT NULL));