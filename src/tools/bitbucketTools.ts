/**
 * @raviraj87/atlassian-mcp · tools/bitbucketTools.ts
 * MCP tools for Bitbucket repositories and pull requests.
 *
 * Copyright (c) 2026 Ravi Raj · MIT License · see LICENSE
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ClientFactory } from "../clients/clientFactory.js";
import { connectionField, dryRunField, jsonResult, registerTool, repoRefSchema } from "./common.js";

export function registerBitbucketTools(server: McpServer, factory: ClientFactory): void {
  registerTool(
    server,
    "bitbucket_list_projects",
    "List Bitbucket projects.",
    { connection: connectionField, start: z.number().optional(), limit: z.number().optional() },
    async ({ connection, start, limit }) =>
      jsonResult(await factory.requireBitbucket(connection).listProjects(start, limit)),
  );

  registerTool(
    server,
    "bitbucket_list_repositories",
    "List repositories in a project.",
    { connection: connectionField, project: z.string(), start: z.number().optional(), limit: z.number().optional() },
    async ({ connection, project, start, limit }) =>
      jsonResult(await factory.requireBitbucket(connection).listRepositories(project, start, limit)),
  );

  registerTool(
    server,
    "bitbucket_search_repositories",
    "Search repositories by name.",
    { connection: connectionField, query: z.string(), start: z.number().optional(), limit: z.number().optional() },
    async ({ connection, query, start, limit }) =>
      jsonResult(await factory.requireBitbucket(connection).searchRepositories(query, start, limit)),
  );

  registerTool(
    server,
    "bitbucket_get_repository",
    "Get repository details.",
    { ...repoRefSchema },
    async ({ connection, project, repository }) =>
      jsonResult(await factory.requireBitbucket(connection).getRepository({ project, repository })),
  );

  registerTool(
    server,
    "bitbucket_list_branches",
    "List branches.",
    { ...repoRefSchema, start: z.number().optional(), limit: z.number().optional() },
    async ({ connection, project, repository, start, limit }) =>
      jsonResult(await factory.requireBitbucket(connection).listBranches({ project, repository }, start, limit)),
  );

  registerTool(
    server,
    "bitbucket_get_branch",
    "Get branch details.",
    { ...repoRefSchema, branch: z.string() },
    async ({ connection, project, repository, branch }) =>
      jsonResult(await factory.requireBitbucket(connection).getBranch({ project, repository }, branch)),
  );

  registerTool(
    server,
    "bitbucket_create_branch",
    "Create a branch.",
    { ...repoRefSchema, name: z.string(), startPoint: z.string(), dryRun: dryRunField },
    async ({ connection, project, repository, name, startPoint, dryRun }) =>
      jsonResult(await factory.requireBitbucket(connection).createBranch({ project, repository }, name, startPoint, dryRun)),
  );

  registerTool(
    server,
    "bitbucket_delete_branch",
    "Delete a branch.",
    { ...repoRefSchema, branch: z.string(), dryRun: dryRunField },
    async ({ connection, project, repository, branch, dryRun }) =>
      jsonResult(await factory.requireBitbucket(connection).deleteBranch({ project, repository }, branch, dryRun)),
  );

  registerTool(
    server,
    "bitbucket_list_tags",
    "List tags.",
    { ...repoRefSchema, start: z.number().optional(), limit: z.number().optional() },
    async ({ connection, project, repository, start, limit }) =>
      jsonResult(await factory.requireBitbucket(connection).listTags({ project, repository }, start, limit)),
  );

  registerTool(
    server,
    "bitbucket_get_commit",
    "Get commit details.",
    { ...repoRefSchema, commitId: z.string() },
    async ({ connection, project, repository, commitId }) =>
      jsonResult(await factory.requireBitbucket(connection).getCommit({ project, repository }, commitId)),
  );

  registerTool(
    server,
    "bitbucket_list_commits",
    "List commits on a branch.",
    { ...repoRefSchema, branch: z.string().optional(), start: z.number().optional(), limit: z.number().optional() },
    async ({ connection, project, repository, branch, start, limit }) =>
      jsonResult(await factory.requireBitbucket(connection).listCommits({ project, repository }, branch, start, limit)),
  );

  registerTool(
    server,
    "bitbucket_list_pull_requests",
    "List pull requests.",
    { ...repoRefSchema, state: z.string().optional(), start: z.number().optional(), limit: z.number().optional() },
    async ({ connection, project, repository, state, start, limit }) =>
      jsonResult(await factory.requireBitbucket(connection).listPullRequests({ project, repository }, state, start, limit)),
  );

  registerTool(
    server,
    "bitbucket_get_pull_request",
    "Get pull request details.",
    { ...repoRefSchema, pullRequestId: z.number() },
    async ({ connection, project, repository, pullRequestId }) =>
      jsonResult(await factory.requireBitbucket(connection).getPullRequest({ project, repository }, pullRequestId)),
  );

  registerTool(
    server,
    "bitbucket_create_pull_request",
    "Create a pull request.",
    {
      ...repoRefSchema,
      title: z.string(),
      fromRef: z.string(),
      toRef: z.string(),
      description: z.string().optional(),
      dryRun: dryRunField,
    },
    async ({ connection, project, repository, title, fromRef, toRef, description, dryRun }) =>
      jsonResult(
        await factory.requireBitbucket(connection).createPullRequest(
          { project, repository },
          title,
          fromRef,
          toRef,
          description,
          dryRun,
        ),
      ),
  );

  registerTool(
    server,
    "bitbucket_update_pull_request",
    "Update pull request metadata.",
    { ...repoRefSchema, pullRequestId: z.number(), fields: z.record(z.unknown()), dryRun: dryRunField },
    async ({ connection, project, repository, pullRequestId, fields, dryRun }) =>
      jsonResult(
        await factory.requireBitbucket(connection).updatePullRequest({ project, repository }, pullRequestId, fields, dryRun),
      ),
  );

  registerTool(
    server,
    "bitbucket_merge_pull_request",
    "Merge a pull request.",
    { ...repoRefSchema, pullRequestId: z.number(), dryRun: dryRunField },
    async ({ connection, project, repository, pullRequestId, dryRun }) =>
      jsonResult(await factory.requireBitbucket(connection).mergePullRequest({ project, repository }, pullRequestId, dryRun)),
  );

  registerTool(
    server,
    "bitbucket_decline_pull_request",
    "Decline a pull request.",
    { ...repoRefSchema, pullRequestId: z.number(), dryRun: dryRunField },
    async ({ connection, project, repository, pullRequestId, dryRun }) =>
      jsonResult(await factory.requireBitbucket(connection).declinePullRequest({ project, repository }, pullRequestId, dryRun)),
  );

  registerTool(
    server,
    "bitbucket_get_pull_request_diff",
    "Get PR diff (summary mode for large diffs).",
    { ...repoRefSchema, pullRequestId: z.number(), contextLines: z.number().optional(), maxChars: z.number().optional() },
    async ({ connection, project, repository, pullRequestId, contextLines, maxChars }) =>
      jsonResult(
        await factory.requireBitbucket(connection).getPullRequestDiff(
          { project, repository },
          pullRequestId,
          contextLines,
          maxChars,
        ),
      ),
  );

  registerTool(
    server,
    "bitbucket_list_pull_request_commits",
    "List commits in a pull request.",
    { ...repoRefSchema, pullRequestId: z.number() },
    async ({ connection, project, repository, pullRequestId }) =>
      jsonResult(await factory.requireBitbucket(connection).listPullRequestCommits({ project, repository }, pullRequestId)),
  );

  registerTool(
    server,
    "bitbucket_add_comment",
    "Add a PR comment.",
    { ...repoRefSchema, pullRequestId: z.number(), text: z.string(), dryRun: dryRunField },
    async ({ connection, project, repository, pullRequestId, text, dryRun }) =>
      jsonResult(
        await factory.requireBitbucket(connection).addPullRequestComment({ project, repository }, pullRequestId, text, dryRun),
      ),
  );

  registerTool(
    server,
    "bitbucket_delete_comment",
    "Delete a PR comment.",
    { ...repoRefSchema, pullRequestId: z.number(), commentId: z.number(), dryRun: dryRunField },
    async ({ connection, project, repository, pullRequestId, commentId, dryRun }) =>
      jsonResult(
        await factory.requireBitbucket(connection).deletePullRequestComment(
          { project, repository },
          pullRequestId,
          commentId,
          dryRun,
        ),
      ),
  );

  registerTool(
    server,
    "bitbucket_set_pr_approval",
    "Approve or unapprove a pull request.",
    { ...repoRefSchema, pullRequestId: z.number(), approved: z.boolean(), dryRun: dryRunField },
    async ({ connection, project, repository, pullRequestId, approved, dryRun }) =>
      jsonResult(
        await factory.requireBitbucket(connection).setPullRequestApproval(
          { project, repository },
          pullRequestId,
          approved,
          dryRun,
        ),
      ),
  );

  registerTool(
    server,
    "bitbucket_get_file_content",
    "Read a file at ref.",
    { ...repoRefSchema, path: z.string(), at: z.string().optional() },
    async ({ connection, project, repository, path, at }) =>
      jsonResult(await factory.requireBitbucket(connection).getFileContent({ project, repository }, path, at)),
  );

  registerTool(
    server,
    "bitbucket_list_directory",
    "List directory contents.",
    { ...repoRefSchema, path: z.string().optional(), at: z.string().optional() },
    async ({ connection, project, repository, path, at }) =>
      jsonResult(await factory.requireBitbucket(connection).listDirectory({ project, repository }, path, at)),
  );

  registerTool(
    server,
    "bitbucket_search_code",
    "Search code in a repository.",
    { ...repoRefSchema, query: z.string(), start: z.number().optional(), limit: z.number().optional() },
    async ({ connection, project, repository, query, start, limit }) =>
      jsonResult(await factory.requireBitbucket(connection).searchCode({ project, repository }, query, start, limit)),
  );

  registerTool(
    server,
    "bitbucket_get_build_status",
    "Get build statuses for a commit.",
    { ...repoRefSchema, commitId: z.string() },
    async ({ connection, project, repository, commitId }) =>
      jsonResult(await factory.requireBitbucket(connection).getBuildStatus({ project, repository }, commitId)),
  );

  registerTool(
    server,
    "bitbucket_set_build_status",
    "Set build status on a commit.",
    {
      ...repoRefSchema,
      commitId: z.string(),
      key: z.string(),
      state: z.enum(["SUCCESSFUL", "FAILED", "INPROGRESS"]),
      url: z.string(),
      description: z.string().optional(),
      dryRun: dryRunField,
    },
    async ({ connection, project, repository, commitId, key, state, url, description, dryRun }) =>
      jsonResult(
        await factory.requireBitbucket(connection).setBuildStatus(
          { project, repository },
          commitId,
          key,
          state,
          url,
          description,
          dryRun,
        ),
      ),
  );

  registerTool(
    server,
    "bitbucket_list_webhooks",
    "List repository webhooks.",
    { ...repoRefSchema },
    async ({ connection, project, repository }) =>
      jsonResult(await factory.requireBitbucket(connection).listWebhooks({ project, repository })),
  );

  registerTool(
    server,
    "bitbucket_create_webhook",
    "Create a repository webhook.",
    { ...repoRefSchema, events: z.array(z.string()), url: z.string(), dryRun: dryRunField },
    async ({ connection, project, repository, events, url, dryRun }) =>
      jsonResult(await factory.requireBitbucket(connection).createWebhook({ project, repository }, events, url, dryRun)),
  );

  registerTool(
    server,
    "bitbucket_delete_webhook",
    "Delete a repository webhook.",
    { ...repoRefSchema, webhookId: z.string(), dryRun: dryRunField },
    async ({ connection, project, repository, webhookId, dryRun }) =>
      jsonResult(await factory.requireBitbucket(connection).deleteWebhook({ project, repository }, webhookId, dryRun)),
  );

  registerTool(
    server,
    "bitbucket_search_users",
    "Search Bitbucket users.",
    { connection: connectionField, query: z.string(), start: z.number().optional(), limit: z.number().optional() },
    async ({ connection, query, start, limit }) =>
      jsonResult(await factory.requireBitbucket(connection).searchUsers(query, start, limit)),
  );

  registerTool(
    server,
    "bitbucket_api",
    "Escape hatch: call any Bitbucket REST path.",
    {
      connection: connectionField,
      path: z.string(),
      method: z.string().optional(),
      query: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
      body: z.unknown().optional(),
      dryRun: dryRunField,
    },
    async ({ connection, path, method, query, body, dryRun }) =>
      jsonResult(await factory.requireBitbucket(connection).raw(path, { method, query, body, dryRun })),
  );
}
