# Tasks

## 1. Speicher-Logik

- [x] 1.1 `cardTitleSchema` und `cardDescriptionSchema` in `packages/shared/src/index.ts` exportieren; verifizieren mit der Typprüfung (`docker compose -f compose.test.yaml run --rm test`)
- [x] 1.2 Reine Funktion `commitField(field, base, value)` in `apps/web/src/lib/inline-edit.ts` (Ergebnis `skip` | `error` mit Meldung | `save` mit getrimmtem Wert) und Unit-Tests in `inline-edit.test.ts` für unverändert, nur Leerzeichen geändert, leerer Titel, zu langer Titel, leere Beschreibung, gültige Änderung; verifizieren, dass die Web-Unit-Tests grün sind

## 2. Zettel ohne Bearbeiten-Modus

- [x] 2.1 Komponente `InlineField` (Anzeige als Text-Button mit `aria-label`, Wechsel per Klick/Enter/Leertaste, Enter bzw. Strg/Cmd+Enter und Blur speichern, Escape verwirft, Blur durch Fensterwechsel speichert nicht, Speichern beim Unmount über die API-Funktion mit anschließender Invalidierung, Fehlermeldung am Feld); verifizieren über den E2E-Fall in 2.8
- [x] 2.2 Konflikthinweis pro Feld (`data-testid="edit-conflict"`, Name aus dem letzten `card.updated`, „Neuen Stand übernehmen“), andere Felder bleiben live; verifizieren über den E2E-Fall in 2.8
- [x] 2.3 `CardDetails` umbauen: Titel und Beschreibung als `InlineField`, leere Beschreibung als „Beschreibung ergänzen …“, Button „Bearbeiten“ entfernen; verifizieren, dass der große Zettel ohne „Bearbeiten“ öffnet und Typprüfung sowie Lint grün sind
- [x] 2.4 Gemeinsame Farbwahl-Komponente aus `CardForm` herauslösen und in `CardDetails` einsetzen: gleiche Farbe ignorieren, sonst `pendingColor` setzen und sofort speichern, bei Live-Stand oder Fehler zurücksetzen; verifizieren über den E2E-Fall in 2.9
- [x] 2.5 „Löschen“ als Icon-Button mit `aria-label="Löschen"` und bestehender Bestätigung in den Footer von `CardDetails` verschieben; verifizieren über den E2E-Fall in 2.8
- [x] 2.6 Escape: `onEscapeKeyDown` des Zettels verhindert das Schließen, solange ein Feld bearbeitet wird; verifizieren über den E2E-Fall in 2.8
- [x] 2.7 `CardForm` auf das Anlegen reduzieren (Konflikthinweis, Löschen und Bearbeiten-Zweig entfernen), `SheetMode` auf `"view" | "create"` und `onModeChange` entfernen; verifizieren, dass Anlegen inklusive Farbwahl und „Abbrechen“ unverändert funktioniert (bestehende Fälle in `meeting-flow.spec.ts` und `sticky-notes.spec.ts`)
- [ ] 2.8 E2E `card-focus.spec.ts`, Test „Detailansicht“ umschreiben: kein „Bearbeiten“, Titel per Klick + Enter ändern (live bei Ben), Beschreibung per Blur, Escape verwirft ohne zu schließen, leerer Titel zeigt Fehler, Schließen mit offener Eingabe speichert, Konflikthinweis am Titel mit „Neuen Stand übernehmen“, Beschreibung bleibt dabei live, Löschen per Symbol mit Bestätigung; `meeting-flow.spec.ts` von „Bearbeiten“ auf Inline-Bearbeitung und Löschen-Symbol umstellen; verifizieren mit `docker compose -f compose.test.yaml run --rm --build e2e`
- [ ] 2.9 E2E `sticky-notes.spec.ts` umstellen: Farbe direkt auf dem großen Zettel wählen, sofort live bei der anderen Person und im Audit-Log, gleiche Farbe erneut erzeugt keinen Eintrag; „Farbe ausprobieren“ beim Anlegen mit „Abbrechen“; verifizieren mit dem E2E-Lauf

## 3. Fokus und „beschäftigt“

- [x] 3.1 `CardSheet` meldet per `onBusyChange`, ob ein Feld bearbeitet wird; in `board-page.tsx` `busy` auf `sheet.mode === "create" || personalFieldEditing || otherDialogOpen` umstellen und die Fokusansicht ohne Wechsel in die persönliche Ansicht bearbeitbar machen; verifizieren über den E2E-Fall in 3.2
- [ ] 3.2 E2E `card-focus.spec.ts`, Test „Gemeinsamer Fokus“ erweitern: im Fokus Beschreibung und Farbe ändern (bei beiden sichtbar), Fokuswechsel während der Eingabe speichert sie, nicht unterbrechen nur bei aktivem Feld, ohne aktives Feld übernimmt der Fokus; verifizieren mit dem E2E-Lauf

## 4. Abschluss

- [ ] 4.1 Gesamtlauf: `docker compose -f compose.test.yaml run --rm test` und der E2E-Lauf sind grün, und `openspec validate inline-card-editing --strict` meldet keine Fehler

## Workflow follow-up

- Nach Review die Änderung mit `/opsx:archive` archivieren und die Specs übernehmen.
