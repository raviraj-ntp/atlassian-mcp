# Publishing this repository

This is a **standalone** repository. It has no dependency on sibling MCP projects.

## Before you push

Verify nothing sensitive is staged:

```bash
git status
```

These must **not** be committed (already in `.gitignore`):

- `node_modules/`, `dist/`
- `config.local.yaml`, `.env`, `.env.local`
- API tokens or internal URLs

## GitHub CLI (recommended)

```bash
brew install gh    # one-time
gh auth login      # one-time

git init
git add .
git commit -m "Initial commit: Atlassian MCP server for Jira and Bitbucket"
gh repo create atlassian-mcp --public --source=. --remote=origin --push
```

Use `--private` for a private repo.

## Without GitHub CLI

1. Create an empty repo on GitHub named `atlassian-mcp` (no README).
2. From this directory:

```bash
git init
git add .
git commit -m "Initial commit: Atlassian MCP server for Jira and Bitbucket"
git branch -M main
git remote add origin git@github.com:ravi-netapp/atlassian-mcp.git
git push -u origin main
```

## After publishing

- Clone anywhere and run `npm install && npm run build`
- Point Cursor `mcp.json` at the cloned `dist/index.js` path
- Add repo topics: `mcp`, `model-context-protocol`, `jira`, `bitbucket`, `cursor`
