# Design

## Context

Das [Dockerfile](../../../Dockerfile) hat bereits ein schlankes Target `runtime`
(node:22-alpine, Nicht-root, Healthcheck, Server-Bundle plus Frontend in
`/app/web`). Migrationen laufen heute als eigener Compose-Dienst `migrate`
(`node dist/migrate.js`), der mit `depends_on: db healthy` auf PostgreSQL wartet.
`main.ts` hat eine Retry-Schleife für Dex, aber keine für die Datenbank.
Alle Tests laufen in Docker über `compose.test.yaml` (`test` mit echtem Postgres,
`e2e` mit Playwright gegen das `runtime`-Image, Dex und Postgres). Kein Paket hat
bisher ein `version`-Feld. Vorbild für Skript und Workflow ist FlashAgenda
(`release.sh`, `docker-publish.yml`). Siehe proposal.md für die Motivation und
specs/deployment/spec.md für die Anforderungen.

## Goals / Non-Goals

**Goals:**

- Ein Startpfad für das Image, der ohne Orchestrierung funktioniert (warten,
  migrieren, starten).
- Ein Workflow, in dem ein Image nur nach grünen Tests veröffentlicht wird.
- Ein Release-Skript, das nichts kaputt macht, wenn es früh abbricht.

**Non-Goals:**

- `linux/arm64`, Images für `main` oder PRs, Signaturen (cosign), SBOM.
- Changelog-Datei im Repository; die Notizen erzeugt GitHub aus den Commits.
- Automatische Updates auf dem Server (Watchtower o. Ä.).
- Änderungen an der Entwicklungsumgebung `compose.yaml`.

## Decisions

### Migration im Serverprozess vor `listen`

`main.ts` ruft nach `createDb` erst `waitForDatabase` (Retry `SELECT 1`, 30 Versuche
im Abstand von 2 s, analog zu `connectDex`) und dann `runMigrations` auf, sofern
`MIGRATE_ON_START` nicht `false` ist. Fehler führen zu `process.exit(1)`; die
Restart-Policy von Compose übernimmt den nächsten Versuch.

- *Alternative Entrypoint-Skript* (`sh -c "node migrate.js && node main.js"`):
  zweimal Verbindungsaufbau, Warten auf die DB müsste trotzdem gebaut werden, und
  Signale landen bei `sh` statt bei Node. Verworfen.
- *Alternative weiterhin separater Dienst*: funktioniert nicht für ein einzelnes
  `docker run`. Bleibt über `MIGRATE_ON_START=false` plus `migrate.js` möglich.
- Gleichzeitige Migrationen mehrerer Instanzen sind kein Thema: Es läuft genau eine
  Instanz (README). Drizzle migriert in einer Transaktion.
- `MIGRATE_ON_START` kommt als `z.stringbool()`-artige Option mit Standard `true` in
  `config.ts`, damit Tippfehler beim Start auffallen.
- In der Entwicklung (`compose.yaml`) läuft der Dienst `migrate` weiter; die
  zusätzliche Migration im Server ist dort ein No-op.

### Eine Version für alle Pakete, Quelle `package.json`

Root, `apps/server`, `apps/web`, `packages/shared` und `e2e` bekommen
`"version": "0.0.0"`. Das Skript setzt sie mit
`npm version <v> --workspaces --include-workspace-root --no-git-tag-version`;
anschließend `npm install --package-lock-only`, damit der Lockfile sicher passt.
Der Server liest die Version zur Laufzeit aus der `package.json` neben `dist/` bzw.
`src/` (`new URL("../package.json", import.meta.url)`); das Runtime-Image kopiert
`apps/server/package.json` schon heute. So zeigt auch die Entwicklung die richtige
Version, ohne Build-Argument.

- *Alternative Build-Argument `APP_VERSION`*: weicht von lokalen Builds ab und
  braucht in Dev einen Fallback. Verworfen.
- *Alternative Version nur im Git-Tag*: dann wüsste das Image ohne CI-Argument
  nichts über sich. Verworfen.

### Ein Workflow mit abhängigen Jobs

`.github/workflows/ci.yml`, Trigger `push` auf `main`, `pull_request` auf `main`,
`push` von Tags `v*`.

```
  test  --+
          +--> publish (nur bei Tag) --> release (gh release create --generate-notes)
  e2e   --+
```

- `test`: `docker compose -f compose.test.yaml run --rm test`.
- `e2e`: `docker compose -f compose.test.yaml run --rm --build e2e`, Upload von
  `e2e/test-results` und `e2e/playwright-report` bei Fehlschlag, danach `down -v`.
- `publish`: `if: startsWith(github.ref, 'refs/tags/v')`, `needs: [test, e2e]`,
  `permissions: packages: write`, `docker/metadata-action` mit
  `type=semver,pattern={{version}}`, `type=semver,pattern={{major}}.{{minor}}` und
  `latest` nur bei Tag, `docker/build-push-action` mit `target: runtime`,
  `platforms: linux/amd64`, Cache `type=gha`. Die Labels aus `metadata-action`
  liefern `org.opencontainers.image.version`, `source` und `revision`.
- `release`: `needs: publish`, `permissions: contents: write`.
- Gleiche Action-Versionen wie in FlashAgenda (`checkout@v4`, `setup-buildx@v3`,
  `login-action@v3`, `metadata-action@v5`, `build-push-action@v6`).
- *Alternative zwei Workflows wie in FlashAgenda* (`ci.yml` und
  `docker-publish.yml` parallel): dort kann ein Image trotz roter Tests erscheinen.
  Verworfen.
- *Alternative im E2E-Job gebautes Image direkt pushen*: spart einen Build, koppelt
  aber Compose-Build und Registry-Push. Der zweite Build kommt aus demselben Commit
  und ist mit dem GHA-Cache schnell. Verworfen zugunsten der Einfachheit.

### Release-Skript nach FlashAgenda, aber defensiver

Ablauf: Vorbedingungen prüfen → Zielversion bestimmen (Argument oder Menü
1/2/3/frei, führendes `v` entfernen, SemVer-Format prüfen, Tag frei) → Tests
(`compose.test.yaml` `test` und `e2e --build`, danach `down -v`, über `trap` auch
bei Abbruch) → Version setzen → `git add` nur der `package.json`-Dateien und des
Lockfiles → Commit „Release vX.Y.Z“ → annotierter Tag → Rückfrage → Push von
`main` und Tag. Bei verneinter Rückfrage gibt es den Push-Befehl aus.

Abweichungen von FlashAgenda: Branch-, Sauberkeits- und Aktualitätsprüfung vorab
(`git fetch` und Vergleich mit `origin/main`), kein `git add .`, keine zweite
Rückfrage zum Commit (Abbruch ist vor dem Push jederzeit möglich, der Commit bleibt
lokal), `--skip-tests`, `set -euo pipefail`.

### `compose.prod.yaml` und `compose.test.yaml`

`compose.prod.yaml`: `app` nutzt `image: ghcr.io/marc2016/looptalk:${LOOPTALK_VERSION:-latest}`
und daneben `build: { target: runtime }` wie in FlashAgenda (ohne `--build` lädt
Compose das Image, mit `--build` baut es aus dem Quellcode),
`depends_on: db: service_healthy`; Dienst `migrate` entfällt.

Ein Image statt zwei (Server + nginx-Frontend wie in FlashAgenda): Der Server
liefert die Oberfläche nur mit Session aus (`dex-auth`). Ein nginx-Frontend bräuchte
`auth_request` oder eine gelockerte Anforderung, einen zweiten Proxy für SSE und
zwei Images im Gleichschritt; der Nutzen (schnellere statische Dateien) ist bei
einer Instanz vernachlässigbar.
`compose.test.yaml`: `migrate` entfällt, `looptalk` wartet direkt auf `db-e2e`
(healthy). Dadurch prüfen die E2E-Tests den neuen Startpfad mit.

## Risks / Trade-offs

- [GHCR-Paket ist nach dem ersten Push privat] → Einmalig in den Paket-Einstellungen
  auf „public“ stellen und mit dem Repository verknüpfen; steht als Task und im
  README.
- [E2E in GitHub ist langsam (Playwright-Image ~3,5 GB, Builds ohne Cache)] → Für
  den Anfang akzeptiert; bei Bedarf später Compose-Build mit GHA-Cache.
- [Rückkehr zu einer Vorversion nach einer neuen Migration] → Drizzle hat keine
  Down-Migrationen. Rollback heißt Backup einspielen; das README sagt das und
  empfiehlt ein Backup vor jedem Update mit Migration.
- [Migration läuft bei jedem Neustart] → Ohne ausstehende Migrationen ein No-op mit
  einer Abfrage; vernachlässigbar.
- [Tag gepusht, CI rot] → Kein Image, kein Release. Fix committen und eine neue
  Patch-Version releasen; der rote Tag bleibt als Historie stehen.
- [`npm version` in Workspaces aktualisiert den Lockfile unvollständig] →
  `npm install --package-lock-only` direkt danach, und das Skript prüft, dass nur
  erwartete Dateien geändert sind.

## Migration Plan

1. Change umsetzen und auf `main` mergen (Version `0.0.0`).
2. `./release.sh major` → `v1.0.0`; Workflow abwarten.
3. GHCR-Paket `looptalk` auf „public“ stellen.
4. Auf dem Server: neue `compose.prod.yaml` holen, Container stoppen,
   `docker compose -f compose.prod.yaml up -d`. Das Volume `db-data` bleibt; die
   Migration im Start ist ein No-op, weil `migrate` vorher schon lief.
5. Rollback: `LOOPTALK_VERSION` auf die Vorversion oder alte `compose.prod.yaml`
   mit `--build`; ohne neue Migration ist die Datenbank unverändert.
