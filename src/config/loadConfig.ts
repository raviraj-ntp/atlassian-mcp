/**
 * @raviraj87/atlassian-mcp · config/loadConfig.ts
 * YAML and environment configuration loader.
 *
 * Copyright (c) 2026 Ravi Raj · MIT License · see LICENSE
 */

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { parse } from "yaml";
import { AppConfig, configSchema } from "./schema.js";

export function resolveConfigPath(): string {
  const fromEnv = process.env.ATLASSIAN_MCP_CONFIG?.trim();
  if (fromEnv) return fromEnv.replace(/^~(?=\/|$)/, homedir());
  return join(homedir(), ".atlassian-mcp.yaml");
}

export function loadConfig(): AppConfig {
  const path = resolveConfigPath();
  if (existsSync(path)) {
    const raw = readFileSync(path, "utf8");
    const parsed = parse(raw);
    return configSchema.parse(parsed);
  }
  return loadConfigFromEnv();
}

export function resolveEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function loadConfigFromEnv(): AppConfig {
  const defaultConnection = process.env.ATLASSIAN_DEFAULT_CONNECTION?.trim() || "default";

  const jiraBaseUrl = process.env.JIRA_BASE_URL?.trim();
  const jiraPat = process.env.JIRA_PAT?.trim();
  const jiraEmail = process.env.JIRA_EMAIL?.trim();

  const bitbucketBaseUrl = process.env.BITBUCKET_BASE_URL?.trim();
  const bitbucketWorkspace = process.env.BITBUCKET_WORKSPACE?.trim();
  const bitbucketUsername = process.env.BITBUCKET_USERNAME?.trim();
  const bitbucketToken = process.env.BITBUCKET_TOKEN?.trim();

  const confluenceBaseUrl = process.env.CONFLUENCE_BASE_URL?.trim();
  const confluencePat = process.env.CONFLUENCE_PAT?.trim();
  const confluenceEmail = process.env.CONFLUENCE_EMAIL?.trim();

  const connection: AppConfig["connections"][string] = {};

  if (jiraBaseUrl && jiraPat) {
    connection.jira = jiraEmail
      ? {
          flavor: "cloud",
          url: jiraBaseUrl,
          email_env: "JIRA_EMAIL",
          token_env: "JIRA_PAT",
        }
      : {
          flavor: "server",
          url: jiraBaseUrl,
          token_env: "JIRA_PAT",
        };
  }

  if (bitbucketWorkspace && bitbucketUsername && bitbucketToken) {
    connection.bitbucket = {
      flavor: "cloud",
      workspace: bitbucketWorkspace,
      username_env: "BITBUCKET_USERNAME",
      token_env: "BITBUCKET_TOKEN",
    };
  } else if (bitbucketBaseUrl && bitbucketUsername && bitbucketToken) {
    connection.bitbucket = {
      flavor: "server",
      url: bitbucketBaseUrl,
      username_env: "BITBUCKET_USERNAME",
      token_env: "BITBUCKET_TOKEN",
    };
  }

  if (confluenceBaseUrl && confluencePat) {
    connection.confluence = confluenceEmail
      ? {
          flavor: "cloud",
          url: confluenceBaseUrl,
          email_env: "CONFLUENCE_EMAIL",
          token_env: "CONFLUENCE_PAT",
        }
      : {
          flavor: "server",
          url: confluenceBaseUrl,
          token_env: "CONFLUENCE_PAT",
        };
  }

  if (!connection.jira && !connection.bitbucket && !connection.confluence) {
    throw new Error(
      `Config file not found at ${pathHint()} and env fallback is incomplete. ` +
        `Set ATLASSIAN_MCP_CONFIG or provide env vars (JIRA_BASE_URL/JIRA_PAT, BITBUCKET_*, CONFLUENCE_BASE_URL/CONFLUENCE_PAT, etc.).`,
    );
  }

  return configSchema.parse({
    default_connection: defaultConnection,
    connections: {
      [defaultConnection]: connection,
    },
  });
}

function pathHint(): string {
  return resolveConfigPath();
}
