# syntax=docker/dockerfile:1

ARG NODE_VERSION=22-alpine
FROM node:${NODE_VERSION} AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@10.34.9 --activate
WORKDIR /repo

# Dependencias: solo manifiestos, para aprovechar la caché de capas
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/backend/package.json apps/backend/
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter @prestaya/backend...

# Build: compila shared, genera el cliente Prisma y compila el backend
FROM deps AS build
COPY packages/shared packages/shared
COPY apps/backend apps/backend
RUN pnpm --filter @prestaya/shared build \
 && pnpm --filter @prestaya/backend exec prisma generate \
 && pnpm --filter @prestaya/backend build

# Solo dependencias de producción del backend
FROM build AS prod-deps
RUN pnpm --filter @prestaya/backend deploy --prod /out

# Runtime mínimo y no root
FROM node:${NODE_VERSION} AS runtime
ENV NODE_ENV=production \
    TZ=America/Bogota
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=prod-deps --chown=app:app /out ./
COPY --from=build --chown=app:app /repo/apps/backend/dist ./dist
COPY --from=build --chown=app:app /repo/apps/backend/prisma ./prisma
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/v1/health || exit 1
CMD ["node", "dist/main.js"]
