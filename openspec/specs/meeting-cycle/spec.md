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
- **WHEN** ein zweiter Benutzer das Board zum ersten Mal öffnet
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
Protokollant und den Karten samt ihrer Spalte und Namen gespeichert werden.

#### Scenario: Historie ansehen
- **WHEN** ein Teilnehmer die Historie öffnet
- **THEN** sieht er alle vergangenen Termine absteigend nach Datum
