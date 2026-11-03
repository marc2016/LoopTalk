## ADDED Requirements

### Requirement: Wand und Spalten
Das Board SHALL eine durchgehende Wand in der gewählten Variante sein (siehe „Wand
des Boards“): Papier als helles, warmes Papier mit feinem Punktraster, Kork als
helles Kork mit feiner Körnung, Whiteboard als kühles Weiß mit zartem Linienraster.
Die drei Spalten liegen ohne eigenen Hintergrund auf der Wand, getrennt durch feine
Linien (Desktop senkrecht, mobil waagerecht). Auf jeder Wand MUST jeder Text,
jedes Etikett und jede Trennlinie mindestens den Kontrast nach WCAG AA haben.

#### Scenario: Eine Fläche
- **WHEN** ein Teilnehmer das Board auf dem Desktop ansieht
- **THEN** liegen alle drei Spalten auf einer gemeinsamen Fläche, getrennt nur
  durch zwei senkrechte Linien, ohne eigene Kästen

#### Scenario: Wand wechselt überall
- **GIVEN** das Board ist Papier
- **WHEN** jemand die Wand auf Whiteboard stellt
- **THEN** zeigt das Board bei allen ein kühles Weiß mit Linienraster, und die
  Zettel sehen unverändert aus

#### Scenario: Lesbar auf Kork
- **GIVEN** das Board ist Kork
- **WHEN** ein Teilnehmer die Spaltenköpfe liest
- **THEN** sind Etiketten und „bis Termin N“ mit mindestens WCAG AA lesbar

### Requirement: Spaltenetiketten
Jeder Spaltenkopf SHALL ein aufgeklebtes Etikett sein: ein heller Streifen mit
fester, leichter Drehung von höchstens 1 Grad, der die Nummer, den Titel und die
Anzahl der Themen als rundes Badge trägt; „bis Termin N“ bzw. „nur noch Termin N“
steht darunter auf der Wand. Das Etikett der letzten Runde MUST die warmen Töne
der letzten Runde tragen. „+ Thema“ SHALL im Kopf von Spalte 1 bleiben.

#### Scenario: Etikett mit Anzahl
- **GIVEN** in Spalte 1 liegen vier Themen
- **WHEN** ein Teilnehmer das Board ansieht
- **THEN** zeigt das Etikett „1 Neu“ mit einem Badge „4“, darunter „bis Termin N“

#### Scenario: Anzahl aktualisiert sich
- **WHEN** Ben ein Thema anlegt
- **THEN** zählt das Badge von Spalte 1 bei allen ohne Neuladen um eins hoch

### Requirement: Letzte Runde und Archiv-Ablage
Die letzte Runde SHALL sich durch einen warmen, weichen Schein hinter ihren Zetteln
von den anderen Spalten abheben, nicht durch einen eigenen Kasten. Unter ihren
Zetteln MUST eine gestrichelt umrandete Ablage „Archiv“ stehen, in die Karten beim
Beenden fallen. Solange die Vorschau zum Beenden offen ist, SHALL der Schein leicht
pulsieren; bei reduzierter Bewegung bleibt er ruhig.

#### Scenario: Schein statt Kasten
- **WHEN** ein Teilnehmer das Board ansieht
- **THEN** liegt hinter den Zetteln der letzten Runde ein warmer Schein, und die
  Spalte hat keinen eigenen Rahmen

#### Scenario: Fallen in die Ablage
- **GIVEN** Karte C liegt in der letzten Runde
- **WHEN** der Termin beendet wird
- **THEN** fällt C sichtbar in Richtung der Ablage „Archiv“ und verschwindet dort

#### Scenario: Vorschau pulsiert
- **GIVEN** ein laufender Termin
- **WHEN** ein Teilnehmer auf „Termin beenden“ klickt
- **THEN** pulsiert der Schein der letzten Runde bei ihm leicht, bis er die
  Bestätigung schließt

### Requirement: Leere Spalte
Eine Spalte ohne Themen SHALL einen blassen, gestrichelt umrandeten, leicht
gedrehten Geister-Zettel in Zettelgröße zeigen, mit „Noch keine neuen Themen.“ in
Spalte 1 und „Keine Themen in dieser Runde.“ in den anderen. Der Geister-Zettel
MUST NOT anklickbar sein und MUST verschwinden, sobald ein Thema in der Spalte
liegt.

#### Scenario: Leere Runde
- **WHEN** in Spalte 2 kein Thema liegt
- **THEN** zeigt Spalte 2 einen Geister-Zettel mit „Keine Themen in dieser Runde.“

#### Scenario: Erstes Thema
- **GIVEN** Spalte 1 zeigt den Geister-Zettel
- **WHEN** jemand ein Thema anlegt
- **THEN** verschwindet der Geister-Zettel, und der neue Zettel landet an seiner
  Stelle

## MODIFIED Requirements

### Requirement: Zettel-Look
Karten auf dem Board SHALL wie Post-its aussehen: Papier in ihrer Zettelfarbe
statt eines weißen Kastens, ein Schatten wie bei einem oben angeklebten Zettel und
eine leichte Drehung von höchstens 1,5 Grad. Jeder Zettel MUST quadratisch sein;
in einer Spalte SHALL je zwei Zettel nebeneinander liegen, alle gleich groß. Texte,
die nicht auf den Zettel passen, MUST gekürzt werden; vollständig stehen sie auf dem
großen Zettel (siehe „Großer Zettel“). Die Drehung MUST sich fest aus der
Karte ergeben, sodass dieselbe Karte auf allen Geräten und nach dem Neuladen gleich
gedreht ist. Beim Darüberfahren oder bei Tastaturfokus SHALL sich eine Ecke des
Zettels anheben. Namen auf einem Zettel MUST als weiße Badges mit einem Punkt in der
Personenfarbe dargestellt werden, damit sie auf jeder Zettelfarbe lesbar bleiben.
Text auf jedem Zettel MUST in jeder Farbe und jedem Alter mindestens einen Kontrast
nach WCAG AA haben. Die Zettel kleben auf der Wand des Boards (siehe „Wand und
Spalten“) und sehen auf jeder Wand gleich aus. Historie und Audit-Log MUST sachlich
bleiben.

#### Scenario: Quadratisch, zwei pro Reihe
- **GIVEN** in Spalte 1 liegen drei Zettel
- **WHEN** ein Teilnehmer das Board auf einem Desktop ansieht
- **THEN** liegen zwei Zettel nebeneinander und der dritte darunter, alle
  quadratisch und gleich groß

#### Scenario: Langer Text
- **GIVEN** ein Thema mit einer langen Beschreibung
- **WHEN** ein Teilnehmer das Board ansieht
- **THEN** ist die Beschreibung auf dem Zettel gekürzt, und der Zettel bleibt
  quadratisch

#### Scenario: Gleiche Drehung überall
- **WHEN** Anna und Ben dasselbe Board ansehen
- **THEN** ist jeder Zettel bei beiden gleich gedreht, auch nach dem Neuladen

#### Scenario: Ecke anheben
- **WHEN** ein Teilnehmer mit der Maus über einen Zettel fährt
- **THEN** hebt sich eine Ecke des Zettels an, und der Schatten wird tiefer

#### Scenario: Name auf farbigem Zettel
- **GIVEN** Anna hat die Personenfarbe Rosa und steht an einem rosa Zettel
- **WHEN** ein Teilnehmer das Board ansieht
- **THEN** ist „Anna“ als weißes Badge mit rosa Punkt gut lesbar
