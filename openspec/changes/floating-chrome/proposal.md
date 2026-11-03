## Why

Mit `board-wall` ist das Board eine Wand, aber sie sitzt als Kasten unter vier
gestapelten Leisten (App-Kopf, Board-Kopf, Tabs, Termin-Leiste) in einem
begrenzten Container. Die Wand soll die ganze Seite sein, und alles, was man zum
Bedienen braucht, soll als leichte Glasfläche darüber schweben, wie Werkzeuge vor
einer Pinnwand. Das hält den Blick auf den Zetteln und spart eine volle Zeile Kopf.

## What Changes

- **Die Wand ist die Seite**: Auf der Board-Seite füllt die Wand den gesamten
  Viewport bis an alle Ränder und scrollt unter den schwebenden Flächen hindurch.
  Kein Rahmen, keine abgerundete Ecke, kein Container.
- **Eine Glasleiste oben** ersetzt App-Kopf und Board-Kopf: Logo, Board-Name mit
  „Board bearbeiten“, die Bereiche Board/Historie/Audit-Log/Teilnehmer als
  Segment-Pille, „Link kopieren“, Anwesenheit, Ich und Abmelden. Sie bleibt beim
  Scrollen oben (sticky) und ist halbtransparent mit Weichzeichnung des
  Dahinterliegenden.
- **Ein Glas-Dock unten** ersetzt die Termin-Leiste: Termin-Nummer, Zustand und
  Dauer, Moderation und Protokoll, Hinweis zum nächsten Protokoll, „Termin
  starten“ bzw. „Termin beenden“. Die Bestätigung zum Beenden klappt im Dock auf
  statt als eigene Leiste zu erscheinen. Der Hinweis „zu wenige Teilnehmer“ steht
  im Dock.
- **Fokus-Leiste als Glas-Toast** über dem Dock („<Name> zeigt: <Titel>“ mit
  „Ansehen“/„Zurück zum Fokus“ und „Fokus beenden“).
- **Kein Zettel unter Glas**: Die Wand bekommt oben und unten so viel Innenabstand,
  dass Etiketten und Zettel nie unter Leiste oder Dock liegen; per Tastatur
  fokussierte Zettel werden sichtbar gescrollt.
- **Handy**: Die Glasleiste zeigt Logo, Board-Name, Bereiche und Avatar; das Dock
  wird auf eine Zeile mit Termin-Nummer, Dauer und Hauptknopf reduziert, Rollen
  und Hinweise klappen per Tippen auf. Dock und Leiste respektieren die sicheren
  Bereiche des Geräts.
- **Glas bleibt lesbar**: Text auf Glas MUST auf jeder Wand und über jedem Zettel
  WCAG AA erreichen. Bei „Transparenz reduzieren“ werden die Flächen
  undurchsichtig; bei „Bewegung reduzieren“ gibt es keine Ein- und
  Ausblendanimationen.
- **Andere Seiten** (Startseite, Historie, Audit-Log, Teilnehmer): dieselbe
  Glasleiste oben, aber neutraler Hintergrund und kein Dock.

Annahmen aus der Diskussion, die noch nicht ausdrücklich bestätigt wurden: Dock
unten statt einer zweiten Leiste oben; App-Kopf und Board-Kopf verschmelzen zu
einer Leiste; Bereiche als Segment-Pille statt Tabs mit Unterstrich; Glas als
halbtransparentes Weiß mit Weichzeichnung (kein eigener Ton je Wand).

## Capabilities

### New Capabilities

_Keine._

### Modified Capabilities

- `ui-appearance`: neue Anforderungen „Randlose Wand“, „Glasflächen“, „Glasleiste“,
  „Termin-Dock“, „Dock auf schmalen Bildschirmen“ und „Lesbarkeit auf Glas“;
  „Zustand des Termins“ beschreibt das Dock statt der Termin-Leiste.

## Impact

- **Web:** `app-shell.tsx` (Glasleiste, Slot für Board-Inhalte, randloser Main),
  `board-layout.tsx` (Board-Name, Bereiche, Link, Anwesenheit wandern in die
  Leiste; Wand als Seite), `meeting-bar.tsx` → Dock mit aufklappender Bestätigung,
  `focus-bar.tsx` (Glas-Toast, Position), `board-page.tsx` (Wand ohne Rahmen,
  Innenabstände, `scroll-padding`), `index.css` (Glas-Tokens, `backdrop-filter`,
  `prefers-reduced-transparency`, Safe-Area), `main.tsx` (Toast-Position unter der
  Leiste).
- **Server, Datenbank, Shared-Paket:** keine Änderung.
- **Tests:** E2E-Anker bleiben (`focus-bar`, `meeting-duration`,
  `next-protocol-hint`, `end-not-discussed`, `presence-user`, Rollen „Board
  umbenennen“ → bereits „Board bearbeiten“, Links „Historie“/„Audit-Log“); neue
  E2E-Fälle für sticky Leiste, Dock mit aufklappender Bestätigung und Innenabstand.
  Unit-Test für die Glas-Kontraste.
- Baut auf `board-wall` auf (Wand, `data-wall`, Etiketten) und muss nach ihr
  umgesetzt werden.
