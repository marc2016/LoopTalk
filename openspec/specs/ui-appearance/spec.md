# ui-appearance Specification

## Purpose

Übergreifende Gestaltung von LoopTalk: ein ruhiges, helles Erscheinungsbild,
wiedererkennbare Personen und ein klar erkennbarer Zustand des aktuellen Termins.

## Requirements

### Requirement: Helles Design
Die Anwendung SHALL ausschließlich ein helles Erscheinungsbild haben, unabhängig von
der Systemeinstellung des Geräts. Texte und Bedienelemente MUST mindestens einen
Kontrast nach WCAG AA haben. Die Akzentfarbe SHALL nur für Aktionen und den
aktuellen Zustand („jetzt“) verwendet werden.

#### Scenario: Dunkles System
- **GIVEN** das Gerät ist auf dunkles Erscheinungsbild eingestellt
- **WHEN** ein Teilnehmer LoopTalk öffnet
- **THEN** erscheint die Anwendung hell

### Requirement: Personenfarben
Jeder Teilnehmer eines Boards SHALL eine feste Farbe aus einer Palette gedeckter
Farben haben, die sich aus seiner Benutzerkennung ergibt und sich bei einer
Namensänderung nicht ändert. Diese Farbe MUST überall erscheinen, wo die Person
dargestellt wird: Avatar, Moderation und Protokoll, Namen an Karten, Anwesenheit.
Namen an Karten ohne zugehöriges Benutzerkonto MUST neutral dargestellt werden.
Farben MUST NOT die einzige Unterscheidung sein; Name oder Initialen bleiben immer
sichtbar.

#### Scenario: Gleiche Farbe überall
- **GIVEN** Ben moderiert und steht als Name an einer Karte
- **WHEN** ein Teilnehmer das Board ansieht
- **THEN** haben Bens Avatar in der Anwesenheit, bei der Moderation und an der Karte
  dieselbe Farbe

#### Scenario: Gleiche Farbe auf allen Geräten
- **WHEN** Anna und Ben dasselbe Board ansehen
- **THEN** sehen beide jede Person in derselben Farbe

#### Scenario: Name ohne Konto
- **GIVEN** an einer Karte steht der frei eingegebene Name „Carla“ ohne Konto
- **WHEN** ein Teilnehmer die Karte ansieht
- **THEN** erscheint „Carla“ neutral, ohne Personenfarbe

### Requirement: Zustand des Termins
Die Termin-Leiste SHALL einen laufenden Termin deutlich von einem geplanten
unterscheiden. Bei einem laufenden Termin MUST sie die bisherige Dauer anzeigen und
diese mindestens jede Minute aktualisieren. Moderation und Protokoll SHALL mit
Namen und Avatar dargestellt werden.

#### Scenario: Laufender Termin
- **GIVEN** ein Termin läuft seit 23 Minuten
- **WHEN** ein Teilnehmer das Board ansieht
- **THEN** ist die Termin-Leiste hervorgehoben und zeigt „seit 23 min“

#### Scenario: Dauer läuft weiter
- **GIVEN** ein Termin läuft seit 23 Minuten
- **WHEN** eine weitere Minute vergeht, ohne dass neu geladen wird
- **THEN** zeigt die Termin-Leiste „seit 24 min“

#### Scenario: Geplanter Termin
- **WHEN** der aktuelle Termin geplant ist
- **THEN** ist die Termin-Leiste neutral dargestellt und zeigt keine Dauer

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
