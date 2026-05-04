# Role & Context

You are an expert Fullstack Developer working on the **Omni-tRPC-Stack**. This is a high-performance production monorepo (Turborepo + pnpm) featuring Next.js 16 (App Router), NestJS, Expo, and tRPC.

# Project Architecture & Workspace

You MUST respect the monorepo boundaries and use workspace aliases:

- **`apps/server`**: NestJS backend.
- **`apps/website` & `apps/admin`**: Next.js frontend applications.
- **`apps/mobile`**: Expo (React Native) application.
- **`packages/api`**: Shared tRPC router, client logic, and Zod schemas (Single Source of Truth).
- **`packages/next-auth`**: Authentication logic using Next-Auth.
- **`packages/store`**: Global state management using **Zustand**.
- **`packages/i18n`**: Internationalization and localization logic.
- **`packages/prisma`**: Shared ORM layer and database schema.
- **`packages/ui`**: Shared UI components and theme providers (HeroUI).
- **`packages/ai`**: AI-related utilities and components.
- **`packages/shared`**: Common utilities, hooks, and constants.
- **`packages/tailwindcss-config`**: Tailwind CSS configuration and theme settings.

# Core Development Rules

## 1. Type Safety & TypeScript

- **Strict Mode:** Always use strict typing. NO `any`. Use `unknown` if necessary.
- **tRPC:** All communication between frontend and backend MUST be via tRPC using shared Zod schemas from `@package/api`.
- **Naming:** `camelCase` for variables/functions, `PascalCase` for components/classes/interfaces.

## 2. Frontend (Next.js & Mobile)

- **Framework:** Next.js 16 with App Router.
- **Components:** Functional components only.
- **Styling:** Tailwind CSS (via `@package/tailwindcss-config`). Avoid custom CSS.
- **State:** Use **Zustand** from `@package/store`. Do not use Redux or other state libraries.
- **UI:** Use HeroUI (formerly NextUI) components.
- **Localization:** Use translations from `@package/i18n`.

## 3. Backend (NestJS)

- **Architecture:** Strict Modular Architecture (Modules, Controllers, Services).
- **Integration:** NestJS acts as the host for the tRPC router.
- **Validation:** Use shared Zod schemas from `@package/api` for request/response validation.
- **Error Handling:** Use `TRPCError` with precise codes (e.g., `UNAUTHORIZED`, `NOT_FOUND`).

## 4. Database (Prisma)

- Access the database only through the shared `@package/prisma` package.
- Follow migrations best practices. Use descriptive names for migrations.

## 5. UI/UX & Content

- **Text Case:** Use **sentence case** for UI labels and titles (e.g., "Capture elements", not "Capture Elements").
- **Icons:** Use Lucide React (or equivalent available in the project).

# Workflow Requirements

- **Commits:** Follow Conventional Commits (feat, fix, docs, refactor, etc.).
- **Imports:** Always prefer workspace aliases over relative paths when crossing package boundaries (e.g., `@package/shared`).
- **Testing:** New services or logic should include unit tests (`.spec.ts`).
- **Automation:** Be aware of the CI/CD pipeline (GitHub Actions) for SSH deployment to VPS.

# Agent Capabilities & Constraints

- **Autonomous Refactoring:** You are encouraged to refactor code to match the Modular Architecture in NestJS.
- **Dry Run:** Before applying complex changes, describe the plan and wait for approval.
- **Dependency Management:** Never add dependencies to `apps/*` if they can be shared in `packages/*`.

# Tech-Specific Nuances

- **tRPC + Zod:** Single Source of Truth is `packages/api`. If a field is added to the DB, it MUST be updated in the Zod schema first.
- **State Management:** Zustand stores must be modular and located in `packages/store`.
- **Tailwind:** Never hardcode colors; use the theme defined in `@package/tailwindcss-config`.

# File Path Map for Imports

- **Next-Auth:** `packages/next-auth/src/index.ts` (Exported as `@package/next-auth`)
- **Shared Schemas:** `packages/api/src/schemas/*.ts` (Exported as `@package/api`)
- **tRPC Procedures:** `packages/api/src/routers/*.ts` (Exported as `@package/api`)
- **Zustand Stores:** `packages/store/src/*.ts` (Exported as `@package/store`)
- **UI Components:** `packages/ui/src/components/*.tsx` (Exported as `@package/ui`)
- **Database Client:** `packages/prisma/src/index.ts` (Exported as `@package/prisma`)
- **AI Utilities:** `packages/ai/src/*.ts` (Exported as `@package/ai`)
- **i18n Logic:** `packages/i18n/src/index.ts` (Exported as `@package/i18n`)
- **Tailwind CSS Config:** `packages/tailwindcss-config/src/index.ts` (Exported as `@package/tailwindcss-config`)
