## MODIFIED Requirements

### Requirement: Zu wenige Teilnehmer
Hat ein Board weniger als zwei aktive Teilnehmer, MUST das Starten und Beenden
trotzdem möglich sein. Das Board SHALL dann allen Teilnehmern live eine Warnung
anzeigen, dass keine Rotation möglich ist. Gibt es beim Beenden keinen anderen
aktiven Teilnehmer, MUST der bisherige Moderator Moderator bleiben und das
Protokoll leer sein.

#### Scenario: Warnung bei einem Teilnehmer
- **GIVEN** ein Board mit nur einem aktiven Teilnehmer
- **WHEN** jemand das Board öffnet
- **THEN** sieht er die Warnung „Für die Rotation werden mindestens zwei aktive
  Teilnehmer benötigt“

#### Scenario: Warnung verschwindet live
- **GIVEN** die Warnung wird angezeigt
- **WHEN** sich ein zweiter Benutzer zum ersten Mal anmeldet oder ein inaktiver
  Teilnehmer wieder aktiv gesetzt wird
- **THEN** verschwindet die Warnung bei allen ohne Neuladen

#### Scenario: Beenden mit einem Teilnehmer
- **GIVEN** Anna ist die einzige aktive Teilnehmerin und moderiert
- **WHEN** der Termin beendet wird
- **THEN** moderiert Anna auch den nächsten Termin, das Protokoll ist leer
