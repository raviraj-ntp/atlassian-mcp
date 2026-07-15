/**
 * @raviraj87/atlassian-mcp · util/jiraBulk.ts
 * Jira bulk update helpers — Server vs Cloud strategy, schema, errors.
 *
 * Copyright (c) 2026 Ravi Raj · MIT License · see LICENSE
 */

import { z } from "zod";
import { AtlassianError } from "./errors.js";

/** Per-issue update payload (fields, update ops, or transition). */
const jiraIssueUpdateBodySchema = z.object({
  fields: z.record(z.unknown()).optional().describe("Fields to set on each matched issue"),
  update: z
    .record(z.unknown())
    .optional()
    .describe("Per-field add/remove/set operations applied to each issue"),
  transition: z.object({ id: z.string() }).optional().describe("Workflow transition id"),
  historyMetadata: z.record(z.unknown()).optional(),
  properties: z
    .array(z.object({ key: z.string(), value: z.unknown() }))
    .optional(),
});

export const jiraIssueUpdateTemplateSchema = jiraIssueUpdateBodySchema.refine(
  (v) => Boolean(v.fields || v.update || v.transition),
  { message: "Update template requires fields, update, or transition" },
);

export type JiraIssueUpdateTemplate = z.infer<typeof jiraIssueUpdateBodySchema>;

export const jiraIssueUpdateSchema = jiraIssueUpdateBodySchema
  .extend({
    issueKey: z.string().optional().describe("Issue key (preferred over issueId)"),
    issueId: z.string().optional().describe("Numeric issue id when key unavailable"),
  })
  .refine((v) => Boolean(v.issueKey || v.issueId), {
    message: "Each item requires issueKey or issueId",
  })
  .refine((v) => Boolean(v.fields || v.update || v.transition), {
    message: "Each item requires fields, update, or transition",
  });

export type JiraIssueUpdate = z.infer<typeof jiraIssueUpdateSchema>;

export const jiraBulkUpdateOptionsSchema = {
  concurrency: z.number().optional().describe("Parallel PUT concurrency (default 10)"),
  batchSize: z.number().optional().describe("Process issues in chunks of N (default 50)"),
  continueOnError: z.boolean().optional().describe("Keep going after failures (default true)"),
  retries: z.number().optional().describe("Retries per issue on 429/503 (default 2)"),
  dryRun: z.boolean().optional().describe("Preview count and sample payloads only"),
};

export const jiraBulkUpdateFromJqlOptionsSchema = {
  ...jiraBulkUpdateOptionsSchema,
  jql: z.string().describe("JQL to select issues to update"),
  update: jiraIssueUpdateTemplateSchema.describe("Same fields/update/transition applied to every matched issue"),
  maxIssues: z.number().optional().describe("Cap how many issues to update (default unlimited)"),
  verifyJql: z
    .boolean()
    .optional()
    .describe("Re-run JQL after update and return remainingJqlCount (default true)"),
};

export interface JiraServerInfo {
  deploymentType: string;
  version: string;
  baseUrl: string;
}

export interface JiraBulkUpdateResult {
  strategy: "parallel_put";
  deploymentType: string;
  deploymentVersion?: string;
  reason?: string;
  total: number;
  updated: number;
  failed: number;
  dryRun?: boolean;
  sample?: JiraIssueUpdate[];
  failures: Array<{ key: string; error: string; status?: number; body?: unknown }>;
  results?: Array<{ item: string; ok: boolean; data?: unknown; error?: string; status?: number }>;
}

export function normalizeIssueUpdates(issueUpdates: unknown[]): JiraIssueUpdate[] {
  return issueUpdates.map((item, i) => {
    try {
      return jiraIssueUpdateSchema.parse(item);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(`issueUpdates[${i}] invalid: ${msg}`);
    }
  });
}

export function applyUpdateTemplate(issueKey: string, template: JiraIssueUpdateTemplate): JiraIssueUpdate {
  return { issueKey, ...template };
}

export function issueRef(item: JiraIssueUpdate): string {
  const ref = item.issueKey ?? item.issueId;
  if (!ref) throw new Error("issueKey or issueId required");
  return ref;
}

export function isServerDeployment(info: JiraServerInfo, flavor: "server" | "cloud"): boolean {
  return info.deploymentType === "Server" || flavor === "server";
}

export function bulkEditUnsupportedReason(info: JiraServerInfo, flavor: "server" | "cloud"): string {
  if (isServerDeployment(info, flavor)) {
    return "Bulk edit not supported on Jira Server — POST /issue/bulk is create-only; using parallel PUT";
  }
  return "Using parallel PUT for bulk field updates";
}

export function formatErrorBody(body: unknown): string {
  const text = stringifyBody(body);
  if (!text) return "";
  return text.length > 500 ? `: ${text.slice(0, 500)}…` : `: ${text}`;
}

export function formatAtlassianError(err: AtlassianError): string {
  return `${err.message}${formatErrorBody(err.body)}`;
}

function stringifyBody(body: unknown): string {
  if (body == null) return "";
  if (typeof body === "string") return body;
  try {
    return JSON.stringify(body);
  } catch {
    return String(body);
  }
}
