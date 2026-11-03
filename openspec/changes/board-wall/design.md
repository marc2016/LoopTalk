## Context

Das Board (`apps/web/src/pages/board-page.tsx`) rendert drei gleich breite
`<section>`-Kästen mit eigener Fläche (`bg-column` bzw. `bg-last-round`,
`note-surface`-Punktraster, `rounded-xl`), Kopf aus Nummernkreis, Titel „(n)“ und
„bis Termin N“, dazwischen Chevrons (Desktop) bzw. eine Linie (mobil), die bei der
Vorschau zum Beenden nudgen. Die Zettel (`topic-card.tsx`, `.note-paper` in
`index.css`) sind fertig gestaltet und bleiben unberührt. Beim Beenden lässt
`use-card-shift.ts` Zettel der Spalte 3 nach rechts unten fallen (`fall()`, feste
Keyframes `translate(40px, 140px)`).

Ein Board hat nur `name`; Umbenennen läuft über `services/boards.ts#rename`,
`PATCH /boards/:slug`, Audit `board.renamed`, Live-Event und
`rename-board-dialog.tsx`. Farb-Tokens liegen als oklch-Variablen in `:root`
(`index.css`), nur ein helles Theme.

Diese Änderung setzt auf `inline-card-editing` auf, weil beide `board-page.tsx`
ändern.

## Goals / Non-Goals

**Goals:**
- Wand als reiner Token-Satz je Variante, ohne Bilder, austauschbar über ein
  Attribut am Board-Container.
- Umschalter mit demselben Muster wie Umbenennen (ein Endpunkt, ein Audit-Eintrag,
  Live über das bestehende `board`-Event).
- Zettel-Layout, Testanker und Animationen bleiben, nur die Fläche darum wird neu.

**Non-Goals:**
- Pinnnadel/Magnet-Details an Zetteln, eigene Zettel-Looks je Wand.
- Bilder oder Texturen als Dateien; alles bleibt CSS.
- Schwebende Bedienelemente (eigene Änderung `floating-chrome`).
- Wand auf Historie, Audit-Log oder Teilnehmerseite.

## Decisions

### Wand als Datenattribut mit Token-Satz
Der Board-Container bekommt `data-wall="paper|cork|whiteboard"` und die Klasse
`wall`. Je Wand setzt `index.css` dieselben Variablen: `--wall-bg`,
`--wall-pattern` (Punkte, Körnung oder Linien als `background-image`),
`--wall-line` (Trennlinien), `--wall-muted` (gedämpfte Schrift auf der Wand),
`--wall-label` (Etikett-Fläche), `--wall-glow` (Schein der letzten Runde). Papier:
`oklch(0.975 0.01 85)` mit dem bestehenden Punktraster; Kork: `oklch(0.9 0.04 70)`
mit Körnung aus zwei überlagerten `radial-gradient`-Rastern; Whiteboard:
`oklch(0.99 0.003 255)` mit Linienraster aus `linear-gradient`. Die gedämpften
Texte auf der Wand nutzen `--wall-muted` statt `text-muted-foreground`, weil
`muted-foreground` auf Kork keine AA-Kontraste mehr erreicht; die Werte werden beim
Bauen gegen jede Wand geprüft (Ziel ≥ 4,5:1 für Text, ≥ 3:1 für Trennlinien und
Badge-Rahmen).
*Alternative:* eigenes Theme je Wand über `:root`-Klassen. Verworfen: Die Wand ist
auf das Board begrenzt, der Rest der App bleibt neutral.

### Eine Fläche, Spalten als Grid-Zellen
Das Grid `md:grid-cols-3` bleibt; der umgebende Container wird die Wand (Padding,
`rounded-xl`, Pattern), die Spalten verlieren `bg-*`, `rounded-xl` und
`note-surface`. Trennlinien: Spalte 2 und 3 erhalten `md:border-l` in
`--wall-line`; mobil erhalten Spalte 2 und 3 `border-t`. Die Chevron- und
Linien-`<span>`s entfallen samt `animate-nudge`-Nutzung dort.

### Etikett
Der Kopf wird ein `<div class="wall-label">`: `inline-flex`, `--wall-label`
(halbtransparentes Weiß auf Papier/Whiteboard, cremig auf Kork), leichter Schatten,
`rotate` fest aus der Spaltennummer (−0,8°, 0,5°, −0,4°), darin Nummernkreis, Titel
und ein rundes Badge mit der Anzahl (`data-testid="column-count"`). „bis Termin N“
bleibt als `<p data-testid="column-until">` unter dem Etikett. Für die letzte
Runde trägt das Etikett `--last-round`/`--last-round-foreground`. Die
`<section aria-label>` und `data-testid="column-N"` bleiben.

### Schein und Ablage der letzten Runde
Die Section der letzten Runde bekommt `data-last-round` und ein
`::before` mit `radial-gradient(ellipse at 50% 35%, var(--wall-glow), transparent
70%)` hinter dem Zettel-Grid (`isolate`, `z-index`). Bei
`data-previewing` am Board animiert `::before` die Opazität (`glow-pulse`,
1,6 s, nur `motion-safe`). Unter dem Grid steht die Ablage
`<div data-testid="archive-tray">`: gestrichelter Rahmen in `--wall-line`,
Archiv-Icon und „Archiv“, `min-h-16`, `aria-hidden="false"` mit Text, damit sie
auch für Screenreader das Ende markiert.

### Fallen in die Ablage
`fall()` in `use-card-shift.ts` bekommt das Ziel aus dem DOM: Vor dem Start wird
die Position von `[data-testid="archive-tray"]` gelesen und der letzte Keyframe
auf die Mitte der Ablage gerechnet (`dx`, `dy` aus den `DOMRect`s) statt fest
`40px/140px`. Fehlt die Ablage (z. B. im Test ohne Spalte 3 im Viewport), bleibt
der heutige Fallweg als Rückfall.

### Geister-Zettel
Der leere Zustand wird ein `<div class="note-ghost" aria-live="polite">` im
Zettel-Grid: `aspect-square`, gestrichelter Rahmen in `--wall-line`, `rotate`
−1°, Text in `--wall-muted`. Kein `button`, keine Klickfläche.

### Board-Modell und API
`boards.wall text NOT NULL DEFAULT 'paper'` mit Check-Constraint (Migration
`0005_board_wall.sql`, analog `0004_card_color.sql`). Shared: `BOARD_WALLS =
["paper","cork","whiteboard"]`, `boardWallSchema`, `updateBoardSchema =
strictObject({ name?: boardNameSchema, wall?: boardWallSchema })` mit `refine`
auf mindestens ein Feld; `renameBoardSchema` entfällt. `BoardSummary`/`BoardView`
erhalten `wall`. Service: `update(board, userId, input)` ersetzt `rename`,
schreibt je geändertem Feld einen eigenen Audit-Eintrag (`board.renamed` bzw.
`board.wall_changed` mit `before/after.wall`) in einer Transaktion, unveränderte
Felder erzeugen nichts, danach ein `boardChanged`. API: `PATCH /boards/:slug`
parst `updateBoardSchema`.
*Alternative:* eigener Endpunkt `PUT /boards/:slug/wall`. Verworfen: Ein Dialog,
ein Request; das Muster „ein PATCH mit Teilfeldern“ gibt es bei Karten schon.

### Dialog „Board bearbeiten“
`rename-board-dialog.tsx` wird `edit-board-dialog.tsx`: Trigger
`aria-label="Board bearbeiten"`, Titel „Board bearbeiten“, Feld Name wie bisher,
darunter ein `fieldset` „Wand“ mit drei Radio-Kacheln (native Radios wie beim
Farbwähler, `aria-label` Papier/Kork/Whiteboard), jede Kachel eine kleine Vorschau
der Wand (`data-wall` auf einem 56×40-Rechteck mit zwei Mini-Zetteln). „Speichern“
sendet nur geänderte Felder; sind beide unverändert, schließt der Dialog ohne
Request. Die Mutation `rename` in `queries.ts` wird `updateBoard`.

### Audit-Beschriftung
`lib/audit.ts`: `"board.wall_changed": "Wand geändert"`, Satz „hat die Wand von
Papier auf Kork gestellt“ über `wallNames` aus einem neuen `lib/wall.ts`
(`wallNames`, `walls`).

## Risks / Trade-offs

- [Kork zu dunkel für AA bei gedämpften Texten] → eigene `--wall-muted` je Wand,
  Kork bewusst hell (L ≈ 0,9); Werte beim Bauen mit einem Kontrastrechner prüfen
  und in `index.css` kommentieren wie bei `--last-round`.
- [Körnung/Linienraster flimmern beim Scrollen oder unter den Zettel-Animationen]
  → sehr geringe Kontraste im Muster (≤ 0,08 Alpha), feste Rastergrößen, kein
  `background-attachment: fixed`.
- [`fall()` zielt daneben, wenn die Ablage außerhalb des Viewports liegt] →
  Rückfall auf den heutigen Fallweg, wenn die Ablage nicht sichtbar ist.
- [Dialogname ändert sich, E2E `card-focus.spec.ts` sucht „Board umbenennen“] →
  Test wird mit umgestellt (Teil der Tasks).
- [Mehr Audit-Einträge durch Name + Wand in einem Request] → gewollt, je Feld ein
  Eintrag, wie in der Spec beschrieben.

## Migration Plan

1. Migration `0005_board_wall.sql` fügt `wall` mit Standard `paper` hinzu; der
   `migrate`-Dienst führt sie vor dem Start aus, bestehende Boards sind damit Papier.
2. Rollback: voriges Image; die Spalte bleibt ohne Wirkung stehen.
