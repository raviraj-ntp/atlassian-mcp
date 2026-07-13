/**
 * @raviraj87/atlassian-mcp · tools/bitbucketBulkTools.ts
 * Bulk Bitbucket MCP tools (multi-branch/tag/PR/webhook operations).
 *
 * Copyright (c) 2026 Ravi Raj · MIT License · see LICENSE
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ClientFactory } from "../clients/clientFactory.js";
import { batchOptionsSchema, jsonResult, registerTool, repoRefSchema } from "./common.js";

export function registerBitbucketBulkTools(server: McpServer, factory: ClientFactory): void {
  const bb = (connection?: string) => factory.requireBitbucket(connection);
  const ref = (a: { project: string; repository: string }) => ({ project: a.project, repository: a.repository });
  const batchOpts = (a: {
    mode?: "sequential" | "parallel";
    onError?: "continue" | "stop";
    parallelism?: number;
    dryRun?: boolean;
  }) => ({ mode: a.mode, onError: a.onError, parallelism: a.parallelism, dryRun: a.dryRun });

  registerTool(
    server,
    "bitbucket_delete_branches",
    "Delete multiple branches in one call. Server/DC uses branch-utils; Cloud deletes each branch via API. Supports parallel/sequential modes and dryRun.",
    {
      ...repoRefSchema,
      branches: z.array(z.string()).min(1).describe("Branch names (with or without refs/heads/ prefix)"),
      ...batchOptionsSchema,
    },
    async (a) =>
      jsonResult(await bb(a.connection).deleteBranches(ref(a), a.branches, batchOpts(a))),
  );

  registerTool(
    server,
    "bitbucket_delete_tag",
    "Delete a single tag.",
    { ...repoRefSchema, tag: z.string(), dryRun: batchOptionsSchema.dryRun },
    async (a) => jsonResult(await bb(a.connection).deleteTag(ref(a), a.tag, a.dryRun)),
  );

  registerTool(
    server,
    "bitbucket_delete_tags",
    "Delete multiple tags in one call.",
    {
      ...repoRefSchema,
      tags: z.array(z.string()).min(1),
      ...batchOptionsSchema,
    },
    async (a) => jsonResult(await bb(a.connection).deleteTags(ref(a), a.tags, batchOpts(a))),
  );

  registerTool(
    server,
    "bitbucket_bulk_pull_requests",
    "Merge or decline multiple pull requests in one call.",
    {
      ...repoRefSchema,
      pullRequestIds: z.array(z.number()).min(1),
      action: z.enum(["merge", "decline"]),
      ...batchOptionsSchema,
    },
    async (a) =>
      jsonResult(
        await bb(a.connection).bulkPullRequestAction(ref(a), a.pullRequestIds, a.action, batchOpts(a)),
      ),
  );

  registerTool(
    server,
    "bitbucket_delete_webhooks",
    "Delete multiple repository webhooks in one call.",
    {
      ...repoRefSchema,
      webhookIds: z.array(z.string()).min(1),
      ...batchOptionsSchema,
    },
    async (a) =>
      jsonResult(await bb(a.connection).deleteWebhooks(ref(a), a.webhookIds, batchOpts(a))),
  );
}
