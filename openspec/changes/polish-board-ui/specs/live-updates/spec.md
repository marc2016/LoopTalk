## ADDED Requirements

### Requirement: Weiterrücken sichtbar
Wenn ein Termin beendet wird, SHALL bei allen Teilnehmern, die das Board geöffnet
haben, sichtbar werden, dass die Karten weitergerückt sind: Karten gleiten ruhig in
ihre neue Spalte, archivierte Karten blenden aus. Die Bewegung MUST in höchstens
einer halben Sekunde abgeschlossen sein. Haben Teilnehmer in ihrem System
reduzierte Bewegung eingestellt, MUST die Bewegung entfallen; stattdessen SHALL ein
kurzer Hinweis erscheinen, dass die Themen weitergerückt sind. Andere Änderungen
(Karte anlegen, bearbeiten, löschen) MUST NOT diese Bewegung auslösen.

#### Scenario: Gleiten bei allen
- **GIVEN** Anna und Ben haben das Board geöffnet, Karte A liegt in Spalte 1
- **WHEN** Anna den Termin beendet
- **THEN** gleitet A bei Anna und bei Ben in Spalte 2

#### Scenario: Reduzierte Bewegung
- **GIVEN** Ben hat reduzierte Bewegung eingestellt
- **WHEN** ein Termin beendet wird
- **THEN** erscheint A bei Ben ohne Bewegung in Spalte 2, zusammen mit einem Hinweis,
  dass die Themen weitergerückt sind

#### Scenario: Keine Bewegung bei anderen Änderungen
- **WHEN** ein Teilnehmer eine Karte bearbeitet
- **THEN** gleitet keine Karte
