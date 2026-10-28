# Design: Board-Oberfläche schärfen

## Context

Die Board-Seite (`apps/web/src/pages/board-page.tsx`) rendert drei gleich gestaltete
Spalten aus `board.cards`. Die Termin-Leiste (`components/meeting-bar.tsx`) bestätigt
das Beenden mit einem modalen `AlertDialog`, der das Board abdunkelt. Live-Updates
kommen per SSE (`lib/events.ts`): Ein `board`-Event invalidiert die Board-Query, die
dann neu lädt. Die Board-Ansicht enthält bereits alles, was die neuen Anzeigen
brauchen: `meeting.number`, `meeting.status`, `meeting.startedAt`, `card.column`,
Benutzer-IDs bei Rollen, Teilnehmern, Anwesenheit und Namen (`userId` oder `null`).
Das Theme liegt als CSS-Variablen in `index.css`, nur hell.

Anforderungen: siehe Delta-Specs `topic-board`, `meeting-cycle`, `live-updates`,
`ui-appearance`.

## Goals / Non-Goals

**Goals:**
- Alles rein im Frontend; keine Änderung an API, Server oder Datenmodell.
- Animation ohne neue Bibliothek, robust gegen doppelte Neuladevorgänge.
- Barrierefreiheit bleibt erhalten: Tastaturbedienung, Screenreader-Texte,
  reduzierte Bewegung.

**Non-Goals:**
- Drag & Drop oder sonstiges manuelles Verschieben (bleibt ausgeschlossen).
- Abhaken „besprochen“ während des Termins (wäre eine neue Funktion mit Datenmodell).
- Gestaltung von Historie, Audit-Log und Teilnehmerseite über Personenfarben und
  Typografie hinaus.

## Decisions

### 1. Weiterrücken erkennen: an der Terminnummer, nicht am Event

Die Animation startet, wenn sich `board.meeting.number` zwischen zwei Renderings
erhöht. Nicht verwendet wird der SSE-Grund `meeting.ended` oder der Klick.

- Warum: Beim beendenden Client kommen die neuen Daten über zwei Wege (eigene
  Mutation und SSE). Bei anderen Clients können Events zusammenfallen. Die
  Terminnummer steigt genau einmal pro beendetem Termin, egal wie die Daten ankommen.
- Alternative: das SSE-Event `board` mit `reason: meeting.ended` auswerten. Verworfen,
  weil dann Reihenfolge von Event und Refetch eine Rolle spielt.

### 2. Bewegung per FLIP mit der Web Animations API

Ein Hook `useCardShift` merkt sich nach jedem Rendern die Positionen aller Karten
(`data-card-id`, `getBoundingClientRect`). Steigt die Terminnummer, misst er in
`useLayoutEffect` die neuen Positionen und spielt für jede Karte eine
`transform`-Animation von alt nach neu ab (etwa 350 ms, `ease-out`).

Archivierte Karten fehlen in den neuen Daten. Der Hook hält deshalb die Karten und
Positionen des vorherigen Stands und rendert die verschwundenen Karten als
„Geister“ in einer fest positionierten Ebene an ihrer alten Stelle, die ausblenden
und danach entfernt werden (`pointer-events: none`, `aria-hidden`).

- Alternative: Framer Motion (`layout`-Animationen). Verworfen: große Abhängigkeit
  für einen einzigen Effekt.
- Alternative: View Transitions API. Verworfen: Browserunterstützung und
  Zusammenspiel mit React-Rendering noch uneinheitlich.

Bei `prefers-reduced-motion: reduce` entfällt die Animation. Stattdessen erscheint ein
Hinweis per `sonner`: „Termin N beendet – die Themen sind weitergerückt.“ Der
beendende Client zeigt wie bisher seinen Hinweis mit der neuen Moderation; ein
zweiter Hinweis wird dort unterdrückt.

### 3. Bestätigung als nicht modale Leiste mit Vorschau

Der modale `AlertDialog` für „Termin beenden“ wird durch eine Bestätigungsleiste
ersetzt, die am unteren Rand des Fensters erscheint (`role="alertdialog"`,
`aria-modal="false"`, Fokus springt hinein, Escape bricht ab). Das Board bleibt
dahinter sichtbar und bedienbar.

Der Zustand `endPreview` liegt in `BoardPage` und wird an Spalten und Karten
gereicht:
- Karten in Spalte 1 und 2 zeigen einen Hinweis „→ Zweite Runde“ bzw. „→ Letzte
  Runde“.
- Karten in Spalte 3 werden blass mit gestricheltem Rahmen und dem Hinweis „wird
  archiviert“ dargestellt.
- Die Verbindungen des Zeitstrahls werden hervorgehoben.

Die Leiste enthält den Satz „<Moderator> protokolliert beim nächsten Termin. Die
neue Moderation wird gezogen.“ bzw. „Keine Themen auf dem Board.“ Hover oder Fokus
auf „Termin beenden“ zeigt dieselbe Vorschau schon vor dem Klick als Andeutung.

- Alternative: Vorschau innerhalb des modalen Dialogs als Miniatur. Verworfen: Die
  Miniatur wäre schwer lesbar, und das echte Board ist die bessere Vorschau.

### 4. Zeitstrahl und Lebensanzeige aus einer Funktion

Eine reine Funktion `lifecycle(column, meetingNumber)` liefert für jede Spalte
Titel, Schrittnummer, „bis Termin X“ bzw. „nur noch Termin N“ und die Zahl der
verbleibenden Termine (`4 - column`). Spaltenköpfe und Karten nutzen sie beide,
damit Anzeige und Spalten nie auseinanderlaufen.

```
 (1)----------------(2)----------------(3)-----> Archiv
 Neu                Zweite Runde       Letzte Runde
 bis Termin 7       bis Termin 6       nur noch Termin 5
```

- Desktop: Schritte mit Verbindungslinie über den Spalten. Mobil: Spalten
  untereinander, die Verbindung läuft als senkrechte Linie links.
- „Letzte Runde“ bekommt eigene Tokens (`--last-round`, `--last-round-foreground`)
  in einem warmen, gedeckten Ton.
- Lebensanzeige auf der Karte: drei Punkte, davon `4 - column` gefüllt, daneben der
  Text („noch 3 Termine“, „noch 2 Termine“, „letzte Chance“). Karten in Spalte 3
  bekommen einen schmalen Rand links im Ton der letzten Runde.

### 5. Personenfarben aus der Benutzer-ID

`personColor(userId)` wählt aus einer festen Palette von acht gedeckten Farben
(`userId % 8`). Jede Farbe ist ein Paar aus heller Fläche und dunkler Schrift, im
Theme als CSS-Variablen `--person-0` bis `--person-7` hinterlegt und auf AA-Kontrast
geprüft. Benutzer-IDs sind fortlaufend, die ersten acht Personen eines Systems
bekommen also verschiedene Farben.

- Alternative: Hash über den Namen. Verworfen: Die Farbe würde sich bei
  Namensänderung ändern.
- Namen ohne `userId` erhalten die neutrale `secondary`-Darstellung.
- Eine gemeinsame Komponente `PersonAvatar` und `PersonBadge` ersetzt die heutigen
  einzelnen `Avatar`-Verwendungen (Kopfzeile, Anwesenheit, Rollen, Karten).

### 6. Termin-Leiste mit Zustand

Bei laufendem Termin bekommt die Leiste einen Akzentrand links, eine leichte
Akzentfläche und die Dauer („seit 23 min“, ab einer Stunde „seit 1 h 05 min“). Ein
Hook `useNow(30_000)` aktualisiert die Zeit alle 30 Sekunden. Moderation und
Protokoll zeigen den `PersonAvatar` im Auswahlfeld. Bei geplantem Termin bleibt die
Leiste neutral.

### 7. Typografie und Dichte

- Ziffern mit fester Breite (`tabular-nums`) bei Terminnummern, Zählern und Zeiten.
- Leere Spalten mit gestricheltem Rand und kurzem Hinweis statt leerer grauer Fläche.
- Etwas geringere Abstände innerhalb der Spalten, klarere Abstufung von Titel,
  Beschreibung und Metadaten auf Karten.
- Akzentfarbe nur noch für primäre Aktionen, den laufenden Termin und aktive
  Navigation.

## Risks / Trade-offs

- [Positionen veralten, wenn sich zwischen zwei Renderings die Fenstergröße ändert]
  → Positionen werden nach jedem Rendern neu gemessen; bei sehr großen Sprüngen
  (über eine Bildschirmbreite) wird die Animation übersprungen.
- [Geister archivierter Karten überlagern Inhalte beim Scrollen] → Die Ebene ist
  nur für die Dauer der Animation sichtbar und an die Fensterkoordinaten der
  Messung gebunden.
- [Nicht modale Bestätigung wird übersehen oder bleibt offen] → Sie bekommt den
  Fokus und ist am unteren Rand fixiert. Ändert sich der Termin inzwischen (Version
  oder Status), schließt sie sich automatisch.
- [Acht Personenfarben reichen bei großen Boards nicht für Eindeutigkeit] → Farbe
  ist nie die einzige Unterscheidung; Name bzw. Initialen bleiben immer sichtbar.
- [Ende-zu-Ende-Test verlässt sich auf den bisherigen Dialog] → Test wird auf die
  Bestätigungsleiste umgestellt und prüft zusätzlich die Vorschau.
