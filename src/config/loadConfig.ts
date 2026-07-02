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

  if (!connection.jira && !connection.bitbucket) {
    throw new Error(
      `Config file not found at ${pathHint()} and env fallback is incomplete. ` +
        `Set ATLASSIAN_MCP_CONFIG or provide env vars (JIRA_BASE_URL/JIRA_PAT, BITBUCKET_BASE_URL+BITBUCKET_USERNAME+BITBUCKET_TOKEN, or BITBUCKET_WORKSPACE+BITBUCKET_USERNAME+BITBUCKET_TOKEN).`,
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
