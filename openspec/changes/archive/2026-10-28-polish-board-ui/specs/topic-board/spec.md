## MODIFIED Requirements

### Requirement: Drei Spalten
Jedes Board SHALL genau drei Spalten haben, die den Lebenszyklus eines Themas abbilden
(Spalte 1 = neu, Spalte 2 = zweiter Termin, Spalte 3 = letzter Termin). Die Spalten
SHALL als zusammenhängender Zeitstrahl dargestellt werden: nummerierte Schritte
„Neu“, „Zweite Runde“ und „Letzte Runde“, verbunden in Leserichtung und endend im
Archiv. Jeder Spaltenkopf MUST anhand der Nummer des aktuellen Termins N angeben,
bis zu welchem Termin die Themen dieser Spalte auf dem Board bleiben: Spalte 1 bis
Termin N+2, Spalte 2 bis Termin N+1, Spalte 3 nur noch Termin N. Die Spalte
„Letzte Runde“ MUST sich optisch von den anderen beiden abheben.

#### Scenario: Board anzeigen
- **WHEN** ein angemeldeter Teilnehmer das Board öffnet
- **THEN** sieht er drei Spalten mit allen nicht archivierten Karten

#### Scenario: Terminnummern in den Spaltenköpfen
- **GIVEN** der aktuelle Termin hat die Nummer 5
- **WHEN** ein Teilnehmer das Board ansieht
- **THEN** zeigen die Spaltenköpfe „bis Termin 7“, „bis Termin 6“ und „nur noch
  Termin 5“

#### Scenario: Zeitstrahl aktualisiert sich
- **GIVEN** der aktuelle Termin hat die Nummer 5
- **WHEN** der Termin beendet wird
- **THEN** zeigen die Spaltenköpfe bei allen Teilnehmern „bis Termin 8“, „bis
  Termin 7“ und „nur noch Termin 6“

## ADDED Requirements

### Requirement: Lebensanzeige
Jede Karte auf dem Board SHALL anzeigen, bei wie vielen Terminen sie einschließlich
des aktuellen noch auf dem Board steht: drei in Spalte 1, zwei in Spalte 2, einer
in Spalte 3. Die Anzeige MUST sowohl grafisch als auch als Text erfolgen, damit sie
ohne Farbwahrnehmung verständlich ist. Karten in Spalte 3 MUST als „letzte Chance“
gekennzeichnet sein.

#### Scenario: Karte in Spalte 1
- **WHEN** eine Karte in Spalte 1 liegt
- **THEN** zeigt sie „noch 3 Termine“

#### Scenario: Karte in Spalte 2
- **WHEN** eine Karte in Spalte 2 liegt
- **THEN** zeigt sie „noch 2 Termine“

#### Scenario: Karte in der letzten Runde
- **WHEN** eine Karte in Spalte 3 liegt
- **THEN** zeigt sie „letzte Chance“ und ist gegenüber den anderen Karten
  hervorgehoben
