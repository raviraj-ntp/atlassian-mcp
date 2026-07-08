/**
 * @raviraj87/atlassian-mcp · config/schema.ts
 * Zod schema for server configuration.
 *
 * Copyright (c) 2026 Ravi Raj · MIT License · see LICENSE
 */

import { z } from "zod";

const jiraServerSchema = z.object({
  flavor: z.literal("server"),
  url: z.string().url(),
  token_env: z.string(),
});

const jiraCloudSchema = z.object({
  flavor: z.literal("cloud"),
  url: z.string().url(),
  email_env: z.string(),
  token_env: z.string(),
});

const bbServerSchema = z.object({
  flavor: z.literal("server"),
  url: z.string().url(),
  username_env: z.string(),
  token_env: z.string(),
});

const bbCloudSchema = z.object({
  flavor: z.literal("cloud"),
  workspace: z.string(),
  username_env: z.string(),
  token_env: z.string(),
});

const confluenceServerSchema = z.object({
  flavor: z.literal("server"),
  url: z.string().url(),
  token_env: z.string(),
});

const confluenceCloudSchema = z.object({
  flavor: z.literal("cloud"),
  url: z.string().url(),
  email_env: z.string(),
  token_env: z.string(),
  /** Required for scoped API tokens (ATATT3x). Classic tokens omit this. */
  cloud_id: z.string().optional(),
  cloud_id_env: z.string().optional(),
});

export const configSchema = z.object({
  default_connection: z.string(),
  connections: z.record(
    z.object({
      jira: z.union([jiraServerSchema, jiraCloudSchema]).optional(),
      bitbucket: z.union([bbServerSchema, bbCloudSchema]).optional(),
      confluence: z.union([confluenceServerSchema, confluenceCloudSchema]).optional(),
    }),
  ),
});

export type AppConfig = z.infer<typeof configSchema>;
export type JiraConfig = NonNullable<AppConfig["connections"][string]["jira"]>;
export type BitbucketConfig = NonNullable<AppConfig["connections"][string]["bitbucket"]>;
export type ConfluenceConfig = NonNullable<AppConfig["connections"][string]["confluence"]>;
