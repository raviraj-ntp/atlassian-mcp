/**
 * @raviraj87/atlassian-mcp · clients/baseClient.ts
 * Shared HTTP client utilities and auth helpers.
 *
 * Copyright (c) 2026 Ravi Raj · MIT License · see LICENSE
 */

import { AtlassianError, assertOk } from "../util/errors.js";
import { AuthHeaders, HttpResult, RequestOptions } from "./types.js";

export class BaseClient {
  constructor(
    protected readonly baseUrl: string,
    protected readonly auth: AuthHeaders,
  ) {}

  protected buildUrl(path: string, query?: RequestOptions["query"]): string {
    const url = new URL(path.startsWith("http") ? path : `${this.baseUrl}${path}`);
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v === undefined) continue;
        url.searchParams.set(k, String(v));
      }
    }
    return url.toString();
  }

  async request(path: string, options: RequestOptions = {}): Promise<HttpResult> {
    if (options.dryRun) {
      return {
        status: 200,
        data: { dryRun: true, method: options.method ?? "GET", path, body: options.body ?? null },
        headers: new Headers(),
      };
    }

    const headers: Record<string, string> = {
      Accept: "application/json",
      ...this.auth,
      ...(options.headers ?? {}),
    };

    let body: BodyInit | undefined;
    if (options.body !== undefined) {
      if (options.body instanceof FormData) {
        body = options.body;
      } else if (typeof options.body === "string") {
        body = options.body;
      } else {
        headers["Content-Type"] ??= "application/json";
        body = JSON.stringify(options.body);
      }
    }

    let attempt = 0;
    while (true) {
      attempt += 1;
      const res = await fetch(this.buildUrl(path, options.query), {
        method: options.method ?? "GET",
        headers,
        body,
      });

      if (res.status === 429 && attempt < 4) {
        const retryAfter = Number(res.headers.get("retry-after") ?? "1");
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        continue;
      }

      const data = options.expectText ? await res.text() : await this.parseBody(res);
      if (!res.ok) {
        throw new AtlassianError(`HTTP ${res.status} for ${path}`, res.status, data);
      }
      return { status: res.status, data, headers: res.headers };
    }
  }

  private async parseBody(res: Response): Promise<unknown> {
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  protected ok(data: unknown, status: number, context: string): unknown {
    assertOk(status, data, context);
    return data;
  }
}

export function basicAuth(user: string, token: string): AuthHeaders {
  return { Authorization: `Basic ${Buffer.from(`${user}:${token}`).toString("base64")}` };
}

export function bearerAuth(token: string): AuthHeaders {
  return { Authorization: `Bearer ${token}` };
}
