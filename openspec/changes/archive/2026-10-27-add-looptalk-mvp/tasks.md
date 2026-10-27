## 1. Projekt-Setup

- [x] 1.1 Monorepo mit npm Workspaces (`apps/server`, `apps/web`, `packages/shared`), TypeScript, ESLint, Vitest
- [x] 1.2 Dockerfile (Targets `dev`, `build`, `runtime`) und `compose.yaml` für die Entwicklung mit Hot Reload
- [x] 1.3 Backend-Grundgerüst: Express-Server mit öffentlichem `/healthz`
- [x] 1.4 Frontend-Grundgerüst: Vite + React + Tailwind, shadcn/ui initialisieren, Dev-Proxy auf das Backend
- [x] 1.5 Helles shadcn/ui-Theme festlegen (Farben, Akzentfarbe, kein Dark Mode)
- [x] 1.6 Konfiguration über Umgebungsvariablen inkl. `DATABASE_URL` und `.env.example`
- [x] 1.7 Offene Fragen aus `design.md` klären und Specs ggf. anpassen

## 2. Domänenlogik

- [x] 2.1 Typen für Benutzer, Board, Teilnehmer, Karte, Termin, Rotationstopf, Audit-Eintrag
- [x] 2.2 Termin-Status `geplant` → `läuft` → `beendet` mit `startMeeting` und `endMeeting`
- [x] 2.3 `endMeeting`: Karten weiterschieben und archivieren
- [x] 2.4 Rollenwechsel: Protokollant = vorheriger Moderator
- [x] 2.5 `setRoles`: manuelle Änderung von Moderator und Protokollant inkl. Anpassung des Rotationstopfs
- [x] 2.6 Faire Rotation beim Beenden, inkl. Fall „nur ein aktiver Teilnehmer“ mit injiziertem Zufall, Topf neu füllen
- [x] 2.7 Unit-Tests für alle Szenarien aus `meeting-cycle` und Randfälle

## 3. Persistenz

- [x] 3.1 PostgreSQL-Container in `compose.yaml` (Volume, Healthcheck)
- [x] 3.2 Drizzle-Schema und Migrationen mit drizzle-kit (Boards, Mitglieder, Constraints, partieller Unique-Index pro Board)
- [x] 3.3 Board-Slug-Erzeugung (128 Bit Zufall, Base64url)
- [x] 3.4 Repository-Funktionen für Boards, Mitglieder, Karten, Namen an Karten, Termine – jeweils auf ein Board beschränkt
- [x] 3.5 Starten, Beenden und Rollenänderung je als Transaktion mit `SELECT … FOR UPDATE`, Status- und Versionsprüfung
- [x] 3.6 Löschen von Karten als Soft Delete; alle Abfragen blenden gelöschte Karten aus
- [x] 3.7 `compose.test.yaml` mit `db-test` und `test`-Dienst; Integrationstests gegen echte PostgreSQL, inkl. Isolation zwischen Boards

## 4. Audit-Log

- [x] 4.1 Tabelle `audit_events`, append-only per Trigger (kein `UPDATE`/`DELETE`/`TRUNCATE`)
- [x] 4.2 `recordAudit(tx, entry)` und Aufruf aus allen schreibenden Repository-Funktionen in derselben Transaktion
- [x] 4.3 Abfragen: Log pro Board (Cursor-Paginierung, Filter Akteur/Aktion), Verlauf pro Karte
- [x] 4.4 Tests: jede schreibende Aktion erzeugt genau einen Eintrag, fehlgeschlagene keinen

## 5. Dex-Login

- [x] 5.1 Dex-Container in `compose.yaml` mit Testnutzern
- [x] 5.2 OIDC-Login mit openid-client (PKCE, state, nonce)
- [x] 5.3 Session-Handling mit PostgreSQL-Store (`connect-pg-simple`) und Logout
- [x] 5.4 Globale Auth-Middleware vor API, SSE und statischen Dateien (401 bzw. Umleitung mit `returnTo`)
- [x] 5.5 Automatische Benutzeranlage beim Login
- [x] 5.6 Tests: kein Pfad außer `/auth/*` und `/healthz` ohne Session erreichbar; Board-Link führt nach Login zurück aufs Board

## 6. API

- [x] 6.1 Gemeinsame zod-Schemas für Request/Response in `packages/shared`
- [x] 6.2 Board-Endpunkte: erstellen, meine Boards, abrufen (mit Beitritt beim ersten Aufruf), umbenennen
- [x] 6.3 Karten-, Namen- und Teilnehmer-Endpunkte unter `/api/boards/:slug`
- [x] 6.4 Endpunkte Termin starten, beenden und Rollen ändern (409 bei falschem Status oder Version, 400 bei ungültigen Rollen)
- [x] 6.5 Historie- und Audit-Endpunkte
- [x] 6.6 API-Tests (Supertest gegen PostgreSQL), inkl. unbekannter Slug → 404, Karte eines fremden Boards → 404, gelöschte Karte → 404, Spaltenänderung per `PATCH` abgelehnt

## 7. Live-Updates

- [x] 7.1 SSE-Hub mit Kanälen pro Board und Heartbeat
- [x] 7.2 Events nach jedem Commit an das betroffene Board senden
- [x] 7.3 Anwesenheit: Verbindungen pro Benutzer und Board zählen, `presence`-Events mit Karenzzeit
- [x] 7.4 Tests: mehrere Tabs zählen einmal, Verlassen wird erkannt, keine Anwesenheit über Boards hinweg

## 8. Oberfläche

- [x] 8.1 App-Gerüst: React Router, TanStack Query, API-Client, Login-Weiterleitung bei jeder 401-Antwort
- [x] 8.2 Startseite: Meine Boards, „Board erstellen“-Dialog
- [x] 8.3 Board mit drei Spalten und Karten (shadcn `Card`), „Link kopieren“, Umbenennen
- [x] 8.4 Dialog zum Anlegen, Bearbeiten und Löschen (shadcn `Dialog` + `Form`, zod-Validierung, Löschen mit `AlertDialog`) mit Verlauf der Karte
- [x] 8.5 Namen an Karten: Anzeige als `Badge`s, Hinzufügen mit Vorschlägen aus Teilnehmern (`Command`/`Popover`), Entfernen
- [x] 8.6 Termin-Leiste: Status, Warnung bei weniger als zwei aktiven Teilnehmern, „Termin starten“ / „Termin beenden“ (mit Bestätigung), Moderation und Protokoll als `Badge`s, Hinweis „<Moderator> protokolliert beim nächsten Termin“, Rollen per `Select` jederzeit änderbar, nach dem Beenden Hinweis auf den neuen Moderator
- [x] 8.7 Historie-Ansicht (`Table`)
- [x] 8.8 Audit-Log-Ansicht (`Table`, Filter nach Akteur und Aktion, „Mehr laden“)
- [x] 8.9 Teilnehmerliste mit aktiv/inaktiv
- [x] 8.10 Anwesenheitsleiste: wer ist gerade auf dem Board (`Avatar`s mit Tooltip)
- [x] 8.11 SSE-Anbindung pro Board mit automatischem Reconnect, invalidiert Board-Query

## 9. Betrieb

- [x] 9.1 `runtime`-Stage: schlankes Image, Nicht-root-Benutzer, `HEALTHCHECK`; Server liefert das gebaute Web aus
- [x] 9.2 `compose.prod.yaml` mit App, PostgreSQL und optional Dex
- [x] 9.3 Migrationen als eigener `migrate`-Job vor dem App-Start
- [x] 9.4 README mit Setup, allen Docker-Befehlen, Dex-Client-Konfiguration, Reverse-Proxy-Hinweisen
- [x] 9.5 Ende-zu-Ende-Test mit Playwright als `e2e`-Dienst in `compose.test.yaml`: Login, Board erstellen, zweiter Nutzer öffnet Link und erscheint als anwesend, Karte anlegen, zweiter Nutzer bearbeitet sie und fügt einen Namen hinzu, weitere Karte löschen, Termin starten, Moderator manuell ändern, Termin beenden, Audit-Einträge sichtbar
