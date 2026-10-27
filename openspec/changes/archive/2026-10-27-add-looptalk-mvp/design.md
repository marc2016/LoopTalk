# Design: LoopTalk MVP

## Context

Mehrere kleine Teams, jedes mit eigenem Board und einem Austauschtermin in
regelmäßigen Abständen, wenige gleichzeitige Nutzer pro Board. Login soll über die vorhandene Dex-Instanz laufen. Fokus auf Einfachheit
und nachvollziehbarer, getesteter Domänenlogik.

## Goals / Non-Goals

**Goals**
- Karten wandern zuverlässig und genau einmal pro beendetem Termin.
- Faire, nachvollziehbare Rollenverteilung.
- Login ausschließlich über Dex.
- Live-Ansicht für alle Teilnehmer während des Termins.
- Mehrere Boards, geteilt per Link, ohne Einladungs- oder Rechteverwaltung.
- Lückenloses Audit-Log: wer hat wann was geändert.

**Non-Goals**
- Videokonferenz oder Chat (läuft über bestehende Tools).
- Protokoll in der App: Es wird vorerst außerhalb der App geführt (ggf. später
  ein Link pro Termin). Die App legt nur fest, wer protokolliert.
- Berechtigungen, Rollenrechte, Admins, Gruppenprüfung (vorerst; Audit-Log statt
  Verbote).
- Link widerrufen oder Board löschen (später).
- Terminplanung / Kalenderintegration.

## Architektur

```
React SPA (shadcn/ui) ──HTTP/JSON──▶ Express (TypeScript) ──▶ PostgreSQL
     ▲                          │
     └── SSE /api/boards/:id/events ─┘
                                │
                            Dex (OIDC)
```

Monorepo mit npm Workspaces:

- `apps/server`: Node/Express-Backend (TypeScript)
- `apps/web`: React-Frontend (Vite, TypeScript, Tailwind CSS, shadcn/ui)

Im Betrieb liefert Express das gebaute Frontend als statische Dateien aus (eine
Origin, keine CORS-Konfiguration, Session-Cookie bleibt same-site).

**Zugriffsschutz**: Eine globale Auth-Middleware sitzt vor allen Routen und vor
der Auslieferung der statischen Dateien. Öffentlich sind nur `/auth/*` und
`/healthz`. Ohne Session antworten `/api/*` mit 401, alle anderen Pfade leiten auf
`/auth/login?returnTo=<pfad>` um (`returnTo` nur relativ, gegen Open Redirect).
Das Frontend leitet bei jeder 401-Antwort ebenfalls zum Login um. Session-Cookie:
`HttpOnly`, `Secure`, `SameSite=Lax`. In der
Entwicklung leitet der Vite-Dev-Server `/api` und `/auth` an das Backend weiter.

Backend (`apps/server/src/`):

- **Domänenmodul** (`domain/`): reine Funktionen, z. B.
  `startMeeting(state, now)`, `endMeeting(state, rng, now)` und
  `setRoles(state, { moderatorId, protocolId })`, jeweils `{ state, events }`.
  `setRoles` passt den Rotationstopf an (neuer Moderator raus, ersetzter
  Moderator wieder rein, falls er in der Runde noch nicht moderiert hat). Zufall per injiziertem `rng`,
  damit Tests deterministisch sind.
- **Persistenz** (`db/`): PostgreSQL über Drizzle ORM (`drizzle-orm` + `pg`),
  Schema in TypeScript, Migrationen mit `drizzle-kit`. Start und Ende eines Termins je in einer
  Transaktion; die Zeile des aktuellen Termins wird mit `SELECT … FOR UPDATE`
  gesperrt, zusätzlich Versionsprüfung.
- **HTTP** (`http/`): Express-Routen, Auth-Middleware, Board-Auflösung aus der
  URL (unbekannt → 404, beim ersten Zugriff Teilnehmer anlegen).
- **Audit** (`audit/`): `recordAudit(tx, entry)` wird von jeder schreibenden
  Repository-Funktion in derselben Transaktion aufgerufen. Kein eigener Endpunkt
  zum Schreiben.
- **Auth** (`auth/`): `openid-client` v6, Discovery gegen `DEX_ISSUER`.
- **Realtime** (`realtime/`): SSE-Hub mit Kanälen pro Board, sendet nach jeder
  Änderung ein Event an die Clients dieses Boards; Clients laden dann das Board
  neu (einfach und robust).
- **Anwesenheit** (`realtime/presence`): abgeleitet aus den offenen
  SSE-Verbindungen, pro Board eine Map `userId → Anzahl Verbindungen`. Erste
  Verbindung eines Benutzers → Event `presence` an das Board; letzte Verbindung
  geschlossen → nach 10 s Karenz (gegen Flackern bei Reloads) `presence`-Event.
  Abgebrochene Verbindungen erkennt der Heartbeat (alle 15 s). Die
  Anwesenheitsliste wird direkt im Event mitgeschickt, nicht in der Datenbank
  gespeichert und nicht im Audit-Log protokolliert.
Frontend (`apps/web/src/`):

- React mit React Router, Datenabruf über TanStack Query; ein SSE-Event
  invalidiert die Board-Query.
- UI-Bausteine aus shadcn/ui: `Card` für Themenkarten, `Dialog` + `Form`
  (react-hook-form, zod) zum Anlegen/Bearbeiten, `Badge` für Rollen, `AlertDialog`
  zur Bestätigung von „Termin beenden“ und „Thema löschen“, `Table` für die Historie, `Sonner`
  für Hinweise.
- Routen: `/` (Meine Boards + „Board erstellen“), `/b/:boardId` (Board),
  `/b/:boardId/history`, `/b/:boardId/audit`, `/b/:boardId/participants`.
- Ansichten: Board mit drei Spalten; Termin-Leiste mit Status (geplant / läuft
  seit …), Button „Termin starten“ bzw. „Termin beenden“ (für alle, Beenden mit
  Bestätigung), Rollen „Moderation“ und „Protokoll“ als `Badge`s, per Klick
  änderbar (`Select` mit aktiven Teilnehmern), mit Hinweis
  „<Moderator> protokolliert beim nächsten Termin“; nach dem Beenden ein Hinweis
  (`Sonner`) mit dem neu gezogenen Moderator; „Link kopieren“, Namen auf der Karte als `Badge`s,
Anwesenheitsleiste mit `Avatar`s (Initialen) und Tooltip mit Namen,
  im Karten-Dialog Namensfeld mit Vorschlägen (shadcn `Command`/`Popover`), Historie, Audit-Log (`Table` mit
  Filtern, Verlauf pro Karte im Karten-Dialog), Teilnehmerliste mit
  aktiv/inaktiv.
- **Helles Design**: nur ein helles Theme, kein Dark Mode und kein Umschalten
  nach Systemeinstellung. shadcn/ui-Theme mit hellem Hintergrund, neutralen
  Grautönen und einer Akzentfarbe für Aktionen und Rollen; die `.dark`-Variablen
  werden nicht angelegt. Spalten heben sich durch leicht getönte Flächen ab,
  Karten sind weiß mit dezentem Rahmen und Schatten. Kontraste mindestens
  WCAG AA.
- Gemeinsame API-Typen (zod-Schemas) in `packages/shared`, von Server und Web
  genutzt.

## Datenmodell

PostgreSQL-Typen: interne `id`s als `bigint generated always as identity`,
Zeitstempel als `timestamptz`, `column` mit `CHECK (column BETWEEN 1 AND 3)`.
Die öffentliche Board-Kennung `slug` ist ein zufälliger, URL-sicherer String
(22 Zeichen Base64url aus `crypto.randomBytes(16)`, also 128 Bit) und nie
fortlaufend.

| Tabelle | Felder |
|---|---|
| users | id, oidc_sub (unique), name, email, created_at |
| boards | id, slug (unique), name, created_by, created_at |
| board_members | board_id, user_id, active, joined_at — PK (board_id, user_id) |
| cards | id, board_id, title, description, column (1–3), created_by, created_at, deleted_at, archived_at |
| card_people | id, card_id, name, user_id (optional, wenn aus Vorschlag gewählt), added_by, added_at — unique (card_id, lower(name)) |
| meetings | id, board_id, number, status (`planned`/`running`/`ended`), started_at, ended_at, started_by, ended_by, moderator_id, protocol_id, version |
| meeting_cards | meeting_id, card_id, column_at_meeting, people (jsonb-Snapshot der Namen) |
| rotation_pool | board_id, user_id |
| audit_events | id, board_id, actor_id, at, action, target_type, target_id, data (jsonb: before/after) |
| session | sid, sess (jsonb), expire (für `connect-pg-simple`) |

Pro Board ist der „aktuelle Termin“ der Eintrag mit Status `planned` oder
`running`; ein partieller Unique-Index auf `(board_id) WHERE status <> 'ended'`
stellt sicher, dass es genau einen gibt. `protocol_id` ist nullable (erster
Termin), `moderator_id` nicht; `CHECK (moderator_id <> protocol_id)`. Ein `CHECK` erzwingt passende
Zeitstempel (`running` ⇒ `started_at`, `ended` ⇒ `started_at` und `ended_at`).
Der nächste Moderator wird nicht vorab gespeichert, sondern erst beim Beenden
gezogen.

Gelöschte Karten werden per `deleted_at` ausgeblendet (Soft Delete), damit
Audit-Einträge und Termin-Historie gültige Verweise behalten. Alle Abfragen für
Board und API filtern `deleted_at IS NULL`. Beim Erstellen eines Boards wird der erste Termin mit dem
Ersteller als Moderator angelegt.

`audit_events` ist append-only: Trigger lehnen `UPDATE`, `DELETE` und `TRUNCATE`
ab. Das greift unabhängig von der Datenbankrolle der App (auch wenn sie
Tabellenbesitzer ist, wo reine Rechtevergabe nicht schützt). Index auf `(board_id, at desc)` und
`(target_type, target_id)`. `action` z. B. `board.created`, `board.renamed`,
`member.joined`, `member.deactivated`, `member.activated`, `card.created`,
`card.updated`, `card.deleted`, `card.person_added`, `card.person_removed`,
`meeting.started`, `meeting.roles_changed`, `meeting.ended`.

## Ablauf eines Termins

```
geplant ──[Termin starten]──▶ läuft ──[Termin beenden]──▶ beendet
                                                           │
                         nächster Termin (geplant) ◀───────┘
```

**Starten**
1. Termin per `FOR UPDATE` sperren; Status muss `planned` sein und `version`
   stimmen, sonst 409.
2. `status = running`, `started_at`, `started_by` setzen, `version + 1`.
3. Audit-Eintrag `meeting.started`, Commit, SSE-Event.

**Rollen ändern** (jederzeit, Status `planned` oder `running`)
1. Termin per `FOR UPDATE` sperren; `version` muss stimmen, sonst 409.
2. Neue Rollen prüfen: aktive Teilnehmer, nicht dieselbe Person, Moderator gesetzt.
3. Rotationstopf anpassen, Rollen setzen, `version + 1`.
4. Audit-Eintrag `meeting.roles_changed`, Commit, SSE-Event.

**Beenden**
1. Termin per `FOR UPDATE` sperren; Status muss `running` sein und `version`
   stimmen, sonst 409.
2. Snapshot der Karten samt Namen in `meeting_cards` schreiben.
3. Neuer Protokollant = aktuell eingetragener Moderator.
4. Topf ohne neuen Protokollanten leer? → mit allen aktiven außer ihm füllen.
   Bleibt er leer (nur ein aktiver Teilnehmer), bleibt der Moderator derselbe
   und das Protokoll leer.
5. Neuen Moderator zufällig aus dem Topf ziehen und entfernen.
6. Spalte 3 archivieren, Spalte 2 → 3, Spalte 1 → 2.
7. `status = ended`, `ended_at`, `ended_by` setzen; nächsten Termin `planned`
   mit neuen Rollen anlegen.
8. Audit-Eintrag `meeting.ended` (verschobene/archivierte Karten, neue Rollen).
9. Commit, danach SSE-Event an das Board senden.

## API

| Methode | Pfad | Zweck |
|---|---|---|
| GET | /healthz | Health-Check, öffentlich, ohne Daten |
| GET | /auth/login, /auth/callback, /auth/logout | Dex-Login, öffentlich |
| GET | /api/me | aktueller Benutzer |
| GET / POST | /api/boards | meine Boards / Board erstellen |
| GET / PATCH | /api/boards/:slug | Board (Spalten, Karten, Rollen, Version, Warnung zu wenige Teilnehmer); beitreten beim ersten Aufruf / umbenennen |
| POST | /api/boards/:slug/cards | Karte anlegen (Spalte 1) |
| PATCH / DELETE | /api/boards/:slug/cards/:id | bearbeiten / löschen |
| POST | /api/boards/:slug/cards/:id/people | Namen hinzufügen (Body: name, optional userId) |
| DELETE | /api/boards/:slug/cards/:id/people/:personId | Namen entfernen |
| GET | /api/boards/:slug/cards/:id/audit | Verlauf einer Karte |
| POST | /api/boards/:slug/meetings/current/start | Termin starten (Body: version) |
| POST | /api/boards/:slug/meetings/current/end | Termin beenden (Body: version) |
| PATCH | /api/boards/:slug/meetings/current/roles | Moderator/Protokollant ändern (Body: moderatorId, protocolId, version) |
| GET | /api/boards/:slug/meetings | Historie |
| GET | /api/boards/:slug/participants | Teilnehmerliste |
| PATCH | /api/boards/:slug/participants/:userId | aktiv/inaktiv |
| GET | /api/boards/:slug/audit | Audit-Log (Cursor-Paginierung, Filter `actor`, `action`) |
| GET | /api/boards/:slug/events | SSE für dieses Board |

Alle `/api/boards/:slug/…`-Routen prüfen nur: angemeldet und Board existiert.
Karten-IDs werden immer zusammen mit dem Board geprüft, damit keine Karte über ein
fremdes Board erreichbar ist.

## Dex-Konfiguration

```yaml
staticClients:
  - id: looptalk
    name: LoopTalk
    secret: <aus Secret-Store>
    redirectURIs:
      - https://looptalk.example.com/auth/callback
```

Umgebungsvariablen der App: `DEX_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`,
`BASE_URL`, `SESSION_SECRET`, `DATABASE_URL`.

Scopes: `openid profile email`.

## Docker

Alles läuft in Containern; lokal wird nur Docker mit Compose benötigt.

| Datei | Zweck |
|---|---|
| `Dockerfile` | Multi-Stage: `deps` → `dev` (Hot Reload) → `build` (Web + Server bauen) → `runtime` (schlankes `node:22-alpine`, nur Produktionsabhängigkeiten, läuft als Nicht-root-Benutzer, `HEALTHCHECK` auf `/healthz`) |
| `compose.yaml` | Entwicklung: `server` (Express mit `tsx watch`), `web` (Vite-Dev-Server, Proxy auf `server`), `migrate` (einmalig vor dem Server), beide mit Target `dev` und Quellcode per Bind-Mount; `db` (`postgres:17-alpine` mit Volume und Healthcheck, lokal auf Port 55432), `dex` (mit `staticPasswords` und Testnutzern) |
| `compose.test.yaml` | Tests: `db-test` ohne Volume, `test` führt Lint, Typen, Unit-, Integrations- und API-Tests aus; `e2e` (offizielles Playwright-Image) gegen `looptalk` (Target `runtime`), Dex und eigene DB. Der App-Dienst heißt bewusst nicht `app`, weil Chromium für `.app` per HSTS-Preload HTTPS erzwingt. |
| `compose.prod.yaml` | Betrieb: `app` (Target `runtime`), `migrate` (einmaliger Job vor dem App-Start, `depends_on: service_completed_successfully`), `db`; Dex optional, falls nicht extern vorhanden |

Befehle (im README):
- `docker compose up` – Entwicklung unter `http://localhost:5173`
- `docker compose -f compose.test.yaml run --rm test` – alle Tests
- `docker compose -f compose.test.yaml run --rm --build e2e` – Ende-zu-Ende-Tests
- `docker compose -f compose.prod.yaml up -d` – Betrieb

Konfiguration über `.env` (Vorlage `.env.example`), Geheimnisse im Betrieb über
Compose-Secrets oder Umgebung, nie im Image.

## Risiken / Trade-offs

- **PostgreSQL**: zusätzlicher Dienst im Betrieb, dafür mehrere App-Instanzen,
  saubere Sperren und Backups mit Standardwerkzeugen (`pg_dump`).
- **Session-Store**: Sessions in PostgreSQL (`connect-pg-simple`), überstehen
  Neustarts ohne zusätzlichen Redis.
- **SSE bei mehreren Instanzen**: Der SSE-Hub ist prozesslokal. Für mehrere
  Instanzen später `LISTEN/NOTIFY` in PostgreSQL nutzen; im MVP eine Instanz.
- **Tests gegen echte Datenbank**: Repository- und API-Tests laufen gegen den
  PostgreSQL-Container `db-test`, nicht gegen einen Mock. Jede Testdatei nutzt ein
  eigenes Schema bzw. eine Transaktion mit Rollback.
- **Anwesenheit bei mehreren Instanzen**: wie der SSE-Hub prozesslokal; im MVP
  eine Instanz.
- **Zugriff per Link**: Wer den Link hat (und sich bei Dex anmelden kann), darf
  alles. Weitergeleitete Links lassen sich im MVP nicht widerrufen. Gegenmittel:
  nicht erratbare Kennung, Login-Pflicht, Audit-Log. Rechte und „Link neu
  erzeugen“ lassen sich später ergänzen, ohne das Datenmodell umzubauen.
- **Audit-Log wächst**: ein Eintrag pro Änderung, bei wenigen Teams
  unproblematisch. Aufbewahrungsfrist ggf. später.
- **Dex-Logout**: Dex unterstützt kein vollständiges RP-initiated Logout; Abmelden
  beendet nur die App-Session.
- **SSE hinter Proxy**: Buffering im Reverse Proxy abschalten, Heartbeat senden.

## Geklärte Fragen

- **Moderator fehlt** → Rollen manuell ändern; der ersetzte Moderator kommt
  zurück in den Topf.
- **Erster Termin** → Ersteller moderiert, Protokoll leer, manuell setzbar.
- **Wer ist Teilnehmer** → jeder angemeldete Benutzer, der den Board-Link öffnet.
- **Weniger als zwei aktive Teilnehmer** → nicht sperren, sondern live eine
  Warnung bei allen anzeigen. Ohne anderen Kandidaten bleibt der Moderator beim
  Beenden derselbe, das Protokoll leer.
- **Karten aus einem laufenden Termin** → rücken beim Beenden wie alle anderen
  weiter.
- **Manuelles Verschieben** → nicht erlaubt; `column` ist über die API nicht
  änderbar (das Schema für `PATCH` enthält das Feld nicht).
