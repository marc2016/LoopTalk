## ADDED Requirements

### Requirement: Wand des Boards
Jedes Board SHALL eine Wand aus genau drei hellen Varianten haben: Papier, Kork,
Whiteboard. Neue und bestehende Boards MUST Papier haben, bis jemand umschaltet.
Jeder Teilnehmer SHALL die Wand im Dialog „Board bearbeiten“ ändern können; die
Auswahl MUST jede Wand mit ihrem Namen zugänglich machen. Die Wand gilt für alle
Teilnehmer, MUST bei allen ohne Neuladen erscheinen und als „Wand geändert“ mit
alter und neuer Wand im Audit-Log stehen. Andere Werte MUST abgelehnt werden.

#### Scenario: Wand wechseln
- **GIVEN** Anna und Ben haben das Board „Team A“ geöffnet, die Wand ist Papier
- **WHEN** Ben im Dialog „Board bearbeiten“ Kork wählt und speichert
- **THEN** sehen Anna und Ben das Board ohne Neuladen auf Kork, und das Audit-Log
  enthält „Wand geändert“ mit Ben als Akteur sowie Papier und Kork

#### Scenario: Name und Wand zugleich
- **WHEN** ein Teilnehmer im Dialog „Board bearbeiten“ den Namen ändert und eine
  andere Wand wählt
- **THEN** werden beide Änderungen gespeichert, je mit eigenem Audit-Eintrag

#### Scenario: Gleiche Wand erneut
- **GIVEN** die Wand ist Kork
- **WHEN** ein Teilnehmer Kork wählt und speichert
- **THEN** wird nichts gespeichert und kein Audit-Eintrag erzeugt

#### Scenario: Unbekannte Wand
- **WHEN** ein Client die Wand „beton“ speichern will
- **THEN** wird die Änderung abgelehnt und die Wand bleibt unverändert

#### Scenario: Bestehende Boards
- **GIVEN** Boards, die vor dieser Änderung angelegt wurden
- **WHEN** die Änderung eingespielt wird
- **THEN** haben alle diese Boards die Wand Papier
