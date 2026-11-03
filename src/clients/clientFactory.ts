/**
 * @raviraj87/atlassian-mcp · clients/clientFactory.ts
 * Named connection factory for Jira and Bitbucket clients.
 *
 * Copyright (c) 2026 Ravi Raj · MIT License · see LICENSE
 */

import { envIfSet, loadConfig } from "../config/loadConfig.js";
import { AppConfig, BitbucketConfig, ConfluenceConfig, JiraConfig } from "../config/schema.js";
import { basicAuth, bearerAuth } from "./baseClient.js";
import { BitbucketClient } from "./bitbucketClient.js";
import { ConfluenceClient } from "./confluenceClient.js";
import { JiraClient } from "./jiraClient.js";
import { RichFiltersClient } from "./richFiltersClient.js";

export type ConnectionClients = {
  name: string;
  jira?: JiraClient;
  bitbucket?: BitbucketClient;
  confluence?: ConfluenceClient;
};

export class ClientFactory {
  private readonly config: AppConfig;
  private readonly cache = new Map<string, ConnectionClients>();

  constructor(config?: AppConfig) {
    this.config = config ?? loadConfig();
    for (const { name, missing } of this.skippedConnections()) {
      console.error(`atlassian-mcp: skipped "${name}" until set: ${missing.join(", ")}`);
    }
    if (!this.listConnections().length) {
      const detail = this.skippedConnections().map((s) => `${s.name}: ${s.missing.join(", ")}`).join("; ");
      throw new Error(`No Atlassian token is set. ${detail}`);
    }
  }

  private isReady(name: string): boolean {
    const entry = this.config.connections[name];
    if (!entry) return false;
    if (entry.jira && jiraGaps(entry.jira).length === 0) return true;
    if (entry.bitbucket && bitbucketGaps(entry.bitbucket).length === 0) return true;
    if (entry.confluence && confluenceGaps(entry.confluence).length === 0) return true;
    return false;
  }

  private missingEnv(name: string): string[] {
    const entry = this.config.connections[name];
    if (!entry) return [];
    return missingNames([
      ...(entry.jira ? jiraGaps(entry.jira) : []),
      ...(entry.bitbucket ? bitbucketGaps(entry.bitbucket) : []),
      ...(entry.confluence ? confluenceGaps(entry.confluence) : []),
    ]);
  }

  listConnections(): string[] {
    return Object.keys(this.config.connections).filter((name) => this.isReady(name));
  }

  /** Sites whose token env vars are unset. Callers should ignore these. */
  skippedConnections(): { name: string; missing: string[] }[] {
    return Object.keys(this.config.connections)
      .filter((name) => !this.isReady(name))
      .map((name) => ({ name, missing: this.missingEnv(name) }));
  }

  listConfluenceConnections(): string[] {
    return Object.entries(this.config.connections)
      .filter(([, entry]) => entry.confluence && confluenceGaps(entry.confluence).length === 0)
      .map(([name]) => name);
  }

  defaultConnection(): string {
    const ready = this.listConnections();
    if (ready.includes(this.config.default_connection)) return this.config.default_connection;
    if (ready[0]) return ready[0];
    return this.config.default_connection;
  }

  get(connection?: string): ConnectionClients {
    const name = connection ?? this.defaultConnection();
    const cached = this.cache.get(name);
    if (cached) return cached;

    const entry = this.config.connections[name];
    if (!entry) throw new Error(`Unknown connection: ${name}`);
    if (!this.isReady(name)) {
      throw new Error(`Connection "${name}" needs ${this.missingEnv(name).join(", ")}.`);
    }

    const clients: ConnectionClients = { name };

    if (entry.jira) {
      const auth = jiraAuth(entry.jira);
      if (auth) clients.jira = new JiraClient(entry.jira, auth);
    }

    if (entry.bitbucket) {
      const auth = bitbucketAuth(entry.bitbucket);
      if (auth) clients.bitbucket = new BitbucketClient(entry.bitbucket, auth);
    }

    if (entry.confluence) {
      const auth = confluenceAuth(entry.confluence);
      if (auth) {
        const cloudId = entry.confluence.flavor === "cloud" ? resolveConfluenceCloudId(entry.confluence) : undefined;
        clients.confluence = new ConfluenceClient(entry.confluence, auth, cloudId);
      }
    }

    this.cache.set(name, clients);
    return clients;
  }

  requireJira(connection?: string): JiraClient {
    const name = connection ?? this.defaultConnection();
    const jira = this.get(name).jira;
    if (!jira) {
      const entry = this.config.connections[name];
      const missing = entry?.jira ? missingNames(jiraGaps(entry.jira)) : [];
      throw new Error(
        missing.length
          ? `Jira on "${name}" needs ${missing.join(", ")}.`
          : `Jira is not configured for connection "${name}".`,
      );
    }
    return jira;
  }

  richFilters(connection?: string): RichFiltersClient {
    return new RichFiltersClient(this.requireJira(connection));
  }

  requireBitbucket(connection?: string): BitbucketClient {
    const name = connection ?? this.defaultConnection();
    const bb = this.get(name).bitbucket;
    if (!bb) {
      const entry = this.config.connections[name];
      const missing = entry?.bitbucket ? missingNames(bitbucketGaps(entry.bitbucket)) : [];
      throw new Error(
        missing.length
          ? `Bitbucket on "${name}" needs ${missing.join(", ")}.`
          : `Bitbucket is not configured for connection "${name}".`,
      );
    }
    return bb;
  }

  requireConfluence(connection?: string): ConfluenceClient {
    const name = connection ?? this.defaultConnection();
    const confluence = this.get(name).confluence;
    if (!confluence) {
      const entry = this.config.connections[name];
      const missing = entry?.confluence ? missingNames(confluenceGaps(entry.confluence)) : [];
      throw new Error(
        missing.length
          ? `Confluence on "${name}" needs ${missing.join(", ")}.`
          : `Confluence is not configured for connection "${name}".`,
      );
    }
    return confluence;
  }
}

function jiraGaps(j: JiraConfig): string[] {
  return envIfSet(j.token_env) ? [] : [j.token_env];
}

function bitbucketGaps(b: BitbucketConfig): string[] {
  const missing: string[] = [];
  if (!envIfSet(b.username_env)) missing.push(b.username_env);
  if (!envIfSet(b.token_env)) missing.push(b.token_env);
  return missing;
}

function confluenceGaps(c: ConfluenceConfig): string[] {
  return envIfSet(c.token_env) ? [] : [c.token_env];
}

function missingNames(names: string[]): string[] {
  return [...new Set(names)];
}

function jiraAuth(j: JiraConfig): Record<string, string> | undefined {
  if (jiraGaps(j).length) return undefined;
  const token = envIfSet(j.token_env)!;
  if (j.flavor === "cloud") return basicAuth(j.email, token);
  return bearerAuth(token);
}

function bitbucketAuth(b: BitbucketConfig): Record<string, string> | undefined {
  if (bitbucketGaps(b).length) return undefined;
  let user = envIfSet(b.username_env)!;
  if (b.flavor === "server" && user.includes("@")) user = user.split("@")[0];
  return basicAuth(user, envIfSet(b.token_env)!);
}

function confluenceAuth(c: ConfluenceConfig): Record<string, string> | undefined {
  if (confluenceGaps(c).length) return undefined;
  const token = envIfSet(c.token_env)!;
  if (c.flavor === "cloud") return basicAuth(c.email, token);
  return bearerAuth(token);
}

/** Scoped Cloud API tokens (ATATT3x) require api.atlassian.com/ex/confluence/{cloudId}. */
function resolveConfluenceCloudId(c: Extract<ConfluenceConfig, { flavor: "cloud" }>): string | undefined {
  if (c.cloud_id) return c.cloud_id;
  if (c.cloud_id_env) return envIfSet(c.cloud_id_env);
  return undefined;
}
