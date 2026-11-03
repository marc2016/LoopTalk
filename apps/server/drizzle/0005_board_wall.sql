-- Wand des Boards; bestehende Boards sind aus Papier.
ALTER TABLE "boards" ADD COLUMN "wall" text DEFAULT 'paper' NOT NULL;--> statement-breakpoint
ALTER TABLE "boards" ADD CONSTRAINT "boards_wall_check" CHECK ("boards"."wall" IN ('paper', 'cork', 'whiteboard'));