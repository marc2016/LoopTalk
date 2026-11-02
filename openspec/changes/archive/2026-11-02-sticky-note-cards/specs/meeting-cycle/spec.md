## MODIFIED Requirements

### Requirement: Termin-Historie
Jeder beendete Termin SHALL mit Nummer, Start- und Endzeitpunkt, Moderator,
Protokollant und den Karten samt ihrer Spalte, Zettelfarbe und Namen gespeichert
werden. Für jede Karte MUST festgehalten werden, ob sie in diesem Termin besprochen
wurde. Die Historie MUST besprochene Karten von nicht besprochenen unterscheiden und
jede Karte in der Zettelfarbe zeigen, die sie bei diesem Termin hatte.

#### Scenario: Historie ansehen
- **WHEN** ein Teilnehmer die Historie öffnet
- **THEN** sieht er alle vergangenen Termine absteigend nach Datum

#### Scenario: Besprochen in der Historie
- **GIVEN** in Termin 5 wurde „Release-Planung“ besprochen, „Retro-Format“ nicht
- **WHEN** ein Teilnehmer die Historie öffnet
- **THEN** ist bei Termin 5 „Release-Planung“ als besprochen und „Retro-Format“ als
  nicht besprochen gekennzeichnet

#### Scenario: Farbe in der Historie
- **GIVEN** „Budget“ war bei Termin 5 grün und wurde danach blau gefärbt
- **WHEN** ein Teilnehmer die Historie von Termin 5 öffnet
- **THEN** ist „Budget“ dort grün
