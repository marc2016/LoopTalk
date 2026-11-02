## ADDED Requirements

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
nach WCAG AA haben. Das Board SHALL einen hellen Hintergrund mit feinem Punktraster
haben. Historie und Audit-Log MUST sachlich bleiben.

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

### Requirement: Großer Zettel
Ein Klick auf einen Zettel SHALL ihn sichtbar aus seiner Position auf dem Board zu
einem großen Zettel wachsen lassen; beim Schließen MUST er an seinen Platz
zurückschrumpfen. Solange der große Zettel offen ist, MUST der kleine an seiner
Stelle ausgeblendet sein, damit nur ein Zettel zu sehen ist. Der große Zettel MUST wie der kleine aussehen: dieselbe
Zettelfarbe, dasselbe Alter, Papier mit umgeknickter Ecke, ohne Dialograhmen. Er
enthält alles zum Lesen, Bearbeiten und Präsentieren: Titel, vollständige
Beschreibung, Namen, Lebensanzeige, „besprochen“, „Allen zeigen“ bzw. „Fokus
beenden“, Verlauf und „Bearbeiten“. Im Bearbeiten-Modus MUST auf dem Papier selbst
geschrieben werden: Titel und Beschreibung sind direkt auf dem Zettel editierbar,
darunter liegen Farbwahl, „Löschen“, „Abbrechen“ und „Speichern“. Eine gewählte Farbe
MUST den großen Zettel sofort umfärben, gespeichert wird sie erst mit „Speichern“.
Ein neues Thema MUST als großer gelber Zettel im Bearbeiten-Modus beginnen. Die
gemeinsame Fokusansicht MUST ebenfalls als großer Zettel erscheinen. Bei reduzierter
Bewegung erscheint und verschwindet der große Zettel ohne Animation. Text auf dem
großen Zettel MUST mindestens einen Kontrast nach WCAG AA haben, und alle Felder
MUST per Tastatur und Screenreader bedienbar bleiben.

#### Scenario: Zettel öffnen
- **GIVEN** „Budget“ ist ein grüner Zettel in Spalte 2
- **WHEN** ein Teilnehmer auf den Zettel klickt
- **THEN** wächst er zu einem großen grünen Zettel mit vollständiger Beschreibung,
  ohne Dialograhmen

#### Scenario: Auf dem Papier bearbeiten
- **GIVEN** der große Zettel „Budget“ ist offen
- **WHEN** der Teilnehmer auf „Bearbeiten“ klickt
- **THEN** sind Titel und Beschreibung direkt auf dem Zettel editierbar, darunter
  stehen Farbwahl und „Speichern“

#### Scenario: Farbe ausprobieren
- **GIVEN** der große Zettel „Budget“ ist im Bearbeiten-Modus
- **WHEN** der Teilnehmer „Blau“ wählt und „Abbrechen“ klickt
- **THEN** war der große Zettel kurz blau und ist danach wieder grün, und die Farbe
  wurde nicht gespeichert

#### Scenario: Nur ein Zettel
- **GIVEN** der große Zettel „Budget“ ist offen
- **WHEN** der Teilnehmer auf das Board dahinter schaut
- **THEN** ist der kleine Zettel „Budget“ dort nicht zu sehen

#### Scenario: Schließen
- **WHEN** der Teilnehmer den großen Zettel schließt
- **THEN** schrumpft er an seinen Platz auf dem Board zurück, und erst dann ist der kleine Zettel wieder zu sehen

#### Scenario: Fokus als großer Zettel
- **WHEN** Anna „Budget“ allen zeigt
- **THEN** erscheint „Budget“ bei Ben als großer grüner Zettel mit „Anna zeigt“

### Requirement: Bewegung der Zettel
Zettel SHALL sich passend zum Ablauf bewegen: Eine neue Karte MUST mit einer kurzen
Animation auf dem Board landen, die Kennzeichnung „heute besprochen“ MUST als
gezeichneter Haken erscheinen, und beim Beenden eines Termins MUST jede weiterrückende
Karte sichtbar abgezogen und in der nächsten Spalte angeklebt werden, während Karten
aus Spalte 3 sich lösen und fallen. Ein Farbwechsel SHALL animiert übergehen. Ist
auf dem Gerät „Bewegung reduzieren“ eingestellt, MUST keine dieser Animationen
laufen; die Zettel erscheinen dann direkt im Endzustand. Animationen MUST NOT die
Bedienung blockieren.

#### Scenario: Neue Karte landet
- **WHEN** Ben ein Thema anlegt
- **THEN** landet der Zettel bei allen, die das Board ansehen, mit einer kurzen
  Animation in Spalte 1

#### Scenario: Beenden
- **GIVEN** Karte A liegt in Spalte 1, Karte C in Spalte 3
- **WHEN** der Termin beendet wird
- **THEN** wird A abgezogen und in Spalte 2 angeklebt, und C löst sich und fällt aus
  dem Board

#### Scenario: Besprochen
- **WHEN** eine Karte als besprochen markiert wird
- **THEN** erscheint bei allen ein gezeichneter Haken mit „heute besprochen“

#### Scenario: Bewegung reduziert
- **GIVEN** auf dem Gerät ist „Bewegung reduzieren“ eingestellt
- **WHEN** der Termin beendet wird
- **THEN** stehen die Zettel ohne Animation sofort in ihren neuen Spalten
