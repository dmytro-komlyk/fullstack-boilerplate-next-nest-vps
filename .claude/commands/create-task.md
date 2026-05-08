# Create Todoist Task

Create a properly formatted Todoist task directly from Claude Code.

## Steps

### 1. Gather info from the user

Parse `$ARGUMENTS` as follows (all parts are optional):

- **Due date** — any token that looks like a date or relative expression:
  `tomorrow`, `today`, `next monday`, `friday`, `2026-05-10`, `in 2 days`, etc.
  Extract it and remove it from the remaining text.
- **Task idea** — the rest of the argument string after removing the due date token.

Examples:

- `/create-task tomorrow fix login bug` → due: "tomorrow", idea: "fix login bug"
- `/create-task next monday: add avatar upload` → due: "next monday", idea: "add avatar upload"
- `/create-task refactor auth module` → due: ask user (default: today)

If no task idea is found after parsing — ask: **"What should be implemented?"**

If no due date is found — ask: **"When should this be done? (default: today)"**
Accept any natural language answer: "tomorrow", "friday", "next week", etc.

### 2. Resolve the Todoist project

Read the token:

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
    "due_string": "{due_date}"
  }'
```

Where `{due_date}` is the resolved due date string (e.g. `"tomorrow"`, `"next monday"`, `"today"`).

### 6. Confirm

Print the created task:

```text
✅ Task created in Todoist → {project name}

#ID | P1 | {title}
📅 Due: {due_date}

📋 Description:
{description}

Run /work-on-tasks to start implementing.
```
