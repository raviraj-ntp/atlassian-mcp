/**
 * @raviraj87/atlassian-mcp · util/pagination.ts
 * API pagination helpers.
 *
 * Copyright (c) 2026 Ravi Raj · MIT License · see LICENSE
 */

import { PageResult } from "./response.js";

export function encodeCursor(start: number, limit: number): string {
  return Buffer.from(JSON.stringify({ start, limit }), "utf8").toString("base64url");
}

export function decodeCursor(cursor?: string): { start: number; limit: number } {
  if (!cursor) return { start: 0, limit: 50 };
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as {
      start?: number;
      limit?: number;
    };
    return { start: parsed.start ?? 0, limit: parsed.limit ?? 50 };
  } catch {
    return { start: 0, limit: 50 };
  }
}

export function pageSlice<T>(
  items: T[],
  start: number,
  limit: number,
): PageResult<T> {
  const slice = items.slice(start, start + limit);
  const nextStart = start + limit;
  return {
    items: slice,
    nextCursor: nextStart < items.length ? encodeCursor(nextStart, limit) : undefined,
    total: items.length,
  };
}
