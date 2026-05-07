# Role & Context

You are an expert Fullstack Developer working on the **Omni-tRPC-Stack** (`omni-stack`). This is a high-performance production monorepo (Turborepo + pnpm) featuring Next.js 16, NestJS with Fastify, Expo, and tRPC.

**Runtime requirements:** Node `>=22 <25`, pnpm `>=10`

# Project Architecture & Workspace

## Apps

| Package        | Description                                                 |
| -------------- | ----------------------------------------------------------- |
| `apps/server`  | NestJS backend with Fastify adapter. Hosts the tRPC router. |
| `apps/admin`   | Next.js 16 (App Router, React 19). Admin panel.             |
| `apps/website` | Next.js 16 (App Router, React 19). Public-facing site.      |
| `apps/mobile`  | Expo 54 / React Native 0.81. Uses nativewind for Tailwind.  |

## Packages

| Alias                         | Path                          | Description                                                                           |
| ----------------------------- | ----------------------------- | ------------------------------------------------------------------------------------- |
| `@package/api`                | `packages/api`                | tRPC client, `TrpcProvider`, `AuthSchema` re-exports. Gateway for frontend ↔ backend. |
| `@package/prisma`             | `packages/prisma`             | PrismaClient singleton + DB types. **Only types exported, NOT enums — see Gotchas.**  |
| `@package/next-auth`          | `packages/next-auth`          | Next-Auth v5 config (JWT strategy, OAuth, 2FA, token refresh).                        |
| `@package/store`              | `packages/store`              | Zustand stores — split by platform (web/native).                                      |
| `@package/i18n`               | `packages/i18n`               | i18n constants, types, helpers. Locales: `en`, `uk`.                                  |
| `@package/ui`                 | `packages/ui`                 | `ThemeProvider`, `theme-server`. HeroUI theming.                                      |
| `@package/shared`             | `packages/shared`             | Common utilities and hooks (minimal, growing).                                        |
| `@package/ai`                 | `packages/ai`                 | AI SDK wrappers: `planner`, `tools`, `agent`. Backed by Ollama (local LLM).           |
| `@package/tailwindcss-config` | `packages/tailwindcss-config` | Shared Tailwind config. Single source of truth for theme/colors.                      |
| `@package/eslint-config`      | `packages/eslint-config`      | ESLint rule sets: `next`, `library`, `nest`, `react-native`, `react-internal`.        |

# Server Domain Structure

All business logic lives in `apps/server/src/domain/`:

```
domain/
├── app.module.ts          ← NestJS root module
├── trpc/
│   ├── trpc.server.ts     ← exports: procedure, protectedProcedure, router, createCallerFactory, mergeRouters
│   ├── trpc.router.ts     ← root appRouter: { health, auth, notification, ai, user }
│   ├── trpc.context.ts    ← Context type definition + createContext()
│   ├── trpc.module.ts
│   ├── trpc-fastify.plugin.ts
│   └── openapi.plugin.ts
├── auth/
│   ├── auth.schema.ts
│   ├── auth.service.ts
│   ├── auth.router.ts
│   ├── jwt.service.ts
│   ├── oauth.service.ts
│   └── two-factor.service.ts
├── users/
│   ├── user.schema.ts
│   ├── user.service.ts
│   └── user.router.ts
├── notification/
│   ├── notification.schema.ts
│   ├── notification.service.ts
│   └── notification.router.ts
├── ai/
│   ├── ai.schema.ts
│   ├── ai.service.ts
│   ├── ai.router.ts
│   └── ai-history.redis.ts
├── prisma/
│   ├── prisma.service.ts
│   └── prisma.module.ts
└── redis/
    └── redis.provider.ts
```

# tRPC Context Shape

Every procedure receives `ctx` with the following shape (from `trpc.context.ts`):

```typescript
type FullServerContext = {
  // Auth
  user: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    nickName: string | null;
    avatarUrl: string | null;
    emailVerified: Date | null;
    isTwoFactorEnabled: boolean;
  } | null; // null for unauthenticated requests
  sessionToken: string | null;

  // Infrastructure
  logger: Logger; // Pino logger (nestjs-pino)
  redis: Redis; // ioredis instance
  domain: {
    host: string | null;
    origin: string | null;
    userAgent: string | null;
    clientId: string | null;
    locale: string; // defaults to 'uk'
  };
};
```

`protectedProcedure` narrows `ctx.user` to non-null. Use it for any authenticated route.

# tRPC Procedures

Import from `domain/trpc/trpc.server.ts`:

```typescript
import { procedure, protectedProcedure, router } from '../trpc/trpc.server';
```

- `procedure` — public, no auth required
- `protectedProcedure` — throws `UNAUTHORIZED` if `ctx.user` is null

# Core Development Rules

## Type Safety & TypeScript

- **Strict mode.** No `any`. Use `unknown` if type is truly unknown.
- **Arrow functions** for services, routers, procedures, and components.
- **Destructure** function arguments (consistent with tRPC/Zod pattern).
- `camelCase` for variables/functions, `PascalCase` for components/classes/interfaces.
- Prefer `type` over `interface` for object shapes; use `interface` only when extension/declaration merging is needed.
- Never use `as` casting to silence TS errors — fix the actual type. Exception: narrowing with `as const`.
- For `Promise.all` with more than 10 items, TypeScript loses tuple inference and variables become implicit `any`. Fix: group into nested `Promise.all` calls keeping each outer array ≤ 10 items.
- When Prisma query returns `groupBy` or `_count` results, annotate the callback parameter inline — do **not** import enums (see Gotchas).

## Frontend (Next.js & Mobile)

- **Next.js 16** App Router, React 19. Functional components only.
- **Styling:** Tailwind CSS via `@package/tailwindcss-config`. Never hardcode colors.
- **State:** Zustand from `@package/store`. Never use Redux or other state libs.
- **UI:** HeroUI (formerly NextUI) components.
- **Icons (Next.js — admin & website):** `react-icons` — import from sub-packages: `react-icons/hi2`, `react-icons/lu`, `react-icons/fi`, `react-icons/md`, etc. Never use `lucide-react` directly.
- **Icons (Expo — mobile):** `@expo/vector-icons`. Never use `react-icons` in mobile code.
- **Text case:** Sentence case for UI labels ("Save changes", not "Save Changes").
- **Localization:** Always use translations from `@package/i18n`. Supported locales: `en`, `uk`.
  - i18n namespaces: `Home`, `Auth`, `Common`, `User`, `Email`, `AI`.

## Backend (NestJS)

- Strict Modular Architecture (Modules, Controllers, Services).
- NestJS uses **Fastify** adapter (not Express).
- Validation: shared Zod schemas from domain `*.schema.ts` files.
- Error handling: `TRPCError` with precise codes (`UNAUTHORIZED`, `NOT_FOUND`, `BAD_REQUEST`, etc.).
- Logging: always `ctx.logger.log(...)` inside procedure implementations.
- Server middleware stack (in `main.ts`): rate-limit (1000/15min), CORS, Helmet, WebSocket, tRPC plugin, Swagger.

## Database

- Access DB only through `@package/prisma` (`import { prisma } from '@package/prisma'`).
- Migrations must have descriptive names.
- `@package/prisma` exports: `prisma`, `connectPrisma`, `disconnectPrisma`.
- `@package/prisma` exports **types** only: `User`, `Session`, `Account`, `Invite`, `Token`, `VerificationToken`, `PrismaClient`.

## Zustand Stores (Platform-Split)

Stores in `packages/store/src/` are split by platform:

| File                     | Usage                               |
| ------------------------ | ----------------------------------- |
| `auth-web.store.ts`      | Web auth state (Next.js)            |
| `auth-native.store.ts`   | Mobile auth state (Expo)            |
| `config-web.store.ts`    | Web app config                      |
| `config-native.store.ts` | Mobile app config                   |
| `secure.store.ts`        | Sensitive data via Expo SecureStore |
| `ui.store.ts`            | Shared UI state                     |

Always import the correct platform variant. Never use `auth-web` in mobile code.

# Workflow: Full-Cycle Feature Development

When creating a new endpoint:

1. **Schema** — define input/output Zod schemas in `apps/server/src/domain/<domain>/<domain>.schema.ts`
2. **Service** — implement business logic in `<domain>.service.ts` using arrow functions
3. **Router** — wire up in `<domain>.router.ts` using the standard template below
4. **Export** — re-export new schemas from `packages/api/src/index.ts` if needed on frontend
5. **Frontend** — call via `trpc.<domain>.<procedure>.useQuery/useMutation()`

## Zod Schema Naming

- Input schemas: end with `Schema` → `createUserSchema`
- Output schemas: start with `output`, end with `Schema` → `outputUserSchema`

## tRPC Router Template

```typescript
import { protectedProcedure, router } from '../trpc/trpc.server';
import { exampleInputSchema, outputExampleSchema } from './example.schema';
import { exampleServiceFn } from './example.service';

export const exampleRouter = router({
  actionName: protectedProcedure
    .meta({
      openapi: {
        enabled: true,
        method: 'POST',
        path: '/example.actionName',
        summary: 'Brief description',
        tags: ['example'],
        protect: true,
      },
    })
    .input(exampleInputSchema)
    .output(outputExampleSchema)
    .mutation(async ({ input, ctx }) => {
      const response = await exampleServiceFn({ data: input, domain: ctx.domain });
      ctx.logger.log({ userId: ctx.user.id, path: 'example.actionName' }, 'Action completed');
      return response;
    }),
});
```

# Auth System

`@package/next-auth` implements the full auth flow:

- **Providers:** Google, Facebook, Apple (OAuth) + Credentials (email/password)
- **Strategy:** JWT (next-auth) + DB session for NestJS API (`x-session-token` header)
- **Mobile:** Bearer JWT via `Authorization: Bearer <token>` header
- **Session maxAge:** 30 days, `updateAge` 24h
- **2FA:** TOTP-based. When `requires2FA: true` in JWT, user is on 2FA step. MFA token expires in 10 min (600s from JWT `iat`).
- **Token refresh:** Access token auto-refreshed 30s before expiry via `auth.refresh.mutate`.

### JWT token error states

| Error                     | Cause                                    |
| ------------------------- | ---------------------------------------- |
| `MfaTokenExpired`         | User idle >10 min on 2FA page → sign out |
| `RefreshTokenExpired`     | Refresh token expired → sign out         |
| `RefreshAccessTokenError` | Server unreachable during refresh        |

When any session error occurs, call `signOut({ callbackUrl: '/auth/sign-in?toast=session_expired' })` — never use `window.location.href` (causes middleware redirect loop).

# Known Gotchas

## Prisma Enums — NOT exported from `@package/prisma`

`@package/prisma` does **not** re-export enums. The following enums exist in the generated client but cannot be imported from `@package/prisma`:

```
UserRole:         USER | MODERATOR | ADMIN | SUPER_ADMIN
UserStatus:       ACTIVE | BANNED | PENDING
VerificationType: EMAIL_VERIFICATION | PASSWORD_RESET | EMAIL_CHANGE | TWO_FACTOR_SETUP | MAGIC_LINK
TokenType:        ACCESS | REFRESH | RESET | MAGIC_LINK
```

**Fix:** Use inline type annotations or string literals instead of importing enums:

```typescript
// ✅ correct
users.map((u: { role: string; _count: { _all: number } }) => ...)

// ❌ will fail
import { UserRole } from '@package/prisma'
import { UserRole } from '@package/prisma/client'
```

## `@package/api` exports

```typescript
export { trpc } from './client'; // tRPC client instance
export { TrpcProvider } from './Provider'; // React provider
export * as AuthSchema from 'server/src/domain/auth/auth.schema'; // Zod schemas
// Also available as subpaths:
// @package/api/server   — remote server client (SSR/server-side calls)
// @package/api/schema   — raw schema exports
// @package/api/provider, @package/api/providerNative
```

## WebSocket — use lazy mode

tRPC WebSocket client must be configured with `lazy: { enabled: true, closeMs: 0 }` in `createWSClient` to prevent eager connection errors on every page load.

# Infrastructure & Deployment

## Local Development

- `docker-compose.local.yml`: postgres (15-alpine), server (NestJS :3000), website (:3001), admin (:3002)
- Database: PostgreSQL via `@prisma/adapter-pg`
- Cache: Redis (Keyv wrapper, 60s TTL) — also used for AI conversation history

## Production (VPS)

- `docker-compose.prod-ci.yml`: same apps + monitoring stack
- **Nginx Proxy Manager** — reverse proxy on 80/443
- **Loki + Promtail** — log aggregation
- **Prometheus + Grafana** — metrics and dashboards

## CI/CD (GitHub Actions)

- `ssh-build.yml` — triggered on PR, builds Docker images based on PR labels (`backend`, `website`, `admin`)
- `ssh-deploy.yml` — triggered on merge to `main`, SSH into VPS, pulls and restarts affected services
- Images: `{DOCKER_USER}/{PROD_NAME}-{service}:latest`

# ESLint Rules to Respect

Rules enforced via `@package/eslint-config` — violations block CI:

| Rule                                 | Scope              | Meaning                                                                |
| ------------------------------------ | ------------------ | ---------------------------------------------------------------------- |
| `simple-import-sort/imports`         | all (except admin) | Imports must be sorted — ESLint autofix handles this on save           |
| `simple-import-sort/exports`         | all (except admin) | Exports must be sorted                                                 |
| `unused-imports/no-unused-imports`   | all                | Remove unused imports immediately                                      |
| `prettier/prettier`                  | all                | Code must pass Prettier formatting                                     |
| `@typescript-eslint/no-explicit-any` | library, nest      | No `any` — use `unknown` or explicit types                             |
| `import-x/no-default-export`         | library, nest      | No default exports in packages (named exports only)                    |
| `no-console`                         | all                | No `console.log` — use `ctx.logger` on backend, `warn`/`error` allowed |

**Note:** `apps/admin` disables `simple-import-sort` rules — imports there are not auto-sorted by ESLint.

**VS Code:** `source.fixAll.eslint` runs on save. Do **not** add `source.organizeImports` — it conflicts with `simple-import-sort`.

# Agent Capabilities & Constraints

- **Dry Run first:** Before complex multi-file changes, describe which packages will be affected and wait for approval.
- **No deps in apps/** if they can go in `packages/*`.
- **Never read** `node_modules`, `.next`, `.turbo`, `dist` folders unless explicitly asked.
- **Autonomous refactoring** to match Modular NestJS Architecture is encouraged.
- **Commits:** Follow Conventional Commits (`feat`, `fix`, `refactor`, `docs`, etc.).
- **Imports:** Prefer workspace aliases (`@package/shared`) over relative cross-package paths.
- **Testing:** New services/logic should include unit tests (`.spec.ts`).

# File Path Map for Imports

| What                   | Source                                               | Alias                         |
| ---------------------- | ---------------------------------------------------- | ----------------------------- |
| tRPC client & provider | `packages/api/src/`                                  | `@package/api`                |
| Zod schemas            | `apps/server/src/domain/<domain>/<domain>.schema.ts` | via `@package/api`            |
| tRPC procedures        | `apps/server/src/domain/<domain>/<domain>.router.ts` | via `@package/api`            |
| Auth config            | `packages/next-auth/src/index.ts`                    | `@package/next-auth`          |
| Zustand stores         | `packages/store/src/*.ts`                            | `@package/store`              |
| DB client              | `packages/prisma/src/index.ts`                       | `@package/prisma`             |
| i18n                   | `packages/i18n/src/index.ts`                         | `@package/i18n`               |
| Tailwind config        | `packages/tailwindcss-config/src/index.ts`           | `@package/tailwindcss-config` |
| AI utilities           | `packages/ai/src/`                                   | `@package/ai`                 |
| Shared utilities       | `packages/shared/src/`                               | `@package/shared`             |

# Task Management & Automation (MCP)

- **Morning Routine:** On startup, use `todoist.get_tasks` to retrieve today's tasks.
- **Priority:** Focus on Priority 1 tasks or tags `@refactor`, `@feature`, `@bug`. Ignore non-coding tasks.
- **Execution:** Dry Run first (state which packages are affected), wait for approval, then modify files.
- **Context:** If a task mentions "auth", check `@package/next-auth` and `@package/api`. If "UI" — check `@package/ui` and `@package/tailwindcss-config`.
- **Environment check:** Confirm `node --version` is `>=22` before starting.
