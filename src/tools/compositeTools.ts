import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ClientFactory } from "../clients/clientFactory.js";
import { connectionField, dryRunField, jsonResult, registerTool } from "./common.js";

export function registerCompositeTools(server: McpServer, factory: ClientFactory): void {
  registerTool(
    server,
    "jira_triage_issue",
    "Composite: fetch issue, comments, transitions, and remote links in one call.",
    { connection: connectionField, issueKey: z.string() },
    async ({ connection, issueKey }) => {
      const jira = factory.requireJira(connection);
      const [issue, comments, transitions, remoteLinks] = await Promise.all([
        jira.getIssue(issueKey, ["summary", "status", "assignee", "priority", "description"]),
        jira.getComments(issueKey, 0, 10),
        jira.getTransitions(issueKey),
        jira.getRemoteLinks(issueKey),
      ]);
      return jsonResult({ issue, comments, transitions, remoteLinks });
    },
  );

  registerTool(
    server,
    "jira_whats_on_my_plate",
    "Composite: issues assigned to current user, grouped by status.",
    { connection: connectionField, maxResults: z.number().optional() },
    async ({ connection, maxResults }) => {
      const jira = factory.requireJira(connection);
      const me = (await jira.whoAmI()) as { name?: string; displayName?: string; accountId?: string };
      const assignee = me.accountId ?? me.name ?? me.displayName;
      const jql = assignee
        ? `assignee = "${assignee}" AND resolution = Unresolved ORDER BY priority DESC, updated DESC`
        : `assignee = currentUser() AND resolution = Unresolved ORDER BY updated DESC`;
      const data = (await jira.searchIssues(jql, 0, maxResults ?? 50, ["summary", "status", "priority"])) as {
        issues?: Array<{ key: string; fields?: { summary?: string; status?: { name?: string }; priority?: { name?: string } } }>;
      };
      const grouped: Record<string, Array<{ key: string; summary: string; priority?: string }>> = {};
      for (const issue of data.issues ?? []) {
        const status = issue.fields?.status?.name ?? "Unknown";
        grouped[status] ??= [];
        grouped[status].push({
          key: issue.key,
          summary: issue.fields?.summary ?? "",
          priority: issue.fields?.priority?.name,
        });
      }
      return jsonResult({ jql, grouped, total: data.issues?.length ?? 0 });
    },
  );

  registerTool(
    server,
    "bitbucket_triage_pr",
    "Composite: PR details, diff summary, commits, and approval state.",
    {
      connection: connectionField,
      project: z.string(),
      repository: z.string(),
      pullRequestId: z.number(),
    },
    async ({ connection, project, repository, pullRequestId }) => {
      const bb = factory.requireBitbucket(connection);
      const ref = { project, repository };
      const [pr, diff, commits] = await Promise.all([
        bb.getPullRequest(ref, pullRequestId),
        bb.getPullRequestDiff(ref, pullRequestId, 3, 8000),
        bb.listPullRequestCommits(ref, pullRequestId),
      ]);
      return jsonResult({ pullRequest: pr, diff, commits });
    },
  );

  registerTool(
    server,
    "bitbucket_review_pull_request",
    "Composite: PR + diff preview + linked Jira keys from title/description.",
    {
      connection: connectionField,
      project: z.string(),
      repository: z.string(),
      pullRequestId: z.number(),
    },
    async ({ connection, project, repository, pullRequestId }) => {
      const bb = factory.requireBitbucket(connection);
      const ref = { project, repository };
      const pr = (await bb.getPullRequest(ref, pullRequestId)) as { title?: string; description?: string };
      const diff = await bb.getPullRequestDiff(ref, pullRequestId, 3, 6000);
      const text = `${pr.title ?? ""}\n${pr.description ?? ""}`;
      const keys = [...new Set(text.match(/\b[A-Z][A-Z0-9]+-\d+\b/g) ?? [])];
      return jsonResult({ pullRequest: pr, diff, linkedJiraKeys: keys });
    },
  );

  registerTool(
    server,
    "daily_standup",
    "Composite: my open Jira issues + open PRs authored by me (best effort).",
    {
      connection: connectionField,
      project: z.string().optional(),
      repository: z.string().optional(),
    },
    async ({ connection, project, repository }) => {
      const jira = factory.requireJira(connection);
      const issues = await jira.searchIssues(
        "assignee = currentUser() AND resolution = Unresolved ORDER BY updated DESC",
        0,
        20,
        ["summary", "status"],
      );

      let pullRequests: unknown = null;
      if (project && repository) {
        pullRequests = await factory.requireBitbucket(connection).listPullRequests({ project, repository }, "OPEN", 0, 20);
      }

      return jsonResult({ jiraIssues: issues, openPullRequests: pullRequests });
    },
  );

  registerTool(
    server,
    "bitbucket_open_pr_from_changes",
    "Composite: create branch + PR from source/target refs with optional Jira link.",
    {
      connection: connectionField,
      project: z.string(),
      repository: z.string(),
      title: z.string(),
      fromRef: z.string(),
      toRef: z.string(),
      issueKey: z.string().optional(),
      description: z.string().optional(),
      dryRun: dryRunField,
    },
    async ({ connection, project, repository, title, fromRef, toRef, issueKey, description, dryRun }) => {
      const bb = factory.requireBitbucket(connection);
      const ref = { project, repository };
      const prTitle = issueKey && !title.includes(issueKey) ? `${issueKey}: ${title}` : title;
      const pr = await bb.createPullRequest(ref, prTitle, fromRef, toRef, description, dryRun);
      if (issueKey && !dryRun) {
        await factory.requireJira(connection).addComment(issueKey, `PR opened: ${prTitle}`, false);
      }
      return jsonResult({ pullRequest: pr, issueKey: issueKey ?? null });
    },
  );
}
