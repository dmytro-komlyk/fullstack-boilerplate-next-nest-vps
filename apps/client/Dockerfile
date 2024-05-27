ARG NODE_VERSION=18

FROM --platform=linux/amd64 node:${NODE_VERSION}-alpine3.17 AS alpine
RUN apk update
RUN apk add --no-cache libc6-compat

FROM alpine as base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN pnpm install turbo --global
RUN pnpm config set store-dir ~/.pnpm-store

# Prune project
FROM base AS pruner
ARG APP_NAME=client

WORKDIR /app
COPY . .
RUN turbo prune --scope=${APP_NAME} --docker

# Build the project
FROM base AS builder
ARG APP_NAME=client

WORKDIR /app

# Copy lockfile and package.json's of isolated subworkspace
COPY .gitignore .gitignore
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/tsconfig.json ./tsconfig.json

# First install the dependencies (as they change less often)
RUN pnpm install

ARG BUILD_MODE=local
ARG APP_DOMAIN
ARG SERVER_DOMAIN

ENV APP_DOMAIN=$APP_DOMAIN
ENV SERVER_DOMAIN=$SERVER_DOMAIN
ENV NEXT_TELEMETRY_DISABLED 1

COPY apps/${APP_NAME}/.env.docker.${BUILD_MODE}.example ./apps/${APP_NAME}/.env.local
# Copy source code of isolated subworkspace
COPY --from=pruner /app/out/full/ .

RUN pnpm db:generate
RUN turbo build --filter=${APP_NAME}

#
COPY apps/${APP_NAME}/start.sh ./apps/${APP_NAME}/start.sh
RUN chmod +x /app/apps/${APP_NAME}/start.sh

# Final image
FROM alpine AS runner
ARG APP_NAME=client

WORKDIR /app
# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=builder /app/apps/${APP_NAME}/next.config.js ./apps/${APP_NAME}/next.config.js
COPY --from=builder /app/apps/${APP_NAME}/package.json ./apps/${APP_NAME}/package.json
 
# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/apps/${APP_NAME}/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/${APP_NAME}/.next/static ./apps/${APP_NAME}/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/${APP_NAME}/public ./apps/${APP_NAME}/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/${APP_NAME}/start.sh ./apps/${APP_NAME}/start.sh
COPY --from=builder --chown=nextjs:nodejs /app/apps/${APP_NAME}/.env.local ./apps/${APP_NAME}/.env.local

WORKDIR /app/apps/${APP_NAME}

ARG DATABASE_URL

ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV=production
ENV DATABASE_URL=${DATABASE_URL}

USER nextjs

ARG PORT=3001
ENV PORT=${PORT}
ENV HOSTNAME 0.0.0.0
EXPOSE ${PORT}

CMD ["./start.sh"]