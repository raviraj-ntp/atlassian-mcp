/**
 * @raviraj87/atlassian-mcp · util/errors.ts
 * API error normalization helpers.
 *
 * Copyright (c) 2026 Ravi Raj · MIT License · see LICENSE
 */

function summarizeBody(body: unknown): string {
  if (body == null) return "";
  const text = typeof body === "string" ? body : JSON.stringify(body);
  if (!text) return "";
  return text.length > 400 ? `${text.slice(0, 400)}…` : text;
}

export class AtlassianError extends Error {
  readonly status?: number;
  readonly body?: unknown;

  constructor(message: string, status?: number, body?: unknown) {
    const detail = summarizeBody(body);
    super(detail ? `${message}: ${detail}` : message);
    this.name = "AtlassianError";
    this.status = status;
    this.body = body;
  }
}

export function assertOk(status: number, body: unknown, context: string): void {
  if (status >= 200 && status < 300) return;
  throw new AtlassianError(`${context} failed: HTTP ${status}`, status, body);
}
