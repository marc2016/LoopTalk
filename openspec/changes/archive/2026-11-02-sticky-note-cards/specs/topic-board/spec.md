## ADDED Requirements

### Requirement: Zettelfarbe
Jede Karte SHALL eine Zettelfarbe aus genau sechs festen Tönen haben: Gelb,
Orange, Rosa, Grün, Blau, Lila. Neue Karten MUST gelb sein, sofern beim Anlegen
keine andere Farbe gewählt wird. Jeder Teilnehmer des Boards SHALL die Farbe jeder
Karte im Bearbeiten-Modus der Detailansicht ändern können; die Auswahl MUST jeden
Ton mit seinem Namen zugänglich machen, damit sie ohne Farbwahrnehmung bedienbar
ist. Eine Farbänderung MUST bei allen Teilnehmern ohne Neuladen erscheinen und als
„Karte bearbeitet“ mit alter und neuer Farbe im Audit-Log stehen. Andere Werte als
die sechs Töne MUST abgelehnt werden. Die Farbe hat in der Anwendung keine
festgelegte Bedeutung.

#### Scenario: Neue Karte ist gelb
- **WHEN** ein Teilnehmer ein Thema ohne Farbwahl anlegt
- **THEN** erscheint die Karte als gelber Zettel

#### Scenario: Farbe beim Anlegen wählen
- **WHEN** ein Teilnehmer ein neues Thema anlegt und „Grün“ wählt
- **THEN** erscheint die Karte als grüner Zettel in Spalte 1

#### Scenario: Farbe ändern
- **GIVEN** Anna und Ben haben das Board geöffnet, die Karte „Budget“ ist gelb
- **WHEN** Ben im Bearbeiten-Modus „Blau“ wählt und speichert
- **THEN** ist „Budget“ bei Anna ohne Neuladen ein blauer Zettel, und das
  Audit-Log enthält „Karte bearbeitet“ mit Ben als Akteur sowie Gelb und Blau

#### Scenario: Unbekannte Farbe
- **WHEN** ein Client eine Karte mit der Farbe „rot“ speichern will
- **THEN** wird die Änderung abgelehnt und die Karte behält ihre Farbe

#### Scenario: Bestehende Karten
- **GIVEN** Karten, die vor dieser Änderung angelegt wurden
- **WHEN** die Änderung eingespielt wird
- **THEN** sind alle diese Karten gelb

## MODIFIED Requirements

### Requirement: Lebensanzeige
Jede Karte auf dem Board SHALL anzeigen, bei wie vielen Terminen sie einschließlich
des aktuellen noch auf dem Board steht: drei in Spalte 1, zwei in Spalte 2, einer
in Spalte 3. Die Anzeige MUST sowohl grafisch als auch als Text erfolgen, damit sie
ohne Farbwahrnehmung verständlich ist. Karten in Spalte 3 MUST als „letzte Chance“
gekennzeichnet sein. Zusätzlich SHALL die Karte sichtbar altern: Je weniger
Termine sie noch hat, desto stärker wellt sich ihre Ecke und desto blasser wird ihr
Papier. Karten in Spalte 3 MUST dadurch gegenüber den anderen Karten hervorgehoben
sein, ohne dass ihr Text an Kontrast verliert.

#### Scenario: Karte in Spalte 1
- **WHEN** eine Karte in Spalte 1 liegt
- **THEN** zeigt sie „noch 3 Termine“, und ihr Zettel liegt glatt

#### Scenario: Karte in Spalte 2
- **WHEN** eine Karte in Spalte 2 liegt
- **THEN** zeigt sie „noch 2 Termine“, und ihre Ecke ist leicht gewellt

#### Scenario: Karte in der letzten Runde
- **WHEN** eine Karte in Spalte 3 liegt
- **THEN** zeigt sie „letzte Chance“, ihre Ecke ist stark gewellt, ihr Papier
  blasser, und sie ist gegenüber den anderen Karten hervorgehoben
