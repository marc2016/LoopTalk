## ADDED Requirements

### Requirement: Randlose Wand
Auf der Board-Seite SHALL die Wand den gesamten Viewport bis an alle Ränder
füllen, ohne Rahmen, Rundung oder umgebenden Container, und unter den
schwebenden Bedienflächen hindurchscrollen. Die Wand MUST oben und unten so viel
Innenabstand haben, dass kein Etikett und kein Zettel unter Leiste oder Dock liegt;
ein per Tastatur fokussierter Zettel MUST vollständig sichtbar gescrollt werden.
Historie, Audit-Log, Teilnehmer und Startseite haben keine Wand.

#### Scenario: Wand bis zum Rand
- **WHEN** ein Teilnehmer das Board ansieht
- **THEN** reicht die Wand links, rechts, oben und unten bis an den Rand des
  Fensters, und die Zettel liegen direkt darauf

#### Scenario: Scrollen unter Glas
- **GIVEN** in Spalte 1 liegen zwölf Zettel
- **WHEN** der Teilnehmer nach unten scrollt
- **THEN** wandern die Zettel unter der Glasleiste hindurch, und Leiste und Dock
  bleiben an ihrem Platz

#### Scenario: Letzter Zettel frei
- **GIVEN** in Spalte 1 liegen zwölf Zettel
- **WHEN** der Teilnehmer bis ganz nach unten scrollt
- **THEN** liegt der letzte Zettel vollständig oberhalb des Docks

#### Scenario: Tastaturfokus
- **WHEN** ein Teilnehmer per Tab auf einen Zettel springt, der unter dem Dock
  liegen würde
- **THEN** scrollt das Board so, dass der Zettel vollständig sichtbar ist

### Requirement: Glasflächen
Leiste, Dock, Fokus-Toast und die Bestätigung zum Beenden SHALL als Glas
erscheinen: halbtransparentes Weiß, weichgezeichnetes Dahinterliegendes, feiner
heller Rand, weicher Schatten. Das Glas hat auf jeder Wand dasselbe Aussehen.

#### Scenario: Zettel schimmern durch
- **WHEN** ein Zettel unter der Leiste oder dem Dock liegt
- **THEN** ist er dort weichgezeichnet und abgeschwächt zu erkennen

### Requirement: Glasleiste
Eine einzige Leiste am oberen Rand SHALL App und Board zusammen bedienen: Logo mit
Link zur Startseite, Board-Name mit „Board bearbeiten“, die Bereiche Board,
Historie, Audit-Log und Teilnehmer als Segment-Pille mit markiertem aktiven
Bereich, „Link kopieren“, Anwesenheit sowie Name und Avatar der angemeldeten Person
mit „Abmelden“. Die Leiste MUST beim Scrollen oben bleiben. Auf Seiten ohne Board
zeigt sie nur Logo, Name und Abmelden.

#### Scenario: Ein Kopf
- **WHEN** ein Teilnehmer das Board öffnet
- **THEN** gibt es über der Wand genau eine Leiste mit Logo, Board-Name, Bereichen,
  „Link kopieren“, Anwesenheit und Abmelden

#### Scenario: Bleibt oben
- **WHEN** der Teilnehmer scrollt
- **THEN** bleibt die Leiste oben sichtbar, und die Zettel schimmern
  weichgezeichnet durch sie hindurch

#### Scenario: Bereich wechseln
- **WHEN** der Teilnehmer in der Pille „Historie“ wählt
- **THEN** zeigt die Seite die Historie, „Historie“ ist in der Pille markiert, und
  die Leiste bleibt dieselbe

#### Scenario: Startseite
- **WHEN** ein Benutzer die Startseite öffnet
- **THEN** zeigt die Leiste Logo, Name und Abmelden, aber keine Bereiche und keine
  Anwesenheit

### Requirement: Termin-Dock
Die Steuerung des aktuellen Termins SHALL als Dock am unteren Rand der Board-Seite
schweben, zentriert und schmaler als die Seite. Es enthält Termin-Nummer, Zustand
mit Dauer, Moderation und Protokoll, den Hinweis, wer beim nächsten Termin
protokolliert, „Termin starten“ bzw. „Termin beenden“ und bei Bedarf den Hinweis
„zu wenige Teilnehmer“. Die Bestätigung zum Beenden MUST im Dock aufklappen und
das Board sichtbar lassen; Escape schließt sie.

#### Scenario: Dock unten
- **WHEN** ein Teilnehmer das Board auf dem Desktop ansieht
- **THEN** schwebt unten mittig ein Dock mit „Termin 5“, Dauer, Moderation,
  Protokoll und „Termin beenden“, und die Wand ist dahinter sichtbar

#### Scenario: Bestätigung klappt auf
- **GIVEN** ein laufender Termin
- **WHEN** der Teilnehmer „Termin beenden“ klickt
- **THEN** klappt im Dock die Frage „Termin 5 beenden?“ mit „Abbrechen“ und „Termin
  beenden“ auf, das Board zeigt die Vorschau, und Escape klappt sie wieder zu

#### Scenario: Zu wenige Teilnehmer
- **GIVEN** nur eine Person ist auf dem Board aktiv
- **WHEN** ein Teilnehmer das Board ansieht
- **THEN** steht der Hinweis zu mindestens zwei aktiven Teilnehmern im Dock

### Requirement: Dock auf schmalen Bildschirmen
Auf schmalen Bildschirmen MUST das Dock auf Termin-Nummer, Dauer und Hauptknopf
schrumpfen; Rollen und Hinweise klappen per Tippen auf. Dock und Leiste MUST die
sicheren Bereiche des Geräts (Notch, Home-Leiste) freihalten.

#### Scenario: Handy
- **WHEN** ein Teilnehmer das Board auf einem 400 Pixel breiten Bildschirm ansieht
- **THEN** zeigt das Dock nur „Termin 5“, die Dauer und „Termin beenden“, und ein
  Tippen auf das Dock zeigt Moderation und Protokoll

#### Scenario: Sichere Bereiche
- **GIVEN** ein Gerät mit Home-Leiste am unteren Rand
- **WHEN** ein Teilnehmer das Board ansieht
- **THEN** liegt das Dock oberhalb der Home-Leiste und wird nicht von ihr verdeckt

### Requirement: Lesbarkeit auf Glas
Text und Bedienelemente auf Glasflächen MUST auf jeder Wand und über jedem
Zettel mindestens einen Kontrast nach WCAG AA haben. Ist auf dem Gerät
„Transparenz reduzieren“ eingestellt, MUST das Glas undurchsichtig sein. Ist
„Bewegung reduzieren“ eingestellt, erscheinen und verschwinden Dock, Toast und
Bestätigung ohne Animation.

#### Scenario: Lila Zettel unter der Leiste
- **GIVEN** ein lila Zettel liegt beim Scrollen unter der Glasleiste
- **WHEN** ein Teilnehmer den Board-Namen in der Leiste liest
- **THEN** ist er mit mindestens 4,5:1 lesbar

#### Scenario: Transparenz reduziert
- **GIVEN** auf dem Gerät ist „Transparenz reduzieren“ eingestellt
- **WHEN** ein Teilnehmer das Board ansieht
- **THEN** sind Leiste und Dock undurchsichtig, und nichts schimmert durch

#### Scenario: Bewegung reduziert
- **GIVEN** auf dem Gerät ist „Bewegung reduzieren“ eingestellt
- **WHEN** die Bestätigung zum Beenden aufklappt
- **THEN** erscheint sie sofort, ohne Animation

## MODIFIED Requirements

### Requirement: Zustand des Termins
Das Termin-Dock SHALL einen laufenden Termin deutlich von einem geplanten
unterscheiden. Bei einem laufenden Termin MUST es die bisherige Dauer anzeigen und
diese mindestens jede Minute aktualisieren. Moderation und Protokoll SHALL mit
Namen und Avatar dargestellt werden.

#### Scenario: Laufender Termin
- **GIVEN** ein Termin läuft seit 23 Minuten
- **WHEN** ein Teilnehmer das Board ansieht
- **THEN** ist das Termin-Dock hervorgehoben und zeigt „seit 23 min“

#### Scenario: Dauer läuft weiter
- **GIVEN** ein Termin läuft seit 23 Minuten
- **WHEN** eine weitere Minute vergeht, ohne dass neu geladen wird
- **THEN** zeigt das Termin-Dock „seit 24 min“

#### Scenario: Geplanter Termin
- **WHEN** der aktuelle Termin geplant ist
- **THEN** ist das Termin-Dock neutral dargestellt und zeigt keine Dauer
