/**
 * @raviraj87/atlassian-mcp · clients/bitbucketClient.ts
 * Bitbucket REST API client (Server and Cloud).
 *
 * Copyright (c) 2026 Ravi Raj · MIT License · see LICENSE
 */

import { BaseClient } from "./baseClient.js";
import { BitbucketConfig } from "../config/schema.js";
import { RequestOptions } from "./types.js";

type RepoRef = { project: string; repository: string };

export class BitbucketClient extends BaseClient {
  readonly flavor: "server" | "cloud";
  readonly workspace?: string;

  constructor(config: BitbucketConfig, auth: Record<string, string>) {
    super(
      config.flavor === "cloud" ? "https://api.bitbucket.org/2.0" : config.url.replace(/\/+$/, ""),
      auth,
    );
    this.flavor = config.flavor;
    this.workspace = config.flavor === "cloud" ? config.workspace : undefined;
  }

  private repoBase({ project, repository }: RepoRef): string {
    if (this.flavor === "cloud") {
      return `/repositories/${encodeURIComponent(this.workspace!)}/${encodeURIComponent(repository)}`;
    }
    return `/rest/api/1.0/projects/${encodeURIComponent(project)}/repos/${encodeURIComponent(repository)}`;
  }

  async raw(path: string, options: RequestOptions = {}): Promise<unknown> {
    const { data } = await this.request(path.startsWith("http") ? path : path.startsWith("/") ? path : `/${path}`, options);
    return data;
  }

  listProjects(start = 0, limit = 50) {
    if (this.flavor === "cloud") {
      return this.raw(`/workspaces/${encodeURIComponent(this.workspace!)}/projects`, {
        query: { pagelen: limit, page: Math.floor(start / limit) + 1 },
      });
    }
    return this.raw("/rest/api/1.0/projects", { query: { start, limit } });
  }

  listRepositories(project: string, start = 0, limit = 50) {
    if (this.flavor === "cloud") {
      return this.raw(`/repositories/${encodeURIComponent(this.workspace!)}`, {
        query: { q: `project.key="${project}"`, pagelen: limit, page: Math.floor(start / limit) + 1 },
      });
    }
    return this.raw(`/rest/api/1.0/projects/${encodeURIComponent(project)}/repos`, {
      query: { start, limit },
    });
  }

  searchRepositories(query: string, start = 0, limit = 50) {
    if (this.flavor === "cloud") {
      return this.raw(`/repositories/${encodeURIComponent(this.workspace!)}`, {
        query: { q: `name ~ "${query}"`, pagelen: limit },
      });
    }
    return this.raw("/rest/api/1.0/repos", { query: { name: query, start, limit } });
  }

  getRepository(ref: RepoRef) {
    return this.raw(this.repoBase(ref));
  }

  listBranches(ref: RepoRef, start = 0, limit = 50) {
    if (this.flavor === "cloud") {
      return this.raw(`${this.repoBase(ref)}/refs/branches`, { query: { pagelen: limit } });
    }
    return this.raw(`${this.repoBase(ref)}/branches`, { query: { start, limit } });
  }

  getBranch(ref: RepoRef, branch: string) {
    if (this.flavor === "cloud") {
      return this.raw(`${this.repoBase(ref)}/refs/branches/${encodeURIComponent(branch)}`);
    }
    return this.raw(`${this.repoBase(ref)}/branches`, { query: { filterText: branch, limit: 1 } });
  }

  createBranch(ref: RepoRef, name: string, startPoint: string, dryRun?: boolean) {
    if (this.flavor === "cloud") {
      return this.raw(`${this.repoBase(ref)}/refs/branches`, {
        method: "POST",
        body: { name, target: { hash: startPoint } },
        dryRun,
      });
    }
    return this.raw(`${this.repoBase(ref)}/branches`, {
      method: "POST",
      body: { name, startPoint },
      dryRun,
    });
  }

  deleteBranch(ref: RepoRef, branch: string, dryRun?: boolean) {
    if (this.flavor === "cloud") {
      return this.raw(`${this.repoBase(ref)}/refs/branches/${encodeURIComponent(branch)}`, {
        method: "DELETE",
        dryRun,
      });
    }
    return this.raw(`${this.repoBase(ref)}/branches`, {
      method: "DELETE",
      query: { name: branch },
      dryRun,
    });
  }

  listTags(ref: RepoRef, start = 0, limit = 50) {
    if (this.flavor === "cloud") {
      return this.raw(`${this.repoBase(ref)}/refs/tags`, { query: { pagelen: limit } });
    }
    return this.raw(`${this.repoBase(ref)}/tags`, { query: { start, limit } });
  }

  getCommit(ref: RepoRef, commitId: string) {
    if (this.flavor === "cloud") {
      return this.raw(`${this.repoBase(ref)}/commit/${encodeURIComponent(commitId)}`);
    }
    return this.raw(`${this.repoBase(ref)}/commits/${encodeURIComponent(commitId)}`);
  }

  listCommits(ref: RepoRef, branch?: string, start = 0, limit = 50) {
    if (this.flavor === "cloud") {
      return this.raw(`${this.repoBase(ref)}/commits/${encodeURIComponent(branch ?? "main")}`, {
        query: { pagelen: limit },
      });
    }
    return this.raw(`${this.repoBase(ref)}/commits`, {
      query: { until: branch, start, limit },
    });
  }

  listPullRequests(ref: RepoRef, state = "OPEN", start = 0, limit = 50) {
    if (this.flavor === "cloud") {
      return this.raw(`${this.repoBase(ref)}/pullrequests`, {
        query: { state: state.toLowerCase(), pagelen: limit },
      });
    }
    return this.raw(`${this.repoBase(ref)}/pull-requests`, {
      query: { state, start, limit, order: "NEWEST" },
    });
  }

  getPullRequest(ref: RepoRef, pullRequestId: number) {
    if (this.flavor === "cloud") {
      return this.raw(`${this.repoBase(ref)}/pullrequests/${pullRequestId}`);
    }
    return this.raw(`${this.repoBase(ref)}/pull-requests/${pullRequestId}`);
  }

  createPullRequest(
    ref: RepoRef,
    title: string,
    fromRef: string,
    toRef: string,
    description?: string,
    dryRun?: boolean,
  ) {
    if (this.flavor === "cloud") {
      return this.raw(`${this.repoBase(ref)}/pullrequests`, {
        method: "POST",
        body: {
          title,
          description,
          source: { branch: { name: fromRef } },
          destination: { branch: { name: toRef } },
        },
        dryRun,
      });
    }
    return this.raw(`${this.repoBase(ref)}/pull-requests`, {
      method: "POST",
      body: {
        title,
        description,
        fromRef: { id: `refs/heads/${fromRef}` },
        toRef: { id: `refs/heads/${toRef}` },
      },
      dryRun,
    });
  }

  updatePullRequest(ref: RepoRef, pullRequestId: number, fields: Record<string, unknown>, dryRun?: boolean) {
    const path =
      this.flavor === "cloud"
        ? `${this.repoBase(ref)}/pullrequests/${pullRequestId}`
        : `${this.repoBase(ref)}/pull-requests/${pullRequestId}`;
    return this.raw(path, { method: "PUT", body: fields, dryRun });
  }

  mergePullRequest(ref: RepoRef, pullRequestId: number, dryRun?: boolean) {
    const path =
      this.flavor === "cloud"
        ? `${this.repoBase(ref)}/pullrequests/${pullRequestId}/merge`
        : `${this.repoBase(ref)}/pull-requests/${pullRequestId}/merge`;
    return this.raw(path, { method: "POST", body: {}, dryRun });
  }

  declinePullRequest(ref: RepoRef, pullRequestId: number, dryRun?: boolean) {
    const path =
      this.flavor === "cloud"
        ? `${this.repoBase(ref)}/pullrequests/${pullRequestId}/decline`
        : `${this.repoBase(ref)}/pull-requests/${pullRequestId}/decline`;
    return this.raw(path, { method: "POST", body: {}, dryRun });
  }

  getPullRequestDiff(ref: RepoRef, pullRequestId: number, contextLines = 3, maxChars = 12000) {
    const path =
      this.flavor === "cloud"
        ? `${this.repoBase(ref)}/pullrequests/${pullRequestId}/diff`
        : `${this.repoBase(ref)}/pull-requests/${pullRequestId}.diff`;
    return this.request(path, { expectText: true, query: { contextLines } }).then((r) => {
      const text = String(r.data ?? "");
      return text.length > maxChars
        ? { summary: true, chars: text.length, preview: text.slice(0, maxChars) }
        : { summary: false, diff: text };
    });
  }

  listPullRequestCommits(ref: RepoRef, pullRequestId: number) {
    const path =
      this.flavor === "cloud"
        ? `${this.repoBase(ref)}/pullrequests/${pullRequestId}/commits`
        : `${this.repoBase(ref)}/pull-requests/${pullRequestId}/commits`;
    return this.raw(path);
  }

  addPullRequestComment(ref: RepoRef, pullRequestId: number, text: string, dryRun?: boolean) {
    const path =
      this.flavor === "cloud"
        ? `${this.repoBase(ref)}/pullrequests/${pullRequestId}/comments`
        : `${this.repoBase(ref)}/pull-requests/${pullRequestId}/comments`;
    const body = this.flavor === "cloud" ? { content: { raw: text } } : { text };
    return this.raw(path, { method: "POST", body, dryRun });
  }

  deletePullRequestComment(ref: RepoRef, pullRequestId: number, commentId: number, dryRun?: boolean) {
    const path =
      this.flavor === "cloud"
        ? `${this.repoBase(ref)}/pullrequests/${pullRequestId}/comments/${commentId}`
        : `${this.repoBase(ref)}/pull-requests/${pullRequestId}/comments/${commentId}`;
    return this.raw(path, { method: "DELETE", dryRun });
  }

  setPullRequestApproval(ref: RepoRef, pullRequestId: number, approved: boolean, dryRun?: boolean) {
    const path =
      this.flavor === "cloud"
        ? `${this.repoBase(ref)}/pullrequests/${pullRequestId}/approve`
        : `${this.repoBase(ref)}/pull-requests/${pullRequestId}/approve`;
    return this.raw(path, { method: approved ? "POST" : "DELETE", dryRun });
  }

  setReviewStatus(
    ref: RepoRef,
    pullRequestId: number,
    requestChanges: boolean,
    comment?: string,
    dryRun?: boolean,
  ) {
    if (this.flavor === "cloud") {
      const path = `${this.repoBase(ref)}/pullrequests/${pullRequestId}/request-changes`;
      return requestChanges
        ? this.raw(path, { method: "POST", dryRun })
        : this.raw(`${this.repoBase(ref)}/pullrequests/${pullRequestId}/approve`, { method: "DELETE", dryRun });
    }
    const path = `${this.repoBase(ref)}/pull-requests/${pullRequestId}/participants`;
    const body = { status: requestChanges ? "NEEDS_WORK" : "UNAPPROVED", comment };
    return this.raw(path, { method: "PUT", body, dryRun });
  }

  listPullRequestTasks(ref: RepoRef, pullRequestId: number) {
    if (this.flavor === "cloud") {
      return this.raw(`${this.repoBase(ref)}/pullrequests/${pullRequestId}/tasks`);
    }
    return this.raw(`${this.repoBase(ref)}/pull-requests/${pullRequestId}/tasks`);
  }

  createPullRequestTask(ref: RepoRef, pullRequestId: number, text: string, dryRun?: boolean) {
    const path =
      this.flavor === "cloud"
        ? `${this.repoBase(ref)}/pullrequests/${pullRequestId}/tasks`
        : `${this.repoBase(ref)}/pull-requests/${pullRequestId}/tasks`;
    return this.raw(path, { method: "POST", body: { text }, dryRun });
  }

  updatePullRequestTask(ref: RepoRef, pullRequestId: number, taskId: number, text: string, dryRun?: boolean) {
    const path =
      this.flavor === "cloud"
        ? `${this.repoBase(ref)}/pullrequests/${pullRequestId}/tasks/${taskId}`
        : `${this.repoBase(ref)}/pull-requests/${pullRequestId}/tasks/${taskId}`;
    return this.raw(path, { method: "PUT", body: { text }, dryRun });
  }

  deletePullRequestTask(ref: RepoRef, pullRequestId: number, taskId: number, dryRun?: boolean) {
    const path =
      this.flavor === "cloud"
        ? `${this.repoBase(ref)}/pullrequests/${pullRequestId}/tasks/${taskId}`
        : `${this.repoBase(ref)}/pull-requests/${pullRequestId}/tasks/${taskId}`;
    return this.raw(path, { method: "DELETE", dryRun });
  }

  setPullRequestTaskStatus(ref: RepoRef, pullRequestId: number, taskId: number, state: "OPEN" | "RESOLVED", dryRun?: boolean) {
    const path =
      this.flavor === "cloud"
        ? `${this.repoBase(ref)}/pullrequests/${pullRequestId}/tasks/${taskId}`
        : `${this.repoBase(ref)}/pull-requests/${pullRequestId}/tasks/${taskId}`;
    return this.raw(path, { method: "PUT", body: { state }, dryRun });
  }

  convertPullRequestItem(
    ref: RepoRef,
    pullRequestId: number,
    id: number,
    direction: "to_task" | "to_comment",
    dryRun?: boolean,
  ) {
    if (this.flavor === "cloud") {
      throw new Error("convertPullRequestItem is Bitbucket Server/DC only");
    }
    const base = `${this.repoBase(ref)}/pull-requests/${pullRequestId}`;
    if (direction === "to_task") {
      return this.raw(`${base}/comments/${id}`, { method: "PUT", body: { task: true }, dryRun });
    }
    return this.raw(`${base}/tasks/${id}`, { method: "PUT", body: { task: false }, dryRun });
  }

  listPullRequestComments(ref: RepoRef, pullRequestId: number, start = 0, limit = 50) {
    const path =
      this.flavor === "cloud"
        ? `${this.repoBase(ref)}/pullrequests/${pullRequestId}/comments`
        : `${this.repoBase(ref)}/pull-requests/${pullRequestId}/comments`;
    return this.raw(path, { query: { start, limit } });
  }

  getPullRequestChanges(ref: RepoRef, pullRequestId: number) {
    if (this.flavor === "cloud") {
      return this.raw(`${this.repoBase(ref)}/pullrequests/${pullRequestId}/diffstat`);
    }
    return this.raw(`${this.repoBase(ref)}/pull-requests/${pullRequestId}/changes`);
  }

  createRepository(project: string, name: string, dryRun?: boolean) {
    if (this.flavor === "cloud") {
      return this.raw(`/repositories/${encodeURIComponent(this.workspace!)}`, {
        method: "POST",
        body: { scm: "git", project: { key: project }, name, is_private: true },
        dryRun,
      });
    }
    return this.raw(`/rest/api/1.0/projects/${encodeURIComponent(project)}/repos`, {
      method: "POST",
      body: { name, scmId: "git" },
      dryRun,
    });
  }

  createTag(ref: RepoRef, name: string, startPoint: string, message?: string, dryRun?: boolean) {
    if (this.flavor === "cloud") {
      return this.raw(`${this.repoBase(ref)}/refs/tags`, {
        method: "POST",
        body: { name, target: { hash: startPoint }, message },
        dryRun,
      });
    }
    return this.raw(`${this.repoBase(ref)}/tags`, {
      method: "POST",
      body: { name, startPoint, message },
      dryRun,
    });
  }

  getFileBlame(ref: RepoRef, filePath: string, branch?: string, startLine?: number, lineCount?: number) {
    if (this.flavor === "cloud") {
      return this.raw(`${this.repoBase(ref)}/filehistory/${encodeURIComponent(branch ?? "HEAD")}/${filePath}`, {
        query: { startLine, lineCount },
      });
    }
    const at = branch ? `refs/heads/${branch}` : undefined;
    return this.raw(`${this.repoBase(ref)}/browse/${filePath}`, {
      query: { blame: true, noContent: true, ...(at ? { at } : {}) },
    });
  }

  searchFiles(ref: RepoRef, pattern?: string, subPath?: string, branch?: string, limit = 100) {
    if (this.flavor === "cloud") {
      const q = pattern ? `path ~ "${pattern}"` : undefined;
      return this.raw(`${this.repoBase(ref)}/src/${encodeURIComponent(branch ?? "HEAD")}/${subPath ?? ""}`, {
        query: q ? { q, pagelen: limit } : { pagelen: limit },
      });
    }
    const at = branch ? `refs/heads/${branch}` : undefined;
    return this.raw(`${this.repoBase(ref)}/files`, {
      query: { filter: pattern, limit, ...(subPath ? { prefix: subPath } : {}), ...(at ? { at } : {}) },
    });
  }

  async findInFiles(
    ref: RepoRef,
    contentQuery: string,
    filenamePattern?: string,
    branch?: string,
    maxFiles = 300,
    limit = 25,
    parallelism = 4,
  ) {
    const filesResp = (await this.searchFiles(ref, filenamePattern ?? "**/*", undefined, branch, maxFiles)) as {
      values?: Array<{ path?: string; name?: string }>;
      children?: { values?: Array<{ path?: { toString?: () => string } }> };
    };
    const paths: string[] = [];
    for (const v of filesResp.values ?? []) {
      if (v.path) paths.push(v.path);
      else if (v.name) paths.push(v.name);
    }
    const regex = new RegExp(contentQuery, "i");
    const hits: Array<{ path: string; line: number; text: string }> = [];
    let scanned = 0;
    for (const path of paths) {
      if (hits.length >= limit || scanned >= maxFiles) break;
      scanned += 1;
      try {
        const content = String(await this.getFileContent(ref, path, branch ? `refs/heads/${branch}` : undefined));
        const lines = content.split(/\r?\n/);
        for (let i = 0; i < lines.length; i += 1) {
          if (regex.test(lines[i])) {
            hits.push({ path, line: i + 1, text: lines[i] });
            if (hits.length >= limit) break;
          }
        }
      } catch {
        // skip unreadable files
      }
      if (scanned % parallelism === 0) await Promise.resolve();
    }
    return { engine: "find_in_files", scanned, truncated: scanned >= maxFiles, hits };
  }

  manageAttachment(ref: RepoRef, action: "download" | "delete", attachmentId: string, dryRun?: boolean) {
    if (this.flavor === "cloud") {
      throw new Error("manageAttachment is Bitbucket Server/DC only");
    }
    const path = `${this.repoBase(ref)}/attachments/${attachmentId}`;
    if (action === "delete") {
      return this.raw(path, { method: "DELETE", dryRun });
    }
    return this.request(path, { expectText: true }).then((r) => ({ attachmentId, content: r.data }));
  }

  addPullRequestReviewer(ref: RepoRef, pullRequestId: number, userSlug: string, dryRun?: boolean) {
    const path =
      this.flavor === "cloud"
        ? `${this.repoBase(ref)}/pullrequests/${pullRequestId}/participants/${userSlug}`
        : `${this.repoBase(ref)}/pull-requests/${pullRequestId}/participants`;
    const body = this.flavor === "cloud" ? undefined : { user: { name: userSlug }, role: "REVIEWER" };
    return this.raw(path, { method: "POST", body, dryRun });
  }

  getFileContent(ref: RepoRef, path: string, at?: string) {
    if (this.flavor === "cloud") {
      return this.raw(`${this.repoBase(ref)}/src/${encodeURIComponent(at ?? "HEAD")}/${path}`, {
        expectText: true,
      } as RequestOptions);
    }
    return this.raw(`${this.repoBase(ref)}/browse/${path}`, {
      query: at ? { at } : undefined,
      expectText: true,
    } as RequestOptions);
  }

  listDirectory(ref: RepoRef, path = "", at?: string) {
    if (this.flavor === "cloud") {
      return this.raw(`${this.repoBase(ref)}/src/${encodeURIComponent(at ?? "HEAD")}/${path}`);
    }
    return this.raw(`${this.repoBase(ref)}/browse/${path}`, { query: at ? { at } : undefined });
  }

  searchCode(ref: RepoRef, query: string, start = 0, limit = 25) {
    if (this.flavor === "cloud") {
      return this.raw(`${this.repoBase(ref)}/src/${encodeURIComponent("HEAD")}/?q=${encodeURIComponent(query)}`);
    }
    return this.raw(`${this.repoBase(ref)}/search`, { query: { code: query, start, limit } });
  }

  getBuildStatus(ref: RepoRef, commitId: string) {
    if (this.flavor === "cloud") {
      return this.raw(`/repositories/${encodeURIComponent(this.workspace!)}/${encodeURIComponent(ref.repository)}/commit/${commitId}/statuses`);
    }
    return this.raw(`${this.repoBase(ref)}/commits/${commitId}/builds`);
  }

  setBuildStatus(
    ref: RepoRef,
    commitId: string,
    key: string,
    state: "SUCCESSFUL" | "FAILED" | "INPROGRESS",
    url: string,
    description?: string,
    dryRun?: boolean,
  ) {
    if (this.flavor === "cloud") {
      return this.raw(`/repositories/${encodeURIComponent(this.workspace!)}/${encodeURIComponent(ref.repository)}/commit/${commitId}/statuses/build`, {
        method: "POST",
        body: { key, state, url, description },
        dryRun,
      });
    }
    return this.raw(`${this.repoBase(ref)}/commits/${commitId}/builds`, {
      method: "POST",
      body: { key, state, url, description },
      dryRun,
    });
  }

  listWebhooks(ref: RepoRef) {
    if (this.flavor === "cloud") {
      return this.raw(`${this.repoBase(ref)}/hooks`);
    }
    return this.raw(`${this.repoBase(ref)}/webhooks`);
  }

  createWebhook(ref: RepoRef, events: string[], url: string, dryRun?: boolean) {
    if (this.flavor === "cloud") {
      return this.raw(`${this.repoBase(ref)}/hooks`, {
        method: "POST",
        body: { description: "atlassian-mcp", url, active: true, events },
        dryRun,
      });
    }
    return this.raw(`${this.repoBase(ref)}/webhooks`, {
      method: "POST",
      body: { events, url, active: true },
      dryRun,
    });
  }

  deleteWebhook(ref: RepoRef, webhookId: string, dryRun?: boolean) {
    if (this.flavor === "cloud") {
      return this.raw(`${this.repoBase(ref)}/hooks/${webhookId}`, { method: "DELETE", dryRun });
    }
    return this.raw(`${this.repoBase(ref)}/webhooks/${webhookId}`, { method: "DELETE", dryRun });
  }

  searchUsers(query: string, start = 0, limit = 25) {
    if (this.flavor === "cloud") {
      return this.raw("/users", { query: { q: query, pagelen: limit } });
    }
    return this.raw("/rest/api/1.0/users", { query: { filter: query, start, limit } });
  }
}
