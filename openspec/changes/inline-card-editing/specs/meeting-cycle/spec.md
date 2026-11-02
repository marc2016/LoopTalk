## MODIFIED Requirements

### Requirement: Gemeinsamer Fokus
Während eines laufenden Termins SHALL jeder Teilnehmer eine Karte über „Allen
zeigen“ in der Detailansicht in den gemeinsamen Fokus nehmen können. Pro Termin
MUST höchstens eine Karte im Fokus sein; eine neu gezeigte Karte ersetzt die
vorige. Die Fokuskarte MUST bei allen Teilnehmern, die das Board geöffnet haben,
groß geöffnet werden, mit dem Hinweis, wer sie zeigt. In der Fokusansicht SHALL
jeder Teilnehmer Titel, Beschreibung, Farbe und Namen direkt ändern können, wie in
der eigenen Detailansicht. Teilnehmer, die gerade in ihrer eigenen Detailansicht
ein Feld bearbeiten, ein neues Thema anlegen oder einen anderen Dialog geöffnet
haben, MUST NOT unterbrochen werden; sie sehen stattdessen eine Leiste „<Name>
zeigt: <Titel>“ mit „Ansehen“. Wechselt oder endet der Fokus, während jemand in der
Fokusansicht ein Feld bearbeitet, MUST seine geänderte Eingabe gespeichert werden.
Schließt ein Teilnehmer die Fokusansicht, schließt sie sich nur bei ihm, und die
Leiste mit „Zurück zum Fokus“ erscheint. „Fokus beenden“ MUST den Fokus für alle
beenden. Der Fokus MUST mit dem Beenden des Termins enden und endet, wenn die
Fokuskarte gelöscht wird. Wer das Board während eines Fokus öffnet, MUST die
Fokuskarte sofort sehen. Zeigen und Fokus beenden erzeugen keinen Audit-Eintrag.

#### Scenario: Allen zeigen
- **GIVEN** ein laufender Termin, Anna und Ben haben das Board geöffnet
- **WHEN** Anna die Karte „Release-Planung“ allen zeigt
- **THEN** öffnet sich „Release-Planung“ bei Ben groß mit „Anna zeigt“

#### Scenario: Im Fokus bearbeiten
- **GIVEN** Anna zeigt „Release-Planung“ allen
- **WHEN** Ben in der Fokusansicht die Beschreibung ergänzt und das Feld verlässt
- **THEN** sehen Anna und Ben die neue Beschreibung in der Fokusansicht

#### Scenario: Farbe im Fokus ändern
- **GIVEN** Anna zeigt die gelbe Karte „Budget“ allen
- **WHEN** Ben in der Fokusansicht „Grün“ anklickt
- **THEN** ist die Fokusansicht bei Anna und Ben grün

#### Scenario: Fokuswechsel während der Eingabe
- **GIVEN** Ben ergänzt in der Fokusansicht von „Release-Planung“ die Beschreibung
- **WHEN** Anna „Budget“ allen zeigt
- **THEN** ist Bens Ergänzung an „Release-Planung“ gespeichert, und bei Ben
  erscheint „Budget“ mit „Anna zeigt“

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
- **GIVEN** Ben bearbeitet in seiner eigenen Detailansicht gerade den Titel einer
  Karte
- **WHEN** Anna eine Karte allen zeigt
- **THEN** bleibt Bens Detailansicht mit seiner Eingabe offen, und er sieht die
  Leiste „Anna zeigt“

#### Scenario: Ohne laufende Eingabe übernimmt der Fokus
- **GIVEN** Ben hat eine Karte in seiner eigenen Detailansicht offen, bearbeitet
  aber kein Feld
- **WHEN** Anna eine Karte allen zeigt
- **THEN** erscheint bei Ben die Fokusansicht mit „Anna zeigt“

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
