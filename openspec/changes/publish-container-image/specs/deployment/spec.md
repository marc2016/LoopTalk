# Spec Delta

## Purpose

Wie LoopTalk als fertiges, versioniertes Container-Image entsteht, veröffentlicht und
betrieben wird: vom Release-Skript über die Veröffentlichung in GHCR bis zum Start
des Images neben einer PostgreSQL-Datenbank.

## ADDED Requirements

### Requirement: Ein Produktions-Image
LoopTalk SHALL als genau ein Container-Image ausgeliefert werden, das Server und
gebautes Frontend enthält. Das Image MUST als Nicht-root-Benutzer laufen, auf Port
3000 lauschen, einen Healthcheck auf `/healthz` mitbringen und ausschließlich über
Umgebungsvariablen konfiguriert werden. Das Image MUST keine Geheimnisse enthalten.
PostgreSQL und Dex SHALL nicht Teil des Images sein.

#### Scenario: Start neben vorhandener Datenbank
- **WHEN** das Image mit gültiger Konfiguration (`BASE_URL`, `DATABASE_URL`,
  `SESSION_SECRET`, Dex-Variablen) und ohne weitere Dienste gestartet wird
- **THEN** ist die Anwendung unter Port 3000 erreichbar und der Container wird als
  gesund gemeldet

#### Scenario: Fehlende Konfiguration
- **WHEN** das Image ohne `SESSION_SECRET` gestartet wird
- **THEN** beendet sich der Container mit einem Fehlercode und nennt die fehlende
  Variable im Log

### Requirement: Migration beim Start
Beim Start SHALL die Anwendung auf die Datenbank warten, alle ausstehenden
Migrationen ausführen und erst danach Anfragen annehmen. Ist die Datenbank nach
etwa 60 Sekunden nicht erreichbar oder schlägt eine Migration fehl, MUST sich der
Prozess mit einem Fehlercode beenden, ohne Anfragen anzunehmen. Mit
`MIGRATE_ON_START=false` SHALL die Migration beim Start entfallen; die Migration
MUST dann weiterhin separat aus demselben Image ausführbar sein.

#### Scenario: Leere Datenbank
- **WHEN** das Image gegen eine leere PostgreSQL-Datenbank startet
- **THEN** legt es das Schema an und die Anwendung ist danach benutzbar

#### Scenario: Neue Version mit neuer Migration
- **WHEN** ein Image einer neueren Version gegen die Datenbank einer älteren
  Version startet
- **THEN** werden nur die fehlenden Migrationen ausgeführt und die Daten bleiben
  erhalten

#### Scenario: Datenbank startet später
- **WHEN** die Anwendung startet, bevor PostgreSQL Verbindungen annimmt, und die
  Datenbank innerhalb von 60 Sekunden bereit wird
- **THEN** wartet die Anwendung, migriert und startet ohne Absturz

#### Scenario: Datenbank bleibt unerreichbar
- **WHEN** die Datenbank 60 Sekunden lang nicht erreichbar ist
- **THEN** beendet sich der Prozess mit einem Fehlercode und meldet im Log, dass
  die Datenbank nicht erreichbar ist

#### Scenario: Migration abgeschaltet
- **WHEN** das Image mit `MIGRATE_ON_START=false` startet
- **THEN** führt es keine Migration aus, und ein separater Lauf von `migrate.js`
  aus demselben Image bringt die Datenbank auf den aktuellen Stand

### Requirement: Sichtbare Version
Jede Version SHALL eine SemVer-Nummer `X.Y.Z` tragen, die für alle Pakete des
Repositorys gleich ist. `/healthz` SHALL diese Version ohne Anmeldung zurückgeben,
weiterhin ohne Inhalte aus der Datenbank. Das veröffentlichte Image MUST die
Version als OCI-Label `org.opencontainers.image.version` tragen.

#### Scenario: Version abfragen
- **WHEN** `/healthz` auf einem Image der Version `1.2.0` aufgerufen wird
- **THEN** antwortet der Server mit 200 und `{"status":"ok","version":"1.2.0"}`

#### Scenario: Version im Image
- **WHEN** jemand die Labels des Images `ghcr.io/marc2016/looptalk:1.2.0` ansieht
- **THEN** steht dort `org.opencontainers.image.version=1.2.0`

### Requirement: Release-Skript
Das Repository SHALL ein Skript `release.sh` enthalten, das ein Release vorbereitet.
Es SHALL die Zielversion als `patch`, `minor`, `major` oder `X.Y.Z` entgegennehmen
und ohne Argument interaktiv danach fragen. Es MUST abbrechen, ohne etwas zu
verändern, wenn nicht auf `main` gearbeitet wird, der Arbeitsbaum nicht sauber
ist, `main` nicht dem Stand von `origin/main` entspricht oder der Tag `vX.Y.Z`
bereits existiert. Vor dem Setzen der Version SHALL es die Tests und die
Ende-zu-Ende-Tests in Docker ausführen und bei einem Fehlschlag abbrechen; mit
`--skip-tests` dürfen die Tests übersprungen werden. Danach SHALL es die Version in
allen Paketen setzen, nur diese Dateien committen, einen annotierten Tag `vX.Y.Z`
anlegen und `main` und den Tag erst nach ausdrücklicher Bestätigung pushen.

#### Scenario: Patch-Release
- **WHEN** auf sauberem, aktuellem `main` mit Version `1.2.0` `./release.sh patch`
  läuft und die Tests grün sind
- **THEN** tragen alle Pakete `1.2.1`, es gibt einen Commit „Release v1.2.1“ und
  einen Tag `v1.2.1`, und nach Bestätigung sind beide auf GitHub

#### Scenario: Falscher Branch
- **WHEN** `./release.sh` auf einem anderen Branch als `main` läuft
- **THEN** bricht es mit einer Meldung ab, ohne Dateien, Commits oder Tags zu
  verändern

#### Scenario: Rote Tests
- **WHEN** die Tests während `./release.sh minor` fehlschlagen
- **THEN** bricht das Skript ab, und Version, Commits und Tags bleiben unverändert

#### Scenario: Push abgelehnt
- **WHEN** die Rückfrage zum Pushen verneint wird
- **THEN** bleiben Commit und Tag lokal und das Skript nennt den Befehl zum
  späteren Pushen

### Requirement: Automatische Tests in GitHub
Bei jedem Push auf `main`, bei jedem Pull Request gegen `main` und bei jedem Tag
`v*` SHALL GitHub Actions Lint, Typprüfung, Unit-, Integrations- und API-Tests sowie
die Ende-zu-Ende-Tests gegen das Produktions-Image ausführen. Pushes auf `main` und
Pull Requests MUST dabei kein Image veröffentlichen.

#### Scenario: Pull Request
- **WHEN** ein Pull Request gegen `main` geöffnet wird
- **THEN** laufen alle Tests, und es wird kein Image veröffentlicht

#### Scenario: Fehlgeschlagene Ende-zu-Ende-Tests
- **WHEN** die Ende-zu-Ende-Tests in GitHub fehlschlagen
- **THEN** ist der Lauf rot, und Screenshots und Traces stehen als Artefakt zum
  Herunterladen bereit

### Requirement: Veröffentlichung in GHCR
Bei einem Tag `vX.Y.Z` SHALL GitHub Actions das Produktions-Image für `linux/amd64`
bauen und als `ghcr.io/marc2016/looptalk:X.Y.Z`, `:X.Y` und `:latest`
veröffentlichen, MUST dies aber nur tun, nachdem alle Tests dieses Laufs grün sind.
Zum Tag SHALL ein GitHub-Release mit automatisch erzeugten Notizen entstehen. Das
Image MUST ohne Anmeldung abrufbar sein.

#### Scenario: Release-Tag
- **WHEN** der Tag `v1.3.0` gepusht wird und alle Tests grün sind
- **THEN** sind `ghcr.io/marc2016/looptalk:1.3.0`, `:1.3` und `:latest` abrufbar
  und zeigen auf dasselbe Image, und es gibt ein GitHub-Release `v1.3.0`

#### Scenario: Release-Tag mit roten Tests
- **WHEN** der Tag `v1.3.0` gepusht wird und ein Test fehlschlägt
- **THEN** wird kein Image veröffentlicht, `:latest` zeigt weiter auf das vorherige
  Release, und es entsteht kein GitHub-Release

### Requirement: Betrieb aus dem veröffentlichten Image
Die Compose-Datei für den Betrieb SHALL standardmäßig das veröffentlichte Image
laden und es nur mit `--build` aus dem Quellcode bauen. Die Version SHALL über
`LOOPTALK_VERSION` wählbar sein, Standard ist `latest`. Für den Betrieb aus dem
veröffentlichten Image MUST außer der Compose-Datei, der `.env` und optional der
Dex-Konfiguration nichts aus dem Repository auf dem Server liegen.

#### Scenario: Erstinstallation
- **WHEN** auf einem Server nur `compose.prod.yaml` und eine ausgefüllte `.env`
  liegen und `docker compose -f compose.prod.yaml up -d` läuft
- **THEN** werden die Images geladen, die Datenbank angelegt und migriert, und die
  App antwortet auf `127.0.0.1:3000`

#### Scenario: Update auf neue Version
- **WHEN** `LOOPTALK_VERSION=1.3.0` gesetzt und
  `docker compose -f compose.prod.yaml up -d` erneut ausgeführt wird
- **THEN** läuft danach Version `1.3.0` mit migrierter Datenbank und erhaltenen
  Daten

#### Scenario: Selbst bauen
- **WHEN** im ausgecheckten Repository `docker compose -f compose.prod.yaml up -d --build`
  läuft
- **THEN** wird das Image aus dem Quellcode gebaut und unter demselben Namen gestartet

#### Scenario: Rückkehr zur Vorversion ohne neue Migrationen
- **WHEN** von `1.3.1` auf `1.3.0` zurückgewechselt wird und `1.3.1` keine neue
  Migration enthielt
- **THEN** läuft `1.3.0` mit den unveränderten Daten weiter
