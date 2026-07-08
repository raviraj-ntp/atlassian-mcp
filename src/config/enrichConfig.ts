/**
 * @raviraj87/atlassian-mcp · config/enrichConfig.ts
 * Resolve Cloud site IDs and other config that needs a network lookup at startup.
 *
 * Copyright (c) 2026 Ravi Raj · MIT License · see LICENSE
 */

import { loadConfig, resolveEnv } from "./loadConfig.js";
import { AppConfig, ConfluenceConfig } from "./schema.js";

export async function loadEnrichedConfig(): Promise<AppConfig> {
  return enrichConfig(loadConfig());
}

export async function enrichConfig(config: AppConfig): Promise<AppConfig> {
  const connections: AppConfig["connections"] = {};

  for (const [name, entry] of Object.entries(config.connections)) {
    let confluence = entry.confluence;
    if (confluence?.flavor === "cloud") {
      const cloudId = await resolveConfluenceCloudId(confluence);
      if (cloudId && !confluence.cloud_id) {
        confluence = { ...confluence, cloud_id: cloudId };
      }
    }
    connections[name] = confluence === entry.confluence ? entry : { ...entry, confluence };
  }

  return { ...config, connections };
}

async function resolveConfluenceCloudId(
  c: Extract<ConfluenceConfig, { flavor: "cloud" }>,
): Promise<string | undefined> {
  if (c.cloud_id) return c.cloud_id;
  if (c.cloud_id_env) {
    try {
      return resolveEnv(c.cloud_id_env);
    } catch {
      /* fall through to auto-fetch */
    }
  }
  return fetchCloudId(c.url);
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
