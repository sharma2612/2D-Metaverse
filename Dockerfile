# syntax=docker/dockerfile:1

# Values come from the committed deploy.env at the repo root. Vite only exposes
# variables prefixed with VITE_ to the bundle, so that prefix is what decides
# what reaches the browser. Each build stage sources that file with
# `set -a; . ../deploy.env; set +a` to export every line into its environment.
#
# Note on dependency installs: source and node_modules are copied in separate
# steps and `npm ci` runs after the source copy. Copying them together would
# overwrite the Linux node_modules with the host tree, which breaks native
# modules and leaves Windows-created symlinks that rollup cannot resolve.

# ---------- Stage 1: build the Vite frontend ----------
FROM node:22-bookworm-slim AS frontend

WORKDIR /src

COPY package.json ./
COPY deploy.env ./
COPY 2d_metaverse/package.json ./2d_metaverse/
COPY 2d_metaverse/package-lock.json ./2d_metaverse/

# `2d_metaverse/package.json` declares a "2d-metaverse": "file:.." dependency, so
# the root manifest must exist for npm to resolve it.
RUN cd 2d_metaverse && npm ci --no-audit --no-fund

COPY 2d_metaverse/src ./2d_metaverse/src
COPY 2d_metaverse/public ./2d_metaverse/public
COPY 2d_metaverse/index.html ./2d_metaverse/index.html
COPY 2d_metaverse/vite.config.js ./2d_metaverse/vite.config.js

RUN cd 2d_metaverse \
    && set -a \
    && . ../deploy.env \
    && set +a \
    && npm run build


# ---------- Stage 2: build the API dependency tree ----------
FROM node:22-bookworm-slim AS api-deps

WORKDIR /src

COPY package.json ./
COPY deploy.env ./
COPY 2d_metaverse/api/package.json ./2d_metaverse/api/
COPY 2d_metaverse/api/package-lock.json ./2d_metaverse/api/

RUN cd 2d_metaverse/api && npm ci --omit=dev --no-audit --no-fund


# ---------- Stage 3: runtime ----------
FROM node:22-bookworm-slim AS runtime

# Render/Fly set PORT for the public listener. The default keeps a plain
# `docker run -p 5000:5000` working with no flags.
ENV NODE_ENV=production \
    PORT=5000

WORKDIR /app

COPY --from=api-deps --chown=node:node /src/2d_metaverse/api/node_modules ./api/node_modules
COPY --chown=node:node 2d_metaverse/api/ ./api/
COPY --chown=node:node deploy.env ./api/.env
COPY --from=frontend --chown=node:node /src/2d_metaverse/dist ./dist

# api/index.js resolves static assets as path.join(path.resolve(), "../dist"), so
# the process must run from /app/api for that to resolve to /app/dist.
WORKDIR /app/api

USER node

EXPOSE 5000

# Hits the static "/" route rather than an API endpoint, so a transient Mongo
# Atlas outage cannot pull the whole service out of rotation.
HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||5000)+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "index.js"]