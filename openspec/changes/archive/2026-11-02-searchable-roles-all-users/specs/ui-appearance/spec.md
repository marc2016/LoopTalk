## ADDED Requirements

### Requirement: Rollen-Auswahl
Die Auswahl für Moderation und Protokoll in der Termin-Leiste SHALL großzügig
dargestellt und durchsuchbar sein. Der Auslöser MUST Avatar und vollen Namen der
aktuellen Person zeigen (lange Namen gekürzt). Beim Öffnen MUST ein Suchfeld den
Fokus haben; die Eingabe filtert die Liste nach dem Namen, auch nach Wortanfängen
innerhalb des Namens. Jede Person erscheint mit Avatar in einer gut treffbaren
Zeile; die aktuelle Auswahl ist markiert. Die Person, die die jeweils andere Rolle
hat, MUST sichtbar, aber nicht wählbar sein und als solche gekennzeichnet werden.
Beim Protokoll MUST „nicht festgelegt“ als eigener Eintrag oben stehen. Die Auswahl
MUST vollständig per Tastatur bedienbar sein (Pfeiltasten, Enter, Escape).

#### Scenario: Suchen und wählen
- **GIVEN** auf dem Board sind Anna Schmidt, Ben Weber, Carla Kraus und Dora Lenz
  aktiv, Anna moderiert
- **WHEN** ein Teilnehmer die Auswahl „Moderation“ öffnet, „kra“ eintippt und Enter
  drückt
- **THEN** moderiert Carla Kraus, und die Auswahl ist geschlossen

#### Scenario: Andere Rolle gesperrt
- **GIVEN** Ben protokolliert
- **WHEN** ein Teilnehmer die Auswahl „Moderation“ öffnet
- **THEN** steht Ben in der Liste mit dem Hinweis „Protokoll“ und lässt sich nicht
  auswählen

#### Scenario: Kein Treffer
- **WHEN** ein Teilnehmer in der Auswahl einen Namen eintippt, den es nicht gibt
- **THEN** zeigt die Liste „Niemand gefunden“, und die Rolle bleibt unverändert

#### Scenario: Protokoll leeren
- **GIVEN** Ben protokolliert
- **WHEN** ein Teilnehmer in der Auswahl „Protokoll“ den Eintrag „nicht festgelegt“
  wählt
- **THEN** ist das Protokoll allen als „nicht festgelegt“ angezeigt
