# Proposal: Board-Oberfläche schärfen

## Why

Die Oberfläche ist funktional, wirkt aber flach: drei gleiche graue Spalten, weiße
Karten, alles gleich gewichtet. Vor allem zeigt sie nicht, was LoopTalk ausmacht:
Die Spalten sind keine Kategorien, sondern Zeit. Jedes Thema hat genau drei Termine
Lebensdauer, und beim Beenden rückt alles weiter. Das passiert heute unsichtbar
hinter einem Dialogtext. Ziel ist eine ruhige, hochwertige Oberfläche, die diesen
Ablauf sichtbar macht, ohne verspielt zu werden.

## What Changes

- **Spalten als Zeitstrahl**: Die drei Spalten werden als verbundene Schritte
  (1 → 2 → 3 → Archiv) dargestellt. Die Köpfe nennen echte Terminnummern („bis
  Termin 7“, „nur noch heute“). Die letzte Runde hebt sich mit eigenem Ton ab.
  Die Spalten heißen „Neu“, „Zweite Runde“, „Letzte Runde“.
- **Lebensanzeige auf Karten**: Jede Karte zeigt, wie viele Termine sie noch auf
  dem Board bleibt (drei Punkte), in der letzten Runde hervorgehoben („letzte
  Chance“).
- **Vorschau vor dem Beenden**: Solange die Bestätigung zum Beenden offen ist,
  zeigt das Board, was passieren wird: welche Themen weiterrücken und welche
  archiviert werden. Die Bestätigung verdeckt das Board nicht mehr.
- **Weiterrücken sichtbar bei allen**: Nach dem Beenden gleiten die Karten bei
  allen verbundenen Teilnehmern ruhig in ihre neue Spalte. Bei reduzierter
  Bewegung entfällt die Animation.
- **Personenfarben**: Jede Person hat eine feste, gedeckte Farbe, die überall
  gleich erscheint (Avatare, Rollen, Namen auf Karten, Anwesenheit).
- **Termin-Leiste mit Zustand**: Ein laufender Termin wird deutlich
  hervorgehoben, mit laufender Dauer und den Rollen samt Avatar.
- **Kleinere Verfeinerungen**: klarere Typografie und Dichte, gestrichelte leere
  Spalten, Akzentfarbe nur für Aktionen und „jetzt“.

## Capabilities

### New Capabilities

- `ui-appearance`: Übergreifende Gestaltung: helles Design, Personenfarben,
  hervorgehobener Zustand des laufenden Termins.

### Modified Capabilities

- `topic-board`: Spalten werden als Zeitstrahl mit Terminnummern dargestellt
  (geänderte Anforderung „Drei Spalten“); neue Anforderung „Lebensanzeige“.
- `meeting-cycle`: neue Anforderung „Vorschau vor dem Beenden“.
- `live-updates`: neue Anforderung „Weiterrücken sichtbar“.

## Impact

- Nur Frontend (`apps/web`): Board-Seite, Spalten, Karten, Termin-Leiste,
  Bestätigung zum Beenden, Anwesenheit, Avatare, Theme in `index.css`.
- Server, API, Datenmodell und Audit-Log bleiben unverändert. Terminnummer, Spalte
  und Benutzer-IDs liefert die Board-Ansicht bereits.
- Keine neuen schweren Abhängigkeiten; Animation mit CSS und der Web Animations
  API.
- Der Ende-zu-Ende-Test wird an die neue Bestätigung und Spaltennamen angepasst.
