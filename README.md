<div align="center">

# 💠 Omni-tRPC-Stack

### The Ultimate Fullstack Monorepo Engine

**Next.js 16 • Nest.js • Expo • tRPC • Prisma**

[![CI/CD Build](https://github.com/dmytro-komlyk/omni-trpc-stack/actions/workflows/ssh-build.yml/badge.svg)](https://github.com/dmytro-komlyk/omni-trpc-stack/actions/workflows/ssh-build.yml)
[![CI/CD Deploy](https://github.com/dmytro-komlyk/omni-trpc-stack/actions/workflows/ssh-deploy.yml/badge.svg)](https://github.com/dmytro-komlyk/omni-trpc-stack/actions/workflows/ssh-deploy.yml)

[Explore Documentation](#-getting-started) • [Report Bug](https://github.com/dmytro-komlyk/omni-trpc-stack/issues)

</div>

---

## 🌟 Overview

**Omni-tRPC-Stack** is a high-performance, production-ready Monorepo architecture. It eliminates the friction between your Backend and multiple Frontends by providing a unified, **100% Type-Safe** communication layer.

### Why Omni-Stack?

- **🧩 Single Source of Truth:** Forget about duplicating validation logic. Use shared Zod schemas to validate data across Web, Mobile, and Server simultaneously. Change once, update everywhere.
- **🛡️ E2E Type-Safety (Zero-runtime errors):** Experience the magic of tRPC. Catch API breaking changes at compile time before they ever reach production. If your backend changes, your frontend won't build until it's fixed.
- **📱 Native Mobile Integration:** Not just a web-wrapper. A fully-fledged Expo (React Native) application is baked into the monorepo, sharing logic and state with your web apps out of the box — including deep linking on both iOS and Android.
- **🚢 DevOps-as-a-Service:** Industrial-grade deployment. From Docker Orchestration to automated GitHub Actions CI/CD for your own VPS. It's not just a boilerplate; it's a complete production pipeline.
- **🔐 Advanced Security Included:** Full 2FA (TOTP) with backup codes, account lockout protection, role-based access control (RBAC), and secure session management are pre-configured across web and mobile.

---

## 🛠 Tech Stack

### 🏗 Infrastructure & Monorepo

- **Monorepo:** [PNPM Workspaces](https://pnpm.io/workspaces) + [Turborepo](https://turbo.build/)
- **API Layer:** [tRPC](https://trpc.io/) (End-to-End Type-Safety)
- **Database:** PostgreSQL + [Prisma ORM](https://www.prisma.io/)
- **DevOps:** Docker, Nginx Proxy Manager, GitHub Actions

### 💻 Frontend & Mobile

- **Web Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Mobile:** [Expo](https://expo.dev/) (React Native) + Expo Router
- **UI Toolkit:** [HeroUI](https://heroui.com/) (ex. NextUI) + TailwindCSS
- **State:** Zustand + TanStack Query
- **i18n:** react-i18next (Mobile) + next-intl (Web) with shared locale support

### ⚙️ Backend

- **Core:** [Nest.js](https://nestjs.com/) (Modular Architecture)
- **Auth:** [NextAuth.js](https://next-auth.js.org/) (Web) + JWT (Mobile)
- **OAuth Providers:** Google, Facebook, Apple
- **Validation:** Shared Zod schemas across the entire Monorepo
- **AI:** [Ollama](https://ollama.com/) (self-hosted LLM) via Vercel AI SDK — streaming assistants for admin & website

## 📁 Project Structure

```markdown
.
├── apps
│ ├── admin # Admin Dashboard (Next.js)
│ ├── website # Customer Web App (Next.js)
│ ├── mobile # Cross-platform App (Expo / React Native)
│ ├── server # Backend API (Nest.js)
├── packages
│ ├── api # Shared tRPC router & client logic & shared Zod validation schemas
│ ├── store # Shared state management (Zustand)
│ ├── prisma # Database schema & Prisma Client (Shared ORM)
│ ├── ui # Shared theme provider
│ ├── next-auth # Centralized Auth configurations & providers
│ ├── shared # Common components, hooks, utilities and constants
│ ├── ai # AI assistants & tools (Ollama, Vercel AI SDK)
│ ├── i18n # Shared translations (en/uk)
│ ├── tailwind-config # Base TailwindCSS configurations
│ └── eslint-config # Centralized linting rules
├── docker-compose.local.yml # Local development orchestration
└── docker-compose.prod-ci.yml # Production deploy orchestration
```

## 🔐 Authentication & Security

The stack ships with a complete, production-grade auth system that works across web and mobile.

### Features

| Feature                                  | Web (Next.js) | Mobile (Expo) |
| :--------------------------------------- | :-----------: | :-----------: |
| Email + Password sign-in                 |      ✅       |      ✅       |
| OAuth (Google, Facebook, Apple)          |      ✅       |      ✅       |
| Two-Factor Authentication (TOTP)         |      ✅       |      ✅       |
| 2FA backup codes                         |      ✅       |       —       |
| Account lockout (brute-force protection) |      ✅       |      ✅       |
| Role-based access control (RBAC)         |      ✅       |      ✅       |
| Admin-only domain guard                  |      ✅       |       —       |
| JWT session tokens                       |       —       |      ✅       |
| NextAuth.js sessions                     |      ✅       |       —       |

### 2FA Flow

**Web:** Users can enable 2FA during sign-up or from their profile. After sign-in, if 2FA is active they are redirected to `/auth/two-factor/verify`. If they lose their authenticator they can use a one-time backup code. The setup flow lives at `/auth/two-factor/setup`.

**Mobile:** After a successful credential login, if the account requires 2FA, the user is pushed to the `verify-2fa` screen with a short-lived `mfaToken`. On success, the full JWT session is stored in the native auth store.

### Account Lockout

After repeated failed login attempts the account is automatically locked until `lockedUntil` expires. The schema tracks `failedLoginAttempts`, `lockedUntil`, `passwordChangedAt`, `isOnline`, and `lastActiveAt`.

## 🤖 AI Assistants

The `@package/ai` package provides two built-in AI assistants powered by a self-hosted [Ollama](https://ollama.com/) model. Both stream responses over tRPC WebSocket subscriptions (`useSubscription`) so the UI updates in real time.

### Public assistant (Website)

Embedded as a floating chat widget (`AiAssistantPlugin`) on the website landing page. It answers questions about the project architecture and guides visitors through the stack. Quick-action buttons let users ask about the tech stack, project structure, mobile integration, or DevOps with one click.

**Capabilities**

| Tool                | Description                                                             |
| :------------------ | :---------------------------------------------------------------------- |
| `getWelcomeMessage` | Returns assistant greeting and capability overview                      |
| `getSystemStatus`   | Reports platform health and DB status                                   |
| `getProjectInfo`    | Deep-dives into stack, features, mobile, security, devops, or structure |
| `getPackageDetails` | Lists all monorepo packages and their purpose                           |

The public assistant **cannot** call any admin tools. Requests for ban/unban, user deletion, or statistics return a hard-coded permission error.

### Admin assistant (Admin Dashboard)

Embedded in the protected admin layout so it is available on every admin page. It uses the same streaming widget but exposes a full set of admin tools with a **confirmation step** for destructive actions (ban, unban, delete, unlock).

**Available tools**

| Category | Tools                                                                                                                 |
| :------- | :-------------------------------------------------------------------------------------------------------------------- |
| Users    | `getUserList`, `getAdminList`, `getRecentUsers`, `findUser`, `banUser`, `unbanUser`, `deleteUser`, `exportUsersToCSV` |
| Stats    | `getUserCounts`, `getActiveUsers`, `getGrowthRate`, `getRoleDistribution`, `getRegistrationsByDay`, `getTopUsers`     |
| Security | `getUserSessions`, `unlockUser`, `getSecurityAlerts`                                                                  |
| Invites  | `getInviteList`, `createInvite`, `revokeInvite`                                                                       |
| System   | `getWelcomeMessage`, `getSystemStatus`, `getProjectInfo`                                                              |

Destructive tools (`banUser`, `unbanUser`, `deleteUser`, `unlockUser`) trigger a confirmation dialog before execution. The assistant never invents data — it always calls a tool if one exists.

### Configuration

Set these environment variables on the server:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_BASE_MODEL=llama3
```

The model name can be any model available in your Ollama instance. Swap it out without changing application code.

### Architecture

```
packages/ai/
├── assistants/
│   ├── admin.assistant.ts   # Admin streaming handler (tool filtering by prompt)
│   └── public.assistant.ts  # Public streaming handler (read-only tools)
├── agent/
│   └── index.ts             # Multi-step agent loop (up to 6 steps, confirmation support)
├── tools/
│   ├── users.tools.ts       # User CRUD + CSV export
│   ├── stats.tools.ts       # Analytics and growth metrics
│   ├── security.tools.ts    # Sessions, lockout, security alerts
│   ├── invites.tools.ts     # Invite management
│   └── system.tools.ts      # System health + project knowledge base
└── index.ts                 # handleAssistant() — routes to admin or public handler
```

## 🧠 Claude Code Agent Workflow

This project includes a built-in AI agent workflow powered by **Claude Code** and **Todoist**. Tasks are created and tracked in Todoist, Claude implements the code, GitHub Copilot generates commit messages, and a git hook closes the task and opens a PR automatically after push.

### How it works

```
/create-task "add user avatar upload"
  ↓ Claude analyzes the codebase and creates a structured task in Todoist
/work-on-tasks
  ↓ Claude fetches the task, reads title + description, does a dry run
  ↓ Creates a branch: feature/todoist-{id}-{slug}
  ↓ Implements: schema → service → router → frontend
  ↓ Reports changed files
Copilot generates commit message in VS Code → user commits → git push
  ↓ post-push hook runs automatically:
     ✅ Closes task in Todoist
     🔗 Creates GitHub PR with task description as body
     💬 Adds PR link as comment to the Todoist task
```

### Setup

1. **Get your Todoist API token** from [todoist.com/app/settings/integrations/developer](https://app.todoist.com/app/settings/integrations/developer)

2. **Add to your shell profile** (`~/.zshrc` or `~/.bashrc`):

   ```bash
   export TODOIST_API_TOKEN=your_token_here
   ```

3. **Configure git hooks** (one-time):

   ```bash
   git config core.hooksPath .githooks
   chmod +x .githooks/post-push
   ```

4. **Install GitHub CLI** and authenticate:

   ```bash
   brew install gh && gh auth login
   ```

### Commands

| Command | Description |
| :------ | :---------- |
| `/create-task "idea"` | Analyzes codebase, composes a structured task and creates it in Todoist |
| `/work-on-tasks` | Fetches today's P1 `@claude` tasks and implements the top one |
| `/work-on-tasks {taskId}` | Jumps directly to a specific task by ID |

### Todoist task format

For Claude to pick up a task automatically, it must have:
- **Priority:** P1
- **Due date:** Today
- **Label:** `@claude`

Use `/create-task` to create correctly formatted tasks directly from Claude Code without opening Todoist.

---

## 📱 Mobile Deep Linking

The Nest.js server hosts the required verification files for Universal Links (iOS) and App Links (Android) under `apps/server/static/.well-known/`:

| File                         | Platform | Purpose                                           |
| :--------------------------- | :------- | :------------------------------------------------ |
| `apple-app-site-association` | iOS      | Handles Universal Links (e.g. email verification) |
| `assetlinks.json`            | Android  | Handles App Links                                 |

Before publishing, replace `ABC123DE45.com.omni.app` in the AASA file and `SHA256_FINGERPRINT_HERE_EAS_BUILD_ONLY` in assetlinks.json with your real values from the Apple Developer portal and EAS build.

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

- Node.js **v22** (use `.nvmrc` — `nvm use`)
- PNPM (v9+)
- Docker Desktop

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/dmytro-komlyk/fullstack-boilerplate-next-nest-vps.git
   cd fullstack-boilerplate-next-nest-vps
   ```

   or use the repository button [Use this template](https://github.com/new?template_name=fullstack-boilerplate-next-nest-vps&template_owner=dmytro-komlyk)

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Setup environment variables**

   Copy example env files for all apps and **fill in the required fields** (e.g., Auth secrets, Database credentials):

   ```bash
   pnpm run setup:local:env
   ```

4. **Spin up development environment**

   ```bash
   pnpm dev
   ```

## 📱 Mobile Development (Expo)

### Building for Production

1. **To build the project for production:**

   ```bash
   pnpm build:mobile
   ```

2. **To start the production build:**

   ```bash
   pnpm start:mobile
   ```

## 🐳 Docker Orchestration

💻 Local Development
Run the entire stack (Database + Redis + Services) locally without installing dependencies on your host machine.

1. **Set up environment variables**

   Copy example env files for all apps and **fill in the required fields** (e.g., Auth secrets, Database credentials):

   ```bash
   pnpm run setup:local:env
   ```

2. **Build and run Docker containers**

   ```bash
   docker compose -f docker-compose.local.yml up -d --build
   ```

## 🚢 Deployment & CI/CD

### CI/CD Pipeline

This project uses GitHub Actions for continuous integration and continuous deployment. The configuration files are located in the .github/workflows directory.

1. **Set up your secrets and variables in a GitHub repository**

   Go to your repository Settings > Secrets and variables > Actions and fill in the following:

   #### 🔐 Repository Secrets

   _Sensitive values (masked in logs). Add these in the **Secrets** tab._

   | Secret Name           | Description                    | Example                          |
   | :-------------------- | :----------------------------- | :------------------------------- |
   | `SSH_PASSWORD`        | Password for your VPS user     | `your_secure_password`           |
   | `EXPO_TOKEN`          | Access token for Expo EAS      | `expo_token_abc123...`           |
   | `DOCKER_HUB_USERNAME` | Your Docker Hub username       | `dmytro_komlyk`                  |
   | `DOCKER_HUB_TOKEN`    | Docker Hub token or GitHub PAT | `ghp_your_personal_access_token` |

   #### 📊 Repository Variables

   _Configuration values. Add these in the **Variables** tab._

   | Variable Name         | Description                   | Example                 |
   | :-------------------- | :---------------------------- | :---------------------- |
   | `SSH_HOST`            | IP address of your VPS        | `123.456.78.90`         |
   | `SSH_USERNAME`        | SSH login user                | `root` or `ubuntu`      |
   | `SSH_PORT`            | SSH port (default is 22)      | `22`                    |
   | `SSH_FOLDER`          | Target directory on VPS       | `/home/root/my-project` |
   | `PROD_NAME`           | Project identifier for Docker | `my-boilerplate`        |
   | `DOCKER_HUB_USERNAME` | Your Docker Hub/GHCR username | `dmytro-komlyk`         |
   | `WEBSITE_DOMAIN`      | Main website domain           | `example.com`           |
   | `ADMIN_DOMAIN`        | Admin dashboard domain        | `admin.example.com`     |
   | `SERVER_DOMAIN`       | API server domain             | `api.example.com`       |

2. 🏷️ **Set up Pull Request Labels**

   This project uses a **Smart Build System**. To save CI/CD minutes and speed up deployment, images are only built when specific labels are added to a Pull Request.
   1. Go to your repository **Pull Requests** > **Labels**.
   2. Click **New label** and create these three (names must match exactly):
      - `backend` — triggers Nest.js server build.
      - `website` — triggers Next.js client app build.
      - `admin` — triggers Next.js admin dashboard build.

   #### How to use

   When you create a Pull Request, simply attach the relevant labels. For example, if you only changed the API, add the `backend` label. GitHub Actions will skip building the frontend apps, saving you time.

   > 💡 **Tip:** You can attach multiple labels if your changes affect several applications.

### 🚢 VPS Deployment Guide

1. **Initial Server Preparation**

   Connect to your VPS via SSH and install the necessary engine:

   ```bash
   sudo apt update
   sudo apt install -y docker.io docker-compose
   sudo systemctl enable --now docker
   ```

2. **Project Infrastructure Setup**

   Navigate to your target directory (defined in your SSH_FOLDER variable) and create the following structure.

   > 💡 Note: You only need to manually create the environment files and configuration. Docker images will be pulled automatically by the CI/CD pipeline.

   ```bash
   mkdir -p apps/website apps/admin apps/server nginx
   ```

   ```markdown
   ${SSH_FOLDER}
   ├── .env # Global production variables (DB credentials, etc.)
   ├── apps
   │ ├── website/.env.production # Next.js Client environment
   │ ├── admin/.env.production # Next.js Admin environment
   │ └── server/.env.production # Nest.js API environment
   ├── nginx/ # (Optional) Nginx Proxy Manager data
   └── docker-compose.prod-ci.yml # Copied from the repository
   ```

3. **First Manual Start (Bootstrap)**
   Before the first automated deploy, log in to Docker Hub and start the initial stack:

   ```bash
   # 1. Login to Docker (Use your DOCKER_HUB_TOKEN)
   echo "YOUR_DOCKER_HUB_TOKEN" | docker login -u YOUR_DOCKER_HUB_USERNAME --password-stdin

   # 2. Start the project
   docker compose -f docker-compose.prod-ci.yml -p <PROD_NAME> up -d
   ```

## 📝 Commit Guidelines

We enforce Conventional Commits using Husky and Commitlint:

- feat: A new feature
- fix: A bug fix
- docs: Documentation only changes
- style: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- refactor: A code change that neither fixes a bug nor adds a feature
- perf: A code change that improves performance
- test: Adding missing tests or correcting existing tests
- build: Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)
- ci: Changes to CI configuration files and scripts (example scopes: Travis, Circle, BrowserStack, SauceLabs)

## ⭐ If you find this boilerplate useful, please give it a star
