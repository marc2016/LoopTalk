-- Zettelfarbe für Karten und ihre Stände in der Historie; bestehende Zeilen werden gelb.
ALTER TABLE "cards" ADD COLUMN "color" text DEFAULT 'yellow' NOT NULL;--> statement-breakpoint
ALTER TABLE "meeting_cards" ADD COLUMN "color" text DEFAULT 'yellow' NOT NULL;--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_color_check" CHECK ("cards"."color" IN ('yellow', 'orange', 'pink', 'green', 'blue', 'purple'));--> statement-breakpoint
ALTER TABLE "meeting_cards" ADD CONSTRAINT "meeting_cards_color_check" CHECK ("meeting_cards"."color" IN ('yellow', 'orange', 'pink', 'green', 'blue', 'purple'));