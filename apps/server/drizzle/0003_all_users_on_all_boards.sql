-- Alle bekannten Benutzer werden aktive Teilnehmer jedes Boards und kommen in den
-- Rotationstopf. Bestehende Mitgliedschaften (auch inaktive) bleiben unverändert.
WITH joined AS (
	INSERT INTO "board_members" ("board_id", "user_id")
	SELECT b."id", u."id" FROM "boards" b CROSS JOIN "users" u
	ON CONFLICT DO NOTHING
	RETURNING "board_id", "user_id"
)
INSERT INTO "rotation_pool" ("board_id", "user_id")
SELECT j."board_id", j."user_id" FROM joined j
ON CONFLICT DO NOTHING;
