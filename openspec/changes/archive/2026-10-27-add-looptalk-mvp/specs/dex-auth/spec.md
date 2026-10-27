## ADDED Requirements

### Requirement: Login über Dex
Die Anwendung SHALL Benutzer ausschließlich über Dex per OpenID Connect anmelden
(Authorization Code Flow mit PKCE, `state` und `nonce`).

#### Scenario: Erfolgreicher Login
- **WHEN** ein Benutzer sich bei Dex erfolgreich anmeldet
- **THEN** wird er zur Anwendung zurückgeleitet und sieht das Board

#### Scenario: Manipulierter Callback
- **WHEN** der Callback mit ungültigem `state` aufgerufen wird
- **THEN** wird kein Login durchgeführt

### Requirement: Zugriff nur mit Login
Die gesamte Anwendung MUST nur mit gültiger Session erreichbar sein. Das gilt für
die Oberfläche einschließlich ihrer statischen Dateien, alle `/api`-Endpunkte und
den Live-Update-Stream. Ohne Session ausgenommen sind nur die Login-Endpunkte
unter `/auth` und ein Health-Endpunkt, der keine Daten preisgibt. Die Prüfung
MUST serverseitig erfolgen, nicht nur im Frontend.

#### Scenario: API ohne Anmeldung
- **WHEN** ein nicht angemeldeter Benutzer einen `/api`-Endpunkt aufruft
- **THEN** antwortet die API mit 401 und liefert keine Daten

#### Scenario: Oberfläche ohne Anmeldung
- **WHEN** ein nicht angemeldeter Benutzer eine Seite der Anwendung im Browser öffnet
- **THEN** wird er zum Dex-Login umgeleitet und danach auf die ursprünglich
  angeforderte Seite zurückgeführt

#### Scenario: Live-Updates ohne Anmeldung
- **WHEN** ein nicht angemeldeter Client `/api/events` öffnet
- **THEN** wird die Verbindung mit 401 abgelehnt

#### Scenario: Session läuft ab
- **WHEN** die Session eines geöffneten Boards abläuft
- **THEN** antwortet die API mit 401, die SSE-Verbindung wird beendet und das
  Frontend leitet zum Login um

#### Scenario: Health-Check
- **WHEN** `/healthz` ohne Anmeldung aufgerufen wird
- **THEN** antwortet der Server mit 200 ohne Inhalte aus der Datenbank

### Requirement: Automatische Benutzeranlage
Beim ersten Login SHALL ein Benutzer mit dem OIDC-`sub` als stabilem Schlüssel
sowie Name und E-Mail aus den Claims angelegt werden. Bei späteren Logins SHALL
Name und E-Mail aktualisiert werden. Jeder Benutzer, der sich bei Dex anmelden
kann, erhält Zugang; Gruppen werden im MVP nicht ausgewertet. Teilnehmer eines
Boards wird ein Benutzer erst beim Öffnen des Boards (siehe `boards`).

#### Scenario: Erster Login
- **WHEN** sich ein Benutzer zum ersten Mal anmeldet
- **THEN** existiert er als Benutzer und sieht die Startseite mit seinen Boards

### Requirement: Logout
Die Anwendung SHALL einen Logout anbieten, der die lokale Session beendet.

#### Scenario: Abmelden
- **WHEN** ein Teilnehmer auf Abmelden klickt
- **THEN** ist seine Session ungültig und das Board nicht mehr erreichbar
