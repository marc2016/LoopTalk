## Why

LoopTalk lässt sich heute nur betreiben, indem man das Repository auf den Server holt
und dort mit `docker compose -f compose.prod.yaml up --build` selbst baut. Es gibt
keine Versionen, kein veröffentlichtes Image und keinen nachvollziehbaren Weg vom
getesteten Stand zum laufenden Server. Ein fertiges, versioniertes Image macht den
Betrieb zu einem `docker pull` und zeigt jederzeit, welche Version läuft.

## What Changes

- **Ein Image, das sich selbst migriert**: Das bestehende `runtime`-Image wartet beim
  Start auf die Datenbank, führt die Migrationen aus und startet erst dann. Damit
  reicht ein einzelnes `docker run` mit `DATABASE_URL` neben einem vorhandenen
  PostgreSQL. Über `MIGRATE_ON_START=false` lässt sich das abschalten; `migrate.js`
  bleibt im Image für Init-Jobs.
- **Versionen nach SemVer**: Alle `package.json` im Repository tragen eine
  gemeinsame Version. `/healthz` liefert sie mit aus, das Image trägt sie als
  OCI-Label.
- **Release-Skript** `release.sh` nach dem Muster aus FlashAgenda: fragt patch,
  minor oder major ab (oder nimmt eine Version entgegen), prüft den Git-Stand, führt
  die Tests in Docker aus, setzt die Version, committet, taggt `vX.Y.Z` und pusht
  nach Rückfrage.
- **GitHub Actions**: Ein Workflow testet bei jedem Push auf `main`, bei Pull
  Requests und bei Tags. Nur bei einem Tag `v*` und nur nach grünen Tests baut er
  das Image für `linux/amd64`, veröffentlicht es als
  `ghcr.io/marc2016/looptalk:X.Y.Z`, `:X.Y` und `:latest` und legt ein
  GitHub-Release an.
- **Betrieb ohne Quellcode**: `compose.prod.yaml` lädt das veröffentlichte Image
  (Version über `LOOPTALK_VERSION`, Standard `latest`); wie in FlashAgenda steht
  daneben `build:`, sodass `--build` weiterhin aus dem Quellcode baut. Der Dienst
  `migrate` entfällt dort und in den E2E-Tests.
- **Geändertes Verhalten (Betrieb):** `docker compose -f compose.prod.yaml up -d`
  ohne `--build` lädt künftig das Image aus GHCR, statt lokal zu bauen.

Getroffene Entscheidungen aus der Diskussion: Variante „ein App-Image mit
Auto-Migration, PostgreSQL separat“; GHCR; SemVer mit interaktivem Skript; nur
`linux/amd64`; Images entstehen nur zu Tags, nicht bei Push auf `main`; ein Image
statt zwei wie in FlashAgenda, weil der Server die Oberfläche nur mit Login
ausliefert (`dex-auth`).

Annahmen, die noch nicht ausdrücklich bestätigt wurden: die erste Version ist
`1.0.0` (Ausgangswert `0.0.0`, erstes Release mit „major“); das GitHub-Release
bekommt automatisch erzeugte Notizen; `LOOPTALK_VERSION` als Name der Variable.

## Capabilities

### New Capabilities

- `deployment`: Produktions-Image, Migration beim Start, sichtbare Version,
  Release-Skript, Veröffentlichung in GHCR und Betrieb per Compose aus dem Image.

### Modified Capabilities

_Keine._ `/healthz` liefert zusätzlich die Version, bleibt aber ohne Anmeldung und
ohne Inhalte aus der Datenbank; die Anforderung in `dex-auth` gilt unverändert.

## Impact

- **Server**: `apps/server/src/main.ts` (Warten auf DB, Migration vor `listen`),
  `config.ts` (`MIGRATE_ON_START`), `http/app.ts` (`/healthz` mit Version), Tests
  in `apps/server/test`.
- **Pakete**: `version`-Feld in allen `package.json`, `package-lock.json`.
- **Docker/Compose**: `Dockerfile` (OCI-Labels), `compose.prod.yaml` (Image statt
  Build, ohne `migrate`), `compose.test.yaml` (ohne `migrate`, damit E2E die
  Auto-Migration prüft). `compose.yaml` für die Entwicklung bleibt, wie es ist.
- **Neu**: `release.sh`, `.github/workflows/ci.yml`.
- **Doku**: README-Abschnitte „Betrieb“ und neu „Release“.
- **Extern**: GitHub Container Registry `ghcr.io/marc2016/looptalk`; das Paket muss
  nach der ersten Veröffentlichung einmalig auf „public“ gestellt werden.
