# Atlassian MCP

Local MCP server for **Jira**, **Bitbucket**, and **Confluence**. Gives Cursor (or any MCP client) tools to search issues, manage PRs, read wiki pages, and link Jira ↔ Bitbucket.

- Runs on **your machine** (not cloud-hosted)
- Uses **REST API + personal tokens** — **no Atlassian Connect app**
- **npm:** `@raviraj87/atlassian-mcp` — https://www.npmjs.com/package/@raviraj87/atlassian-mcp
- **GitHub:** https://github.com/raviraj-ntp/atlassian-mcp

---

## Quick start (npm — recommended)

Edit `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "atlassian": {
      "command": "npx",
      "args": ["-y", "@raviraj87/atlassian-mcp"],
      "env": {
        "JIRA_URL": "https://jira.example.com",
        "JIRA_PAT": "your-jira-server-pat",
        "BITBUCKET_URL": "https://bitbucket.example.com",
        "BITBUCKET_USERNAME": "your-user",
        "BITBUCKET_TOKEN": "your-bitbucket-token",
        "JIRA_CLOUD_URL": "https://your-org.atlassian.net",
        "JIRA_CLOUD_EMAIL": "you@company.com",
        "JIRA_CLOUD_PAT": "your-atlassian-cloud-api-token"
      }
    }
  }
}
```

Delete any group you do not use. One token covers every project on that site. Restart Cursor.

## Install from source (optional)

```bash
git clone https://github.com/raviraj-ntp/atlassian-mcp.git
cd atlassian-mcp
npm install
npm run build
```

Then use `"command": "node"` and `"args": ["<<YOUR_CLONE_PATH>>/atlassian-mcp/dist/index.js"]` in `mcp.json`.

---

## What you customize on each machine

Every user/machine needs **their own** values. Do not copy paths or tokens from someone else's config.

| What | Where | npm install | From source |
|------|--------|-------------|-------------|
| Server command | `mcp.json` | `npx` + `@raviraj87/atlassian-mcp` | `node` + path to `dist/index.js` |
| URLs and tokens | `mcp.json` → `env` | One group per site | Same |

---

## Authentication (no Atlassian Connect)

| Site | Put these in `mcp.json` `env` | What the token covers |
|------|--------------------------------|------------------------|
| Jira Server / DC | `JIRA_URL`, `JIRA_PAT` | Every project on that server |
| Bitbucket Server / DC | `BITBUCKET_URL`, `BITBUCKET_USERNAME`, `BITBUCKET_TOKEN` | That Bitbucket server |
| Jira Cloud and Confluence Cloud | `JIRA_CLOUD_URL`, `JIRA_CLOUD_EMAIL`, `JIRA_CLOUD_PAT` | Both products on that Cloud site |
| Bitbucket Cloud | `BITBUCKET_WORKSPACE`, `BITBUCKET_USERNAME`, `BITBUCKET_TOKEN` | That workspace. Use the slug, not a URL |

Leave a group out and that site stays off. On-prem Jira does not need the Cloud variables. When both are set, tools use `server` unless you pass `"connection": "cloud"`. Set `ATLASSIAN_DEFAULT_CONNECTION` to `cloud` to flip that default.

`JIRA_BASE_URL` is accepted in place of `JIRA_URL`. `BITBUCKET_BASE_URL` is accepted in place of `BITBUCKET_URL`.

### Jira Server / Data Center

1. Open your on-prem Jira → your avatar → **Profile** → **Personal Access Tokens**.
2. Create a token.
3. Set `JIRA_URL` to the site origin, with no trailing path (`https://jira.example.com`).
4. Set `JIRA_PAT` to that token.

This token is not an Atlassian Cloud API token. One `JIRA_PAT` is enough for every project on that server.

### Bitbucket Server / Data Center

1. Open Bitbucket → **Manage account** → **HTTP access tokens**.
2. Create a token.
3. Set `BITBUCKET_URL`, `BITBUCKET_USERNAME`, and `BITBUCKET_TOKEN`.
4. `BITBUCKET_USERNAME` is the account slug. An email value is accepted; the server uses the part before `@`.

### Bitbucket Cloud

1. Open Bitbucket → **Personal settings** → **App passwords**.
2. Create an app password.
3. Set `BITBUCKET_WORKSPACE` to the workspace slug, plus `BITBUCKET_USERNAME` and `BITBUCKET_TOKEN`.

Do not set `BITBUCKET_URL` and `BITBUCKET_WORKSPACE` together. A workspace means Bitbucket Cloud.

### Jira Cloud and Confluence Cloud

Both products use one token. The email is the Atlassian account email from [id.atlassian.com](https://id.atlassian.com/manage-profile/account), not your on-prem username.

1. Open [API tokens](https://id.atlassian.com/manage-profile/security/api-tokens).
2. Create a token **with scopes**. A token with no scopes cannot call Jira Cloud.
3. Grant Jira: `read:jira-work`, `write:jira-work`, `read:jira-user`.
4. Grant Confluence read and write for pages, spaces, comments, and attachments. The same token is used for both products.
5. Set `JIRA_CLOUD_URL` to `https://your-org.atlassian.net`.
6. Set `JIRA_CLOUD_EMAIL` to that Atlassian account email.
7. Set `JIRA_CLOUD_PAT` to the new token.

The server reads the site id from `{JIRA_CLOUD_URL}/_edge/tenant_info` and calls `api.atlassian.com`. You do not set a cloud id yourself.

There is no separate Confluence Server token. Confluence in this server is the Cloud site configured above.

---

## Cursor setup

1. Edit `~/.cursor/mcp.json`.
2. Use **npm** (`npx` + `@raviraj87/atlassian-mcp`) or `node` with `dist/index.js`.
3. Restart Cursor. Check **Settings → MCP**.

**From source only:** `"command": "node"`, `"args": ["<<YOUR_CLONE_PATH>>/atlassian-mcp/dist/index.js"]`

**Dev from source:** `"command": "npx"`, `"args": ["tsx", "<<YOUR_CLONE_PATH>>/atlassian-mcp/src/index.ts"]`

---

## Verify

**In Cursor:** *"Use jira_who_am_i"* or *"Use confluence_who_am_i with connection cloud"*

Use `dryRun: true` on write tools (`confluence_create_page`, etc.) to validate payloads without saving.

---

## Using tools

| Parameter | Purpose |
|-----------|---------|
| `connection` | `server` or `cloud`. Omit = the site that has a token, preferring `server`. |
| `dryRun` | On write tools: `true` = validate only, no save. |

| You ask | Tool |
|---------|------|
| What's in PROJ-123? | `jira_get_issue`, `jira_triage_issue` |
| My open tickets | `jira_whats_on_my_plate` |
| PRs for PROJ-123 | `find_prs_for_jira_issue` |
| Release notes from JQL | `release_notes` |
| Read a Confluence runbook | `confluence_get_page`, `confluence_search` |

---

## Tool reference

### Jira (~55)

Issues, comments, worklogs, attachments, links, workflow, agile/sprints, projects, versions, components — plus `jira_who_am_i`, `jira_api`.

### Bitbucket (~50)

Repos, branches, commits, PRs, review, tasks, code search, build status, webhooks — plus `bitbucket_api`.

### Confluence (23)

| Area | Tools |
|------|-------|
| Pages | `confluence_get_page`, `confluence_get_page_by_title`, `confluence_create_page`, `confluence_update_page`, `confluence_delete_page`, `confluence_get_page_children`, `confluence_get_page_history`, `confluence_restore_page_version`, `confluence_move_page` |
| Spaces | `confluence_list_spaces`, `confluence_get_space`, `confluence_search` |
| Labels | `confluence_add_label`, `confluence_remove_label` |
| Comments | `confluence_get_comments`, `confluence_add_comment`, `confluence_update_comment`, `confluence_delete_comment` |
| Attachments | `confluence_get_attachments`, `confluence_add_attachment`, `confluence_delete_attachment` |
| Utility | `confluence_list_connections`, `confluence_who_am_i`, `confluence_api` |

Page bodies use **storage XHTML** (`<p>…</p>`) for create/update. `confluence_get_page` returns `body.storage`, `body.view`, and plain `body.text`. Write tools support `dryRun: true`. Cloud tokens need **read + write** scopes.

### Cross-product (8)

`find_prs_for_jira_issue`, `find_jira_issues_for_pr`, `find_commits_for_jira_issue`, `open_pr_for_jira_issue`, `transition_jira_on_pr_event`, `comment_jira_with_pr_link`, `comment_pr_with_jira_summary`, `release_notes`

### Composite (6)

`jira_triage_issue`, `jira_whats_on_my_plate`, `bitbucket_triage_pr`, `bitbucket_review_pull_request`, `bitbucket_open_pr_from_changes`, `daily_standup`

<details>
<summary>Full Jira tool list</summary>

| Area | Tools |
|------|-------|
| Issues | `jira_get_issue`, `jira_search`, `jira_create_issue`, `jira_update_issue`, `jira_delete_issue`, `jira_assign_issue`, `jira_clone_issue`, `jira_move_issue`, `jira_bulk_update` |
| Comments | `jira_get_comments`, `jira_add_comment`, `jira_update_comment`, `jira_delete_comment` |
| Worklogs | `jira_get_worklogs`, `jira_add_worklog`, `jira_update_worklog`, `jira_delete_worklog` |
| Attachments | `jira_get_attachments`, `jira_add_attachment`, `jira_delete_attachment` |
| Links | `jira_create_issue_link`, `jira_delete_issue_link`, `jira_get_issue_link_types`, `jira_get_remote_links`, `jira_create_remote_link`, `jira_delete_remote_link` |
| Workflow | `jira_get_transitions`, `jira_transition_issue`, `jira_get_changelog` |
| Social | `jira_watch_issue`, `jira_unwatch_issue`, `jira_get_watchers`, `jira_add_vote`, `jira_remove_vote`, `jira_get_votes` |
| Projects | `jira_get_projects`, `jira_get_project`, `jira_get_issue_types`, `jira_get_create_meta`, `jira_lookup_user`, `jira_get_groups`, `jira_get_fields` |
| Versions | `jira_get_versions`, `jira_create_version`, `jira_update_version`, `jira_delete_version`, `jira_get_components`, `jira_create_component`, `jira_update_component`, `jira_delete_component` |
| Agile | `jira_get_boards`, `jira_get_sprints`, `jira_create_sprint`, `jira_update_sprint`, `jira_delete_sprint`, `jira_get_sprint_issues`, `jira_move_issues_to_sprint`, `jira_rank_issues`, `jira_get_epic_issues`, `jira_get_board_epics`, `jira_get_board_backlog` |
| Utility | `jira_list_connections`, `jira_who_am_i`, `jira_api` |

</details>

<details>
<summary>Full Bitbucket tool list</summary>

| Area | Tools |
|------|-------|
| Repos | `bitbucket_list_projects`, `bitbucket_list_repositories`, `bitbucket_search_repositories`, `bitbucket_get_repository`, `bitbucket_create_repository` |
| Branches | `bitbucket_list_branches`, `bitbucket_get_branch`, `bitbucket_create_branch`, `bitbucket_delete_branch`, `bitbucket_list_tags`, `bitbucket_create_tag` |
| Commits | `bitbucket_get_commit`, `bitbucket_list_commits` |
| PRs | `bitbucket_list_pull_requests`, `bitbucket_get_pull_request`, `bitbucket_create_pull_request`, `bitbucket_update_pull_request`, `bitbucket_merge_pull_request`, `bitbucket_decline_pull_request`, `bitbucket_get_pull_request_diff`, `bitbucket_list_pull_request_commits`, `bitbucket_get_pr_changes` |
| Review | `bitbucket_add_comment`, `bitbucket_delete_comment`, `bitbucket_list_pr_comments`, `bitbucket_set_pr_approval`, `bitbucket_set_review_status`, `bitbucket_add_pr_reviewer` |
| Tasks | `bitbucket_list_pr_tasks`, `bitbucket_create_pr_task`, `bitbucket_update_pr_task`, `bitbucket_delete_pr_task`, `bitbucket_set_pr_task_status`, `bitbucket_convert_pr_item` |
| Code | `bitbucket_get_file_content`, `bitbucket_list_directory`, `bitbucket_get_file_blame`, `bitbucket_search_code`, `bitbucket_search_files`, `bitbucket_find_in_files` |
| CI | `bitbucket_get_build_status`, `bitbucket_set_build_status`, `bitbucket_list_webhooks`, `bitbucket_create_webhook`, `bitbucket_delete_webhook` |
| Other | `bitbucket_search_users`, `bitbucket_manage_attachment`, `bitbucket_api` |

</details>

---

## npm scripts

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run build` | Build `dist/` (required before production use) |
| `npm run dev` | Run with `tsx` (no build) |
| `npm run typecheck` | Typecheck without emit |

---

## Security

- Never commit tokens. URLs and tokens both live in `mcp.json` `env`.
- Admin-capable: can create/update/delete issues, PRs, branches. Use `dryRun: true` when testing.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Server exits at startup | A group is half set. Finish it or remove it: `JIRA_URL` + `JIRA_PAT`, the three Bitbucket variables, or `JIRA_CLOUD_URL` + `JIRA_CLOUD_EMAIL` + `JIRA_CLOUD_PAT` |
| `scope does not match` on Jira Cloud | Recreate `JIRA_CLOUD_PAT` with `read:jira-work`, `write:jira-work`, and `read:jira-user`. A Confluence-only token cannot call Jira |
| 401 Jira Cloud | `JIRA_CLOUD_EMAIL` must be the id.atlassian.com email. `JIRA_PAT` is the on-prem token and will not work here |
| 401 Jira Server | Use a Personal Access Token from that Jira server, in `JIRA_PAT` |
| 401 / 403 Bitbucket | `BITBUCKET_USERNAME` is the account slug. An email is reduced to the part before `@` |
| Confluence 404 on API | Cloud uses `/wiki/rest/api`; Server uses `/rest/api` — use `confluence_api` paths relative to prefix |
| Tools missing in Cursor | Fix `args` path; run `npm run build`; restart Cursor |
| Wrong machine paths | Use **your** clone path — never copy `/Users/someone/...` |

---

## License

Copyright © 2026 Ravi Raj. Licensed under the [MIT License](LICENSE).
