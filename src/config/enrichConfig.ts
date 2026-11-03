/**
 * @raviraj87/atlassian-mcp · config/enrichConfig.ts
 * Resolve Cloud site IDs and other config that needs a network lookup at startup.
 *
 * Copyright (c) 2026 Ravi Raj · MIT License · see LICENSE
 */

import { envIfSet, loadConfig } from "./loadConfig.js";
import { AppConfig } from "./schema.js";

export async function loadEnrichedConfig(): Promise<AppConfig> {
  return enrichConfig(loadConfig());
}

export async function enrichConfig(config: AppConfig): Promise<AppConfig> {
  const connections: AppConfig["connections"] = {};

  for (const [name, entry] of Object.entries(config.connections)) {
    let jira = entry.jira;
    let confluence = entry.confluence;
    if (confluence?.flavor === "cloud" && !confluence.cloud_id && confluence.cloud_id_env) {
      const fromEnv = envIfSet(confluence.cloud_id_env);
      if (fromEnv) confluence = { ...confluence, cloud_id: fromEnv };
    }
    const siteUrl =
      (jira?.flavor === "cloud" && !jira.cloud_id ? jira.url : undefined) ??
      (confluence?.flavor === "cloud" && !confluence.cloud_id ? confluence.url : undefined);
    const cloudId = siteUrl ? await fetchCloudId(siteUrl) : undefined;
    if (jira?.flavor === "cloud" && cloudId && !jira.cloud_id) jira = { ...jira, cloud_id: cloudId };
    if (confluence?.flavor === "cloud" && cloudId && !confluence.cloud_id) {
      confluence = { ...confluence, cloud_id: cloudId };
    }
    const changed = jira !== entry.jira || confluence !== entry.confluence;
    connections[name] = changed ? { ...entry, jira, confluence } : entry;
  }

  return { ...config, connections };
}

async function fetchCloudId(siteUrl: string): Promise<string | undefined> {
  try {
    const base = siteUrl.replace(/\/+$/, "");
    const res = await fetch(`${base}/_edge/tenant_info`, { headers: { Accept: "application/json" } });
    if (!res.ok) return undefined;
    const data = (await res.json()) as { cloudId?: string };
    return data.cloudId;
  } catch {
    return undefined;
  }
}
