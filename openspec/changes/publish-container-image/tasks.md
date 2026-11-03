# Tasks

## 1. Version im Projekt und in `/healthz`

- [x] 1.1 `"version": "0.0.0"` in Root-, `apps/server`-, `apps/web`-, `packages/shared`- und `e2e`-`package.json`, Lockfile mit `npm install --package-lock-only` aktualisieren; verifizieren, dass `npm version 0.0.1 --workspaces --include-workspace-root --no-git-tag-version --dry-run` bzw. ein Probelauf in einem Wegwerf-Checkout alle fünf Dateien und den Lockfile ändert
- [x] 1.2 Server liest die Version aus der `package.json` neben `src/` bzw. `dist/` und gibt sie in `/healthz` als `{"status":"ok","version":"…"}` zurück; API-Test in `api.test.ts` prüft Feld `version` gleich der Version aus `apps/server/package.json`; verifizieren mit `docker compose -f compose.test.yaml run --rm test`

## 2. Migration beim Start

- [x] 2.1 `config.ts`: `MIGRATE_ON_START` als boolesche Option, Standard `true`, ungültige Werte führen zu „Ungültige Konfiguration“; Unit-Test für `true`, `false`, fehlend und ungültig; verifizieren mit dem Server-Testlauf
- [x] 2.2 `waitForDatabase` (Retry `SELECT 1`, 30 × 2 s, Log je Versuch, danach Fehler „Datenbank nicht erreichbar“) als testbare Funktion mit injizierbarem Warten; Unit-Test: Erfolg nach zwei Fehlversuchen, Abbruch nach dem letzten Versuch; verifizieren mit dem Server-Testlauf
- [x] 2.3 `main.ts`: nach `createDb` warten, bei `MIGRATE_ON_START` `runMigrations` ausführen, Fehler loggen und mit Code 1 beenden, erst danach Dex verbinden und `listen`; verifizieren mit 2.4 und 4.2
- [x] 2.4 `compose.test.yaml`: Dienst `migrate` entfernen, `looptalk` wartet auf `db-e2e` (healthy) und `dex`; verifizieren, dass `docker compose -f compose.test.yaml run --rm --build e2e` grün ist (die App migriert die leere Datenbank selbst)
- [x] 2.5 Manuelle Prüfung der Startfälle mit dem `runtime`-Image: App vor Postgres starten (wartet und läuft), Postgres weglassen (Exit-Code ≠ 0 nach ~60 s mit Meldung), `MIGRATE_ON_START=false` gegen leere DB (keine Tabellen) und danach `node dist/migrate.js` aus demselben Image (Tabellen da); Ergebnisse im PR-Text festhalten

## 3. Image und Betrieb

- [x] 3.1 `compose.prod.yaml`: `app` mit `image: ghcr.io/marc2016/looptalk:${LOOPTALK_VERSION:-latest}` plus `build:` (target `runtime`), `depends_on: db: service_healthy`, Dienst `migrate` entfernen; `.env.example` um `LOOPTALK_VERSION` ergänzen; verifizieren mit `docker compose -f compose.prod.yaml config` (mit Beispielwerten) ohne Fehler, `app` ohne `migrate`-Abhängigkeit
- [x] 3.2 Lokale Probe des Betriebs: Image als `ghcr.io/marc2016/looptalk:0.0.0` lokal taggen, in einem leeren Verzeichnis nur mit `compose.prod.yaml` und `.env` (`LOOPTALK_VERSION=0.0.0`, Dex per `--profile dex` aus `docker/dex.dev.yaml`) starten; verifizieren, dass `curl 127.0.0.1:3000/healthz` die Version liefert

## 4. Release-Skript

- [x] 4.1 `release.sh` (bash, `set -euo pipefail`): Vorbedingungen (Branch `main`, sauberer Baum, `git fetch` und gleich mit `origin/main`), Zielversion aus Argument oder Menü patch/minor/major/frei, `v` entfernen, SemVer prüfen, Tag frei; `--skip-tests`; verifizieren, dass das Skript auf einem anderen Branch, mit lokaler Änderung, mit vorhandenem Tag und mit `1.2` als Version jeweils ohne Änderung abbricht
- [x] 4.2 Testschritt im Skript: `compose.test.yaml` `test` und `e2e --build`, Aufräumen mit `down -v` per `trap` auch bei Fehler; verifizieren, dass ein absichtlich roter Test das Skript ohne Versionsänderung beendet und keine Test-Container zurückbleiben
- [x] 4.3 Version setzen (`npm version … --workspaces --include-workspace-root --no-git-tag-version`, `npm install --package-lock-only`), Prüfung, dass nur `package.json`-Dateien und `package-lock.json` geändert sind, gezieltes `git add`, Commit „Release vX.Y.Z“, annotierter Tag, Rückfrage, Push von `main` und Tag, sonst Ausgabe des Push-Befehls; verifizieren mit einem Lauf `./release.sh patch --skip-tests` in einem Wegwerf-Klon mit lokalem Bare-Remote (Commit, Tag und Versionen stimmen, Push landet im Bare-Remote)

## 5. GitHub Actions

- [ ] 5.1 `.github/workflows/ci.yml` mit Triggern `push` (`main`, Tags `v*`) und `pull_request` (`main`), Jobs `test` und `e2e` über `compose.test.yaml`, Upload von `e2e/test-results` und `e2e/playwright-report` bei Fehlschlag; verifizieren mit `actionlint` (lokal per Docker) und einem grünen Lauf auf einem Pull Request
- [ ] 5.2 Job `publish` (`needs: [test, e2e]`, nur bei Tag `v*`, `packages: write`): Buildx, Login GHCR, `metadata-action` (`{{version}}`, `{{major}}.{{minor}}`, `latest`), `build-push-action` mit `target: runtime`, `linux/amd64`, GHA-Cache; Job `release` (`needs: publish`, `contents: write`) mit `gh release create --generate-notes`; verifizieren mit `actionlint` und über 6.2

## 6. Doku und erstes Release

- [x] 6.1 README: „Betrieb“ auf das veröffentlichte Image umstellen (`LOOPTALK_VERSION`, Update, Backup vor Updates mit Migration, Rollback nur per Backup, `MIGRATE_ON_START`, einzelnes `docker run`), neuer Abschnitt „Release“ (`./release.sh`, was die CI macht, GHCR-Paket einmalig öffentlich stellen); verifizieren durch Lesen gegen die Spec `deployment`
- [ ] 6.2 Nach dem Merge: `./release.sh major` → `v1.0.0`, Workflow grün, GHCR-Paket `looptalk` auf „public“ stellen; verifizieren mit `docker pull ghcr.io/marc2016/looptalk:1.0.0` ohne Login, `docker inspect` zeigt `org.opencontainers.image.version=1.0.0`, und `:1.0` und `:latest` haben denselben Digest, GitHub-Release `v1.0.0` existiert
