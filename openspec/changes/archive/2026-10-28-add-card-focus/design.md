# Design: Karten groß ansehen und gemeinsam im Termin zeigen

## Context

- Ein Klick auf eine Karte öffnet heute `CardDialog`
  (`apps/web/src/components/card-dialog.tsx`), ein Formular mit Namen, Verlauf und
  Löschen.
- Live-Updates laufen über ein `board`-Event per SSE, das die Board-Query
  invalidiert. Der Grund ist als `AuditAction` typisiert
  (`packages/shared/src/index.ts`).
- Der aktuelle Termin wird für jede Änderung an Rollen, Topf oder Teilnehmern per
  `SELECT … FOR UPDATE` gesperrt (`lockCurrentMeeting`). Seine `version` schützt
  Starten, Beenden und Rollenänderungen.
- Die Bestätigung zum Beenden aus `polish-board-ui` gilt genau für die Version, bei
  der sie geöffnet wurde.
- Beim Beenden schreibt `meetingService.end` einen Stand aller offenen Karten in
  `meeting_cards`.
- Migrationen: `0000_init`, `0001_audit_append_only`.

Anforderungen: siehe Delta-Specs.

## Goals / Non-Goals

**Goals:**
- Fokus und „besprochen“ sind Serverzustand, damit Neuladen, spätes Dazukommen
  und Wiederverbinden ohne Sonderlogik funktionieren.
- Fokus ändert die Terminversion nicht, damit Zeigen weder Rollenänderungen noch
  eine offene Bestätigung zum Beenden stört.
- Detail-, Bearbeiten- und Fokusansicht sind eine Komponente mit Modi, nicht drei.

**Non-Goals:**
- Kein Folgen von Scrollposition oder Markierungen innerhalb einer Karte.
- Kein serverseitiger Konfliktschutz beim gleichzeitigen Bearbeiten (nur Hinweis).
- Kein Protokoll in der App; „besprochen“ ist nur ein Merker pro Termin.

## Decisions

### 1. Datenmodell

Neue Migration `0002_card_focus`:

| Änderung | Felder |
|---|---|
| `meetings` (neue Spalten) | `focus_card_id` (FK `cards`, nullable), `focus_by` (FK `users`, nullable), `focus_since` (`timestamptz`, nullable); `CHECK`: alle drei gemeinsam gesetzt oder leer |
| `meeting_discussed` (neu) | `meeting_id`, `card_id`, `marked_by`, `marked_at`; PK `(meeting_id, card_id)` |
| `meeting_cards` (neue Spalte) | `discussed boolean not null default false` |

- Der Fokus gehört zum Termin. Ein beendeter Termin hat ihn damit implizit
  verloren, und der nächste Termin beginnt ohne Fokus. „Fokus endet mit dem
  Beenden“ ergibt sich also aus dem Datenmodell. Beim Beenden wird der Fokus
  trotzdem explizit geleert, damit die Historie sauber ist.
- „Besprochen“ hängt am Termin, nicht an der Karte. Das macht „mit dem nächsten
  Termin wieder nicht besprochen“ trivial.
- Alternative: ein Feld `discussed_at` an `cards`. Verworfen, weil man es beim
  Beenden zurücksetzen müsste und die Information pro Termin verloren ginge.

### 2. Server: Endpunkte und Sperren

| Methode | Pfad | Zweck |
|---|---|---|
| PUT | `/api/boards/:slug/meetings/current/focus` | Karte zeigen (Body: `cardId`) |
| DELETE | `/api/boards/:slug/meetings/current/focus` | Fokus beenden |
| PUT | `/api/boards/:slug/meetings/current/discussed/:cardId` | als besprochen markieren |
| DELETE | `/api/boards/:slug/meetings/current/discussed/:cardId` | Markierung entfernen |

- Alle Endpunkte sperren den aktuellen Termin wie bisher, prüfen
  `status = running` (sonst 409) und dass die Karte offen zum Board gehört (sonst
  404). Die Terminversion bleibt unverändert (siehe Goals).
- Zeigen setzt den Fokus und markiert in derselben Transaktion als besprochen, falls
  das noch nicht geschehen ist. Ein Audit-Eintrag `card.discussed` mit
  `data.via = "focus"` entsteht nur bei neuer Markierung. Das Zeigen selbst wird
  nicht protokolliert.
- Markieren und Entfernen sind idempotent: Ohne Änderung entsteht kein Eintrag.
  Neue Audit-Aktionen sind `card.discussed` und `card.undiscussed` mit Ziel Karte
  und `data` aus Titel und Terminnummer.
- `cards.remove` leert in derselben Transaktion den Fokus, wenn die gelöschte Karte
  im Fokus ist.
- `meetings.end` übernimmt für den Stand in `meeting_cards.discussed` die Einträge
  aus `meeting_discussed` und leert den Fokus.
- SSE: `BoardChangedEvent.reason` wird um `meeting.focus_changed` erweitert, weil
  Zeigen keine Audit-Aktion ist. Clients laden wie bisher die Board-Ansicht neu.
  Fokus und „besprochen“ sind Teil dieser Ansicht. Wiederverbinden lädt ohnehin
  neu, eine Sonderlogik braucht es nicht.

### 3. API-Typen

- `CurrentMeeting.focus: { cardId: number; by: UserRef; since: string } | null`
- `CardView.discussed: boolean` (nur bei laufendem Termin `true` möglich)
- `MeetingCardSnapshot.discussed: boolean`

### 4. Frontend: eine Karten-Ansicht mit Modi

`CardDialog` wird zu `CardSheet` mit den Modi `view`, `edit` und `create`. Ob es
sich um die Fokusansicht handelt, steuert ein zusätzliches Flag `focus`.

```
                    +--> [Bearbeiten] --> edit --[Speichern|Abbrechen]--+
 Klick --> view ----+                                                   |
   ^                +--> [Allen zeigen] --> PUT focus                   |
   +--------------------------------------------------------------------+
 "+ Thema" --> create --[Anlegen]--> geschlossen (mehrere Themen schnell nacheinander)
```

- **view:** Titel groß, Beschreibung vollständig mit `whitespace-pre-line`.
  Darunter Lebensanzeige (`lifecycle`), Namen als `PersonBadge` mit
  Hinzufügen/Entfernen, Ersteller und Datum, Verlauf eingeklappt.
  - Bei laufendem Termin zusätzlich der Schalter „besprochen“ und „Allen zeigen“.
  - In der Fokusansicht steht oben „<Name> zeigt“, und es gibt „Fokus beenden“.
- **edit:** Formular wie heute (react-hook-form, zod). „Löschen“ gibt es nur hier.
  - Beim Wechsel in den Modus merkt sich das Formular Titel und Beschreibung.
  - Weicht die Live-Karte davon ab, erscheint ein Hinweis mit dem Namen aus dem
    jüngsten `card.updated`-Eintrag des Kartenverlaufs: „Ben hat dieses Thema
    gerade geändert“. Die Eingaben bleiben, eine Schemaänderung braucht es dafür
    nicht.
- **Verschwundene Karte:** Ist die Karte gelöscht oder archiviert, schließt sich
  die Ansicht mit dem Hinweis „Das Thema ist nicht mehr auf dem Board“.

### 5. Aus der Karte wachsen

Beim Klick merkt sich die Board-Seite das Rechteck der Karte. Nach dem Öffnen
animiert `CardSheet` den Inhalt per Web Animations API von diesem Rechteck
(`translate` + `scale`) auf seine endgültige Position. Die Dauer liegt bei etwa
250 ms, dieselbe Easing-Kurve wie beim Weiterrücken.

- Beim Schließen läuft dieselbe Animation rückwärts, erst danach schließt der
  Dialog.
- Die Fokusansicht bei anderen wächst aus der Karte auf ihrem eigenen Board.
- Ohne Ursprungsrechteck (Karte nicht sichtbar) und bei reduzierter Bewegung
  blendet die Ansicht nur ein.
- Alternative: View Transitions API. Aus demselben Grund wie in `polish-board-ui`
  verworfen.

### 6. Wann die Fokusansicht bei anderen aufgeht

Die Board-Seite leitet den Zustand aus `board.meeting.focus` ab und hält lokal
`dismissed`, den Schlüssel `cardId + since` des zuletzt selbst geschlossenen
Fokus.

- Die Fokusansicht ist offen, wenn ein Fokus existiert, sein Schlüssel nicht
  `dismissed` ist und ich nicht beschäftigt bin.
- **Beschäftigt** heißt: Meine Karten-Ansicht ist im Modus `edit` oder `create`,
  oder ein anderer Dialog ist offen. Das prüft die Seite über
  `[data-slot=dialog-content][data-state=open]`, ohne die eigene Ansicht
  mitzuzählen.
- Habe ich eine Karte im Modus `view` offen, ersetzt die Fokusansicht sie
  endgültig: Nach dem Schließen des Fokus kommt nicht die alte Ansicht wieder
  hervor. Wer selbst „Allen zeigen“ klickt, schließt dabei seine eigene Ansicht,
  und zwar sofort beim Klick, weil das Live-Event vor der Antwort eintreffen kann.
- Bearbeite ich gerade die gezeigte Karte selbst, nennt der Hinweis im Formular
  das („<Name> zeigt gerade dieses Thema allen“).
- Ein neuer Fokus hat einen neuen Schlüssel und öffnet sich deshalb auch dann
  wieder, wenn ich den vorigen geschlossen hatte.
- **Leiste:** Gibt es einen Fokus, ohne dass die Ansicht offen ist, erscheint unter
  der Termin-Leiste „<Name> zeigt: <Titel> [Zurück zum Fokus] [Fokus beenden]“.
  Bin ich beschäftigt, heißt der Button „Ansehen“.

### 7. „Heute besprochen“, Warnung und Historie

- **TopicCard:** zeigt bei `discussed` ein dezentes Häkchen „heute besprochen“ in der
  Fußzeile. Es ersetzt nicht die Lebensanzeige.
- **Bestätigung zum Beenden:** listet die Titel der Karten in Spalte 3 mit
  `discussed = false` als Warnung, zum Beispiel: „Nicht besprochen und wird
  archiviert: Hiring“.
- **Historie:** zeigt pro Karte ein Etikett „besprochen“. Nicht besprochene Karten
  erscheinen gedämpft.

## Risks / Trade-offs

- [Fokus reißt jemanden aus dem Lesen einer anderen Karte] → Der View-Modus wird
  bewusst ersetzt, weil das genau der Zweck ist. Bearbeiten und andere Dialoge
  bleiben geschützt, und Schließen ist ein Klick.
- [Zwei Personen zeigen fast gleichzeitig] → Die Sperre auf dem Termin serialisiert,
  der Letzte gewinnt, und alle sehen denselben Stand. Das ist gewollt, weil es keine
  Rechte gibt.
- [Prüfung auf offene Dialoge über das DOM ist lose gekoppelt] → Sie ist auf ein
  `data-slot`-Attribut von shadcn begrenzt und durch einen Ende-zu-Ende-Test
  abgesichert, der beim Umbenennen-Dialog nicht unterbricht.
- [Hinweis bei gleichzeitigem Bearbeiten verhindert kein Überschreiben] → Er ist als
  Hinweis bewusst so gewählt (siehe Non-Goals). Wer danach speichert, überschreibt,
  und das Audit-Log hält beide Stände fest.
- [Wachsen-Animation und Radix-Dialog-Animation überlagern sich] → Die eingebaute
  Zoom-Animation des Dialogs wird für `CardSheet` abgeschaltet, nur die eigene
  läuft.

## Migration Plan

- Die Migration `0002_card_focus` fügt nur Spalten und eine Tabelle hinzu. Die
  Standardwerte machen bestehende Daten gültig (`discussed = false`, kein Fokus).
- Ausgerollt wird wie bisher über den `migrate`-Dienst vor dem App-Start.
- Rückweg: Mit einem älteren App-Stand bleiben die neuen Spalten ungenutzt. Eine
  Rückmigration ist nicht nötig.
