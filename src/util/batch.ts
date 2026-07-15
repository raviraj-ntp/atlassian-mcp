/**
 * @raviraj87/atlassian-mcp · util/batch.ts
 * Batch executor for multi-item MCP operations.
 *
 * Copyright (c) 2026 Ravi Raj · MIT License · see LICENSE
 */

import { AtlassianError } from "./errors.js";

export type BatchMode = "sequential" | "parallel";
export type OnError = "continue" | "stop";

export interface BatchOptions {
  mode?: BatchMode;
  onError?: OnError;
  parallelism?: number;
  dryRun?: boolean;
  retries?: number;
}

export interface BatchItemResult<T> {
  item: string;
  ok: boolean;
  data?: T;
  error?: string;
  status?: number;
}

export interface BatchResult<T> {
  total: number;
  succeeded: number;
  failed: number;
  mode: BatchMode;
  onError: OnError;
  dryRun: boolean;
  results: BatchItemResult<T>[];
}

function toBatchError(e: unknown): { message: string; status?: number } {
  if (e instanceof AtlassianError) {
    return { message: e.message, status: e.status };
  }
  if (e instanceof Error) {
    return { message: e.message };
  }
  return { message: String(e) };
}

export async function runBatch<TItem, TResult>(
  items: TItem[],
  label: (item: TItem) => string,
  fn: (item: TItem) => Promise<TResult>,
  options: BatchOptions = {},
): Promise<BatchResult<TResult>> {
  const mode = options.mode ?? "parallel";
  const onError = options.onError ?? "continue";
  const parallelism = Math.max(1, options.parallelism ?? 4);
  const dryRun = options.dryRun ?? false;
  const results: BatchItemResult<TResult>[] = new Array(items.length);
  let stopped = false;

  const retries = Math.max(0, options.retries ?? 0);

  const runOne = async (item: TItem, index: number): Promise<boolean> => {
    let lastErr: { message: string; status?: number } | undefined;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        const data = await fn(item);
        results[index] = { item: label(item), ok: true, data };
        return true;
      } catch (e) {
        lastErr = toBatchError(e);
        const retryable = lastErr.status === 429 || lastErr.status === 503;
        if (retryable && attempt < retries) {
          await new Promise((r) => setTimeout(r, (attempt + 1) * 500));
          continue;
        }
        break;
      }
    }
    results[index] = {
      item: label(item),
      ok: false,
      error: lastErr!.message,
      status: lastErr!.status,
    };
    return false;
  };

  if (mode === "sequential") {
    for (let i = 0; i < items.length; i += 1) {
      if (stopped) break;
      const ok = await runOne(items[i], i);
      if (!ok && onError === "stop") stopped = true;
    }
  } else {
    let next = 0;
    const worker = async () => {
      while (!stopped) {
        const i = next;
        next += 1;
        if (i >= items.length) return;
        const ok = await runOne(items[i], i);
        if (!ok && onError === "stop") stopped = true;
      }
    };
    await Promise.all(Array.from({ length: Math.min(parallelism, items.length) }, () => worker()));
  }

  const settled = results.filter(Boolean);
  const succeeded = settled.filter((r) => r.ok).length;
  return {
    total: items.length,
    succeeded,
    failed: settled.length - succeeded,
    mode,
    onError,
    dryRun,
    results: settled,
  };
}
