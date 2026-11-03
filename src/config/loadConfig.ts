/**
 * @raviraj87/atlassian-mcp · config/loadConfig.ts
 * Environment configuration loader. One token enables one site.
 *
 * Copyright (c) 2026 Ravi Raj · MIT License · see LICENSE
 */

import { AppConfig, configSchema } from "./schema.js";

export function envIfSet(name: string | undefined): string | undefined {
  if (!name) return undefined;
  const value = process.env[name]?.trim();
  return value || undefined;
}

export function resolveEnv(name: string): string {
  const value = envIfSet(name);
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function requireTogether(label: string, pairs: [string, string | undefined][]): void {
  const set = pairs.filter(([, value]) => value);
  if (set.length === 0 || set.length === pairs.length) return;
  const missing = pairs.filter(([, value]) => !value).map(([name]) => name);
  throw new Error(`${label} needs ${missing.join(", ")}.`);
}

export function loadConfig(): AppConfig {
  const jiraUrl = envIfSet("JIRA_URL") ?? envIfSet("JIRA_BASE_URL");
  const jiraPat = envIfSet("JIRA_PAT");
  const bitbucketUrl = envIfSet("BITBUCKET_URL") ?? envIfSet("BITBUCKET_BASE_URL");
  const bitbucketUser = envIfSet("BITBUCKET_USERNAME");
  const bitbucketToken = envIfSet("BITBUCKET_TOKEN");
  const bitbucketWorkspace = envIfSet("BITBUCKET_WORKSPACE");
  const cloudUrl = envIfSet("JIRA_CLOUD_URL");
  const cloudEmail = envIfSet("JIRA_CLOUD_EMAIL");
  const cloudPat = envIfSet("JIRA_CLOUD_PAT");

  requireTogether("Jira Server", [
    ["JIRA_URL", jiraUrl],
    ["JIRA_PAT", jiraPat],
  ]);
  requireTogether("Bitbucket", [
    ["BITBUCKET_URL", bitbucketWorkspace ? bitbucketWorkspace : bitbucketUrl],
    ["BITBUCKET_USERNAME", bitbucketUser],
    ["BITBUCKET_TOKEN", bitbucketToken],
  ]);
  requireTogether("Jira Cloud", [
    ["JIRA_CLOUD_URL", cloudUrl],
    ["JIRA_CLOUD_EMAIL", cloudEmail],
    ["JIRA_CLOUD_PAT", cloudPat],
  ]);

  const connections: AppConfig["connections"] = {};

  if ((jiraUrl && jiraPat) || (bitbucketUser && bitbucketToken && (bitbucketUrl || bitbucketWorkspace))) {
    connections.server = {};
    if (jiraUrl && jiraPat) {
      connections.server.jira = { flavor: "server", url: jiraUrl, token_env: "JIRA_PAT" };
    }
    if (bitbucketUser && bitbucketToken && bitbucketWorkspace) {
      connections.server.bitbucket = {
        flavor: "cloud",
        workspace: bitbucketWorkspace,
        username_env: "BITBUCKET_USERNAME",
        token_env: "BITBUCKET_TOKEN",
      };
    } else if (bitbucketUser && bitbucketToken && bitbucketUrl) {
      connections.server.bitbucket = {
        flavor: "server",
        url: bitbucketUrl,
        username_env: "BITBUCKET_USERNAME",
        token_env: "BITBUCKET_TOKEN",
      };
    }
  }

  if (cloudUrl && cloudEmail && cloudPat) {
    connections.cloud = {
      jira: { flavor: "cloud", url: cloudUrl, email: cloudEmail, token_env: "JIRA_CLOUD_PAT" },
      confluence: { flavor: "cloud", url: cloudUrl, email: cloudEmail, token_env: "JIRA_CLOUD_PAT" },
    };
  }

  const names = Object.keys(connections);
  if (!names.length) {
    throw new Error("Set JIRA_URL and JIRA_PAT, or JIRA_CLOUD_URL, JIRA_CLOUD_EMAIL, and JIRA_CLOUD_PAT.");
  }

  const requested = envIfSet("ATLASSIAN_DEFAULT_CONNECTION");
  const defaultConnection = requested && names.includes(requested) ? requested : names[0];

  return configSchema.parse({ default_connection: defaultConnection, connections });
}
