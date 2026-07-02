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
