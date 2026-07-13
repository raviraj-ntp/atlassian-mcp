/**
 * @raviraj87/atlassian-mcp · tools/common.ts
 * Shared tool registration and response helpers.
 *
 * Copyright (c) 2026 Ravi Raj · MIT License · see LICENSE
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { stringify, toContent } from "../util/response.js";

export const connectionField = z.string().optional().describe("Named connection from config; defaults to default_connection");
export const dryRunField = z.boolean().optional().describe("If true, validate only — no write is performed");
export const cursorField = z.string().optional();
export const limitField = z.number().optional().default(50);

export function registerTool(
  server: McpServer,
  name: string,
  description: string,
  handler: () => Promise<any>,
): void;
export function registerTool<Args extends Record<string, z.ZodTypeAny>>(
  server: McpServer,
  name: string,
  description: string,
  inputSchema: Args,
  handler: (args: z.infer<z.ZodObject<Args>>) => Promise<any>,
): void;
export function registerTool<Args extends Record<string, z.ZodTypeAny>>(
  server: McpServer,
  name: string,
  description: string,
  schemaOrHandler: Args | (() => Promise<any>),
  handler?: (args: z.infer<z.ZodObject<Args>>) => Promise<any>,
): void {
  if (typeof schemaOrHandler === "function") {
    server.registerTool(name, { description }, schemaOrHandler as any);
    return;
  }
  server.registerTool(name, { description, inputSchema: schemaOrHandler }, handler as any);
}

export async function jsonResult(data: unknown) {
  return toContent(stringify(data));
}

export const repoRefSchema = {
  project: z.string().describe("Project key (Server) or project key filter (Cloud)"),
  repository: z.string().describe("Repository slug"),
  connection: connectionField,
};

export const batchOptionsSchema = {
  mode: z
    .enum(["sequential", "parallel"])
    .optional()
    .describe("Execution mode: sequential (one at a time) or parallel (default)"),
  onError: z
    .enum(["continue", "stop"])
    .optional()
    .describe("continue=collect all errors (default); stop=abort after first failure"),
  parallelism: z.number().optional().describe("Max concurrent requests in parallel mode (default 4)"),
  dryRun: dryRunField,
};
