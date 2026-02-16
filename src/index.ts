#!/usr/bin/env node

import { createRequire } from "node:module";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config/index.js";
import { MendixClient } from "./mendix/client.js";
import { registerDomainModelTools } from "./tools/domain-model.js";
import { registerNavigationTools } from "./tools/navigation.js";

interface PackageJson {
  version?: string;
}

function loadPackageVersion(): string {
  const require = createRequire(import.meta.url);
  const packageJson = require("../package.json") as PackageJson;
  return packageJson.version ?? "0.0.0";
}

async function main(): Promise<void> {
  const config = loadConfig();
  const mendixClient = new MendixClient(config);
  const version = loadPackageVersion();

  await mendixClient.connect();

  const server = new McpServer({
    name: "mendix-copilot",
    version,
  });

  registerNavigationTools(server, mendixClient);
  registerDomainModelTools(server, mendixClient);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  const shutdown = async (signal: "SIGINT" | "SIGTERM"): Promise<void> => {
    console.error(`Received ${signal}. Shutting down Mendix Copilot...`);
    await mendixClient.disconnect();
    process.exit(0);
  };

  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });
  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
}

main().catch((error) => {
  console.error("Fatal error starting Mendix Copilot:", error);
  process.exit(1);
});
