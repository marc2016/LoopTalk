## Purpose

Übergreifende Gestaltung von LoopTalk: ein ruhiges, helles Erscheinungsbild,
wiedererkennbare Personen und ein klar erkennbarer Zustand des aktuellen Termins.

## ADDED Requirements

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
