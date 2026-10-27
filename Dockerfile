# syntax=docker/dockerfile:1

# --- Abhängigkeiten (alle Workspaces, inkl. Dev-Abhängigkeiten) -------------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
COPY e2e/package.json e2e/
RUN npm ci

# --- Entwicklung: Quellcode kommt per Bind-Mount, Hot Reload ----------------
FROM deps AS dev
COPY . .
CMD ["npm", "run", "dev", "-w", "@looptalk/server"]

# --- Build: Web und Server bauen --------------------------------------------
FROM deps AS build
COPY . .
RUN npm run build

# --- Nur Produktionsabhängigkeiten des Servers -------------------------------
FROM node:22-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
COPY e2e/package.json e2e/
RUN npm ci --omit=dev -w @looptalk/server

# --- Betrieb: schlankes Image, Nicht-root-Benutzer ---------------------------
FROM node:22-alpine AS runtime
ENV NODE_ENV=production \
    PORT=3000 \
    STATIC_DIR=/app/web
WORKDIR /app/apps/server
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY apps/server/package.json ./
COPY --from=build /app/apps/server/dist ./dist
COPY --from=build /app/apps/server/drizzle ./drizzle
COPY --from=build /app/apps/web/dist /app/web
USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/healthz >/dev/null || exit 1
CMD ["node", "--enable-source-maps", "dist/main.js"]

# --- Ende-zu-Ende-Tests mit Playwright (Browser im Image enthalten) --------
FROM mcr.microsoft.com/playwright:v1.64.1-noble AS e2e
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
COPY e2e/package.json e2e/
RUN npm ci -w @looptalk/e2e
COPY tsconfig.base.json ./
COPY e2e ./e2e
WORKDIR /app/e2e
CMD ["npx", "playwright", "test"]
