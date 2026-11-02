## Why

Die Themenkarten sind weiße Kästen mit Rahmen und wirken dadurch lieblos. Ein Board
für Austauschtermine lebt von der Metapher „Zettel an der Wand“: Themen werden
angeklebt, wandern weiter und werden irgendwann abgenommen. Wenn die Karten wie
Post-its aussehen und sich so bewegen, wird der Ablauf eines Termins ohne
Erklärung sichtbar.

## What Changes

- Karten sehen aus wie Post-its: Papierfarbe statt Weiß, Schatten wie ein oben
  angeklebter Zettel, leichte Drehung (fest aus der Karten-ID), eine Ecke, die sich
  beim Darüberfahren anhebt.
- Jede Karte hat eine frei wählbare Zettelfarbe aus sechs festen Tönen (Gelb,
  Orange, Rosa, Grün, Blau, Lila); neue Karten sind gelb. Gewählt wird in der
  Detailansicht im Bearbeiten-Modus. Änderungen erscheinen live bei allen, stehen
  im Audit-Log als „Karte bearbeitet“ und werden in der Termin-Historie festgehalten.
- Karten altern sichtbar: Je weniger Termine eine Karte noch hat, desto stärker
  wellt sich ihre Ecke und desto blasser wird das Papier. Das ersetzt den farbigen
  linken Rand der letzten Runde.
- Namen auf Zetteln werden als weiße Badges mit einem Punkt in der Personenfarbe
  dargestellt, damit sie auf jeder Zettelfarbe lesbar bleiben.
- Das Board bekommt einen hellen Hintergrund mit feinem Punktraster.
- Bewegung passend zum Ablauf: Neue Karten „klatschen“ aufs Board, „heute
  besprochen“ erscheint als gezeichneter Haken, beim Beenden werden Karten
  abgezogen und in der nächsten Spalte angeklebt, Karten der letzten Runde lösen
  sich und fallen ins Archiv. Alle Animationen nur ohne „reduzierte Bewegung“.
- Detailansicht, Historie und Audit-Log bleiben sachlich; die Detailansicht zeigt
  die Zettelfarbe nur als Akzent.

Annahmen aus der Diskussion, die noch nicht ausdrücklich bestätigt wurden: Farbwahl
nur in der Detailansicht (nicht direkt am Zettel), weiße Badges mit Farbpunkt,
Altern statt farbigem Rand.

## Capabilities

### New Capabilities

_Keine._

### Modified Capabilities

- `topic-board`: neue Anforderung „Zettelfarbe“; „Lebensanzeige“ hebt die letzte
  Runde künftig über das gealterte Aussehen hervor statt über einen farbigen Rand.
- `ui-appearance`: neue Anforderungen „Zettel-Look“ und „Bewegung der Zettel“.
- `meeting-cycle`: „Termin-Historie“ hält zusätzlich die Zettelfarbe jeder Karte fest.

## Impact

- **Datenbank:** neue Spalte `cards.color` (Standard `yellow`) und
  `meeting_cards.color`; Migration setzt bestehende Karten und Snapshots auf Gelb.
- **Shared-Paket:** `createCardSchema`/`updateCardSchema` um `color` erweitert,
  `CardView` und `MeetingCardSnapshot` um `color`.
- **Server:** `services/cards.ts` (Anlegen, Bearbeiten, Audit-Werte),
  `services/meetings.ts` (Snapshot beim Beenden).
- **Web:** `topic-card.tsx` (Look, Altern, Badges), `card-sheet.tsx` (Farbwahl,
  Akzent), Board-Hintergrund, `index.css` (Zettelfarben, Keyframes),
  `use-card-shift.ts` (Abziehen/Fallen beim Beenden), Historie-Seite.
- **Tests:** Service- und API-Tests für die Farbe, E2E für Farbwahl und Live-Update.
- Keine neuen Abhängigkeiten.
