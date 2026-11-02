## Why

Wer auf dem großen Zettel nur die Farbe wechseln oder einen Tippfehler im Titel
korrigieren will, muss heute erst „Bearbeiten“ klicken, ändern und „Speichern“
klicken. Namen und „besprochen“ wirken dagegen schon direkt auf dem Zettel. Der
Modus ist damit eine unnötige Hürde und passt nicht zur Metapher, direkt auf das
Papier zu schreiben, gerade im Termin, wenn alle gemeinsam auf einen Zettel
schauen.

## What Changes

- **BREAKING (Oberfläche):** Der Button „Bearbeiten“ und der Bearbeiten-Modus des
  großen Zettels entfallen. „Abbrechen“ und „Speichern“ gibt es für bestehende
  Karten nicht mehr.
- Titel und Beschreibung werden per Klick (oder Tastatur) direkt auf dem Zettel zum
  Eingabefeld. Verlassen des Felds speichert, beim Titel auch Enter; Escape
  verwirft die Eingabe. Unveränderte Felder lösen keine Speicherung aus. Ein leerer
  Titel wird nicht gespeichert, sondern mit Fehlermeldung angezeigt.
- Die Farbwahl liegt direkt auf dem großen Zettel; ein Klick auf eine Farbe
  speichert sofort und erscheint live bei allen. Das „Farbe ausprobieren“ ohne
  Speichern entfällt.
- „Löschen“ liegt als Mülleimer-Symbol mit der bisherigen Bestätigung direkt auf dem
  großen Zettel.
- Auch in der gemeinsamen Fokusansicht kann jeder Teilnehmer Titel, Beschreibung,
  Farbe und Namen direkt ändern.
- Ändert jemand anderes ein Feld, das ich gerade bearbeite, bleibt meine Eingabe
  erhalten und am Feld erscheint ein Hinweis mit „Neuen Stand übernehmen“. Alle
  anderen Felder aktualisieren sich wie bisher live.
- Ein neues Thema bleibt ein großer gelber Zettel mit Titel, Beschreibung, Farbwahl
  und „Anlegen“/„Abbrechen“, weil die Karte vorher noch nicht existiert.

Annahmen aus der Diskussion, die noch nicht ausdrücklich bestätigt wurden:
Mülleimer-Symbol für „Löschen“, jeder Farbklick erzeugt einen eigenen Eintrag
„Karte bearbeitet“ im Audit-Log, und eine noch nicht gespeicherte Eingabe wird
gespeichert, wenn der Zettel geschlossen wird oder der Fokus wechselt bzw. endet.

## Capabilities

### New Capabilities

_Keine._

### Modified Capabilities

- `topic-board`: „Detailansicht“ ist nicht mehr frei von Eingabefeldern;
  „Bearbeiten aus der Detailansicht“ wird durch „Direkt auf dem Zettel bearbeiten“
  ersetzt; neue Anforderungen „Löschen direkt auf dem Zettel“ und „Gleichzeitig
  dasselbe Feld bearbeiten“; „Zettelfarbe“ wird direkt statt im
  Bearbeiten-Modus gewählt.
- `ui-appearance`: „Großer Zettel“ ohne Bearbeiten-Modus, mit Farbwahl und Löschen
  direkt auf dem Papier; „Farbe ausprobieren“ entfällt.
- `meeting-cycle`: „Gemeinsamer Fokus“ ist in der Fokusansicht bearbeitbar; „nicht
  unterbrechen“ gilt künftig für ein gerade bearbeitetes Feld statt für den
  Bearbeiten-Modus.

## Impact

- **Web:** `apps/web/src/components/card-sheet.tsx` (Detailansicht und Formular
  werden zu einem Zettel mit Inline-Feldern; das Formular bleibt nur für neue
  Themen), `apps/web/src/pages/board-page.tsx` („beschäftigt“ hängt nicht mehr am
  Modus, sondern an einem gerade bearbeiteten Feld).
- **Server, Datenbank:** keine Änderung; `PATCH /cards/:cardId` nimmt schon
  einzelne Felder an.
- **Shared-Paket:** `cardTitleSchema` und `cardDescriptionSchema` werden exportiert,
  damit der Client beim Inline-Speichern dieselben Regeln prüft.
- **Tests:** E2E-Tests in `card-focus.spec.ts`, `meeting-flow.spec.ts` und
  `sticky-notes.spec.ts` nutzen heute „Bearbeiten“ und müssen umgestellt werden;
  neue E2E-Fälle für Inline-Bearbeitung, direkte Farbwahl und Bearbeiten im Fokus.
- Keine neuen Abhängigkeiten.
