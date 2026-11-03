# LoopTalk

Online-Tool für regelmäßige Austauschtermine. Themen stehen auf Karten und laufen
durch drei Spalten: Ein neues Thema startet in „Neu“, rückt mit jedem beendeten
Termin eine Spalte weiter und wird nach „Letzter Termin“ archiviert.

- **Mehrere Boards**: Die Startseite listet alle Boards, jedes Board hat außerdem
  einen nicht erratbaren Link. Jedes Board ist eine Wand aus Papier (Standard), Kork
  oder Whiteboard; die Wand wird im Dialog „Board bearbeiten“ gewählt und gilt für
  alle. Jeder, der sich einmal angemeldet hat, ist Teilnehmer
  jedes Boards und kommt in dessen Rotation; auf der Teilnehmerseite lässt sich
  jemand pro Board inaktiv setzen. Es gibt keine Rollenrechte; jeder darf alles.
- **Termine** werden per Button gestartet und beendet. Erst beim Beenden wird die
  neue Moderation gezogen, alle Themen rücken weiter.
- **Rollen**: Protokoll führt, wer zuletzt moderiert hat. Die Moderation wird fair
  rotiert (jeder kommt einmal dran, bevor sich jemand wiederholt). Beide Rollen
  lassen sich jederzeit manuell ändern. Das Protokoll selbst wird außerhalb der App
  geführt.
- **Themen** kann jeder anlegen, bearbeiten, löschen und um weitere Namen ergänzen.
  Sie hängen als Zettel am Board, in einer von sechs frei wählbaren Farben, und
  altern sichtbar, je näher sie dem Archiv kommen.
- **Live**: Änderungen und wer gerade auf dem Board ist, erscheinen sofort bei allen.
- **Bedienung über der Wand**: Das Board füllt die ganze Seite; eine Glasleiste oben
  (Board-Name, Bereiche, Link, Anwesenheit) und ein Termin-Dock unten (Termin, Rollen,
  Starten/Beenden) schweben darüber.
- **Audit-Log**: Jede Änderung wird unveränderlich mit Person und Zeitpunkt
  festgehalten.
- **Login** ausschließlich über [Dex](https://dexidp.io) (OpenID Connect). Ohne
  Anmeldung ist nichts erreichbar außer `/healthz`.

Stack: Node.js 22, TypeScript, Express 5, PostgreSQL 17 mit Drizzle ORM, React 19
mit Vite, Tailwind CSS und shadcn/ui. Alles läuft in Docker.

## Entwicklung

Voraussetzung ist nur Docker mit Compose.

```bash
./start.sh
```

Das Skript startet bei Bedarf Colima, baut und startet alle Container, wartet bis
die App antwortet und zeigt danach die Logs. Strg+C stoppt alles wieder. Ohne das
Skript geht es auch direkt mit `docker compose up --build`.

Danach läuft die App unter <http://localhost:5173> mit Hot Reload für Server und
Frontend. Compose startet PostgreSQL, führt die Migrationen aus und startet Dex mit
Testnutzern:

| E-Mail | Passwort |
| --- | --- |
| `anna@example.com` | `password` |
| `ben@example.com` | `password` |
| `carla@example.com` | `password` |
| `dora@example.com` | `password` |

Zum Ausprobieren mit mehreren Personen ein zweites Browserfenster im privaten Modus
öffnen und den Board-Link teilen.

Weitere Befehle:

```bash
# Neue Migration nach Änderungen an apps/server/src/db/schema.ts
docker compose run --rm server npm run db:generate -w @looptalk/server

# Datenbank zurücksetzen
docker compose down -v
```

Die Datenbank ist für lokale Werkzeuge unter `localhost:55432` erreichbar
(Benutzer und Passwort `looptalk`).

## Tests

```bash
# Lint, Typprüfung, Unit-, Integrations- und API-Tests (gegen echte PostgreSQL)
docker compose -f compose.test.yaml run --rm test

# Ende-zu-Ende-Tests mit Playwright gegen das Produktions-Image, Dex und PostgreSQL
docker compose -f compose.test.yaml run --rm --build e2e
docker compose -f compose.test.yaml down -v
```

Bei Fehlschlägen der Ende-zu-Ende-Tests liegen Screenshots und Traces unter
`e2e/test-results/`.

## Betrieb

LoopTalk gibt es als fertiges Image `ghcr.io/marc2016/looptalk` (`linux/amd64`) mit
den Tags `X.Y.Z`, `X.Y` und `latest`. Auf dem Server reichen `compose.prod.yaml`,
eine `.env` und optional die Dex-Konfiguration; der Quellcode wird nicht gebraucht.

```bash
cp .env.example .env      # Werte eintragen
docker compose -f compose.prod.yaml up -d
```

Die App wartet beim Start bis zu 60 Sekunden auf die Datenbank, führt ausstehende
Migrationen aus und nimmt erst danach Anfragen an. Sie lauscht nur auf
`127.0.0.1:3000`; davor gehört ein Reverse Proxy mit TLS. Das Image läuft als
Nicht-root-Benutzer und hat einen Healthcheck auf `/healthz`, der auch die
laufende Version zeigt:

```bash
curl -s 127.0.0.1:3000/healthz    # {"status":"ok","version":"1.0.0"}
```

**Update:** `LOOPTALK_VERSION` in der `.env` setzen (oder `latest` lassen), dann

```bash
docker compose -f compose.prod.yaml pull
docker compose -f compose.prod.yaml up -d
```

Migrationen lassen sich nicht zurückdrehen. Vor einem Update deshalb ein Backup
anlegen, z. B. `docker compose -f compose.prod.yaml exec db pg_dump -U looptalk looptalk > backup.sql`.
Zurück auf eine Vorversion geht über `LOOPTALK_VERSION`, solange die neuere Version
keine Migration mitgebracht hat; sonst nur mit dem Backup.

**Selbst bauen:** Im ausgecheckten Repository baut
`docker compose -f compose.prod.yaml up -d --build` das Image aus dem Quellcode.

**Ohne Compose:** Läuft PostgreSQL schon, genügt ein einzelner Container:

```bash
docker run -d -p 127.0.0.1:3000:3000 --env-file .env \
  -e DATABASE_URL=postgres://looptalk:<passwort>@<host>:5432/looptalk \
  ghcr.io/marc2016/looptalk:latest
```

Soll die Migration getrennt laufen (z. B. als Init-Job), `MIGRATE_ON_START=false`
setzen und vorher `node dist/migrate.js` aus demselben Image ausführen.

### Konfiguration

| Variable | Bedeutung |
| --- | --- |
| `BASE_URL` | Öffentliche URL der App, z. B. `https://looptalk.example.com` |
| `SESSION_SECRET` | Mindestens 32 zufällige Zeichen, z. B. `openssl rand -hex 32` |
| `POSTGRES_PASSWORD` | Passwort der Datenbank (`POSTGRES_USER`, `POSTGRES_DB` optional) |
| `DATABASE_URL` | Nur setzen, wenn PostgreSQL extern läuft |
| `DEX_ISSUER` | Issuer-URL von Dex, z. B. `https://dex.example.com/dex` |
| `DEX_INTERNAL_URL` | Optional: interne Adresse von Dex, falls der Server Dex nicht unter `DEX_ISSUER` erreicht |
| `OIDC_CLIENT_ID` | Client-ID in Dex, Standard `looptalk` |
| `OIDC_CLIENT_SECRET` | Client-Secret in Dex |
| `LOOPTALK_VERSION` | Nur Compose: Version des Images, Standard `latest` |
| `MIGRATE_ON_START` | `false`, wenn die Migration nicht beim Start laufen soll (Standard `true`) |

Geheimnisse gehören in die `.env` auf dem Server oder in einen Secret-Store, nie
ins Repository oder ins Image.

### Dex-Client

In der Dex-Konfiguration einen Client für LoopTalk eintragen:

```yaml
staticClients:
  - id: looptalk
    name: LoopTalk
    secret: <OIDC_CLIENT_SECRET>
    redirectURIs:
      - https://looptalk.example.com/auth/callback
```

LoopTalk fragt die Scopes `openid profile email` an und legt Benutzer beim ersten
Login an. Gruppen werden nicht ausgewertet: Jeder, der sich bei Dex anmelden kann,
erhält Zugang. Abmelden beendet nur die LoopTalk-Session, nicht die Dex-Session.

Soll Dex mit LoopTalk zusammen laufen, die Konfiguration unter `docker/dex.yaml`
ablegen und mit `--profile dex` starten.

### Reverse Proxy

Die Live-Updates nutzen Server-Sent Events unter `/api/boards/<id>/events`. Der
Proxy darf diese Antworten nicht puffern und muss lange offene Verbindungen
zulassen. Die App sendet alle 15 Sekunden einen Heartbeat und setzt
`X-Accel-Buffering: no`. Beispiel für nginx:

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_buffering off;
    proxy_read_timeout 1h;
}
```

`X-Forwarded-Proto` ist nötig, damit das Session-Cookie als `Secure` gesetzt wird.
Live-Updates und Anwesenheit laufen im Prozess; betreibe daher genau eine Instanz
der App.

## Release

```bash
./release.sh            # fragt nach patch, minor oder major
./release.sh minor      # oder direkt: patch, minor, major, X.Y.Z
```

Das Skript läuft nur auf einem sauberen `main`, der dem Stand von `origin/main`
entspricht. Es führt die Tests und die Ende-zu-Ende-Tests in Docker aus
(`--skip-tests` überspringt sie), setzt die Version in allen Paketen, committet
„Release vX.Y.Z“, legt den Tag `vX.Y.Z` an und pusht nach Rückfrage.

GitHub Actions ([ci.yml](.github/workflows/ci.yml)) testet jeden Push auf `main` und
jeden Pull Request. Bei einem Tag `vX.Y.Z` baut der Workflow nach grünen Tests das
Image, veröffentlicht es als `X.Y.Z`, `X.Y` und `latest` und legt ein GitHub-Release
mit automatisch erzeugten Notizen an. Ist ein Test rot, entsteht kein Image; dann
den Fehler beheben und eine neue Patch-Version releasen.

Nach der allerersten Veröffentlichung das Paket `looptalk` unter
GitHub → Packages einmalig auf „Public“ stellen, damit es ohne Login abrufbar ist.

## Projektstruktur

```text
apps/server     Express-Backend: Domänenlogik, Datenbank, Auth, API, Live-Updates
apps/web        React-Frontend mit shadcn/ui
packages/shared gemeinsame API-Typen und zod-Schemas
e2e             Playwright-Tests
release.sh      Release vorbereiten (Version, Tag, Push)
.github         GitHub Actions: Tests, Image, Release
docker          Dex-Konfigurationen für Entwicklung und Tests
openspec        Anforderungen, Design und Aufgaben (OpenSpec)
```

## Anforderungen und Design

Anforderungen, Design und Umsetzungsschritte liegen als
[OpenSpec](https://github.com/Fission-AI/OpenSpec)-Änderung unter
`openspec/changes/add-looptalk-mvp/`.
