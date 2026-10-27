#!/bin/bash
# Startet die lokale Entwicklungsumgebung (Server, Web, PostgreSQL, Dex) per Docker Compose.
# Strg+C stoppt alles wieder. Datenbank leeren: docker compose down -v

set -euo pipefail
cd "$(dirname "$0")"

echo "🔁 LoopTalk Local Environment 🔁"
echo "================================"

# Colima starten, falls installiert und nicht aktiv
if command -v colima >/dev/null 2>&1; then
  if ! colima status >/dev/null 2>&1; then
    echo "🐳 Starting Colima runtime..."
    colima start
  fi
fi

if ! docker info >/dev/null 2>&1; then
  echo "❌ Docker läuft nicht. Bitte Docker Desktop oder Colima starten."
  exit 1
fi

echo "📦 Starting PostgreSQL, Dex, Server & Web via Docker Compose..."
if ! docker compose up -d --build; then
  echo "❌ Start fehlgeschlagen. Logs: docker compose logs"
  echo "   Häufige Ursache: Docker-Speicher voll (docker system df)."
  exit 1
fi

stop() {
  echo -e "\n🛑 Stopping services..."
  docker compose stop
  echo "✅ Stopped."
  exit 0
}
trap stop INT TERM

echo "⏳ Waiting for the app..."
for _ in $(seq 1 60); do
  if curl -fsS -o /dev/null http://localhost:5173/healthz 2>/dev/null; then
    break
  fi
  sleep 1
done

if ! curl -fsS -o /dev/null http://localhost:5173/healthz 2>/dev/null; then
  echo "❌ App antwortet nicht. Logs: docker compose logs server web"
  exit 1
fi

echo "✅ All services started successfully!"
echo "➡️ App:      http://localhost:5173"
echo "➡️ Dex:      http://localhost:5556/dex"
echo "➡️ Postgres: localhost:55432 (looptalk / looptalk)"
echo "👤 Login:    anna@example.com, ben@example.com, carla@example.com, dora@example.com"
echo "             Passwort jeweils: password"
echo "Press Ctrl+C to stop the servers."
echo

# Logs von Server und Web im Vordergrund, bis Strg+C
docker compose logs -f --tail 20 server web &
wait $!
