/**
 * @raviraj87/atlassian-mcp · util/response.ts
 * MCP JSON response formatting.
 *
 * Copyright (c) 2026 Ravi Raj · MIT License · see LICENSE
 */

export function stringify(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

export function toContent(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

export function truncateText(text: string, maxChars = 12000): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n... [truncated ${text.length - maxChars} chars]`;
}

export function pickFields<T extends Record<string, unknown>>(
  obj: T,
  fields?: string[],
): Partial<T> {
  if (!fields?.length) return obj;
  const out: Partial<T> = {};
  for (const f of fields) {
    if (f in obj) out[f as keyof T] = obj[f as keyof T];
  }
  return out;
}

export type PageResult<T> = {
  items: T[];
  nextCursor?: string;
  total?: number;
};
