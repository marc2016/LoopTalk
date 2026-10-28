# Tasks

## 1. Grundlagen

- [x] 1.1 Theme-Tokens in `apps/web/src/index.css` ergänzen (`--last-round`, `--last-round-foreground`, `--person-0` bis `--person-7` als Flächen-/Schrift-Paare) und Kontraste auf mindestens WCAG AA prüfen; verifiziert durch eine dokumentierte Kontrastprüfung im Kommentar neben den Tokens
- [x] 1.2 Reine Funktion `lifecycle(column, meetingNumber)` (Titel, Schritt, „bis Termin X“ / „nur noch Termin N“, verbleibende Termine) mit Unit-Tests für Termin 1 und 5 und alle drei Spalten; `npm test -w @looptalk/web` grün
- [x] 1.3 Reine Funktion `personColor(userId)` und `formatDuration(startedAt, now)` („seit 23 min“, „seit 1 h 05 min“) mit Unit-Tests für Stabilität, Wertebereich und Grenzfälle; Tests grün
- [x] 1.4 Komponenten `PersonAvatar` und `PersonBadge` (Personenfarbe bei `userId`, neutral ohne) anlegen und in Kopfzeile, Anwesenheit, Karten-Namen und Karten-Dialog einsetzen; im Browser zeigt dieselbe Person überall dieselbe Farbe, freie Namen sind neutral

## 2. Zeitstrahl und Lebensanzeige

- [x] 2.1 Spaltenköpfe als Zeitstrahl (nummerierte Schritte, Verbindung, „Archiv“ am Ende; mobil senkrecht) mit Terminnummern aus `lifecycle`; Spalten heißen „Neu“, „Zweite Runde“, „Letzte Runde“; Screenshot Desktop und Handy geprüft
- [x] 2.2 „Letzte Runde“ optisch abheben (eigener Ton der Spalte, schmaler Rand links an Karten); im Screenshot klar unterscheidbar
- [x] 2.3 Lebensanzeige auf Karten (drei Punkte plus Text „noch 3 Termine“ / „noch 2 Termine“ / „letzte Chance“, Text auch für Screenreader); im Browser für alle drei Spalten geprüft
- [x] 2.4 `columnTitles` und alle Verwendungen (Karten-Dialog, Historie) auf die neuen Spaltennamen umstellen; `npm run typecheck` und Lint grün

## 3. Vorschau vor dem Beenden

- [x] 3.1 Modalen `AlertDialog` für „Termin beenden“ durch eine nicht modale Bestätigungsleiste am unteren Rand ersetzen (`role="alertdialog"`, Fokus hinein, Escape bricht ab, Hinweis auf nächsten Protokollanten bzw. „Keine Themen auf dem Board“); per Tastatur bedienbar
- [x] 3.2 Zustand `endPreview` in `BoardPage`, an Spalten und Karten durchreichen: „→ Zweite Runde“ / „→ Letzte Runde“ bzw. blass mit „wird archiviert“; Hover und Fokus auf „Termin beenden“ zeigen die Vorschau als Andeutung; Abbrechen stellt die normale Ansicht wieder her
- [x] 3.3 Bestätigung schließt sich automatisch, wenn sich Version oder Status des Termins ändern (z. B. jemand anderes hat beendet); mit zwei Browserfenstern geprüft

## 4. Weiterrücken sichtbar

- [x] 4.1 Hook `useCardShift`: Positionen der Karten nach jedem Rendern merken, bei steigender `meeting.number` FLIP-Animation (≤ 350 ms) ausführen, keine Animation bei anderen Änderungen; geprüft mit zwei Fenstern (Anlegen/Bearbeiten löst nichts aus, Beenden lässt Karten bei beiden gleiten)
- [x] 4.2 Geister archivierter Karten in einer fest positionierten Ebene ausblenden (`aria-hidden`, `pointer-events: none`), danach entfernen; im Browser geprüft
- [x] 4.3 Reduzierte Bewegung: bei `prefers-reduced-motion: reduce` keine Animation, stattdessen Hinweis „Termin N beendet – die Themen sind weitergerückt“, beim beendenden Client keinen doppelten Hinweis; geprüft mit Playwright-Option `reducedMotion: "reduce"`

## 5. Termin-Leiste und Feinschliff

- [x] 5.1 Termin-Leiste mit Zustand: laufend mit Akzentrand, Akzentfläche und Dauer über `useNow(30_000)`, geplant neutral; Rollen mit `PersonAvatar` im Auswahlfeld; im Browser geprüft, Dauer springt ohne Neuladen weiter
- [x] 5.2 Typografie und Dichte: `tabular-nums` für Zahlen, gestrichelte leere Spalten, Abstände und Abstufung auf Karten, Akzentfarbe nur für Aktionen, „jetzt“ und aktive Navigation; Screenshots Desktop und Handy geprüft

## 6. Tests und Abschluss

- [x] 6.1 Ende-zu-Ende-Test an die Bestätigungsleiste und neuen Spaltennamen anpassen und um Prüfungen ergänzen: Vorschau zeigt „wird archiviert“, Abbrechen ohne Änderung, Spaltenköpfe zeigen nach dem Beenden die neuen Terminnummern, Lebensanzeige; `docker compose -f compose.test.yaml run --rm --build e2e` grün
- [x] 6.2 Ende-zu-Ende-Test mit `reducedMotion: "reduce"` für den Hinweis statt Animation; im selben Lauf grün
- [x] 6.3 Gesamte Suite in Docker ausführen (`docker compose -f compose.test.yaml run --rm test`) und grün
