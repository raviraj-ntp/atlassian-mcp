/**
 * @raviraj87/atlassian-mcp · tools/crossproductTools.ts
 * Cross-product Jira and Bitbucket MCP tools.
 *
 * Copyright (c) 2026 Ravi Raj · MIT License · see LICENSE
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ClientFactory } from "../clients/clientFactory.js";
import { extractJiraKeys } from "../util/keyExtraction.js";
import { connectionField, dryRunField, jsonResult, registerTool, repoRefSchema } from "./common.js";

export function registerCrossProductTools(server: McpServer, factory: ClientFactory): void {
  registerTool(
    server,
    "find_prs_for_jira_issue",
    "Find PRs whose title/description/commits mention a Jira issue key.",
    {
      connection: connectionField,
      issueKey: z.string(),
      project: z.string(),
      repository: z.string(),
    },
    async ({ connection, issueKey, project, repository }) => {
      const bb = factory.requireBitbucket(connection);
      const prs = (await bb.listPullRequests({ project, repository }, "ALL", 0, 100)) as {
        values?: Array<{ id: number; title?: string; description?: string }>;
      };
      const items = (prs.values ?? []).filter((pr) => {
        const blob = `${pr.title ?? ""} ${pr.description ?? ""}`;
        return blob.includes(issueKey);
      });
      return jsonResult({ issueKey, count: items.length, pullRequests: items });
    },
  );

  registerTool(
    server,
    "find_jira_issues_for_pr",
    "Extract Jira keys from a PR title/description.",
    { ...repoRefSchema, pullRequestId: z.number() },
    async ({ connection, project, repository, pullRequestId }) => {
      const pr = (await factory.requireBitbucket(connection).getPullRequest({ project, repository }, pullRequestId)) as {
        title?: string;
        description?: string;
      };
      const text = `${pr.title ?? ""}\n${pr.description ?? ""}`;
      return jsonResult({ pullRequestId, issueKeys: extractJiraKeys(text) });
    },
  );

  registerTool(
    server,
    "find_commits_for_jira_issue",
    "Find PR commits whose messages mention a Jira issue key.",
    {
      connection: connectionField,
      issueKey: z.string(),
      project: z.string(),
      repository: z.string(),
      pullRequestId: z.number(),
    },
    async ({ connection, issueKey, project, repository, pullRequestId }) => {
      const commits = (await factory.requireBitbucket(connection).listPullRequestCommits(
        { project, repository },
        pullRequestId,
      )) as { values?: Array<{ message?: string; id?: string }> };
      const matched = (commits.values ?? []).filter((c) => (c.message ?? "").includes(issueKey));
      return jsonResult({ issueKey, pullRequestId, count: matched.length, commits: matched });
    },
  );

  registerTool(
    server,
    "comment_jira_with_pr_link",
    "Add a Jira comment linking to a PR.",
    {
      connection: connectionField,
      issueKey: z.string(),
      project: z.string(),
      repository: z.string(),
      pullRequestId: z.number(),
      extraText: z.string().optional(),
      dryRun: dryRunField,
    },
    async ({ connection, issueKey, project, repository, pullRequestId, extraText, dryRun }) => {
      const pr = (await factory.requireBitbucket(connection).getPullRequest({ project, repository }, pullRequestId)) as {
        links?: { self?: Array<{ href?: string }> };
        title?: string;
      };
      const href = pr.links?.self?.[0]?.href ?? `PR #${pullRequestId}`;
      const body = [`Linked PR: ${href}`, pr.title ? `Title: ${pr.title}` : "", extraText ?? ""]
        .filter(Boolean)
        .join("\n");
      return jsonResult(await factory.requireJira(connection).addComment(issueKey, body, dryRun));
    },
  );

  registerTool(
    server,
    "comment_pr_with_jira_summary",
    "Add a PR comment summarizing a Jira issue.",
    {
      ...repoRefSchema,
      pullRequestId: z.number(),
      issueKey: z.string(),
      dryRun: dryRunField,
    },
    async ({ connection, project, repository, pullRequestId, issueKey, dryRun }) => {
      const issue = (await factory.requireJira(connection).getIssue(issueKey, ["summary", "status", "assignee"])) as {
        fields?: { summary?: string; status?: { name?: string }; assignee?: { displayName?: string } };
      };
      const text = [
        `Jira ${issueKey}: ${issue.fields?.summary ?? ""}`,
        `Status: ${issue.fields?.status?.name ?? "unknown"}`,
        `Assignee: ${issue.fields?.assignee?.displayName ?? "unassigned"}`,
      ].join("\n");
      return jsonResult(
        await factory.requireBitbucket(connection).addPullRequestComment(
          { project, repository },
          pullRequestId,
          text,
          dryRun,
        ),
      );
    },
  );

  registerTool(
    server,
    "release_notes",
    "Build release notes from Jira issues in a JQL result.",
    { connection: connectionField, jql: z.string(), maxResults: z.number().optional() },
    async ({ connection, jql, maxResults }) => {
      const data = (await factory.requireJira(connection).searchIssues(
        jql,
        0,
        maxResults ?? 100,
        ["summary", "issuetype", "status"],
      )) as { issues?: Array<{ key: string; fields?: { summary?: string; issuetype?: { name?: string } } }> };
      const lines = (data.issues ?? []).map(
        (i) => `- [${i.key}] (${i.fields?.issuetype?.name ?? "Issue"}) ${i.fields?.summary ?? ""}`,
      );
      return jsonResult({ jql, count: lines.length, notes: lines.join("\n") });
    },
  );

  registerTool(
    server,
    "open_pr_for_jira_issue",
    "Create a PR with Jira key in title and link comment on the issue.",
    {
      connection: connectionField,
      issueKey: z.string(),
      project: z.string(),
      repository: z.string(),
      title: z.string(),
      fromRef: z.string(),
      toRef: z.string(),
      description: z.string().optional(),
      dryRun: dryRunField,
    },
    async ({ connection, issueKey, project, repository, title, fromRef, toRef, description, dryRun }) => {
      const bb = factory.requireBitbucket(connection);
      const jira = factory.requireJira(connection);
      const prTitle = title.includes(issueKey) ? title : `${issueKey}: ${title}`;
      const pr = await bb.createPullRequest(
        { project, repository },
        prTitle,
        fromRef,
        toRef,
        description,
        dryRun,
      );
      if (!dryRun) {
        await jira.addComment(issueKey, `Opened PR: ${prTitle}`, false);
      }
      return jsonResult({ issueKey, pullRequest: pr });
    },
  );

  registerTool(
    server,
    "transition_jira_on_pr_event",
    "Transition a Jira issue when a PR event occurs (merged/declined/open).",
    {
      connection: connectionField,
      issueKey: z.string(),
      event: z.enum(["opened", "merged", "declined"]),
      transitionMap: z.object({
        opened: z.string().optional(),
        merged: z.string().optional(),
        declined: z.string().optional(),
      }),
      dryRun: dryRunField,
    },
    async ({ connection, issueKey, event, transitionMap, dryRun }) => {
      const transitionId = transitionMap[event];
      if (!transitionId) {
        throw new Error(`No transition configured for event: ${event}`);
      }
      return jsonResult(await factory.requireJira(connection).transitionIssue(issueKey, transitionId, undefined, dryRun));
    },
  );
}
