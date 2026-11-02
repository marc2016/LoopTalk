# meeting-cycle Specification

## Purpose

Termine starten und beenden, Karten weiterschieben, faire Moderatorwahl, Rollenwechsel und Historie.

## Requirements

### Requirement: Termin-Status
Jeder Termin eines Boards SHALL einen der Status `geplant`, `läuft` oder `beendet`
haben. Pro Board MUST es genau einen Termin geben, der `geplant` oder `läuft` ist.
Status-Änderungen betreffen nur das jeweilige Board.

#### Scenario: Anderes Board unberührt
- **GIVEN** zwei Boards mit je eigenen Karten
- **WHEN** auf Board A ein Termin gestartet oder beendet wird
- **THEN** bleiben Termin, Karten und Rollen auf Board B unverändert

### Requirement: Termin starten
Jeder Teilnehmer des Boards SHALL einen geplanten Termin per Button „Termin
starten“ starten können. Der Termin MUST dann den Status `läuft` mit
Startzeitpunkt haben. Karten und Rollen ändern sich beim Start nicht.

#### Scenario: Start
- **GIVEN** der Termin ist `geplant`
- **WHEN** ein Teilnehmer auf „Termin starten“ klickt
- **THEN** läuft der Termin, und alle Teilnehmer sehen, dass er läuft und seit wann

#### Scenario: Doppelter Start
- **WHEN** zwei Teilnehmer gleichzeitig auf „Termin starten“ klicken
- **THEN** wird der Termin genau einmal gestartet, der zweite Klick mit einem
  Konflikt abgelehnt

#### Scenario: Beenden ohne Start
- **GIVEN** der Termin ist `geplant`
- **THEN** wird kein Button „Termin beenden“ angeboten und ein entsprechender
  Aufruf abgelehnt

### Requirement: Termin beenden
Jeder Teilnehmer des Boards SHALL einen laufenden Termin per Button „Termin
beenden“ beenden können; vorher MUST eine Bestätigung abgefragt werden. Erst beim
Beenden SHALL in dieser Reihenfolge und atomar:
1. der Stand der Karten für die Historie festgehalten werden,
2. der neue Moderator gezogen werden (siehe „Faire Moderatorwahl“),
3. der bisherige Moderator Protokollant des nächsten Termins werden,
4. alle Karten eine Spalte weiterrücken und Karten aus Spalte 3 archiviert werden,
5. der nächste Termin mit Status `geplant` angelegt werden.

#### Scenario: Karten wandern beim Beenden
- **GIVEN** ein laufender Termin, Karte A in Spalte 1, B in Spalte 2, C in Spalte 3
- **WHEN** ein Teilnehmer den Termin beendet
- **THEN** liegt A in Spalte 2, B in Spalte 3 und C ist archiviert

#### Scenario: Während des Termins angelegte Karte
- **GIVEN** während eines laufenden Termins wird Karte D angelegt
- **WHEN** der Termin beendet wird
- **THEN** rückt D wie alle anderen Karten von Spalte 1 nach Spalte 2

#### Scenario: Karten bleiben beim Start
- **GIVEN** Karte A in Spalte 1
- **WHEN** der Termin gestartet wird
- **THEN** liegt A weiterhin in Spalte 1

#### Scenario: Doppeltes Beenden
- **WHEN** das Beenden zweimal mit derselben Terminversion ausgelöst wird
- **THEN** wird nur das erste ausgeführt, das zweite mit einem Konflikt abgelehnt

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

### Requirement: Rollen anzeigen
Das Board SHALL jederzeit den Moderator und den Protokollanten des aktuellen
Termins anzeigen und dabei kennzeichnen, dass der aktuelle Moderator der
Protokollant des nächsten Termins wird. Der nächste Moderator MUST bis zum
Beenden des Termins unbekannt bleiben und nirgends angezeigt werden.

#### Scenario: Hinweis auf nächsten Protokollanten
- **GIVEN** Anna moderiert, Ben protokolliert den aktuellen Termin
- **WHEN** ein Teilnehmer das Board ansieht
- **THEN** sieht er „Moderation: Anna“, „Protokoll: Ben“ und den Hinweis
  „Anna protokolliert beim nächsten Termin“

#### Scenario: Nächster Moderator vor dem Beenden
- **WHEN** der Termin läuft
- **THEN** ist der nächste Moderator weder angezeigt noch über die API abrufbar

### Requirement: Protokollant
Beim Beenden eines Termins MUST dessen Moderator als Protokollant des nächsten
Termins eingetragen werden. Wurde der Moderator manuell geändert, gilt der
zuletzt eingetragene Moderator. Beim ersten Termin eines Boards ist der
Protokollant leer, bis er manuell gesetzt wird. Das Protokoll selbst wird
außerhalb der App geführt; die App legt nur fest, wer protokolliert.

#### Scenario: Erster Termin
- **WHEN** ein Board erstellt wird
- **THEN** moderiert der Ersteller den ersten Termin, und das Protokoll ist
  „nicht festgelegt“

#### Scenario: Rollenwechsel
- **GIVEN** Anna moderiert den laufenden Termin
- **WHEN** der Termin beendet wird
- **THEN** ist Anna Protokollantin des nächsten Termins, und der neu gezogene
  Moderator wird allen angezeigt

### Requirement: Rollen manuell ändern
Jeder Teilnehmer des Boards SHALL Moderator und Protokollant des aktuellen
Termins jederzeit manuell ändern können, egal ob der Termin geplant ist oder
läuft. Zur Auswahl MUST nur aktive Teilnehmer des Boards stehen. Moderator und
Protokollant MUST NOT dieselbe Person sein; der Protokollant darf leer sein, der
Moderator nicht. Eine manuelle Änderung MUST den Rotationstopf so anpassen, dass
die Rotation fair bleibt: Der neue Moderator wird aus dem Topf entfernt, der
ersetzte Moderator kommt wieder hinein, wenn er in dieser Runde noch nicht
moderiert hat.

#### Scenario: Moderator fehlt
- **GIVEN** Anna ist als Moderatorin gezogen, ist aber nicht da
- **WHEN** ein Teilnehmer Carla als Moderatorin einträgt
- **THEN** moderiert Carla, Anna liegt wieder im Rotationstopf, Carla nicht mehr

#### Scenario: Protokollant ändern
- **WHEN** ein Teilnehmer während des laufenden Termins Ben als Protokollanten
  einträgt
- **THEN** wird Ben allen Teilnehmern als Protokollant angezeigt

#### Scenario: Manueller Moderator wird nächster Protokollant
- **GIVEN** Carla wurde manuell als Moderatorin eingetragen
- **WHEN** der Termin beendet wird
- **THEN** ist Carla Protokollantin des nächsten Termins

#### Scenario: Gleiche Person
- **WHEN** ein Teilnehmer den aktuellen Moderator auch als Protokollanten eintragen will
- **THEN** wird die Änderung abgelehnt

#### Scenario: Gleichzeitige Änderung
- **WHEN** zwei Teilnehmer die Rollen gleichzeitig mit derselben Terminversion ändern
- **THEN** wird nur die erste Änderung übernommen, die zweite mit einem Konflikt
  abgelehnt

### Requirement: Faire Moderatorwahl
Beim Beenden eines Termins SHALL der Moderator für den nächsten Termin zufällig aus einem
Rotationstopf des Boards gezogen werden. Der Topf enthält alle aktiven Teilnehmer
des Boards, die in der
laufenden Runde noch nicht moderiert haben. Ist der Topf leer, MUST er mit allen
aktiven Teilnehmern neu gefüllt werden. Der neue Protokollant MUST von der Ziehung
ausgeschlossen sein.

#### Scenario: Jeder einmal
- **GIVEN** vier aktive Teilnehmer und ein voller Rotationstopf
- **WHEN** vier Termine nacheinander beendet werden
- **THEN** hat jeder Teilnehmer genau einmal moderiert

#### Scenario: Nicht beide Rollen
- **WHEN** ein neuer Moderator gezogen wird
- **THEN** ist er nicht der Protokollant desselben Termins

#### Scenario: Topf neu füllen
- **GIVEN** der Rotationstopf ist nach der Ziehung leer
- **WHEN** der nächste Termin beendet wird
- **THEN** wird der Topf mit allen aktiven Teilnehmern außer dem neuen Protokollanten befüllt und daraus gezogen

#### Scenario: Inaktiver Teilnehmer
- **WHEN** ein Teilnehmer auf inaktiv gesetzt wird
- **THEN** wird er aus dem Rotationstopf entfernt und nicht mehr gezogen

### Requirement: Termin-Historie
Jeder beendete Termin SHALL mit Nummer, Start- und Endzeitpunkt, Moderator,
Protokollant und den Karten samt ihrer Spalte, Zettelfarbe und Namen gespeichert
werden. Für jede Karte MUST festgehalten werden, ob sie in diesem Termin besprochen
wurde. Die Historie MUST besprochene Karten von nicht besprochenen unterscheiden und
jede Karte in der Zettelfarbe zeigen, die sie bei diesem Termin hatte.

#### Scenario: Historie ansehen
- **WHEN** ein Teilnehmer die Historie öffnet
- **THEN** sieht er alle vergangenen Termine absteigend nach Datum

#### Scenario: Besprochen in der Historie
- **GIVEN** in Termin 5 wurde „Release-Planung“ besprochen, „Retro-Format“ nicht
- **WHEN** ein Teilnehmer die Historie öffnet
- **THEN** ist bei Termin 5 „Release-Planung“ als besprochen und „Retro-Format“ als
  nicht besprochen gekennzeichnet

#### Scenario: Farbe in der Historie
- **GIVEN** „Budget“ war bei Termin 5 grün und wurde danach blau gefärbt
- **WHEN** ein Teilnehmer die Historie von Termin 5 öffnet
- **THEN** ist „Budget“ dort grün

### Requirement: Vorschau vor dem Beenden
Solange die Bestätigung zum Beenden eines laufenden Termins offen ist, SHALL das
Board zeigen, was beim Beenden passiert: Karten in Spalte 1 und 2 sind als
„rückt weiter“ gekennzeichnet, Karten in Spalte 3 als „wird archiviert“. Die
Bestätigung MUST das Board dabei sichtbar lassen und den Hinweis enthalten, wer
beim nächsten Termin protokolliert. Wird die Bestätigung abgebrochen, MUST das
Board ohne Änderung in seine normale Ansicht zurückkehren. Die Vorschau betrifft nur
den Teilnehmer, der die Bestätigung geöffnet hat.

#### Scenario: Vorschau öffnen
- **GIVEN** ein laufender Termin mit Karte A in Spalte 1 und Karte C in Spalte 3
- **WHEN** ein Teilnehmer auf „Termin beenden“ klickt
- **THEN** sieht er weiterhin das Board, A ist als „rückt weiter“ und C als
  „wird archiviert“ gekennzeichnet, und eine Bestätigung wird angezeigt

#### Scenario: Vorschau abbrechen
- **WHEN** der Teilnehmer die Bestätigung abbricht
- **THEN** verschwinden die Kennzeichnungen, und Termin und Karten bleiben unverändert

#### Scenario: Nur beim eigenen Client
- **GIVEN** Anna hat die Bestätigung zum Beenden geöffnet
- **WHEN** Ben das Board ansieht
- **THEN** sieht Ben keine Vorschau

#### Scenario: Leeres Board
- **GIVEN** ein laufender Termin ohne Karten
- **WHEN** ein Teilnehmer auf „Termin beenden“ klickt
- **THEN** weist die Bestätigung darauf hin, dass keine Themen weiterrücken

### Requirement: Gemeinsamer Fokus
Während eines laufenden Termins SHALL jeder Teilnehmer eine Karte über „Allen
zeigen“ in der Detailansicht in den gemeinsamen Fokus nehmen können. Pro Termin
MUST höchstens eine Karte im Fokus sein; eine neu gezeigte Karte ersetzt die
vorige. Die Fokuskarte MUST bei allen Teilnehmern, die das Board geöffnet haben,
groß geöffnet werden, mit dem Hinweis, wer sie zeigt. Teilnehmer, die gerade eine
Karte bearbeiten oder einen anderen Dialog geöffnet haben, MUST NOT unterbrochen
werden; sie sehen stattdessen eine Leiste „<Name> zeigt: <Titel>“ mit „Ansehen“.
Schließt ein Teilnehmer die Fokusansicht, schließt sie sich nur bei ihm, und die
Leiste mit „Zurück zum Fokus“ erscheint. „Fokus beenden“ MUST den Fokus für alle
beenden. Der Fokus MUST mit dem Beenden des Termins enden und endet, wenn die
Fokuskarte gelöscht wird. Wer das Board während eines Fokus öffnet, MUST die
Fokuskarte sofort sehen. Zeigen und Fokus beenden erzeugen keinen Audit-Eintrag.

#### Scenario: Allen zeigen
- **GIVEN** ein laufender Termin, Anna und Ben haben das Board geöffnet
- **WHEN** Anna die Karte „Release-Planung“ allen zeigt
- **THEN** öffnet sich „Release-Planung“ bei Ben groß mit „Anna zeigt“

#### Scenario: Anderes Thema zeigen
- **GIVEN** „Release-Planung“ ist im Fokus
- **WHEN** Ben „Budget“ allen zeigt
- **THEN** wechselt die Fokusansicht bei allen zu „Budget“ mit „Ben zeigt“

#### Scenario: Lokal schließen
- **WHEN** Ben die Fokusansicht schließt
- **THEN** bleibt sie bei Anna offen, und Ben sieht die Leiste „Anna zeigt:
  Release-Planung“ mit „Zurück zum Fokus“

#### Scenario: Fokus beenden
- **WHEN** ein Teilnehmer „Fokus beenden“ klickt
- **THEN** schließt sich die Fokusansicht bei allen, und die Leiste verschwindet

#### Scenario: Nicht beim Bearbeiten unterbrechen
- **GIVEN** Ben bearbeitet gerade eine Karte
- **WHEN** Anna eine Karte allen zeigt
- **THEN** bleibt Bens Bearbeitung offen, und er sieht die Leiste „Anna zeigt“

#### Scenario: Später dazukommen
- **GIVEN** „Release-Planung“ ist im Fokus
- **WHEN** Carla das Board öffnet
- **THEN** sieht sie „Release-Planung“ groß mit „Anna zeigt“

#### Scenario: Nur im laufenden Termin
- **WHEN** der Termin geplant ist
- **THEN** bietet die Detailansicht kein „Allen zeigen“ an, und ein entsprechender
  Aufruf wird abgelehnt

#### Scenario: Termin beendet
- **GIVEN** eine Karte ist im Fokus
- **WHEN** der Termin beendet wird
- **THEN** gibt es keinen Fokus mehr

#### Scenario: Fokuskarte gelöscht
- **WHEN** die Karte im Fokus gelöscht wird
- **THEN** endet der Fokus bei allen

### Requirement: Warnung vor nicht besprochenen Themen
Die Bestätigung zum Beenden eines Termins SHALL nennen, welche Karten der Spalte 3
in diesem Termin nicht besprochen wurden und daher ohne Besprechung archiviert
werden. Das Beenden MUST trotzdem möglich bleiben.

#### Scenario: Nicht besprochenes Thema in der letzten Runde
- **GIVEN** in Spalte 3 liegen „Budget“ (besprochen) und „Hiring“ (nicht besprochen)
- **WHEN** ein Teilnehmer die Bestätigung zum Beenden öffnet
- **THEN** weist sie darauf hin, dass „Hiring“ nicht besprochen wurde und archiviert
  wird, und „Termin beenden“ bleibt möglich

#### Scenario: Alles besprochen
- **GIVEN** alle Karten in Spalte 3 wurden besprochen
- **WHEN** ein Teilnehmer die Bestätigung zum Beenden öffnet
- **THEN** erscheint keine Warnung
