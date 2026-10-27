# Proposal: LoopTalk MVP

## Why

Wir treffen uns regelmäßig zu einem Austausch. Themen sollen sichtbar gesammelt
werden, eine begrenzte Zeit präsent bleiben und dann von selbst verschwinden, statt
sich endlos anzusammeln. Moderation und Protokoll sollen fair verteilt werden, ohne
dass jemand das jedes Mal manuell organisieren muss.

## What Changes

- Beliebig viele Boards; jedes Board ist per Link erreichbar, wer den Link hat und
  angemeldet ist, kann mitmachen.
- Jedes Board hat drei Spalten. Neue Themenkarten landen in Spalte 1.
- Termine werden per Button gestartet und beendet. Erst beim Beenden wird der neue
  Moderator gezogen, und alle Karten rücken eine Spalte weiter; Karten aus
  Spalte 3 werden archiviert.
- Themen können von jedem bearbeitet, um weitere Namen ergänzt und gelöscht werden.
- Rollen pro Termin: Protokollant ist der vorherige Moderator, der neue Moderator
  wird zufällig mit fairer Rotation gezogen. Das Board zeigt an, dass der
  aktuelle Moderator beim nächsten Termin protokolliert. Moderator und
  Protokollant lassen sich jederzeit manuell ändern.
- Das Protokoll wird außerhalb der App geführt; die App legt nur fest, wer
  protokolliert.
- Login über Dex (OIDC); ohne Login ist nichts erreichbar. Benutzer werden beim
  ersten Login angelegt, Teilnehmer eines Boards beim ersten Öffnen.
- Keine Berechtigungsstufen im MVP: Jeder Teilnehmer darf alles auf seinem Board.
- Audit-Log pro Board: wer hat wann was gemacht.
- Historie vergangener Termine (Datum, Rollen, besprochene Karten).
- Live-Aktualisierung des Boards bei allen verbundenen Teilnehmern, inkl. Anzeige,
  wer gerade auf dem Board ist.
- Alles läuft per Docker: Entwicklung, Tests und Betrieb.

## Capabilities

### New Capabilities

- `boards`: Boards erstellen, Zugriff per Link, Beitritt, Übersicht „Meine Boards“.
- `topic-board`: Themenkarten anlegen, bearbeiten, löschen, Namen ergänzen; drei Spalten.
- `meeting-cycle`: Termin starten und beenden, Karten weiterschieben, Rollenwechsel,
  manuelle Rollenänderung, faire
  Rotation, Historie.
- `dex-auth`: Anmeldung über Dex, Login-Pflicht, Benutzeranlage.
- `live-updates`: Änderungen in Echtzeit an alle Clients eines Boards verteilen;
  Anwesenheit, wer das Board gerade ansieht.
- `audit-log`: unveränderliches Protokoll aller Änderungen pro Board.

### Modified Capabilities

Keine (neues Projekt).

## Impact

- Neues Repository, keine bestehenden Systeme betroffen.
- Benötigt einen Dex-Client (`looptalk`) mit Redirect-URI auf `/auth/callback`.
- Betrieb als Container hinter einem Reverse Proxy mit TLS.
- Benötigt eine PostgreSQL-Datenbank (als Container).
- Lokal wird nur Docker benötigt, kein lokal installiertes Node.js oder PostgreSQL.

## Getroffene Entscheidungen

- **Name**: LoopTalk. Themen laufen einmal durch die Schleife, die Moderation
  rotiert im Kreis. Verworfene Kandidaten: DriftTalk (Verwechslung mit bekanntem
  Chat-Tool), LetsTalk (zu generisch), FlowTalk, ShiftTalk.
- **Drei Spalten** sind der Lebenszyklus eines Themas, keine Kategorien.
- **Moderatorwahl**: faire Rotation statt rein zufällig.
- **Stack**: Node.js / TypeScript.
  - Backend: Node-Server mit Express.
  - Frontend: React (Vite) mit shadcn/ui und Tailwind CSS, helles Design.
  - Datenbank: PostgreSQL (statt SQLite), Zugriff und Migrationen über Drizzle ORM.
- **Dex** dient ausschließlich als OIDC-Login.
- **Docker** für alles: Docker Compose für Entwicklung, Tests und Betrieb.
- **Zugriff per Link** statt Einladungen oder Rollen; Berechtigungen folgen ggf.
  später. Das Audit-Log macht Änderungen bis dahin nachvollziehbar.
