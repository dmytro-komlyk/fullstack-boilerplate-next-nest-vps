# Create Todoist Task

Create a properly formatted Todoist task directly from Claude Code.

## Steps

### 1. Gather info from the user

If `$ARGUMENTS` is provided — use it as the raw task idea and proceed automatically.

Otherwise ask: **"What should be implemented?"** — one sentence is enough.

### 2. Resolve the Todoist project

Read the token from `.mcp.json`:

```bash
bash scripts/todoist-token.sh
```

Fetch all projects:

```bash
curl -s "https://api.todoist.com/api/v1/projects" \
  -H "Authorization: Bearer {TOKEN}"
```

**Project matching logic (in order):**

1. Get the git repo name: `git remote get-url origin | sed 's|.*/||; s|\.git$||'`
2. Try to find a project whose `name` matches the repo name (case-insensitive)
3. If no match — show the project list and ask the user which one to use:

```text
Multiple Todoist projects found:
1. Omni
2. EazyScrape
3. CryptoBot

Which project should this task be added to?
```

1. Use the selected project's `id` for task creation.

### 3. Analyze the codebase

Based on the task idea, identify:

- Which domain it belongs to (auth, user, notification, ai, etc.)
- Which packages/apps will be affected
- Whether it is a `feat`, `fix`, or `refactor`

### 4. Build the task

Compose:

- **Title** — conventional commit style: `feat: ...` / `fix: ...` / `refactor: ...`, concise, max 80 chars
- **Description** — structured implementation spec:

```text
Scope:
1. [package/app] — what to do
2. [package/app] — what to do
...

Constraints:
- Any gotchas, rules, or edge cases Claude should know
```

### 5. Create the task via Todoist API

```bash
curl -s -X POST "https://api.todoist.com/api/v1/tasks" \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "{title}",
    "description": "{description}",
    "project_id": "{project_id}",
    "priority": 4,
    "labels": ["claude"],
    "due_string": "today"
  }'
```

### 6. Confirm

Print the created task:

```text
✅ Task created in Todoist → {project name}

#ID | P1 | {title}

📋 Description:
{description}

Run /work-on-tasks to start implementing.
```
