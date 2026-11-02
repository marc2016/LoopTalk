# Tasks

## 1. Datenbank

- [x] 1.1 Migration `apps/server/drizzle/0003_all_users_on_all_boards.sql` (plus Journal-Eintrag) anlegen: fehlende Kombinationen Benutzer × Board als aktive `board_members` und in `rotation_pool` eintragen, bestehende Zeilen unverändert lassen. Prüfen: Servertest mit vorbefülltem Stand (inaktiver Ben, Carla nur auf anderem Board) zeigt danach Carla aktiv und im Topf, Ben weiter inaktiv und nicht im Topf

## 2. Server: Teilnahme aller Benutzer

- [x] 2.1 In `services/boards.ts` den Beitritt aus `open` in eine gemeinsame Funktion `join(board, userId)` ziehen (Sperre, `onConflictDoNothing`, `addToPool`, Audit `member.joined`, Live-Update) und `open` darauf umstellen. Prüfen: bestehender Test zum Beitritt beim Öffnen bleibt grün
- [x] 2.2 `boards.joinAll(userId)` ergänzen: alle Boards ohne Zeile für den Benutzer finden und jeweils `join` ausführen, Inaktive bleiben unberührt. Prüfen: Servertest „Dora wird beim Login auf zwei Boards Teilnehmerin, im Topf, je ein `member.joined`, je ein Live-Update“ und „inaktiver Ben bleibt nach erneutem Login inaktiv“
- [x] 2.3 `auth/routes.ts`: nach dem Upsert `joinAll` aufrufen, Fehler loggen ohne den Login abzubrechen. Prüfen: API-Test mit Fake-IdP, ein neuer Benutzer steht nach dem Callback in der Teilnehmerliste eines bestehenden Boards
- [x] 2.4 `create`: alle Benutzer in `board_members` eintragen, Topf mit allen außer dem Ersteller, nur `board.created` im Audit. Prüfen: Servertest „Anna erstellt Board, Ben und Carla aktiv und im Topf, Anna moderiert und ist nicht im Topf, Audit nur `board.created`“
- [x] 2.5 `listMine` → `listAll` (alle Boards nach Name, `id`) und Route `GET /api/boards` umstellen. Prüfen: Servertest „Ben sieht Annas Board, ohne es geöffnet zu haben“; bisherige Tests zu `listMine` angepasst
- [x] 2.6 Bestehende Servertests an das neue Modell anpassen (z. B. „zu wenige Teilnehmer“ nur mit einem Benutzer in der DB, Audit-Reihenfolgen, Beitritt). Prüfen: `npm test -w apps/server` grün

## 3. Web: Rollen-Auswahl

- [x] 3.1 `RoleSelect` in `components/meeting-bar.tsx` auf `Popover` + `Command` umbauen: Auslöser als `combobox` mit `aria-label`, Avatar, gekürztem Namen und Chevron in normaler Höhe; Popover mindestens so breit wie der Auslöser und etwa 18rem; Suchfeld mit Fokus; Einträge mit Avatar, Haken für die aktuelle Person, gesperrte andere Rolle mit Hinweis, „inaktiv“ für eingetragene Inaktive, „nicht festgelegt“ oben beim Protokoll, „Niemand gefunden“ ohne Treffer. Prüfen: im Browser „kra“ + Enter wählt Carla Kraus, Escape schließt ohne Änderung, `npm run lint` und `npm run typecheck` grün
- [x] 3.2 Startseite `pages/home-page.tsx`: Überschrift „Boards“, Beschreibung ohne „erstellt oder über einen Link geöffnet“. Prüfen: Startseite zeigt fremde Boards

## 4. e2e

- [x] 4.1 Helfer in `e2e/tests/helpers.ts`, der auf einem Board alle Testbenutzer außer den genannten über `PATCH /api/boards/:slug/participants/:userId` inaktiv setzt. Prüfen: wird in 4.2 genutzt
- [x] 4.2 `meeting-flow.spec.ts` anpassen: nur Anna und Ben aktiv, damit Anna als Moderatorin gezogen wird; die Warnung „zu wenige Teilnehmer“ über das Inaktivsetzen von Ben prüfen statt über den ersten Beitritt. Prüfen: e2e grün
- [x] 4.3 Neuer e2e-Test Rollen-Auswahl: „Moderation“ öffnen, nach Teil des Namens suchen, mit Enter wählen, die andere Rolle ist gesperrt, „Protokoll“ auf „nicht festgelegt“ setzen, Änderung live beim zweiten Browser. Prüfen: e2e grün

## 5. Abschluss

- [x] 5.1 README (Abschnitt zu Boards und Teilnehmern) an „alle Benutzer sind Teilnehmer jedes Boards“ anpassen. Prüfen: keine Stelle mehr, die den Beitritt beim ersten Öffnen beschreibt
- [x] 5.2 Komplette Docker-Testsuite (Server, Web, e2e gegen das Prod-Image) ausführen. Prüfen: alles grün
