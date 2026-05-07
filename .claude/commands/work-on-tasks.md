# Work on Todoist Tasks

You are a Todoist task execution agent. Follow this workflow precisely:

## 1. Fetch Tasks

Get the token first: `bash scripts/todoist-token.sh`

Use the Todoist REST API to fetch tasks:

```bash
curl -s -G "https://api.todoist.com/api/v1/tasks" \
  --data-urlencode "filter=today | p1 | @claude" \
  -H "Authorization: Bearer {TOKEN}"
```

If `$ARGUMENTS` is provided — it is a specific task ID. Fetch that task directly:

```bash
curl -s "https://api.todoist.com/api/v1/tasks/{taskId}" \
  -H "Authorization: Bearer {TOKEN}"
```

Print a numbered list of found tasks in this format:

```text
#ID | P{priority} | {task title}
```

If no tasks are found — report it and stop.

If there is exactly one P1 task — auto-select it without asking.

Otherwise — ask the user which task to work on.

## 2. Read Task Details

For the selected task, extract both fields:

- `content` — task title (used for branch name and implementation goal)
- `description` — detailed implementation spec written by the user

**The `description` is the primary source of truth for implementation.** Read it carefully — it defines scope, affected files, and edge cases. If description is empty, infer the implementation from the title.

## 3. Dry Run (required before any file changes)

Before modifying any files:

- List which **packages/apps** will be affected
- Describe the implementation plan based on the task `description` (schema → service → router → frontend)
- Wait for user approval before proceeding

## 4. Create a Branch

```bash
git checkout -b feature/todoist-{taskId}-{kebab-slug-of-task-title}
```

Slug rules: lowercase, Latin characters and hyphens only, max 40 characters.

Examples:

- `feature/todoist-123456789-add-user-avatar-upload`
- `fix/todoist-987654321-fix-auth-token-refresh`

If the task title starts with "fix" or "bug" — use `fix/` prefix instead of `feature/`.

## 5. Implement the Task

Execute the task strictly following CLAUDE.md rules:

- TypeScript strict mode, no `any`
- Arrow functions for services and routers
- Zod schemas for all inputs and outputs
- `ctx.logger.log(...)` for backend logging
- Tailwind + HeroUI for frontend
- Translations via `@package/i18n`

## 6. Final Report

After implementation, print a clear summary:

```text
✅ Task #{taskId} implemented

📁 Changed files:
- path/to/file1.ts
- path/to/file2.tsx

🌿 Branch: feature/todoist-{taskId}-{slug}

👉 Next steps:
1. Open VS Code Source Control
2. Copilot will generate a commit message — review and confirm
3. Push the branch: git push -u origin HEAD
4. After push — the git hook will automatically:
   - Close task #{taskId} in Todoist
   - Create a GitHub PR with task description as PR body
```
