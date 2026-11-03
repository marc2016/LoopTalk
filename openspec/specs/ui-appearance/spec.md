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

### Requirement: Großer Zettel
Ein Klick auf einen Zettel SHALL ihn sichtbar aus seiner Position auf dem Board zu
einem großen Zettel wachsen lassen; beim Schließen MUST er an seinen Platz
zurückschrumpfen. Solange der große Zettel offen ist, MUST der kleine an seiner
Stelle ausgeblendet sein, damit nur ein Zettel zu sehen ist. Der große Zettel MUST wie der kleine aussehen: dieselbe
Zettelfarbe, dasselbe Alter, Papier mit umgeknickter Ecke, ohne Dialograhmen. Er
enthält alles zum Lesen, Bearbeiten und Präsentieren: Titel, vollständige
Beschreibung, Namen, Lebensanzeige, Farbwahl, „besprochen“, „Allen zeigen“ bzw.
„Fokus beenden“, Verlauf und „Löschen“. Es gibt keinen Bearbeiten-Modus: Titel und
Beschreibung MUST wie Schrift auf dem Papier aussehen und beim Bearbeiten an
derselben Stelle zum Eingabefeld werden, ohne dass sich der Zettel sonst verändert.
Ein leerer Beschreibungstext MUST als Aufforderung erscheinen, eine Beschreibung zu
ergänzen. Ein Klick auf eine Farbe MUST den großen Zettel sofort umfärben und die
Farbe speichern. Ein neues Thema MUST als großer gelber Zettel mit Eingabefeldern,
Farbwahl, „Abbrechen“ und „Anlegen“ beginnen; dort wird die Farbe erst mit
„Anlegen“ gespeichert. Die gemeinsame Fokusansicht MUST ebenfalls als großer Zettel
erscheinen. Bei reduzierter Bewegung erscheint und verschwindet der große Zettel
ohne Animation. Text auf dem großen Zettel MUST mindestens einen Kontrast nach WCAG
AA haben, und alle Felder MUST per Tastatur und Screenreader bedienbar bleiben.

#### Scenario: Zettel öffnen
- **GIVEN** „Budget“ ist ein grüner Zettel in Spalte 2
- **WHEN** ein Teilnehmer auf den Zettel klickt
- **THEN** wächst er zu einem großen grünen Zettel mit vollständiger Beschreibung,
  ohne Dialograhmen

#### Scenario: Auf dem Papier bearbeiten
- **GIVEN** der große Zettel „Budget“ ist offen
- **WHEN** der Teilnehmer auf die Beschreibung klickt
- **THEN** wird die Beschreibung an derselben Stelle zum Eingabefeld, ohne Button
  „Bearbeiten“, und Farbwahl, Namen und Verlauf bleiben unverändert sichtbar

#### Scenario: Farbe ausprobieren
- **GIVEN** ein Teilnehmer legt ein neues Thema an
- **WHEN** er „Blau“ wählt und „Abbrechen“ klickt
- **THEN** war der große Zettel kurz blau, und es wurde kein Thema angelegt

#### Scenario: Per Tastatur bearbeiten
- **GIVEN** der große Zettel „Budget“ ist offen
- **WHEN** der Teilnehmer per Tab auf den Titel geht und Enter drückt
- **THEN** wird der Titel zum Eingabefeld, und ein Screenreader kündigt ihn als
  bearbeitbaren Titel an

#### Scenario: Farbe direkt wählen
- **GIVEN** der große Zettel „Budget“ ist grün
- **WHEN** der Teilnehmer „Blau“ anklickt
- **THEN** wird der große Zettel sofort blau, und nach dem Schließen ist auch der
  kleine Zettel blau

#### Scenario: Escape im Feld
- **GIVEN** der Teilnehmer bearbeitet den Titel auf dem großen Zettel
- **WHEN** er Escape drückt
- **THEN** wird nur die Eingabe verworfen, der große Zettel bleibt offen

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
