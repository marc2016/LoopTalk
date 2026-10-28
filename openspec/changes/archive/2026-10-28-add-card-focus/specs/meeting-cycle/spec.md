## ADDED Requirements

### Requirement: Gemeinsamer Fokus
Während eines laufenden Termins SHALL jeder Teilnehmer eine Karte über „Allen
zeigen“ in der Detailansicht in den gemeinsamen Fokus nehmen können. Pro Termin
MUST höchstens eine Karte im Fokus sein; eine neu gezeigte Karte ersetzt die
vorige. Die Fokuskarte MUST bei allen Teilnehmern, die das Board geöffnet haben,
groß geöffnet werden, mit dem Hinweis, wer sie zeigt. Teilnehmer, die gerade eine
Karte bearbeiten oder einen anderen Dialog geöffnet haben, MUST NOT unterbrochen
werden; sie sehen stattdessen eine Leiste „<Name> zeigt: <Titel>“ mit „Ansehen“.
Schließt ein Teilnehmer die Fokusansicht, schließt sie sich nur bei ihm, und die
Leiste mit „Zurück zum Fokus“ erscheint. „Fokus beenden“ MUST den Fokus für alle
beenden. Der Fokus MUST mit dem Beenden des Termins enden und endet, wenn die
Fokuskarte gelöscht wird. Wer das Board während eines Fokus öffnet, MUST die
Fokuskarte sofort sehen. Zeigen und Fokus beenden erzeugen keinen Audit-Eintrag.

#### Scenario: Allen zeigen
- **GIVEN** ein laufender Termin, Anna und Ben haben das Board geöffnet
- **WHEN** Anna die Karte „Release-Planung“ allen zeigt
- **THEN** öffnet sich „Release-Planung“ bei Ben groß mit „Anna zeigt“

#### Scenario: Anderes Thema zeigen
- **GIVEN** „Release-Planung“ ist im Fokus
- **WHEN** Ben „Budget“ allen zeigt
- **THEN** wechselt die Fokusansicht bei allen zu „Budget“ mit „Ben zeigt“

#### Scenario: Lokal schließen
- **WHEN** Ben die Fokusansicht schließt
- **THEN** bleibt sie bei Anna offen, und Ben sieht die Leiste „Anna zeigt:
  Release-Planung“ mit „Zurück zum Fokus“

#### Scenario: Fokus beenden
- **WHEN** ein Teilnehmer „Fokus beenden“ klickt
- **THEN** schließt sich die Fokusansicht bei allen, und die Leiste verschwindet

#### Scenario: Nicht beim Bearbeiten unterbrechen
- **GIVEN** Ben bearbeitet gerade eine Karte
- **WHEN** Anna eine Karte allen zeigt
- **THEN** bleibt Bens Bearbeitung offen, und er sieht die Leiste „Anna zeigt“

#### Scenario: Später dazukommen
- **GIVEN** „Release-Planung“ ist im Fokus
- **WHEN** Carla das Board öffnet
- **THEN** sieht sie „Release-Planung“ groß mit „Anna zeigt“

#### Scenario: Nur im laufenden Termin
- **WHEN** der Termin geplant ist
- **THEN** bietet die Detailansicht kein „Allen zeigen“ an, und ein entsprechender
  Aufruf wird abgelehnt

#### Scenario: Termin beendet
- **GIVEN** eine Karte ist im Fokus
- **WHEN** der Termin beendet wird
- **THEN** gibt es keinen Fokus mehr

#### Scenario: Fokuskarte gelöscht
- **WHEN** die Karte im Fokus gelöscht wird
- **THEN** endet der Fokus bei allen

### Requirement: Warnung vor nicht besprochenen Themen
Die Bestätigung zum Beenden eines Termins SHALL nennen, welche Karten der Spalte 3
in diesem Termin nicht besprochen wurden und daher ohne Besprechung archiviert
werden. Das Beenden MUST trotzdem möglich bleiben.

#### Scenario: Nicht besprochenes Thema in der letzten Runde
- **GIVEN** in Spalte 3 liegen „Budget“ (besprochen) und „Hiring“ (nicht besprochen)
- **WHEN** ein Teilnehmer die Bestätigung zum Beenden öffnet
- **THEN** weist sie darauf hin, dass „Hiring“ nicht besprochen wurde und archiviert
  wird, und „Termin beenden“ bleibt möglich

#### Scenario: Alles besprochen
- **GIVEN** alle Karten in Spalte 3 wurden besprochen
- **WHEN** ein Teilnehmer die Bestätigung zum Beenden öffnet
- **THEN** erscheint keine Warnung

## MODIFIED Requirements

### Requirement: Termin-Historie
Jeder beendete Termin SHALL mit Nummer, Start- und Endzeitpunkt, Moderator,
Protokollant und den Karten samt ihrer Spalte und Namen gespeichert werden. Für
jede Karte MUST festgehalten werden, ob sie in diesem Termin besprochen wurde. Die
Historie MUST besprochene Karten von nicht besprochenen unterscheiden.

#### Scenario: Historie ansehen
- **WHEN** ein Teilnehmer die Historie öffnet
- **THEN** sieht er alle vergangenen Termine absteigend nach Datum

#### Scenario: Besprochen in der Historie
- **GIVEN** in Termin 5 wurde „Release-Planung“ besprochen, „Retro-Format“ nicht
- **WHEN** ein Teilnehmer die Historie öffnet
- **THEN** ist bei Termin 5 „Release-Planung“ als besprochen und „Retro-Format“ als
  nicht besprochen gekennzeichnet
