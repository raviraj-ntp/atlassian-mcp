/**
 * @raviraj87/atlassian-mcp · tools/confluenceTools.ts
 * MCP tools for Confluence pages, spaces, and CQL search.
 *
 * Copyright (c) 2026 Ravi Raj · MIT License · see LICENSE
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ClientFactory } from "../clients/clientFactory.js";
import { ContentFormat } from "../clients/confluenceClient.js";
import { connectionField, dryRunField, jsonResult, registerTool } from "./common.js";

const contentFormatField = z
  .enum(["storage", "view", "both"])
  .optional()
  .describe("Page body format: storage (XHTML), view (HTML), or both");

export function registerConfluenceTools(server: McpServer, factory: ClientFactory): void {
  registerTool(
    server,
    "confluence_list_connections",
    "List connection names that have Confluence configured.",
    async () =>
      jsonResult({
        default: factory.defaultConnection(),
        connections: factory.listConfluenceConnections(),
      }),
  );

  registerTool(
    server,
    "confluence_who_am_i",
    "Get current Confluence user (verify auth).",
    { connection: connectionField },
    async ({ connection }) => jsonResult(await factory.requireConfluence(connection).whoAmI()),
  );

  registerTool(
    server,
    "confluence_get_page",
    "Get a Confluence page by ID. body.storage is Confluence XHTML (not markdown).",
    {
      connection: connectionField,
      pageId: z.string().describe("Numeric page ID from the Confluence URL"),
      contentFormat: contentFormatField,
    },
    async ({ connection, pageId, contentFormat }) => {
      const raw = (await factory.requireConfluence(connection).getPage(
        pageId,
        (contentFormat ?? "both") as ContentFormat,
      )) as Record<string, unknown>;
      return jsonResult(formatPage(raw));
    },
  );

  registerTool(
    server,
    "confluence_search",
    "Search Confluence content using CQL (e.g. space=DOCS AND title~\"runbook\").",
    {
      connection: connectionField,
      cql: z.string(),
      start: z.number().optional(),
      limit: z.number().optional(),
    },
    async ({ connection, cql, start, limit }) =>
      jsonResult(await factory.requireConfluence(connection).searchCql(cql, start ?? 0, limit ?? 25)),
  );

  registerTool(
    server,
    "confluence_get_space",
    "Get Confluence space metadata by key.",
    { connection: connectionField, spaceKey: z.string() },
    async ({ connection, spaceKey }) =>
      jsonResult(await factory.requireConfluence(connection).getSpace(spaceKey)),
  );

  registerTool(
    server,
    "confluence_get_page_children",
    "List child pages under a parent page.",
    {
      connection: connectionField,
      pageId: z.string(),
      start: z.number().optional(),
      limit: z.number().optional(),
    },
    async ({ connection, pageId, start, limit }) =>
      jsonResult(await factory.requireConfluence(connection).getPageChildren(pageId, start ?? 0, limit ?? 25)),
  );

  registerTool(
    server,
    "confluence_get_page_history",
    "Get version history for a page.",
    {
      connection: connectionField,
      pageId: z.string(),
      start: z.number().optional(),
      limit: z.number().optional(),
    },
    async ({ connection, pageId, start, limit }) =>
      jsonResult(await factory.requireConfluence(connection).getPageHistory(pageId, start ?? 0, limit ?? 25)),
  );

  registerTool(
    server,
    "confluence_create_page",
    "Create a Confluence page. body is Confluence storage XHTML (e.g. <p>Hello</p>). Requires write scope on Cloud tokens.",
    {
      connection: connectionField,
      spaceKey: z.string(),
      title: z.string(),
      body: z.string().describe("Page body in storage format (XHTML)"),
      parentId: z.string().optional().describe("Parent page ID; omit for space root"),
      status: z.enum(["current", "draft"]).optional(),
      dryRun: dryRunField,
    },
    async ({ connection, spaceKey, title, body, parentId, status, dryRun }) => {
      const raw = (await factory.requireConfluence(connection).createPage(
        spaceKey,
        title,
        body,
        { parentId, status },
        dryRun,
      )) as Record<string, unknown>;
      return jsonResult(raw.id ? formatPage(raw) : raw);
    },
  );

  registerTool(
    server,
    "confluence_update_page",
    "Update a Confluence page title and/or body. Auto-increments version unless version is supplied.",
    {
      connection: connectionField,
      pageId: z.string(),
      title: z.string().optional(),
      body: z.string().optional().describe("New body in storage format (XHTML)"),
      version: z.number().optional().describe("Current version number (fetched automatically if omitted)"),
      status: z.enum(["current", "draft"]).optional(),
      dryRun: dryRunField,
    },
    async ({ connection, pageId, title, body, version, status, dryRun }) => {
      const raw = (await factory.requireConfluence(connection).updatePage(
        pageId,
        { title, body, version, status },
        dryRun,
      )) as Record<string, unknown>;
      return jsonResult(raw.id ? formatPage(raw) : raw);
    },
  );

  registerTool(
    server,
    "confluence_delete_page",
    "Delete a Confluence page by ID.",
    {
      connection: connectionField,
      pageId: z.string(),
      dryRun: dryRunField,
    },
    async ({ connection, pageId, dryRun }) =>
      jsonResult(await factory.requireConfluence(connection).deletePage(pageId, dryRun)),
  );

  registerTool(
    server,
    "confluence_api",
    "Escape hatch: call any Confluence REST path under /rest/api or /wiki/rest/api.",
    {
      connection: connectionField,
      path: z.string().describe("Path after the API prefix, e.g. content/12345 or content/search"),
      method: z.string().optional(),
      query: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
      body: z.unknown().optional(),
    },
    async ({ connection, path, method, query, body }) =>
      jsonResult(await factory.requireConfluence(connection).raw(path, { method, query, body })),
  );
}

function formatPage(raw: Record<string, unknown>) {
  const body = raw.body as Record<string, { value?: string }> | undefined;
  const storage = body?.storage?.value;
  const viewHtml = body?.view?.value;
  const links = raw._links as { webui?: string; base?: string } | undefined;
  const webUrl =
    links?.base && links?.webui ? `${links.base}${links.webui}` : links?.webui ?? undefined;

  return {
    id: raw.id,
    title: raw.title,
    type: raw.type,
    status: raw.status,
    space: raw.space,
    version: raw.version,
    ancestors: raw.ancestors,
    labels: (raw.metadata as { labels?: unknown })?.labels,
    webUrl,
    body: {
      storage,
      view: viewHtml,
      text: viewHtml ? stripHtml(viewHtml) : storage ? stripHtml(storage) : undefined,
    },
  };
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}
