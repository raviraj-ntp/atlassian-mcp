/**
 * @raviraj87/atlassian-mcp · server.ts
 * MCP server factory — registers Jira and Bitbucket tools.
 *
 * Copyright (c) 2026 Ravi Raj · MIT License · see LICENSE
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ClientFactory } from "./clients/clientFactory.js";
import { registerBitbucketTools } from "./tools/bitbucketTools.js";
import { registerCompositeTools } from "./tools/compositeTools.js";
import { registerCrossProductTools } from "./tools/crossproductTools.js";
import { registerBitbucketExtendedTools, registerJiraExtendedTools } from "./tools/extendedTools.js";
import { registerJiraTools } from "./tools/jiraTools.js";

export function createAtlassianMcpServer(factory: ClientFactory): McpServer {
  const server = new McpServer({
    name: "atlassian-mcp",
    version: "1.0.1",
  });

  registerJiraTools(server, factory);
  registerJiraExtendedTools(server, factory);
  registerBitbucketTools(server, factory);
  registerBitbucketExtendedTools(server, factory);
  registerCrossProductTools(server, factory);
  registerCompositeTools(server, factory);

  return server;
}
