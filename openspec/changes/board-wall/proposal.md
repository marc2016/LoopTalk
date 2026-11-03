## Why

Die Zettel sehen inzwischen aus wie Post-its, die Spalten aber noch wie drei graue
Verwaltungskästen mit kleinen Pfeilen dazwischen. Dieser Bruch nimmt dem Board die
Metapher „Zettel an der Wand“. Und weil jedes Team seinen eigenen Raum hat, soll
jedes Board seine eigene Wand wählen können.

## What Changes

- Die drei Spalten werden zu **einer durchgehenden Wand**: eine Fläche über das
  ganze Board, Spalten nur durch feine Trennlinien getrennt (auf dem Desktop
  senkrecht, mobil waagerecht). Die Chevrons zwischen den Spalten entfallen.
- **Spaltenköpfe als Etiketten**: ein aufgeklebter, leicht gedrehter Streifen mit
  Nummer, Titel und der Anzahl als kleinem Badge; darunter weiterhin „bis
  Termin N“ bzw. „nur noch Termin N“. „+ Thema“ bleibt im Kopf von Spalte 1.
- Die **letzte Runde** hebt sich durch einen warmen Schein hinter ihren Zetteln ab
  statt durch einen eigenen Kasten; das Etikett nutzt die bestehenden warmen Töne.
  Bei der Vorschau zum Beenden pulsiert der Schein leicht.
- **Archiv-Ablage**: unter den Zetteln der letzten Runde eine kleine, gestrichelt
  umrandete Ablage „Archiv“, in die die Karten beim Beenden fallen.
- **Leere Spalte**: statt des Hinweiskastens ein blasser, gestrichelter
  Geister-Zettel in Zettelgröße mit dem bisherigen Text.
- Etwas **mehr Luft** zwischen den Zetteln und zum Rand.
- **Wand pro Board, umschaltbar**: Jedes Board hat eine von drei hellen Wänden,
  **Papier** (Standard), **Kork** oder **Whiteboard**. Umgeschaltet wird im Dialog
  „Board bearbeiten“ (bisher „Board umbenennen“), der Name und Wand zusammen
  anbietet. Die Wand gilt für alle, erscheint live bei allen und steht als „Wand
  geändert“ mit alter und neuer Wand im Audit-Log. Bestehende Boards sind aus
  Papier.
- **BREAKING (Oberfläche):** Der Button und Dialog „Board umbenennen“ heißen
  künftig „Board bearbeiten“.

Annahmen aus der Diskussion, die noch nicht ausdrücklich bestätigt wurden: die drei
Wände heißen Papier, Kork und Whiteboard, Papier ist Standard; der Umschalter liegt
im Dialog „Board bearbeiten“; die Chevrons entfallen; Pinnnadel (Kork) und Magnet
(Whiteboard) als Detail an den Zetteln gehören nicht zu dieser Änderung.

## Capabilities

### New Capabilities

_Keine._

### Modified Capabilities

- `boards`: neue Anforderung „Wand des Boards“ (drei Wände, Standard Papier,
  gemeinsam, live, Audit).
- `ui-appearance`: „Zettel-Look“ bekommt statt des festen Punktraster-Hintergrunds
  eine der drei Wände; neue Anforderung „Wand und Spalten“ (durchgehende Fläche,
  Etiketten, Schein, Ablage, Geister-Zettel, Trennlinien, Kontrast je Wand).
- `topic-board`: „Drei Spalten“ beschreibt die Verbindung in Leserichtung über
  nummerierte Etiketten, Trennlinien und Archiv-Ablage statt über Pfeile.
- `audit-log`: „Änderungen protokollieren“ nennt zusätzlich „Wand geändert“.

## Impact

- **Datenbank:** neue Spalte `boards.wall` (Text, Standard `paper`, Check auf die
  drei Werte), Migration `0005_board_wall.sql`; bestehende Boards werden `paper`.
- **Shared-Paket:** `BOARD_WALLS`, `BoardWall`, `updateBoardSchema` (Name und/oder
  Wand) ersetzt `renameBoardSchema`; `BoardSummary` und `BoardView` um `wall`;
  neue Audit-Aktion `board.wall_changed`.
- **Server:** `services/boards.ts` (`update` statt `rename`, Audit-Eintrag,
  Live-Event), `http/api.ts` (`PATCH /boards/:slug` nimmt `name` und `wall`).
- **Web:** `board-page.tsx` (Wand, Etiketten, Schein, Ablage, Geister-Zettel,
  keine Chevrons), `index.css` (Wand-Tokens je Wand, Etikett, Schein, Ablage),
  `rename-board-dialog.tsx` → `edit-board-dialog.tsx` mit Wand-Kacheln,
  `lib/audit.ts` (Beschriftung „Wand geändert“), `queries.ts`.
- **Tests:** Migrations-, Service- und API-Tests für die Wand; E2E
  `card-focus.spec.ts` (Dialogname), neuer E2E-Fall für Wand wählen, live bei
  allen und Audit-Log; bestehende Anker `column-1..3`, `column-until`,
  `note-grid`, `topic-card` bleiben.
- Keine neuen Abhängigkeiten. Baut auf `inline-card-editing` auf (dieselbe Datei
  `board-page.tsx`).
