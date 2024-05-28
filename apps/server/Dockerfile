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
ARG APP_NAME=server

WORKDIR /app
COPY . .
RUN turbo prune --scope=${APP_NAME} --docker

# Build the project
FROM base AS builder
ARG APP_NAME=server

WORKDIR /app

# Copy lockfile and package.json's of isolated subworkspace
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/tsconfig.json ./tsconfig.json

# First install the dependencies (as they change less often)
RUN --mount=type=cache,id=pnpm,target=~/.pnpm-store pnpm install --frozen-lockfile

# Copy source code of isolated subworkspace
COPY --from=pruner /app/out/full/ .

COPY .gitignore .gitignore
RUN pnpm db:generate
RUN turbo build --filter=${APP_NAME}

#
COPY apps/${APP_NAME}/migrate-and-start.sh ./apps/${APP_NAME}/migrate-and-start.sh
RUN chmod +x /app/apps/${APP_NAME}/migrate-and-start.sh

RUN --mount=type=cache,id=pnpm,target=~/.pnpm-store pnpm prune --prod --no-optional
RUN rm -rf ./**/*/src

# Final image
FROM alpine AS runner
ARG APP_NAME=server

USER node

WORKDIR /app
COPY --from=builder --chown=node:node /app .

WORKDIR /app/apps/${APP_NAME}

ARG PORT=3000
ENV NODE_ENV=production
ENV PORT=${PORT}
ENV HOSTNAME 0.0.0.0
EXPOSE ${PORT}

CMD ["./migrate-and-start.sh"]

FROM base as prisma-runner
ARG APP_NAME=server
COPY --chown=node:node --from=runner /app/package.json /app/package.json
COPY --chown=node:node --from=runner /app/apps/${APP_NAME}/package.json /app/apps/${APP_NAME}/package.json
WORKDIR /app/apps/${APP_NAME}

USER node

ARG PORT=5555
ENV PORT=${PORT}
ENV HOSTNAME 0.0.0.0
EXPOSE ${PORT}

CMD ["pnpm", "studio"]