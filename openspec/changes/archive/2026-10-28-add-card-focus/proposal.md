# Proposal: Karten groß ansehen und gemeinsam im Termin zeigen

## Why

Ein Klick auf eine Karte öffnet heute sofort ein Bearbeitungsformular. Lange
Beschreibungen liest man dort schlecht, und man ändert leicht versehentlich etwas.
Vor allem fehlt im Termin ein gemeinsamer Bezugspunkt: Alle schauen auf ihr eigenes
Board, und niemand sieht, worüber gerade gesprochen wird. Am Ende des Termins ist
außerdem nicht erkennbar, welche Themen tatsächlich drankamen, auch nicht für
Themen der letzten Runde, die beim Beenden archiviert werden.

## What Changes

- **Detailansicht**: Ein Klick auf eine Karte öffnet sie groß (wächst aus der Karte
  heraus) mit vollständiger Beschreibung, Lebenszyklus, Namen, Ersteller und
  Verlauf. Bearbeiten erfolgt über einen Button „Bearbeiten“ an Ort und Stelle;
  „Löschen“ liegt im Bearbeiten-Modus. Namen lassen sich direkt in der
  Detailansicht ergänzen. „+ Thema“ öffnet die große Karte direkt zum Bearbeiten.
- **Gemeinsamer Fokus**: Während eines laufenden Termins kann jeder Teilnehmer eine
  Karte per „Allen zeigen“ in den Fokus nehmen. Sie öffnet sich bei allen groß, mit
  „<Name> zeigt“. Lokal schließbar, mit Leiste „Zurück zum Fokus“; „Fokus beenden“
  schließt sie für alle. Wer gerade bearbeitet, wird nicht unterbrochen.
- **Besprochen**: Eine Karte, die im Fokus war, gilt für diesen Termin als
  besprochen. Zusätzlich gibt es einen Schalter in der Detailansicht. Das Board
  zeigt „heute besprochen“, die Bestätigung zum Beenden warnt vor nicht
  besprochenen Themen der letzten Runde, die Historie zeigt pro Termin, was
  besprochen wurde.
- **Hinweis bei gleichzeitigem Bearbeiten**: Ändert jemand anderes eine Karte,
  die ich gerade bearbeite, sehe ich einen Hinweis.

## Capabilities

### New Capabilities

Keine.

### Modified Capabilities

- `topic-board`: neue Anforderungen „Detailansicht“, „Bearbeiten aus der
  Detailansicht“ und „Besprochen markieren“.
- `meeting-cycle`: neue Anforderungen „Gemeinsamer Fokus“ und „Warnung vor nicht
  besprochenen Themen“; geänderte Anforderung „Termin-Historie“ (enthält, was
  besprochen wurde).
- `live-updates`: neue Anforderung „Fokus bei allen“.
- `audit-log`: geänderte Anforderung „Änderungen protokollieren“ (Markieren als
  besprochen und Entfernen der Markierung).

## Impact

- **Datenbank**: neue Spalten am Termin für Fokuskarte und zeigende Person, neue
  Tabelle für besprochene Karten pro Termin, Merker „besprochen“ im
  Historien-Stand der Karten; eine neue Migration.
- **API**: neue Endpunkte zum Zeigen, Fokus beenden und Markieren als besprochen;
  Board-Ansicht und Historie liefern Fokus bzw. „besprochen“ mit.
- **Frontend**: Karten-Dialog wird zur Detailansicht mit Bearbeiten-Modus,
  Fokusansicht und Fokus-Leiste, Kennzeichnung „heute besprochen“, Warnung in der
  Bestätigung zum Beenden, Historie.
- **Abhängigkeit**: baut auf `polish-board-ui` auf (Vorschau und Bestätigung zum
  Beenden, Personenfarben, Lebensanzeige). Dieser Change ist noch nicht
  archiviert; die Warnung vor nicht besprochenen Themen ist deshalb als eigene
  Anforderung formuliert, statt dessen Anforderung zu ändern.
