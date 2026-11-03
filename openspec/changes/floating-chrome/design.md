## Context

`app-shell.tsx` rendert einen weißen Kopf (`h-14`, `border-b`) und ein `<main>`
mit `max-w-7xl px-4 py-6`; darin stapelt `board-layout.tsx` Board-Name,
„Board bearbeiten“, „Link kopieren“, Anwesenheit (`presence-bar.tsx`) und die Tabs
(`<nav aria-label="Board-Ansichten">` mit `NavLink`s), darunter `board-page.tsx`
mit `MeetingBar`, `FocusBar` und der Wand aus `board-wall` (`.wall`, `data-wall`,
`rounded-xl p-4`). `meeting-bar.tsx` ist eine Section im Fluss; die
Beenden-Bestätigung (`EndConfirmBar`) ist bereits `fixed bottom-0 z-40` mit
`role="alertdialog"`. Dialoge liegen auf `z-50`, der Toaster oben rechts mit
`offset={72}`. Es gibt nur ein helles Theme; Farben sind oklch-Tokens in
`index.css`, Kontraste werden in `note.test.ts` und `wall.test.ts` aus der CSS
gelesen und gerechnet.

Diese Änderung setzt auf `board-wall` auf.

## Goals / Non-Goals

**Goals:**
- Wand als Seitenhintergrund der Board-Route, Bedienung als zwei Glasflächen
  (Leiste oben, Dock unten) plus Toast.
- Keine Überdeckung: Zettel und Etiketten bleiben immer erreichbar, auch per
  Tastatur und in E2E-Tests.
- Bestehende Komponenten (Rollen-Auswahl, Bestätigung, Anwesenheit) wiederverwenden,
  nur neu verpackt.

**Non-Goals:**
- Eigene Glasfarbe je Wand, Dunkelmodus.
- Änderungen an Zetteln, Etiketten oder der Wand-Umschaltung.
- Ein- und Ausklappen der Leiste beim Scrollen.

## Decisions

### Eine Leiste mit Slot: Portal aus dem Board-Layout
`AppShell` rendert die Glasleiste (`<header data-testid="glass-bar">`, sticky)
mit Logo links, Ich/Abmelden rechts und dazwischen einem leeren Slot-Element. Ein
`ChromeContext` stellt das Slot-Element bereit (Callback-Ref → State), und
`BoardLayout` rendert Board-Name, „Board bearbeiten“, Bereiche, „Link kopieren“
und Anwesenheit per `createPortal` hinein. So bleibt die Leiste ein Element im
DOM, und Seiten ohne Board lassen den Slot leer.
*Alternative:* Leiste in `BoardLayout` duplizieren. Verworfen: zwei Köpfe mit
gleichem Inhalt, die auseinanderlaufen.

### Bereiche als Segment-Pille
Das `<nav aria-label="Board-Ansichten">` bleibt mit `NavLink`s (Rolle `link`,
Namen „Board“, „Historie“, „Audit-Log“, „Teilnehmer“ wie heute), bekommt aber
`rounded-full bg-foreground/6 p-0.5` und der aktive Link `bg-card shadow-xs`
statt des Unterstrichs. Auf schmalen Bildschirmen zeigt die Pille nur Icons mit
`aria-label`; der Name bleibt als Link-Name erhalten.

### Randlose Wand nur auf der Board-Route
`<main>` in `AppShell` verliert Container und Padding. Ein neues
`PageContainer` (`mx-auto max-w-7xl px-4 py-6`) umschließt Startseite,
Historie, Audit-Log, Teilnehmer und Not-Found; `BoardLayout` setzt es um den
`Outlet`, außer für die Index-Route (`useMatch("/b/:slug", { end: true })`),
die die Wand direkt rendert. Die Wand verliert `rounded-xl` und den Schatten,
behält `.wall`/`data-wall`, bekommt `min-height: calc(100dvh - var(--bar-h))`,
`padding-top: 1.25rem` und `padding-bottom: calc(var(--dock-h) + 2rem)`.

### Glas als Token-Satz mit Rückfall
```
--glass-bg: oklch(1 0 0 / 0.8); --glass-border: oklch(1 0 0 / 0.6);
--glass-shadow: 0 1px 2px oklch(0.2 0.02 70 / 0.08), 0 8px 24px oklch(0.2 0.02 70 / 0.12);
.glass { background: var(--glass-bg); backdrop-filter: blur(14px) saturate(1.2);
         border: 1px solid var(--glass-border); box-shadow: var(--glass-shadow); }
@media (prefers-reduced-transparency: reduce) { .glass { background: var(--card); backdrop-filter: none } }
@supports not (backdrop-filter: blur(1px)) { .glass { background: var(--card) } }
```
Die Leiste nutzt `.glass` ohne seitliche Ränder und mit `border-bottom`. Ein Test
`glass.test.ts` liest `--glass-bg` und rechnet die Deckung von 80 % Weiß über
jeder Zettelfarbe (Alter 3) und jeder Wand: `foreground` und `muted-foreground`
darauf ≥ 4,5:1, `primary` ≥ 4,5:1.

### Dock und Toast in einem festen Stapel
Ein fester Wrapper unten (`position: fixed; inset-x: 0; bottom: 0;
padding-bottom: max(1rem, env(safe-area-inset-bottom)); pointer-events: none;
z-index: 40`) enthält einen zentrierten Stapel (`max-w-4xl`, `flex-col gap-2`,
`pointer-events: auto`): oben der Fokus-Toast (`FocusBar`, `data-testid=
"focus-bar"`, Glas, `role="status"` wie heute), darunter das Dock
(`<section aria-label="Aktueller Termin" data-testid="meeting-dock">`, Glas).
`MeetingBar` wird zum Inhalt des Docks; die Warnung „zu wenige Teilnehmer“ wird
eine kompakte Zeile oben im Dock. Die Bestätigung rendert innerhalb des Docks
als zweiter Block (`role="alertdialog"`, ids `end-confirm-title/description`,
`data-testid="end-not-discussed"` bleiben), das Dock wächst nach oben.
`FocusBar` und `MeetingBar` bleiben eigene Komponenten; `board-page.tsx` rendert
nur noch den Stapel statt der Leisten im Fluss.

### Dockhöhe als CSS-Variable
Ein `ResizeObserver` auf dem Stapel schreibt seine Höhe nach
`--dock-h` auf `document.documentElement` (Hook `useDockHeight`). `html` bekommt
`scroll-padding-block: var(--bar-h) calc(var(--dock-h) + 1rem)`, `--bar-h` ist
fest `3.5rem`. Damit landet ein per Tab fokussierter Zettel im freien Bereich, und
die Wand hat unten immer genau so viel Innenabstand wie das Dock hoch ist, auch
mit aufgeklappter Bestätigung.
*Alternative:* feste Innenabstände. Verworfen: Die Bestätigung und der Toast
ändern die Dockhöhe um mehr als 100 px.

### Dock auf schmalen Bildschirmen
Unter `md` zeigt das Dock eine Zeile: „Termin N“, Dauer-Badge, Hauptknopf und
einen Icon-Button mit `aria-label="Rollen anzeigen"`/`"Rollen ausblenden"`
(`aria-expanded`), der den Block mit Moderation, Protokoll und Hinweis einblendet.
Ab `md` ist der Block immer sichtbar und der Button versteckt. Zustand liegt in
`MeetingBar`.

### Anwesenheit kompakt
`PresenceBar` zeigt unter `md` nur die Avatargruppe und den Verbindungs-Punkt;
der Text „Gerade da“/„Verbinde …“ bleibt ab `md`. `data-testid="presence-user"`
und der `sr-only`-Text bleiben.

### Bewegung
Dock, Toast und Bestätigung erscheinen mit `motion-safe:animate-in fade-in-0
slide-in-from-bottom-2`; unter `prefers-reduced-motion` ohne Animation (die
heutige `animate-in`-Klasse der Bestätigung wird auf `motion-safe:` umgestellt).

## Risks / Trade-offs

- [`backdrop-filter` über der Weiterrück-Animation ruckelt auf schwachen Geräten]
  → Glasflächen sind klein (Leiste 56 px, Dock ≈ 80 px); bei Problemen Blur
  während `useCardShift` über ein `data-animating`-Attribut aussetzen (vorbereitet,
  nicht standardmäßig aktiv).
- [Dock überdeckt Zettel, Playwright-Klicks gehen daneben] → Innenabstand aus
  `--dock-h`, `scroll-padding`, und E2E prüft, dass der letzte Zettel oberhalb des
  Docks liegt.
- [Rollen-Popover öffnet unter dem Dock nach unten und wird abgeschnitten] →
  Popover-`side="top"` im Dock.
- [`prefers-reduced-transparency` wird nicht überall unterstützt] → zusätzlich
  `@supports not (backdrop-filter)`-Rückfall; im schlimmsten Fall 80 % Weiß ohne
  Blur, das laut Test lesbar bleibt.
- [Der Toaster oben rechts überlappt die Leiste] → `offset` bleibt 72 px, also
  unter der 56-px-Leiste.
- [Zwei feste Flächen fressen auf dem Handy Platz] → Dock einzeilig, Leiste
  56 px; zusammen ≈ 130 px von ~800 px.

## Migration Plan

Reine Frontend-Änderung ohne Daten- oder API-Änderung; Ausrollen mit dem nächsten
Image, Rückweg ist das vorige Image.
