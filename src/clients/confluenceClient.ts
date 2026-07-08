/**
 * @raviraj87/atlassian-mcp · clients/confluenceClient.ts
 * Confluence REST API client (Server/DC and Cloud).
 *
 * Copyright (c) 2026 Ravi Raj · MIT License · see LICENSE
 */

import { ConfluenceConfig } from "../config/schema.js";
import { BaseClient } from "./baseClient.js";
import { RequestOptions } from "./types.js";

export type ContentFormat = "storage" | "view" | "both";

export class ConfluenceClient extends BaseClient {
  readonly flavor: "server" | "cloud";
  protected readonly apiPrefix: string;

  constructor(config: ConfluenceConfig, auth: Record<string, string>, cloudId?: string) {
    const usePlatform = config.flavor === "cloud" && !!cloudId;
    const baseUrl = usePlatform
      ? `https://api.atlassian.com/ex/confluence/${cloudId}`
      : config.url.replace(/\/+$/, "");
    super(baseUrl, auth);
    this.flavor = config.flavor;
    // Site URL (classic token): /wiki/rest/api — platform URL (scoped token / OAuth): /rest/api
    this.apiPrefix = config.flavor === "server" || usePlatform ? "/rest/api" : "/wiki/rest/api";
  }

  async raw(path: string, options: RequestOptions = {}): Promise<unknown> {
    const normalized = path.startsWith("/") ? path : `${this.apiPrefix}/${path}`;
    const { data } = await this.request(normalized, options);
    return data;
  }

  getPage(pageId: string, contentFormat: ContentFormat = "both") {
    const expand = ["version", "space", "ancestors", "metadata.labels"];
    if (contentFormat === "storage" || contentFormat === "both") expand.push("body.storage");
    if (contentFormat === "view" || contentFormat === "both") expand.push("body.view");
    return this.raw(`content/${encodeURIComponent(pageId)}`, {
      query: { expand: expand.join(",") },
    });
  }

  getPageChildren(pageId: string, start = 0, limit = 25) {
    return this.raw(`content/${encodeURIComponent(pageId)}/child/page`, {
      query: { start, limit, expand: "version,space" },
    });
  }

  getPageHistory(pageId: string, start = 0, limit = 25) {
    return this.raw(`content/${encodeURIComponent(pageId)}/history`, {
      query: { start, limit },
    });
  }

  createPage(
    spaceKey: string,
    title: string,
    body: string,
    options?: { parentId?: string; status?: "current" | "draft" },
    dryRun?: boolean,
  ) {
    const payload: Record<string, unknown> = {
      type: "page",
      title,
      space: { key: spaceKey },
      status: options?.status ?? "current",
      body: { storage: { value: body, representation: "storage" } },
    };
    if (options?.parentId) {
      payload.ancestors = [{ id: options.parentId }];
    }
    return this.raw("content", { method: "POST", body: payload, dryRun });
  }

  async updatePage(
    pageId: string,
    fields: { title?: string; body?: string; version?: number; status?: "current" | "draft" },
    dryRun?: boolean,
  ) {
    const current = fields.version
      ? null
      : ((await this.getPage(pageId, "storage")) as { version?: { number?: number } });
    const currentVersion = fields.version ?? current?.version?.number;
    if (currentVersion === undefined) {
      throw new Error(`Could not determine version for page ${pageId}`);
    }

    const payload: Record<string, unknown> = {
      type: "page",
      version: { number: currentVersion + 1 },
    };
    if (fields.title !== undefined) payload.title = fields.title;
    if (fields.status !== undefined) payload.status = fields.status;
    if (fields.body !== undefined) {
      payload.body = { storage: { value: fields.body, representation: "storage" } };
    }

    return this.raw(`content/${encodeURIComponent(pageId)}`, {
      method: "PUT",
      body: payload,
      dryRun,
    });
  }

  deletePage(pageId: string, dryRun?: boolean) {
    return this.raw(`content/${encodeURIComponent(pageId)}`, { method: "DELETE", dryRun });
  }

  listSpaces(start = 0, limit = 25) {
    return this.raw("space", { query: { start, limit, expand: "description,homepage" } });
  }

  getPageByTitle(spaceKey: string, title: string) {
    const cql = `space="${spaceKey}" AND type=page AND title="${title.replace(/"/g, '\\"')}"`;
    return this.searchCql(cql, 0, 5);
  }

  addLabel(pageId: string, name: string, prefix = "global", dryRun?: boolean) {
    return this.raw(`content/${encodeURIComponent(pageId)}/label`, {
      method: "POST",
      body: { prefix, name },
      dryRun,
    });
  }

  removeLabel(pageId: string, name: string, prefix = "global", dryRun?: boolean) {
    return this.raw(`content/${encodeURIComponent(pageId)}/label`, {
      method: "DELETE",
      query: { name, prefix },
      dryRun,
    });
  }

  getComments(pageId: string, start = 0, limit = 25) {
    return this.raw(`content/${encodeURIComponent(pageId)}/child/comment`, {
      query: { start, limit, expand: "body.view,version,history" },
    });
  }

  addComment(pageId: string, body: string, dryRun?: boolean) {
    return this.raw(`content/${encodeURIComponent(pageId)}/child/comment`, {
      method: "POST",
      body: {
        type: "comment",
        body: { storage: { value: body, representation: "storage" } },
      },
      dryRun,
    });
  }

  async updateComment(
    commentId: string,
    body: string,
    version?: number,
    dryRun?: boolean,
  ) {
    let ver = version;
    if (ver === undefined) {
      const current = (await this.raw(`content/${encodeURIComponent(commentId)}`, {
        query: { expand: "version" },
      })) as { version?: { number?: number } };
      ver = current.version?.number;
    }
    if (ver === undefined) throw new Error(`Could not determine version for comment ${commentId}`);

    return this.raw(`content/${encodeURIComponent(commentId)}`, {
      method: "PUT",
      body: {
        type: "comment",
        version: { number: ver + 1 },
        body: { storage: { value: body, representation: "storage" } },
      },
      dryRun,
    });
  }

  deleteComment(commentId: string, dryRun?: boolean) {
    return this.raw(`content/${encodeURIComponent(commentId)}`, { method: "DELETE", dryRun });
  }

  getAttachments(pageId: string, start = 0, limit = 25) {
    return this.raw(`content/${encodeURIComponent(pageId)}/child/attachment`, {
      query: { start, limit, expand: "version,container" },
    });
  }

  async addAttachment(pageId: string, filename: string, contentBase64: string, dryRun?: boolean) {
    if (dryRun) return { dryRun: true, pageId, filename };
    const bytes = Buffer.from(contentBase64, "base64");
    const form = new FormData();
    form.append("file", new Blob([bytes]), filename);
    const { data } = await this.request(
      `${this.apiPrefix}/content/${encodeURIComponent(pageId)}/child/attachment`,
      {
        method: "POST",
        headers: { "X-Atlassian-Token": "no-check" },
        body: form,
      },
    );
    return data;
  }

  deleteAttachment(attachmentId: string, dryRun?: boolean) {
    return this.raw(`content/${encodeURIComponent(attachmentId)}`, { method: "DELETE", dryRun });
  }

  async restorePageVersion(pageId: string, versionNumber: number, dryRun?: boolean) {
    const historical = (await this.raw(
      `content/${encodeURIComponent(pageId)}/history/${versionNumber}`,
      { query: { expand: "body.storage" } },
    )) as { title?: string; body?: { storage?: { value?: string } } };
    const body = historical.body?.storage?.value;
    if (body === undefined) throw new Error(`No body found for page ${pageId} version ${versionNumber}`);
    return this.updatePage(pageId, { title: historical.title, body }, dryRun);
  }

  movePage(
    pageId: string,
    targetId: string,
    position: "append" | "above" | "below" = "append",
    dryRun?: boolean,
  ) {
    return this.raw(`content/${encodeURIComponent(pageId)}/move/${position}/${encodeURIComponent(targetId)}`, {
      method: "PUT",
      dryRun,
    });
  }

  searchCql(cql: string, start = 0, limit = 25) {
    return this.raw("content/search", {
      query: { cql, start, limit, expand: "space,version" },
    });
  }

  getSpace(spaceKey: string) {
    return this.raw(`space/${encodeURIComponent(spaceKey)}`);
  }

  whoAmI() {
    return this.raw("user/current");
  }
}
