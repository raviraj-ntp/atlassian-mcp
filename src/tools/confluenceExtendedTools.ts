/**
 * @raviraj87/atlassian-mcp · tools/confluenceExtendedTools.ts
 * Extended Confluence MCP tools — labels, comments, attachments, spaces, move/restore.
 *
 * Copyright (c) 2026 Ravi Raj · MIT License · see LICENSE
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ClientFactory } from "../clients/clientFactory.js";
import { connectionField, dryRunField, jsonResult, registerTool } from "./common.js";

export function registerConfluenceExtendedTools(server: McpServer, factory: ClientFactory): void {
  registerTool(
    server,
    "confluence_list_spaces",
    "List Confluence spaces.",
    { connection: connectionField, start: z.number().optional(), limit: z.number().optional() },
    async ({ connection, start, limit }) =>
      jsonResult(await factory.requireConfluence(connection).listSpaces(start ?? 0, limit ?? 25)),
  );

  registerTool(
    server,
    "confluence_get_page_by_title",
    "Find pages by exact title in a space (CQL lookup).",
    { connection: connectionField, spaceKey: z.string(), title: z.string() },
    async ({ connection, spaceKey, title }) =>
      jsonResult(await factory.requireConfluence(connection).getPageByTitle(spaceKey, title)),
  );

  registerTool(
    server,
    "confluence_add_label",
    "Add a label to a page.",
    {
      connection: connectionField,
      pageId: z.string(),
      name: z.string(),
      prefix: z.string().optional(),
      dryRun: dryRunField,
    },
    async ({ connection, pageId, name, prefix, dryRun }) =>
      jsonResult(await factory.requireConfluence(connection).addLabel(pageId, name, prefix, dryRun)),
  );

  registerTool(
    server,
    "confluence_remove_label",
    "Remove a label from a page.",
    {
      connection: connectionField,
      pageId: z.string(),
      name: z.string(),
      prefix: z.string().optional(),
      dryRun: dryRunField,
    },
    async ({ connection, pageId, name, prefix, dryRun }) =>
      jsonResult(await factory.requireConfluence(connection).removeLabel(pageId, name, prefix, dryRun)),
  );

  registerTool(
    server,
    "confluence_get_comments",
    "List comments on a page.",
    {
      connection: connectionField,
      pageId: z.string(),
      start: z.number().optional(),
      limit: z.number().optional(),
    },
    async ({ connection, pageId, start, limit }) =>
      jsonResult(await factory.requireConfluence(connection).getComments(pageId, start ?? 0, limit ?? 25)),
  );

  registerTool(
    server,
    "confluence_add_comment",
    "Add a comment to a page (storage XHTML body).",
    {
      connection: connectionField,
      pageId: z.string(),
      body: z.string(),
      dryRun: dryRunField,
    },
    async ({ connection, pageId, body, dryRun }) =>
      jsonResult(await factory.requireConfluence(connection).addComment(pageId, body, dryRun)),
  );

  registerTool(
    server,
    "confluence_update_comment",
    "Update a comment by comment content ID.",
    {
      connection: connectionField,
      commentId: z.string(),
      body: z.string(),
      version: z.number().optional(),
      dryRun: dryRunField,
    },
    async ({ connection, commentId, body, version, dryRun }) =>
      jsonResult(await factory.requireConfluence(connection).updateComment(commentId, body, version, dryRun)),
  );

  registerTool(
    server,
    "confluence_delete_comment",
    "Delete a comment by comment content ID.",
    { connection: connectionField, commentId: z.string(), dryRun: dryRunField },
    async ({ connection, commentId, dryRun }) =>
      jsonResult(await factory.requireConfluence(connection).deleteComment(commentId, dryRun)),
  );

  registerTool(
    server,
    "confluence_get_attachments",
    "List attachments on a page.",
    {
      connection: connectionField,
      pageId: z.string(),
      start: z.number().optional(),
      limit: z.number().optional(),
    },
    async ({ connection, pageId, start, limit }) =>
      jsonResult(await factory.requireConfluence(connection).getAttachments(pageId, start ?? 0, limit ?? 25)),
  );

  registerTool(
    server,
    "confluence_add_attachment",
    "Upload a file attachment to a page (base64 content).",
    {
      connection: connectionField,
      pageId: z.string(),
      filename: z.string(),
      contentBase64: z.string(),
      dryRun: dryRunField,
    },
    async ({ connection, pageId, filename, contentBase64, dryRun }) =>
      jsonResult(
        await factory.requireConfluence(connection).addAttachment(pageId, filename, contentBase64, dryRun),
      ),
  );

  registerTool(
    server,
    "confluence_delete_attachment",
    "Delete an attachment by attachment content ID.",
    { connection: connectionField, attachmentId: z.string(), dryRun: dryRunField },
    async ({ connection, attachmentId, dryRun }) =>
      jsonResult(await factory.requireConfluence(connection).deleteAttachment(attachmentId, dryRun)),
  );

  registerTool(
    server,
    "confluence_restore_page_version",
    "Restore a page to a previous version number.",
    {
      connection: connectionField,
      pageId: z.string(),
      versionNumber: z.number(),
      dryRun: dryRunField,
    },
    async ({ connection, pageId, versionNumber, dryRun }) =>
      jsonResult(await factory.requireConfluence(connection).restorePageVersion(pageId, versionNumber, dryRun)),
  );

  registerTool(
    server,
    "confluence_move_page",
    "Move a page relative to another page (append, above, or below).",
    {
      connection: connectionField,
      pageId: z.string(),
      targetId: z.string().describe("Target page ID to move under/next to"),
      position: z.enum(["append", "above", "below"]).optional(),
      dryRun: dryRunField,
    },
    async ({ connection, pageId, targetId, position, dryRun }) =>
      jsonResult(
        await factory.requireConfluence(connection).movePage(pageId, targetId, position ?? "append", dryRun),
      ),
  );
}
