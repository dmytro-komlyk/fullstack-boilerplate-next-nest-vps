ARG NODE_VERSION=20

FROM node:${NODE_VERSION}-alpine as base

ARG PACKAGE_NAME=admin
# ARG PNPM_VERSION=8.9.0
ARG SERVICE_PATH=apps/admin

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# RUN --mount=type=cache,id=pnpm-store,target=/root/.pnpm-store \
#     npm i --global --no-update-notifier --no-fund pnpm@${PNPM_VERSION}

FROM base AS dependencies
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY ${SERVICE_PATH}/package.json ./${SERVICE_PATH}/package.json
COPY apps/server/package.json ./apps/server/package.json
# --mount=type=cache,id=pnpm-store,target=/root/.pnpm-store \
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --filter ${PACKAGE_NAME}
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --filter server
FROM base AS builder
COPY . /app
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/${SERVICE_PATH}/node_modules ./${SERVICE_PATH}/node_modules
COPY --from=dependencies /app/apps/server/node_modules ./apps/server/node_modules
COPY ${SERVICE_PATH}/.env.example ./${SERVICE_PATH}/.env

ENV NEXT_TELEMETRY_DISABLED 1

RUN pnpm build:${PACKAGE_NAME}
RUN pnpm deploy --filter=${PACKAGE_NAME} --prod /app/${PACKAGE_NAME}

FROM base as runner
COPY --from=builder /app/${PACKAGE_NAME} /app/${PACKAGE_NAME}
WORKDIR /app/${PACKAGE_NAME}

# # Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/${PACKAGE_NAME}/.next/standalone/${SERVICE_PATH} ./
COPY --from=builder --chown=nextjs:nodejs /app/${PACKAGE_NAME}/.next/static ./.next/static

USER nextjs

# ARG PORT=8080
# ENV PORT=${PORT}
ENV NODE_ENV=production
EXPOSE 3002
ENV HOSTNAME 0.0.0.0
ENV PORT 3002

CMD ["node", "server.js"]