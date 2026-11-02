## Context

Motivation und Umfang: siehe proposal.md. Anforderungen: siehe die Delta-Specs zu
`topic-board`, `ui-appearance` und `meeting-cycle`.

Ausgangslage im Code:
- `apps/web/src/components/topic-card.tsx` rendert eine Karte als `button` mit
  Tailwind-Klassen; die letzte Runde wird über `border-l-last-round-accent`
  hervorgehoben, die Lebenspunkte über `LifeDots`.
- `apps/web/src/lib/use-card-shift.ts` animiert das Weiterrücken beim Beenden
  bereits per FLIP über `[data-card-id]` und blendet archivierte Karten als Klon aus.
- Personenfarben sind acht Pastelltöne in `index.css` (`--person-N-bg/fg`), die sich
  im Farbton mit jeder Zettelfarbe überschneiden.
- Datenmodell über Drizzle mit `pgTable` (Postgres); die Projektbeschreibung nennt
  SQLite. Dieser Entwurf folgt dem tatsächlichen Code.
- Kartenänderungen laufen über `updateCardSchema` (Shared), `services/cards.ts`
  (Audit mit vorher/nachher) und gehen per SSE an alle Clients. Snapshots für die
  Historie entstehen beim Beenden in `services/meetings.ts` (`meeting_cards`).

## Goals / Non-Goals

**Goals:**
- Look und Bewegung vollständig mit CSS und der Web Animations API, ohne neue
  Abhängigkeit.
- Farbe als normales Kartenattribut, das die bestehenden Wege für Bearbeiten,
  Audit, Live-Update und Snapshot mitnutzt.
- Lesbarkeit (WCAG AA) in jeder Kombination aus Farbe und Alter.

**Non-Goals:**
- Freie Farbwahl per Farbrad oder Hex-Wert.
- Farbwahl direkt am Zettel auf dem Board.
- Drag & Drop oder freie Positionierung der Zettel.
- Papier-Look in Historie oder Audit-Log.

## Decisions

### Farbe als Text mit fester Liste
`cards.color` und `meeting_cards.color` als `text NOT NULL DEFAULT 'yellow'` mit
CHECK-Constraint auf die sechs Werte; im Shared-Paket ein `cardColorSchema =
z.enum([...])`, das `createCardSchema` (optional, Standard gelb) und
`updateCardSchema` (optional, zählt als Änderung) nutzen.
*Alternative:* `pgEnum` – Erweitern um Töne erfordert dann eigene Migrationen mit
`ALTER TYPE`; Text mit CHECK ist einfacher zu ändern. Gespeichert wird der Name,
nie ein Farbwert, damit Töne gestalterisch angepasst werden können.

### Farbwechsel ist „Karte bearbeitet“
Die Farbe wird wie Titel und Beschreibung behandelt: dieselbe Route, derselbe
Audit-Eintrag mit vorher/nachher, dasselbe Live-Event. Damit bleibt `audit-log`
unverändert. *Alternative:* eigene Aktion „Farbe geändert“ – mehr Aufwand ohne
Mehrwert für die Nachvollziehbarkeit.

### Zettelfarben und Altern als CSS-Tokens
Pro Ton `--note-<name>` in `oklch` mit gleicher Helligkeit und unterschiedlichem
Farbton; Text immer in einer festen dunklen Farbe. Die Karte bekommt
`data-color` und `data-age` (3, 2, 1 verbleibende Termine). Altern reduziert per
`color-mix` die Sättigung Richtung Weiß, ohne die Helligkeit nennenswert zu
verändern, sodass der Textkontrast stabil bleibt; außerdem wächst die gewellte Ecke.
*Alternative:* Farben in TypeScript wie `personColor` – unnötig, da die Farbe nicht
aus einer ID berechnet wird und CSS die Übergänge direkt animieren kann.

### Drehung aus der Karten-ID
Reine Funktion `noteTilt(cardId)` in `apps/web/src/lib/note.ts`: einfacher
Integer-Hash auf den Bereich −1,5 bis +1,5 Grad, als CSS-Variable `--tilt`
gesetzt. Unit-getestet (deterministisch, Wertebereich). Beim Hover geht die
Drehung leicht Richtung 0, damit der angehobene Zettel ruhiger wirkt.

### Gewellte Ecke ohne Bilder
Die Ecke unten rechts entsteht aus einem `::after`-Pseudoelement mit Verlauf und
Schatten; die Karte selbst schneidet die Ecke per `clip-path` ab. Größe über
`--curl`, gesetzt durch `data-age` und vergrößert bei `:hover`/`:focus-visible`.
*Alternative:* SVG pro Karte – mehr DOM ohne sichtbaren Vorteil.

### Badges auf Zetteln
`PersonBadge` bekommt eine Variante `onNote`: weißer Hintergrund, dunkler Text, ein
Punkt in `personColor(userId).bg` mit dunklem Rand; freie Namen ohne Punkt. Die
Spec „Personenfarben“ bleibt erfüllt, weil die Farbe sichtbar bleibt.

### Animationen
- **Landen:** Keyframe `note-land` (kurz größer und stärker gedreht, dann Endlage).
  Nur für Karten-IDs, die nach dem ersten Rendern des Boards neu hinzukommen; die
  bekannten IDs merkt sich ein Ref, damit beim Laden oder nach einem
  SSE-Reconnect nicht alle Karten gleichzeitig landen.
- **Beenden:** `use-card-shift.ts` wird erweitert statt ersetzt: weiterrückende
  Karten heben sich zuerst kurz an (Skalierung, tieferer Schatten), dann folgt die
  bestehende FLIP-Bewegung, zuletzt ein kurzes „Andrücken“. Der Klon archivierter
  Karten dreht sich und fällt nach unten, statt nur auszublenden.
- **Besprochen:** Haken als Inline-SVG-Pfad, gezeichnet über
  `stroke-dashoffset`; nur wenn der Zustand während der Sitzung wechselt.
- **Farbwechsel:** `transition` auf die Hintergrundfarbe.
- Alle Keyframes nur unter `motion-safe`; die JS-Animationen prüfen wie bisher
  `prefersReducedMotion()`. Animationen nutzen nur `transform`, `opacity` und
  `box-shadow`, blockieren keine Klicks (`pointer-events` bleibt aktiv) und
  verändern nicht das Layout.

### Quadratische Zettel im Raster
Jede Spalte legt ihre Zettel in ein zweispaltiges Grid; der Zettel bekommt
`aspect-square` und `overflow: hidden`. Titel und Beschreibung werden per
`line-clamp` gekürzt, die Fußzeile (Ersteller, Lebensanzeige, „besprochen“) sitzt
per `mt-auto` unten. Der Hinweis für leere Spalten überspannt beide Grid-Spalten.
*Alternative:* feste Pixelgröße – bricht auf schmalen Bildschirmen; das Grid passt
die Kantenlänge der Spaltenbreite an.

### Großer Zettel statt Dialog-Look
Die bestehende `CardSheet` bleibt technisch ein Dialog (Fokusfalle, Escape,
Screenreader-Rolle), sieht aber wie ein großer Zettel aus. Dafür werden die Stile
aufgeteilt: `.note-paper` trägt Papier, Farbe, Alter, Ecke und Schatten; `.note`
ergänzt nur, was der kleine Zettel braucht (Position, Innenabstand, Drehung,
Hover). So überschreibt der Papier-Look nicht die feste Positionierung des Dialogs.
Das Wachsen aus dem kleinen Zettel liefert bereits `use-grow-from-card.ts`. Im
Bearbeiten-Modus meldet das Formular die gewählte Farbe per `watch` an die
`CardSheet`, die damit `data-color` des großen Zettels setzt; gespeichert wird erst
beim Absenden. Titel und Beschreibung sind randlose Felder auf dem Papier, die
sichtbaren Beschriftungen bleiben für Screenreader erhalten (`sr-only`).
*Alternative:* eigener Overlay ohne Dialog-Komponente – müsste Fokusfalle und
Escape nachbauen.

### Farbwahl in der Detailansicht
Im Bearbeiten-Modus von `card-sheet.tsx` eine Zeile mit sechs runden Feldern als
native Radios (jedes mit `aria-label` = Farbname, Pfeiltasten ohne Zusatzlogik). Ein
neues Thema startet mit Gelb.

### Board-Hintergrund
Punktraster als `radial-gradient` auf dem Board-Container, in einer sehr hellen
neutralen Farbe, damit die Zettel sich abheben und „Helles Design“ erfüllt bleibt.

## Risks / Trade-offs

- [Pastelltöne verfehlen WCAG AA in Kombination mit Altern] → Töne mit fester hoher
  Helligkeit und fester dunkler Textfarbe; Altern ändert nur die Sättigung. Kontrast
  aller 6×3 Kombinationen einmalig nachrechnen und im Test der Farbtabelle festhalten.
- [Gedrehte Zettel wirken in vollen Spalten unruhig] → höchstens 1,5 Grad, keine
  Drehung in Detailansicht und Historie.
- [Viele Schatten und Animationen kosten Leistung bei großen Boards] → nur
  `transform`/`opacity` animieren, keine dauerhaften `will-change`, Landen nur für neue
  Karten.
- [E2E-Tests werden durch Animationen instabil] → Playwright mit
  `reducedMotion: "reduce"` laufen lassen; ein eigener Test prüft, dass ohne
  Reduktion die Animationsklasse gesetzt wird.
- [Teams geben Farben eine Bedeutung, die die App nicht kennt] → bewusst
  zugelassen; kein Rot, damit keine Farbe wie die Warnung der letzten Runde wirkt.
- [Annahmen aus der Diskussion sind nicht bestätigt] (Farbwahl nur in der
  Detailansicht, weiße Badges, Altern statt Rand) → im Review der Artefakte
  bestätigen lassen, bevor implementiert wird.

## Migration Plan

1. Drizzle-Migration `0004_card_color`: `color`-Spalte mit Standard `yellow` und
   CHECK-Constraint auf `cards` und `meeting_cards`; bestehende Zeilen erhalten
   dadurch Gelb. Migrationstest analog zu `migrations.test.ts`.
2. Server und Web gemeinsam ausrollen; ältere Clients senden keine Farbe und
   bekommen Gelb.
3. Rollback: Spalten entfernen; die Farbe geht verloren, sonst nichts.
