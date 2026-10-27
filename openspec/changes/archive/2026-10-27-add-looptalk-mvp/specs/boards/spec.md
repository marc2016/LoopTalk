## ADDED Requirements

### Requirement: Board erstellen
Jeder angemeldete Benutzer SHALL ein Board mit einem Namen erstellen können. Jedes
Board hat eigene Karten, Teilnehmer, Termine, eigenen Rotationstopf und eigene
Historie. Der Ersteller MUST automatisch Teilnehmer des Boards werden.

#### Scenario: Neues Board
- **WHEN** ein Benutzer ein Board „Team-Austausch“ erstellt
- **THEN** existiert ein leeres Board mit drei Spalten, er ist Teilnehmer und
  Moderator des ersten Termins, und er erhält den Link zum Board

#### Scenario: Name fehlt
- **WHEN** ein Benutzer ein Board ohne Namen erstellen will
- **THEN** wird kein Board angelegt und eine Fehlermeldung angezeigt

### Requirement: Zugriff per Link
Jedes Board SHALL über einen Link mit einer zufälligen, nicht erratbaren Kennung
erreichbar sein (mindestens 128 Bit Zufall). Jeder angemeldete Benutzer mit dem Link
SHALL das Board vollständig nutzen können. Boards MUST NOT anderen Benutzern
aufgelistet werden, die den Link nicht kennen.

#### Scenario: Link teilen
- **GIVEN** Anna hat ein Board erstellt und Ben den Link geschickt
- **WHEN** Ben den Link öffnet und sich anmeldet
- **THEN** sieht Ben das Board und kann alles darauf tun, was Anna kann

#### Scenario: Unbekannte Kennung
- **WHEN** ein Benutzer einen Board-Link mit unbekannter Kennung öffnet
- **THEN** erhält er „nicht gefunden“, ohne Hinweis, ob es Boards gibt

### Requirement: Beitritt beim ersten Öffnen
Öffnet ein angemeldeter Benutzer ein Board zum ersten Mal, SHALL er als aktiver
Teilnehmer des Boards angelegt und dessen Rotationstopf hinzugefügt werden.

#### Scenario: Erster Besuch
- **WHEN** Ben ein Board zum ersten Mal öffnet
- **THEN** steht Ben in der Teilnehmerliste und kann künftig Moderator werden

### Requirement: Meine Boards
Die Startseite SHALL die Boards auflisten, bei denen der Benutzer Teilnehmer ist,
und einen Button zum Erstellen eines neuen Boards anbieten.

#### Scenario: Startseite
- **WHEN** Ben die Startseite öffnet
- **THEN** sieht er alle Boards, die er erstellt oder über einen Link geöffnet hat

### Requirement: Keine Berechtigungsstufen
Im MVP SHALL es keine Rollenrechte geben. Jeder Teilnehmer eines Boards SHALL
Karten anlegen, bearbeiten und löschen, Namen an Karten hinzufügen und
entfernen, Termine starten und beenden, Moderator und Protokollant ändern, Teilnehmer
aktiv/inaktiv setzen und das Board umbenennen können. Nachvollziehbarkeit
entsteht über das Audit-Log (siehe `audit-log`).

#### Scenario: Fremde Karte bearbeiten
- **WHEN** Ben eine Karte von Anna bearbeitet
- **THEN** wird die Änderung gespeichert und im Audit-Log mit Ben als Akteur vermerkt
