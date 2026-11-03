# Tasks

## 1. Glas-Tokens

- [x] 1.1 `index.css`: Tokens `--glass-bg`, `--glass-border`, `--glass-shadow`, `--bar-h`, Klasse `.glass` mit `backdrop-filter`, Rückfall für `prefers-reduced-transparency` und `@supports not (backdrop-filter)`, `scroll-padding-block` auf `html`; Unit-Test `glass.test.ts` rechnet 80 % Weiß über jeder Zettelfarbe und jeder Wand und prüft `foreground`, `muted-foreground` und `primary` ≥ 4,5:1; verifizieren mit den Web-Unit-Tests und Lint

## 2. Glasleiste und randlose Wand

- [x] 2.1 `ChromeContext` mit Slot-Element (Callback-Ref) und `app-shell.tsx`: sticky Glasleiste (`data-testid="glass-bar"`) mit Logo, Slot, Ich und Abmelden; `<main>` ohne Container; neues `PageContainer`; verifizieren mit Typprüfung und dem E2E-Fall in 2.4
- [x] 2.2 `board-layout.tsx`: Board-Name, „Board bearbeiten“, Bereiche als Segment-Pille (NavLinks, Namen unverändert, unter `md` Icons mit `aria-label`), „Link kopieren“ und `PresenceBar` per Portal in den Slot; Index-Route ohne Container, übrige Bereiche im `PageContainer`; `PresenceBar` unter `md` nur Avatare; verifizieren mit Typprüfung und dem E2E-Fall in 2.4
- [x] 2.3 `board-page.tsx`/`index.css`: Wand ohne Rundung und Schatten, `min-height` bis zum unteren Rand, `padding-top` 1,25 rem, `padding-bottom` aus `--dock-h`; Startseite, Historie, Audit-Log, Teilnehmer und Not-Found im `PageContainer`; verifizieren, dass die bestehenden E2E-Fälle zu Historie und Audit-Log weiter laufen und der E2E-Fall in 2.4 grün ist
- [x] 2.4 E2E `floating-chrome.spec.ts`: genau eine Leiste mit Board-Name, Bereichen, „Link kopieren“, Anwesenheit und Abmelden; Wand reicht bis an die Fensterränder (Bounding Box = Viewport-Breite, oben direkt unter der Leiste); bei zwölf Zetteln bleibt die Leiste nach dem Scrollen oben und der letzte Zettel liegt vollständig oberhalb des Docks; Startseite zeigt keine Bereiche; verifizieren mit `docker compose -f compose.test.yaml run --rm --build e2e`

## 3. Termin-Dock und Fokus-Toast

- [x] 3.1 Fester Stapel unten in `board-page.tsx` (Safe-Area, `pointer-events`), `useDockHeight` schreibt `--dock-h` per `ResizeObserver`; `FocusBar` als Glas-Toast im Stapel; verifizieren mit Typprüfung und dem E2E-Fall in 3.4
- [x] 3.2 `meeting-bar.tsx` als Dock-Inhalt (`data-testid="meeting-dock"`): Glas, Warnung „zu wenige Teilnehmer“ als Zeile im Dock, Bestätigung als Block im Dock mit bestehenden ids und `data-testid`, Escape schließt, Popover der Rollen-Auswahl nach oben, Animationen nur `motion-safe`; verifizieren, dass die bestehenden E2E-Fälle zu Rollen, Beenden-Vorschau und Warnung grün sind
- [x] 3.3 Dock unter `md`: eine Zeile mit „Termin N“, Dauer und Hauptknopf, Button „Rollen anzeigen“ (`aria-expanded`) blendet Rollen und Hinweis ein; verifizieren mit dem E2E-Fall in 3.4 (Viewport 400 px)
- [x] 3.4 E2E in `floating-chrome.spec.ts` ergänzen: Dock unten mittig sichtbar mit Termin-Nummer und „Termin beenden“; Bestätigung klappt im Dock auf (Alertdialog liegt innerhalb von `meeting-dock`), Board zeigt die Vorschau, Escape schließt; Fokus-Toast erscheint über dem Dock; bei 400 px Breite zeigt das Dock keine Rollen, „Rollen anzeigen“ blendet sie ein; verifizieren mit dem E2E-Lauf

## 4. Abschluss

- [x] 4.1 README: Absatz zum Board um Leiste und Dock ergänzen; verifizieren, dass der Text beide nennt
- [x] 4.2 Gesamtlauf: `docker compose -f compose.test.yaml run --rm test` und der E2E-Lauf sind grün, `openspec validate floating-chrome --strict` meldet keine Fehler

## Workflow follow-up

- Nach `board-wall` umsetzen (Branch `2026-November-1`), weil Wand, Etiketten und `data-wall` vorausgesetzt werden.
- Nach Review die Änderung mit `/opsx:archive` archivieren und die Specs übernehmen.
