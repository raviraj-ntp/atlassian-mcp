/**
 * Read-only smoke test. Requires credentials in env (see README).
 * Optional: ATLASSIAN_MCP_CONFIG (defaults to ~/.atlassian-mcp.yaml)
 */
import { ClientFactory } from "../dist/clients/clientFactory.js";

const factory = new ClientFactory();
const out = { ok: true, tests: [] };

async function run(name, fn) {
  try {
    const result = await fn();
    out.tests.push({ name, status: "ok", preview: summarize(result) });
  } catch (err) {
    out.ok = false;
    out.tests.push({ name, status: "fail", error: err instanceof Error ? err.message : String(err) });
  }
}

function summarize(data) {
  const s = JSON.stringify(data);
  return s.length > 500 ? `${s.slice(0, 500)}…` : s;
}

await run("jira_who_am_i", () => factory.requireJira().whoAmI());
await run("jira_get_projects", () => factory.requireJira().getProjects(0, 3));
await run("jira_search", () =>
  factory.requireJira().searchIssues("assignee = currentUser() ORDER BY updated DESC", 0, 3),
);
await run("bitbucket_list_projects", () => factory.requireBitbucket().listProjects(0, 3));
await run("jira_list_connections", () => ({
  default: factory.defaultConnection(),
  connections: factory.listConnections(),
}));

console.log(JSON.stringify(out, null, 2));
process.exit(out.ok ? 0 : 1);
