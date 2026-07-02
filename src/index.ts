#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ClientFactory } from "./clients/clientFactory.js";
import { createAtlassianMcpServer } from "./server.js";

async function main(): Promise<void> {
  const factory = new ClientFactory();
  const server = createAtlassianMcpServer(factory);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
