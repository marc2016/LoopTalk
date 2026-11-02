## Context

Der große Zettel (`apps/web/src/components/card-sheet.tsx`) hat heute zwei Teile:
`CardDetails` zum Lesen mit „Bearbeiten“ und `CardForm` (react-hook-form + zod) für
Anlegen und Bearbeiten. `CardSheet` hält `mode: "view" | "edit" | "create"`, das
Board (`apps/web/src/pages/board-page.tsx`) steuert den Modus und leitet daraus
`busy` ab: Ist meine persönliche Ansicht nicht im Lese-Modus, öffnet sich ein
gezeigter Fokus nicht, sondern erscheint als Leiste. Die Fokusansicht ist ein
eigener `CardSheet` mit `key={focus:<cardId>:<since>}`, also wird sie beim
Fokuswechsel neu gemountet. „Bearbeiten“ in der Fokusansicht wechselt heute in die
persönliche Ansicht.

`PATCH /cards/:cardId` nimmt einzelne Felder an (`updateCardSchema`), schreibt einen
Audit-Eintrag „Karte bearbeitet“ mit alten und neuen Werten und schickt ein
Live-Event; die Mutationen in `apps/web/src/lib/queries.ts` zeigen Fehler als
Toast und invalidieren danach den Board-Stand. Für diese Änderung ist am Server
nichts zu tun; im Shared-Paket werden nur zwei bestehende Schemas exportiert.

## Goals / Non-Goals

**Goals:**
- Ein Zettel ohne Modus für bestehende Karten, in persönlicher Ansicht und Fokus
  gleich.
- Konflikte pro Feld statt pro Formular.
- Logik, die entscheidet, ob gespeichert wird, als reine, unit-getestete Funktion.

**Non-Goals:**
- Echtzeit-Mitschreiben (fremde Tastenanschläge live sehen) oder Feldsperren.
- Bündeln mehrerer Änderungen zu einem Audit-Eintrag.
- Änderungen am Anlegen-Ablauf außer dem Entfernen der Bearbeiten-Teile aus dem
  Formular.

## Decisions

### Ein Zettel-Inhalt, das Formular nur noch zum Anlegen
`CardDetails` wird zum einzigen Inhalt für bestehende Karten (persönlich und Fokus).
`CardForm` bleibt nur für `create` und verliert Löschen, Konflikthinweis und
Bearbeiten-Zweig. `SheetMode` schrumpft auf `"view" | "create"`, `onModeChange`
entfällt.
*Alternative:* das Formular dauerhaft offen lassen (Variante „immer beschreibbar“).
Verworfen: Ein Formular über alle Felder kennt nur einen gemeinsamen Ausgangsstand,
Live-Updates anderer Felder würden blockiert oder überschrieben.

### Eigene Komponente `InlineField` pro Feld
Je eine Instanz für Titel (einzeilig) und Beschreibung (mehrzeilig). Zustand pro
Feld: `idle` oder `editing { base, value, error }`.
- **Anzeige:** ein `<button type="button">`, gestylt wie Schrift auf dem Papier,
  mit `aria-label` „Titel bearbeiten“ bzw. „Beschreibung bearbeiten“. Leere
  Beschreibung zeigt „Beschreibung ergänzen …“ in gedämpfter Schrift. Klick, Enter
  oder Leertaste wechselt in `editing`, `base` ist der Wert in diesem Moment.
- **Bearbeiten:** dasselbe Feld-Styling wie heute (`paperField`), Autofokus, Cursor
  ans Ende. Titel: Enter speichert. Beschreibung: Enter ist Zeilenumbruch,
  Strg/Cmd+Enter speichert. Blur speichert. Escape verwirft und bleibt im Zettel.
- **Speichern:** Eine reine Funktion `commitField(field, base, value)` in
  `apps/web/src/lib/inline-edit.ts` liefert `skip` (getrimmt unverändert), `error`
  (Titel leer bzw. zu lang, mit derselben Meldung wie das zod-Schema) oder
  `save` mit dem normalisierten Wert. Validiert wird mit `cardTitleSchema` bzw.
  `cardDescriptionSchema` aus dem Shared-Paket (dort bisher nicht exportiert, sie
  werden nur zusätzlich exportiert), damit Client und Server dieselben Regeln haben. Bei `save` ruft das Feld `updateCard.mutate({ id, [field]: value })`
  und geht sofort zurück in `idle` mit dem gespeicherten Wert als Anzeige, bis das
  Live-Update kommt; schlägt die Mutation fehl, erscheint der bestehende Fehler-Toast
  und die Anzeige fällt auf den Server-Stand zurück.
*Alternative:* `contentEditable`. Verworfen: schlechter mit Screenreadern, Probleme
mit Einfügen formatierten Texts.

### Escape gehört dem Feld, nicht dem Dialog
Solange ein Feld in `editing` ist, verhindert `onEscapeKeyDown` des
`DialogContent` das Schließen (`event.preventDefault()`), und das Feld verwirft
seine Eingabe. Dazu meldet jedes Feld seinen Zustand an `CardSheet`
(`onEditingChange(field, editing)`).

### Konflikt pro Feld
Während `editing` vergleicht das Feld `base` mit dem aktuellen Live-Wert seines
Felds. Weichen sie ab, zeigt es unter dem Feld den bekannten Hinweis
(`data-testid="edit-conflict"`, Name aus dem letzten `card.updated` im Audit wie
heute) mit „Neuen Stand übernehmen“ (setzt `base` und `value` auf den Live-Wert).
Speichert man trotzdem, gilt die eigene Eingabe (letzter gewinnt, wie bisher).
Andere Felder sind davon unberührt, weil jedes Feld nur seinen eigenen Wert prüft.

### Farbe sofort speichern, optimistisch anzeigen
Die Farbwahl (native Radios wie heute) liegt in `CardDetails` unter der
Beschreibung. Bei Änderung: Ist die Farbe gleich der aktuellen, nichts tun; sonst
lokale `pendingColor` setzen (färbt den Zettel über `data-color` sofort um) und
`updateCard.mutate({ id, color })`. `pendingColor` wird gelöscht, sobald die
Live-Karte die Farbe hat oder die Mutation fehlschlägt. Die Komponente der
Farbwahl wird zwischen Anlegen-Formular (dort über react-hook-form) und Zettel
geteilt.

### Löschen als Symbol
Das bestehende `AlertDialog` wandert aus `CardForm` in `CardDetails`, ausgelöst von
einem Icon-Button (`Trash2Icon`, `aria-label="Löschen"`) im Footer neben „Allen
zeigen“. Gilt auch in der Fokusansicht; das Löschen der Fokuskarte beendet den
Fokus schon heute serverseitig.

### Ungespeicherte Eingabe beim Schließen und Fokuswechsel
Jedes Feld speichert beim Unmount, wenn `commitField` `save` ergibt. Das deckt
Schließen (Dialog schließt, Feld wird ausgehängt), Fokuswechsel (neuer `key` →
Remount) und Fokusende ab. Die Mutation wird dafür direkt über die API-Funktion
ausgeführt und der Board-Stand danach invalidiert, nicht über Callbacks des
ausgehängten Hooks. Ein Titel, der beim Schließen leer ist, wird verworfen (nicht
speicherbar).
*Alternative:* Schließen blockieren, bis gespeichert ist. Verworfen: Fokuswechsel
kommt von außen und darf nicht blockieren.

### „Beschäftigt“ hängt am bearbeiteten Feld
`CardSheet` meldet über `onBusyChange(boolean)`, ob gerade ein Feld in `editing` ist.
`board-page.tsx` ersetzt `sheet.mode !== "view"` durch
`sheet.mode === "create" || personalFieldEditing`. Die Fokusansicht meldet nichts:
Wer im Fokus tippt, wird bei einem Fokuswechsel mitgenommen (Eingabe wird nach der
vorigen Entscheidung gespeichert). Die Regel „Fokus ersetzt eine persönliche
Ansicht im Lese-Modus“ gilt unverändert für die persönliche Ansicht ohne aktives
Feld; endet die Eingabe, während ein Fokus wartet, öffnet sich danach der Fokus.

## Risks / Trade-offs

- [Mehr Audit-Einträge, z. B. beim Durchklicken von Farben] → bewusst akzeptiert;
  jeder Eintrag ist eine echte gespeicherte Änderung, Unveränderte erzeugen keinen.
- [Zwei Personen tippen im Fokus gleichzeitig in dieselbe Beschreibung, der Letzte
  überschreibt] → Konflikthinweis am Feld; bewusst kein Sperren (siehe Non-Goals).
- [Speichern beim Unmount läuft, wenn die Karte inzwischen gelöscht ist] → API
  antwortet 404; der Fehler wird nicht als Toast gezeigt, weil die Ansicht ohnehin
  mit „Das Thema ist nicht mehr auf dem Board“ schließt.
- [Versehentliches Speichern durch Blur, z. B. beim Wechsel in ein anderes Fenster]
  → Blur durch Fenster- oder Tab-Wechsel (`document.hasFocus()` falsch) speichert
  nicht; die Eingabe bleibt offen.
- [Textauswahl mit der Maus in der Anzeige startet Bearbeiten] → akzeptiert; der
  Text bleibt im Feld markierbar und kopierbar.

## Migration Plan

Reine Frontend-Änderung ohne Datenmigration. Ausrollen mit dem nächsten Image;
Rückweg ist das vorige Image.
