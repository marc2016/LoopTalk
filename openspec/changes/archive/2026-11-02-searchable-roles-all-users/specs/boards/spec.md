## MODIFIED Requirements

### Requirement: Board erstellen
Jeder angemeldete Benutzer SHALL ein Board mit einem Namen erstellen können. Jedes
Board hat eigene Karten, Teilnehmer, Termine, eigenen Rotationstopf und eigene
Historie. Alle Benutzer, die sich bisher bei LoopTalk angemeldet haben, MUST beim
Erstellen aktive Teilnehmer des Boards werden und im Rotationstopf liegen; der
Ersteller moderiert den ersten Termin und liegt deshalb nicht im Topf.

#### Scenario: Neues Board
- **WHEN** ein Benutzer ein Board „Team-Austausch“ erstellt
- **THEN** existiert ein leeres Board mit drei Spalten, er ist Teilnehmer und
  Moderator des ersten Termins, und er erhält den Link zum Board

#### Scenario: Alle sind sofort dabei
- **GIVEN** Anna, Ben und Carla haben sich schon einmal angemeldet
- **WHEN** Anna ein neues Board erstellt
- **THEN** sind Anna, Ben und Carla aktive Teilnehmer, und Ben und Carla liegen im
  Rotationstopf

#### Scenario: Name fehlt
- **WHEN** ein Benutzer ein Board ohne Namen erstellen will
- **THEN** wird kein Board angelegt und eine Fehlermeldung angezeigt

### Requirement: Zugriff per Link
Jedes Board SHALL über einen Link mit einer zufälligen, nicht erratbaren Kennung
erreichbar sein (mindestens 128 Bit Zufall). Jeder angemeldete Benutzer SHALL jedes
Board vollständig nutzen können. Boards SHALL allen angemeldeten Benutzern
aufgelistet werden (siehe „Alle Boards“).

#### Scenario: Link teilen
- **GIVEN** Anna hat ein Board erstellt und Ben den Link geschickt
- **WHEN** Ben den Link öffnet und sich anmeldet
- **THEN** sieht Ben das Board und kann alles darauf tun, was Anna kann

#### Scenario: Unbekannte Kennung
- **WHEN** ein Benutzer einen Board-Link mit unbekannter Kennung öffnet
- **THEN** erhält er „nicht gefunden“

## REMOVED Requirements

### Requirement: Beitritt beim ersten Öffnen
**Reason**: Teilnehmer werden nicht mehr beim Öffnen eines Boards angelegt, sondern
sind von Anfang an alle Benutzer.
**Migration**: Ersetzt durch „Alle Benutzer sind Teilnehmer“; eine Migration nimmt
alle bisher bekannten Benutzer in alle bestehenden Boards auf.

### Requirement: Meine Boards
**Reason**: Da jeder Benutzer Teilnehmer jedes Boards ist, wären „meine“ Boards
ohnehin alle Boards.
**Migration**: Ersetzt durch „Alle Boards“.

## ADDED Requirements

### Requirement: Alle Benutzer sind Teilnehmer
Jeder Benutzer, der sich mindestens einmal bei LoopTalk angemeldet hat, SHALL
Teilnehmer jedes Boards sein. Meldet sich ein Benutzer zum ersten Mal an, MUST er
allen bestehenden Boards als aktiver Teilnehmer hinzugefügt und in deren
Rotationstopf gelegt werden; dies MUST im Audit-Log des jeweiligen Boards vermerkt
und allen, die ein Board gerade ansehen, live angezeigt werden. Wer auf einem Board
auf inaktiv gesetzt wurde, MUST dort inaktiv bleiben, auch wenn er sich erneut
anmeldet. Personen, die sich noch nie angemeldet haben, sind nicht bekannt und
erscheinen nirgends als Teilnehmer.

#### Scenario: Erster Login
- **GIVEN** es gibt die Boards „Team A“ und „Team B“
- **WHEN** Dora sich zum ersten Mal anmeldet
- **THEN** ist Dora auf beiden Boards aktive Teilnehmerin, liegt in beiden
  Rotationstöpfen und kann als Moderatorin gezogen oder eingetragen werden

#### Scenario: Live sichtbar
- **GIVEN** Anna sieht das Board „Team A“ an
- **WHEN** Dora sich zum ersten Mal anmeldet
- **THEN** erscheint Dora bei Anna ohne Neuladen in der Auswahl für Moderation und
  Protokoll

#### Scenario: Inaktiv bleibt inaktiv
- **GIVEN** Ben ist auf „Team A“ inaktiv
- **WHEN** Ben sich erneut anmeldet
- **THEN** bleibt Ben auf „Team A“ inaktiv und liegt nicht im Rotationstopf

#### Scenario: Bestehende Boards
- **GIVEN** ein Board, das vor dieser Änderung nur Anna und Ben als Teilnehmer hatte,
  und Carla hat sich auf einem anderen Board schon angemeldet
- **WHEN** die Änderung eingespielt wird
- **THEN** ist Carla auf dem Board aktive Teilnehmerin und liegt im Rotationstopf;
  Annas und Bens Status und Platz im Topf bleiben unverändert

### Requirement: Alle Boards
Die Startseite SHALL alle Boards alphabetisch nach Namen auflisten und einen Button
zum Erstellen eines neuen Boards anbieten.

#### Scenario: Startseite
- **GIVEN** Anna hat das Board „Team A“ erstellt
- **WHEN** Ben die Startseite öffnet, ohne den Link je geöffnet zu haben
- **THEN** sieht er „Team A“ in der Liste und kann es von dort öffnen
