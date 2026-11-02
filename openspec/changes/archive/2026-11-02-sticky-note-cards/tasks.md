# Tasks

## 1. Datenmodell

- [x] 1.1 `cardColorSchema` (`z.enum(["yellow","orange","pink","green","blue","purple"])`) im Shared-Paket anlegen; `createCardSchema` um optionales `color` (Standard `yellow`), `updateCardSchema` um optionales `color` erweitern (zählt in der `refine` als Änderung); `CardView` und `MeetingCardSnapshot` um `color`. Prüfen: Shared-Tests für gültige, fehlende und unbekannte Farbe, `npm run typecheck` grün
- [x] 1.2 Drizzle-Schema und Migration `apps/server/drizzle/0004_card_color.sql` (plus Journal-Eintrag): `color text NOT NULL DEFAULT 'yellow'` mit CHECK auf die sechs Werte für `cards` und `meeting_cards`. Prüfen: Test in `migrations.test.ts` mit vorbefüllter Karte und Snapshot zeigt danach Gelb, ein Insert mit `red` scheitert

## 2. Server

- [x] 2.1 `services/cards.ts`: Farbe beim Anlegen speichern, beim Bearbeiten ändern, in den Audit-Werten (vorher/nachher) von „Karte bearbeitet“ führen und in `CardView` ausliefern. Prüfen: Servertests „neue Karte ist gelb“, „grün anlegen“, „Ben färbt Budget blau → Audit mit Gelb/Blau, Live-Event“
- [x] 2.2 `services/meetings.ts`: Farbe beim Beenden in `meeting_cards` übernehmen und in der Historie ausliefern. Prüfen: Servertest „Budget bei Termin 5 grün, danach blau → Historie von Termin 5 zeigt Grün“
- [x] 2.3 API: unbekannte Farbe liefert 400 und ändert nichts. Prüfen: API-Test `PATCH` mit `color: "red"`

## 3. Web: Zettel-Look

- [x] 3.1 Tokens in `index.css`: `--note-<farbe>` für die sechs Töne in `oklch` mit gleicher Helligkeit, feste dunkle Textfarbe, Altern per `color-mix` über `data-age`, `--curl`-Größen pro Alter. Prüfen: Kontrast aller 6×3 Kombinationen nachgerechnet (mindestens 4,5:1) und als Unit-Test über die Farbtabelle festgehalten
- [x] 3.2 `lib/note.ts` mit `noteTilt(cardId)` (−1,5 bis +1,5 Grad, deterministisch) und `noteAge(column)`. Prüfen: Unit-Tests für Wertebereich, Determinismus und Alter pro Spalte
- [x] 3.3 `topic-card.tsx` auf Papier umstellen: `data-color`, `data-age`, `--tilt`, Schatten wie angeklebt, gewellte Ecke per `::after`/`clip-path`, Ecke hebt sich bei `:hover`/`:focus-visible`; linken Rand für die letzte Runde entfernen; Lebenspunkte und Text bleiben. Prüfen: im Browser alle Farben und Spalten ansehen, Vorschau beim Beenden funktioniert weiter, `npm run lint` grün
- [x] 3.4 `PersonBadge` um Variante `onNote` (weiß, Punkt in Personenfarbe, freie Namen ohne Punkt) erweitern und auf Zetteln nutzen. Prüfen: Komponententest für beide Fälle, im Browser rosa Badge auf rosa Zettel lesbar
- [x] 3.5 Board-Hintergrund mit feinem Punktraster. Prüfen: im Browser, Zettel heben sich ab, Seite bleibt hell

## 4. Web: Farbwahl und Detailansicht

- [x] 4.1 Farbwahl im Bearbeiten-Modus von `card-sheet.tsx` als Radiogruppe mit sechs Feldern und `aria-label` je Farbname; neues Thema startet mit Gelb; Speichern sendet `color` mit. Prüfen: Komponententest „Grün wählen und speichern sendet `color: green`“, Bedienung per Tastatur im Browser
- [x] 4.2 Detailansicht zeigt die Zettelfarbe (abgelöst durch 8.2: großer Zettel statt Streifen). Prüfen: im Browser
- [x] 4.3 Historie zeigt Karten in ihrer damaligen Farbe (kleiner Farbpunkt oder Streifen, kein Papier-Look). Prüfen: im Browser mit Daten aus 2.2

## 5. Web: Bewegung

- [x] 5.1 Keyframe `note-land` unter `motion-safe`; nur Karten-IDs, die nach dem ersten Rendern dazukommen, bekommen die Klasse (Ref mit bekannten IDs, auch über SSE-Reconnect). Prüfen: Board neu laden animiert nichts, neue Karte von einem zweiten Browser landet
- [x] 5.2 `use-card-shift.ts` erweitern: Anheben → FLIP-Bewegung → Andrücken für weiterrückende Karten, archivierte Klone drehen sich und fallen; `prefersReducedMotion()` überspringt alles. Prüfen: im Browser Termin beenden mit und ohne „Bewegung reduzieren“
- [x] 5.3 „heute besprochen“ mit SVG-Haken über `stroke-dashoffset`, nur bei Wechsel während der Sitzung animiert. Prüfen: im Browser markieren und per Zeigen markieren lassen
- [x] 5.4 Farbwechsel mit `transition` auf die Hintergrundfarbe. Prüfen: im Browser, zweiter Browser sieht den Übergang

## 6. e2e

- [x] 6.1 Bewegung in e2e pro Kontext steuern statt global: bestehende Tests prüfen absichtlich Animationen (Wachsen der Detailansicht, Vorschau), daher bleibt Playwright bei Standardbewegung; `cardAnimations` zählt nur Web-Animationen (Weiterrücken/Fallen), nicht das Landen per CSS. Prüfen: bestehende e2e-Tests grün
- [x] 6.2 Neuer e2e-Test Zettelfarbe: Thema ohne Farbwahl ist gelb, Ben färbt es blau, Anna sieht es ohne Neuladen blau (`data-color`), Audit-Log zeigt den Eintrag. Prüfen: e2e grün

## 8. Quadratische Zettel und großer Zettel

- [x] 8.1 Spalten legen Zettel in ein zweispaltiges Grid, Zettel quadratisch mit gekürztem Titel und Beschreibung, Fußzeile unten, Hinweis für leere Spalten über beide Grid-Spalten. Prüfen: im Browser drei Zettel in Spalte 1 ergeben zwei nebeneinander und einen darunter, langer Text bleibt im Quadrat; e2e prüft gleiche Breite und Höhe
- [x] 8.2 Stile in `.note-paper` (Papier, Farbe, Alter, Ecke, Schatten) und `.note` (kleiner Zettel) aufteilen; `CardSheet` als großer Zettel mit `note-paper`, `data-color` und `data-age` der Karte, ohne Dialograhmen und Streifen; Inhalte der Leseansicht auf Papierfarben umstellen (gedämpfte Schrift, Badges `onNote`, Verlauf). Prüfen: im Browser Lesen und Fokusansicht als großer Zettel, Wachsen und Zurückschrumpfen sichtbar
- [x] 8.3 Bearbeiten-Modus auf dem Papier: randlose Felder für Titel und Beschreibung (Beschriftungen `sr-only`), Farbwahl färbt den großen Zettel sofort um, „Abbrechen“ stellt die Farbe zurück; neues Thema als großer gelber Zettel. Prüfen: e2e „Blau wählen und abbrechen → Zettel wieder gelb, nichts gespeichert“, bestehende e2e-Tests grün
- [x] 8.4 Komplette Docker-Testsuite erneut ausführen. Prüfen: alles grün

## 7. Abschluss

- [x] 7.1 README um die Zettelfarbe ergänzen, falls Kartenfelder dort beschrieben sind. Prüfen: README beschreibt den aktuellen Stand
- [x] 7.2 Komplette Docker-Testsuite (Server, Web, e2e gegen das Prod-Image) ausführen. Prüfen: alles grün
