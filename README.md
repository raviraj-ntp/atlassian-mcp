# Atlassian MCP

A local **Model Context Protocol (MCP) server** that lets AI assistants (Cursor, Claude Desktop, etc.) work with **Jira** and **Bitbucket** through structured tools instead of guessing REST APIs.

This repository is **standalone** — clone or publish this folder by itself. No other MCP projects are required.

**License:** MIT

---

## Table of contents

- [What does this do?](#what-does-this-do)
- [Who is this for?](#who-is-this-for)
- [How it works](#how-it-works)
- [Supported platforms](#supported-platforms)
- [Prerequisites](#prerequisites)
- [Installation (step by step)](#installation-step-by-step)
- [Getting API credentials](#getting-api-credentials)
- [Configuration](#configuration)
- [Connect to Cursor](#connect-to-cursor)
- [Verify it works](#verify-it-works)
- [Using the tools](#using-the-tools)
- [Tool reference](#tool-reference)
- [npm scripts](#npm-scripts)
- [Security](#security)
- [Troubleshooting](#troubleshooting)
- [Project layout](#project-layout)
- [Publishing](#publishing)

---

## What does this do?

Without MCP, an AI has to guess how to call Jira or Bitbucket APIs. With this server, the AI gets **named tools** with clear inputs — for example:

- `jira_get_issue` — fetch issue `PROJ-123`
- `jira_search` — run a JQL query
- `bitbucket_get_pull_request` — read a PR
- `find_prs_for_jira_issue` — link Jira issues to Bitbucket PRs

You run the server **on your machine**. Your credentials never leave your computer. The AI talks to the server; the server talks to your Jira/Bitbucket instance.

**~110 tools** cover issues, PRs, branches, sprints, comments, cross-product workflows, and high-level composite helpers.

---

## Who is this for?

- Developers using **Cursor** or another MCP client who work in Jira and Bitbucket daily
- Teams on **Jira Server/Data Center** or **Atlassian Cloud**
- Teams on **Bitbucket Server/Data Center** or **Bitbucket Cloud**
- Anyone who wants the AI to triage issues, review PRs, or automate Jira↔Bitbucket links safely

---

## How it works

```
┌─────────────┐    stdio     ┌──────────────────┐    HTTPS    ┌─────────────────┐
│ Cursor / AI │ ◄──────────► │  atlassian-mcp   │ ◄─────────► │ Jira + Bitbucket│
│   client    │  (local)     │  (this server)   │  (your net) │   (your org)    │
└─────────────┘              └──────────────────┘             └─────────────────┘
```

1. Cursor starts `node dist/index.js` as a background process.
2. When you ask about a Jira issue or PR, Cursor calls a tool on this server.
3. The server uses your API token to call Jira/Bitbucket and returns JSON.
4. The AI reads the result and answers you.

No cloud hosting. No third-party proxy. Everything runs locally.

---

## Supported platforms

| Product | Deployment | Auth |
|---------|------------|------|
| Jira | Server / Data Center | Personal access token (`JIRA_PAT`) |
| Jira | Cloud | Email + API token (`JIRA_EMAIL` + `JIRA_PAT`) |
| Bitbucket | Server / Data Center | Username + HTTP access token |
| Bitbucket | Cloud | Username + app password + workspace slug |

---

## Prerequisites

| Requirement | Details |
|-------------|---------|
| **Node.js 20+** | Check: `node --version` |
| **npm** | Comes with Node |
| **API tokens** | See [Getting API credentials](#getting-api-credentials) |
| **Network** | Your machine must reach Jira and Bitbucket URLs |

---

## Installation (step by step)

### 1. Clone and build

```bash
git clone https://github.com/YOUR_USER/atlassian-mcp.git
cd atlassian-mcp
npm install
npm run build
```

You should see a `dist/` folder after a successful build. (`dist/` is gitignored — you build it locally.)

### 2. Choose a configuration style

| Style | Best for | Config file? |
|-------|----------|--------------|
| **YAML** | Multiple environments (e.g. corp + cloud) | Yes — `~/.atlassian-mcp.yaml` |
| **Env only** | Single Jira + Bitbucket connection | No |

### 3. Set up credentials

See [Configuration](#configuration) below, then [Connect to Cursor](#connect-to-cursor).

---

## Getting API credentials

### Jira Server / Data Center

1. Log in to Jira in your browser.
2. Go to **Profile → Personal Access Tokens** (or your admin’s token page).
3. Create a token with issue read/write scope as needed.
4. Save it — you will set it as `JIRA_PAT`.

### Jira Cloud

1. Go to [https://id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Create an API token.
3. Set `JIRA_EMAIL` to your Atlassian account email and `JIRA_PAT` to the token.

### Bitbucket Server / Data Center

1. Log in to Bitbucket.
2. **Personal settings → HTTP access tokens** → Create token.
3. Set `BITBUCKET_USERNAME` to your **account slug** (not always your email).
4. Set `BITBUCKET_TOKEN` to the token.

> If you use an email for `BITBUCKET_USERNAME`, this server tries to extract the slug automatically.

### Bitbucket Cloud

1. **Personal settings → App passwords** → Create app password.
2. Set `BITBUCKET_WORKSPACE` to your workspace slug (from the URL: `bitbucket.org/<workspace>/...`).
3. Set `BITBUCKET_USERNAME` and `BITBUCKET_TOKEN` (app password).

---

## Configuration

### Option A — YAML file (multiple connections)

Copy the example and edit URLs:

```bash
cp config.example.yaml ~/.atlassian-mcp.yaml
```

Example `~/.atlassian-mcp.yaml`:

```yaml
default_connection: corp

connections:
  corp:
    jira:
      flavor: server
      url: https://jira.example.com
      token_env: JIRA_PAT
    bitbucket:
      flavor: server
      url: https://bitbucket.example.com
      username_env: BITBUCKET_USERNAME
      token_env: BITBUCKET_TOKEN

  cloud:
    jira:
      flavor: cloud
      url: https://your-org.atlassian.net
      email_env: JIRA_EMAIL
      token_env: JIRA_PAT
    bitbucket:
      flavor: cloud
      workspace: your-workspace
      username_env: BITBUCKET_USERNAME
      token_env: BITBUCKET_TOKEN
```

**Important:** The YAML file stores **URLs and env var names**, not secrets. Put actual tokens in environment variables (Cursor `mcp.json` or your shell).

Export secrets before testing:

```bash
export JIRA_PAT=your-jira-token
export BITBUCKET_USERNAME=your-user
export BITBUCKET_TOKEN=your-bitbucket-token
```

Use a different connection per tool call: `"connection": "cloud"`.

### Option B — Environment variables only (single connection)

No YAML file. Set these in Cursor `mcp.json` (see next section):

| Variable | When required | Example |
|----------|---------------|---------|
| `JIRA_BASE_URL` | Using Jira | `https://jira.example.com` |
| `JIRA_PAT` | Using Jira | your token |
| `JIRA_EMAIL` | Jira Cloud only | `you@company.com` |
| `BITBUCKET_BASE_URL` | Bitbucket Server/DC | `https://bitbucket.example.com` |
| `BITBUCKET_WORKSPACE` | Bitbucket Cloud | `my-team` |
| `BITBUCKET_USERNAME` | Using Bitbucket | `myuser` |
| `BITBUCKET_TOKEN` | Using Bitbucket | your token |
| `ATLASSIAN_MCP_CONFIG` | Optional | path to YAML (default `~/.atlassian-mcp.yaml`) |
| `ATLASSIAN_DEFAULT_CONNECTION` | Optional | default profile name |

You can use **Jira only** or **Bitbucket only** — set the vars for the products you need.

---

## Connect to Cursor

### 1. Open MCP settings

Edit `~/.cursor/mcp.json` (global) or `.cursor/mcp.json` (project).

### 2. Add the server entry

Replace `/absolute/path/to/atlassian-mcp` with your real path:

```json
{
  "mcpServers": {
    "atlassian": {
      "command": "node",
      "args": ["/absolute/path/to/atlassian-mcp/dist/index.js"],
      "env": {
        "ATLASSIAN_MCP_CONFIG": "/Users/you/.atlassian-mcp.yaml",
        "JIRA_PAT": "your-jira-token",
        "BITBUCKET_USERNAME": "your-user",
        "BITBUCKET_TOKEN": "your-bitbucket-token"
      }
    }
  }
}
```

**Env-only example** (no YAML):

```json
{
  "mcpServers": {
    "atlassian": {
      "command": "node",
      "args": ["/absolute/path/to/atlassian-mcp/dist/index.js"],
      "env": {
        "JIRA_BASE_URL": "https://jira.example.com",
        "JIRA_PAT": "your-token",
        "BITBUCKET_BASE_URL": "https://bitbucket.example.com",
        "BITBUCKET_USERNAME": "your-user",
        "BITBUCKET_TOKEN": "your-token"
      }
    }
  }
}
```

### 3. Restart Cursor

Fully quit and reopen Cursor. The `atlassian` server should appear in **Settings → MCP** with tools listed.

### Dev mode (optional)

Skip `npm run build` during development:

```json
"command": "npx",
"args": ["tsx", "/absolute/path/to/atlassian-mcp/src/index.ts"]
```

---

## Verify it works

### Smoke test (terminal)

```bash
export JIRA_PAT=... BITBUCKET_USERNAME=... BITBUCKET_TOKEN=...
npm run test:readonly
```

Expect JSON with `"ok": true` and passing tests.

### In Cursor

Ask the AI:

> Use `jira_who_am_i` to show my Jira user.

> Search Jira for issues assigned to me: `assignee = currentUser()`.

---

## Using the tools

### Common parameters (all tools)

| Parameter | Purpose |
|-----------|---------|
| `connection` | Optional. Name from YAML (`corp`, `cloud`). Uses default if omitted. |
| `dryRun` | On **write** tools: `true` validates without saving. Always test with `dryRun` first. |

### Example prompts in Cursor

| You ask | Tool the AI may use |
|---------|---------------------|
| "What's in PROJ-123?" | `jira_get_issue` or `jira_triage_issue` |
| "My open Jira tickets" | `jira_whats_on_my_plate` |
| "Show PR #42 in repo X" | `bitbucket_get_pull_request` |
| "PRs linked to PROJ-123" | `find_prs_for_jira_issue` |
| "Release notes for sprint 5" | `release_notes` with JQL |

### Example tool inputs

**Search Jira:**

```json
{
  "jql": "project = PROJ AND status = Open ORDER BY updated DESC",
  "maxResults": 10
}
```

**Create issue (safe test):**

```json
{
  "projectKey": "PROJ",
  "issueType": "Task",
  "summary": "Test from MCP",
  "dryRun": true
}
```

**Read a file from Bitbucket:**

```json
{
  "project": "MYPROJ",
  "repository": "my-repo",
  "path": "README.md",
  "at": "main"
}
```

---

## Tool reference

### Jira (~55 tools)

| Area | Tools | What you can do |
|------|-------|-----------------|
| **Issues** | `jira_get_issue`, `jira_search`, `jira_create_issue`, `jira_update_issue`, `jira_delete_issue`, `jira_assign_issue`, `jira_clone_issue`, `jira_move_issue`, `jira_bulk_update` | Full issue lifecycle |
| **Comments** | `jira_get_comments`, `jira_add_comment`, `jira_update_comment`, `jira_delete_comment` | Discussion on issues |
| **Worklogs** | `jira_get_worklogs`, `jira_add_worklog`, `jira_update_worklog`, `jira_delete_worklog` | Time tracking |
| **Attachments** | `jira_get_attachments`, `jira_add_attachment`, `jira_delete_attachment` | Files on issues |
| **Links** | `jira_create_issue_link`, `jira_delete_issue_link`, `jira_get_issue_link_types`, `jira_get_remote_links`, `jira_create_remote_link`, `jira_delete_remote_link` | Issue relationships |
| **Workflow** | `jira_get_transitions`, `jira_transition_issue`, `jira_get_changelog` | Status changes, history |
| **Social** | `jira_watch_issue`, `jira_unwatch_issue`, `jira_get_watchers`, `jira_add_vote`, `jira_remove_vote`, `jira_get_votes` | Watchers and votes |
| **Projects** | `jira_get_projects`, `jira_get_project`, `jira_get_issue_types`, `jira_get_create_meta`, `jira_lookup_user`, `jira_get_groups`, `jira_get_fields` | Metadata and discovery |
| **Versions** | `jira_get_versions`, `jira_create_version`, `jira_update_version`, `jira_delete_version`, `jira_get_components`, `jira_create_component`, `jira_update_component`, `jira_delete_component` | Releases and components |
| **Agile** | `jira_get_boards`, `jira_get_sprints`, `jira_create_sprint`, `jira_update_sprint`, `jira_delete_sprint`, `jira_get_sprint_issues`, `jira_move_issues_to_sprint`, `jira_rank_issues`, `jira_get_epic_issues`, `jira_get_board_epics`, `jira_get_board_backlog` | Boards and sprints |
| **Utility** | `jira_list_connections`, `jira_who_am_i`, `jira_api` | Auth check; raw REST escape hatch |

### Bitbucket (~50 tools)

| Area | Tools | What you can do |
|------|-------|-----------------|
| **Repos** | `bitbucket_list_projects`, `bitbucket_list_repositories`, `bitbucket_search_repositories`, `bitbucket_get_repository`, `bitbucket_create_repository` | Browse and create repos |
| **Branches** | `bitbucket_list_branches`, `bitbucket_get_branch`, `bitbucket_create_branch`, `bitbucket_delete_branch`, `bitbucket_list_tags`, `bitbucket_create_tag` | Branch and tag management |
| **Commits** | `bitbucket_get_commit`, `bitbucket_list_commits` | Commit history |
| **Pull requests** | `bitbucket_list_pull_requests`, `bitbucket_get_pull_request`, `bitbucket_create_pull_request`, `bitbucket_update_pull_request`, `bitbucket_merge_pull_request`, `bitbucket_decline_pull_request`, `bitbucket_get_pull_request_diff`, `bitbucket_list_pull_request_commits`, `bitbucket_get_pr_changes` | Full PR workflow |
| **PR review** | `bitbucket_add_comment`, `bitbucket_delete_comment`, `bitbucket_list_pr_comments`, `bitbucket_set_pr_approval`, `bitbucket_set_review_status`, `bitbucket_add_pr_reviewer` | Code review |
| **PR tasks** | `bitbucket_list_pr_tasks`, `bitbucket_create_pr_task`, `bitbucket_update_pr_task`, `bitbucket_delete_pr_task`, `bitbucket_set_pr_task_status`, `bitbucket_convert_pr_item` | Review tasks |
| **Code** | `bitbucket_get_file_content`, `bitbucket_list_directory`, `bitbucket_get_file_blame`, `bitbucket_search_code`, `bitbucket_search_files`, `bitbucket_find_in_files` | Read and search code |
| **CI / hooks** | `bitbucket_get_build_status`, `bitbucket_set_build_status`, `bitbucket_list_webhooks`, `bitbucket_create_webhook`, `bitbucket_delete_webhook` | Build status and webhooks |
| **Other** | `bitbucket_search_users`, `bitbucket_manage_attachment`, `bitbucket_api` | Users; raw REST escape hatch |

### Cross-product (Jira ↔ Bitbucket)

| Tool | Description |
|------|-------------|
| `find_prs_for_jira_issue` | Find PRs whose title/description mentions a Jira key |
| `find_jira_issues_for_pr` | Extract Jira keys from a PR |
| `find_commits_for_jira_issue` | Find commits in a PR that reference a Jira key |
| `open_pr_for_jira_issue` | Open a PR with the Jira key in the title and comment on the issue |
| `transition_jira_on_pr_event` | Move a Jira issue when a PR is opened, merged, or declined |
| `comment_jira_with_pr_link` | Add a Jira comment with a link to a PR |
| `comment_pr_with_jira_summary` | Add a PR comment summarizing a Jira issue |
| `release_notes` | Build markdown release notes from a JQL query |

### Composite (bundled calls — fewer tokens)

| Tool | Description |
|------|-------------|
| `jira_triage_issue` | Issue + recent comments + transitions + remote links in one call |
| `jira_whats_on_my_plate` | Your unresolved issues grouped by status |
| `bitbucket_triage_pr` | PR + diff + commits + approval state |
| `bitbucket_review_pull_request` | PR + diff preview + auto-detected Jira keys |
| `bitbucket_open_pr_from_changes` | Create branch + PR (optional Jira link) |
| `daily_standup` | Your open Jira issues + open PRs in one call |

---

## npm scripts

| Command | When to use |
|---------|-------------|
| `npm install` | First time; after pulling dependency changes |
| `npm run build` | After code changes; required before `npm start` in production |
| `npm run start` | Run compiled server manually (Cursor normally starts it) |
| `npm run dev` | Development with `tsx` (no build step) |
| `npm run typecheck` | Verify TypeScript without emitting files |
| `npm run test:readonly` | Quick API connectivity test |

---

## Security

- **Never commit tokens** to git. Use env vars or `~/.atlassian-mcp.yaml` (URLs only) + env for secrets.
- `config.local.yaml` and `.env.local` are gitignored — use them for local overrides.
- This server is **admin-capable**: it can create, update, and delete issues, PRs, branches, etc.
- Use `dryRun: true` on write tools when experimenting.
- Restrict token scope to what you need.
- All traffic goes directly from your machine to your Atlassian instance.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `Config file not found` | No YAML and incomplete env | Set `ATLASSIAN_MCP_CONFIG` or use Option B env vars |
| `Missing required environment variable: JIRA_PAT` | Token not in env | Add to Cursor `mcp.json` `env` block |
| 401 / 403 from Jira | Bad or expired token | Regenerate PAT; check Jira Cloud email |
| 401 / 403 from Bitbucket Server | Wrong username | Use account **slug**, not display name |
| Tools missing in Cursor | Server not started | Restart Cursor; check path to `dist/index.js` |
| `Cannot find module` | Not built | Run `npm install && npm run build` |
| Server crashes on start | Node too old | Upgrade to Node 20+ |

---

## Project layout

```
atlassian-mcp/
├── src/
│   ├── clients/          # HTTP clients for Jira & Bitbucket APIs
│   ├── config/           # YAML + environment config loading
│   ├── tools/            # MCP tool definitions
│   └── util/             # Shared helpers
├── config.example.yaml   # Template — copy to ~/.atlassian-mcp.yaml
├── scripts/
│   └── test-readonly.mjs # Connectivity smoke test
├── package.json
├── LICENSE
├── PUBLISHING.md
└── dist/                 # Built output (run npm run build; gitignored)
```

---

## Publishing

This folder is a complete GitHub repository. See [PUBLISHING.md](./PUBLISHING.md).
