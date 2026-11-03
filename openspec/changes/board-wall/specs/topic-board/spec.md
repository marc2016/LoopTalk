## MODIFIED Requirements

### Requirement: Drei Spalten
Jedes Board SHALL genau drei Spalten haben, die den Lebenszyklus eines Themas abbilden
(Spalte 1 = neu, Spalte 2 = zweiter Termin, Spalte 3 = letzter Termin). Die Spalten
SHALL als zusammenhängender Zeitstrahl auf einer gemeinsamen Wand dargestellt
werden: nummerierte Etiketten „Neu“, „Zweite Runde“ und „Letzte Runde“ in
Leserichtung, nur durch feine Trennlinien getrennt und endend in einer sichtbaren
Archiv-Ablage hinter der letzten Runde. Jeder Spaltenkopf MUST anhand der Nummer
des aktuellen Termins N angeben, bis zu welchem Termin die Themen dieser Spalte auf
dem Board bleiben: Spalte 1 bis Termin N+2, Spalte 2 bis Termin N+1, Spalte 3 nur
noch Termin N. Die Spalte „Letzte Runde“ MUST sich optisch von den anderen beiden
abheben.

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

#### Scenario: Ende im Archiv
- **WHEN** ein Teilnehmer das Board ansieht
- **THEN** steht hinter der letzten Runde eine Ablage „Archiv“, und zwischen den
  Spalten gibt es keine Pfeile
