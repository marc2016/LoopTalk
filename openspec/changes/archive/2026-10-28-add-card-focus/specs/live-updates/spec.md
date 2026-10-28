## ADDED Requirements

### Requirement: Fokus bei allen
Zeigen, Wechseln und Beenden des gemeinsamen Fokus sowie Änderungen der Markierung
„besprochen“ SHALL ohne Neuladen bei allen Teilnehmern erscheinen, die das Board
geöffnet haben, und nur bei diesen. Nach einem Verbindungsabbruch MUST der aktuelle
Fokus beim Wiederverbinden angezeigt werden.

#### Scenario: Fokus erscheint bei allen
- **GIVEN** Anna und Ben haben das Board geöffnet
- **WHEN** Anna eine Karte allen zeigt
- **THEN** öffnet sie sich bei Ben innerhalb weniger Sekunden ohne Neuladen

#### Scenario: Anderes Board
- **GIVEN** Carla hat ein anderes Board geöffnet
- **WHEN** Anna eine Karte allen zeigt
- **THEN** ändert sich bei Carla nichts

#### Scenario: Wiederverbinden
- **GIVEN** Bens Verbindung ist unterbrochen, während Anna eine Karte zeigt
- **WHEN** Bens Verbindung wiederhergestellt wird
- **THEN** sieht Ben die Fokuskarte
