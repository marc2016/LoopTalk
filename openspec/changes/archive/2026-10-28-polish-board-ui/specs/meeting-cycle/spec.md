## ADDED Requirements

### Requirement: Vorschau vor dem Beenden
Solange die Bestätigung zum Beenden eines laufenden Termins offen ist, SHALL das
Board zeigen, was beim Beenden passiert: Karten in Spalte 1 und 2 sind als
„rückt weiter“ gekennzeichnet, Karten in Spalte 3 als „wird archiviert“. Die
Bestätigung MUST das Board dabei sichtbar lassen und den Hinweis enthalten, wer
beim nächsten Termin protokolliert. Wird die Bestätigung abgebrochen, MUST das
Board ohne Änderung in seine normale Ansicht zurückkehren. Die Vorschau betrifft nur
den Teilnehmer, der die Bestätigung geöffnet hat.

#### Scenario: Vorschau öffnen
- **GIVEN** ein laufender Termin mit Karte A in Spalte 1 und Karte C in Spalte 3
- **WHEN** ein Teilnehmer auf „Termin beenden“ klickt
- **THEN** sieht er weiterhin das Board, A ist als „rückt weiter“ und C als
  „wird archiviert“ gekennzeichnet, und eine Bestätigung wird angezeigt

#### Scenario: Vorschau abbrechen
- **WHEN** der Teilnehmer die Bestätigung abbricht
- **THEN** verschwinden die Kennzeichnungen, und Termin und Karten bleiben unverändert

#### Scenario: Nur beim eigenen Client
- **GIVEN** Anna hat die Bestätigung zum Beenden geöffnet
- **WHEN** Ben das Board ansieht
- **THEN** sieht Ben keine Vorschau

#### Scenario: Leeres Board
- **GIVEN** ein laufender Termin ohne Karten
- **WHEN** ein Teilnehmer auf „Termin beenden“ klickt
- **THEN** weist die Bestätigung darauf hin, dass keine Themen weiterrücken
