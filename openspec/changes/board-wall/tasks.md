# Tasks

## 1. Wand im Datenmodell und in der API

- [x] 1.1 Shared-Paket: `BOARD_WALLS`, `BoardWall`, `boardWallSchema`, `updateBoardSchema` (Name und/oder Wand, mindestens eines) statt `renameBoardSchema`, `wall` in `BoardSummary` und `BoardView`, Audit-Aktion `board.wall_changed`; verifizieren mit der Typprüfung
- [ ] 1.2 Schema `boards.wall` (Text, Standard `paper`, Check auf die drei Werte) und Migration `0005_board_wall.sql`; Migrationstest in `migrations.test.ts`: bestehende Boards werden `paper`, andere Werte lehnt die Datenbank ab; verifizieren mit `docker compose -f compose.test.yaml run --rm test`
- [ ] 1.3 `services/boards.ts`: `update` statt `rename`, je geändertem Feld ein Audit-Eintrag (`board.renamed`, `board.wall_changed` mit vorher/nachher), unverändert erzeugt nichts, ein Live-Event; `wall` in `summary` und `loadBoardView`; Service-Tests für Wand ändern, gleiche Wand, Name und Wand zugleich; verifizieren mit dem Server-Testlauf
- [ ] 1.4 `http/api.ts`: `PATCH /boards/:slug` mit `updateBoardSchema`; API-Tests: Wand setzen (200 mit `wall`), unbekannte Wand (400), Audit-Eintrag „board.wall_changed“ im Log; verifizieren mit dem Server-Testlauf

## 2. Wand und Spalten im Board

- [x] 2.1 `index.css`: Token-Sätze für `paper`, `cork`, `whiteboard` (`--wall-bg`, `--wall-pattern`, `--wall-line`, `--wall-muted`, `--wall-label`, `--wall-glow`), Klassen `wall`, `wall-label`, `note-ghost`, Schein mit `glow-pulse` (nur `motion-safe`); Kontraste je Wand mit einem Kontrastrechner prüfen und als Kommentar festhalten; verifizieren, dass Lint grün ist und alle Werte ≥ AA dokumentiert sind
- [x] 2.2 `board-page.tsx`: Board-Container als Wand mit `data-wall={board.wall}`, Spalten ohne eigene Fläche mit Trennlinien, Chevrons und mobile Linie entfernen, mehr Abstand im Zettel-Grid; verifizieren über den E2E-Fall in 2.6 und Typprüfung
- [x] 2.3 Spaltenköpfe als Etiketten mit fester Drehung, Nummer, Titel, Badge `column-count`, „bis Termin N“ darunter; letzte Runde mit warmem Etikett, Schein (`data-last-round`, Puls bei `data-previewing`) und Ablage `archive-tray`; Geister-Zettel für leere Spalten; verifizieren über die E2E-Fälle in 2.6 und die bestehenden Fälle zu Spaltenköpfen in `meeting-flow.spec.ts`
- [x] 2.4 `use-card-shift.ts`: `fall()` zielt auf die Mitte der Ablage, Rückfall auf den bisherigen Weg ohne sichtbare Ablage; Unit-Test für die Zielberechnung (reine Funktion aus zwei `DOMRect`s); verifizieren mit den Web-Unit-Tests
- [x] 2.5 `lib/wall.ts` mit `walls` und `wallNames` plus Unit-Test, `lib/audit.ts` mit „Wand geändert“ und Satz „hat die Wand von Papier auf Kork gestellt“ plus Test in `audit.test.ts`; verifizieren mit den Web-Unit-Tests
- [ ] 2.6 E2E `board-wall.spec.ts`: eine Fläche mit zwei Trennlinien (keine Chevrons), Etikett mit Badge, Badge zählt live hoch, Geister-Zettel verschwindet beim ersten Thema, Ablage „Archiv“ sichtbar, Zettel der letzten Runde fällt beim Beenden Richtung Ablage; verifizieren mit `docker compose -f compose.test.yaml run --rm --build e2e`

## 3. Wand umschalten

- [x] 3.1 `edit-board-dialog.tsx` (ersetzt `rename-board-dialog.tsx`): Trigger und Titel „Board bearbeiten“, Name, Wand als drei Radio-Kacheln mit Vorschau, nur geänderte Felder senden, unverändert schließt ohne Request; `queries.ts` `updateBoard` statt `rename`; `board-layout.tsx` angepasst; verifizieren über den E2E-Fall in 3.2 und Typprüfung
- [ ] 3.2 E2E in `board-wall.spec.ts` ergänzen: Ben stellt die Wand auf Kork, Anna sieht `data-wall="cork"` ohne Neuladen, Audit-Log zeigt „Wand geändert“ mit Papier → Kork, gleiche Wand erneut erzeugt keinen Eintrag, Name und Wand zugleich ergeben zwei Einträge; `card-focus.spec.ts` von „Board umbenennen“ auf „Board bearbeiten“ umstellen; verifizieren mit dem E2E-Lauf

## 4. Abschluss

- [x] 4.1 README: Abschnitt zu den Boards um die Wand ergänzen (drei Wände, Dialog „Board bearbeiten“); verifizieren, dass der Text den Dialognamen und die Standardwand nennt
- [ ] 4.2 Gesamtlauf: `docker compose -f compose.test.yaml run --rm test` und der E2E-Lauf sind grün, `openspec validate board-wall --strict` meldet keine Fehler

## Workflow follow-up

- Nach `inline-card-editing` mergen, dann auf diesem Stand umsetzen (gemeinsame Datei `board-page.tsx`).
- Nach Review die Änderung mit `/opsx:archive` archivieren und die Specs übernehmen.
