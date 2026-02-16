#!/usr/bin/env node

import { createRequire } from "node:module";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config/index.js";
import { MendixClient } from "./mendix/client.js";
import { registerExplainMicroflowPrompt } from "./prompts/explain-microflow.js";
import { registerReviewModulePrompt } from "./prompts/review-module.js";
import { registerSecurityAuditPrompt } from "./prompts/security-audit.js";
import { registerAppOverviewResource } from "./resources/app-overview.js";
import { registerAnalysisTools } from "./tools/analysis.js";
import { registerDomainModelTools } from "./tools/domain-model.js";
import { registerLogicTools } from "./tools/logic.js";
import { registerNavigationTools } from "./tools/navigation.js";
import { registerPageTools } from "./tools/pages.js";
import { registerSecurityTools } from "./tools/security.js";

interface PackageJson {
  version?: string;
}

function loadPackageVersion(): string {
  const require = createRequire(import.meta.url);
  const packageJson = require("../package.json") as PackageJson;
  return packageJson.version ?? "0.0.0";
}

function hasVersionFlag(argv: string[] = process.argv.slice(2)): boolean {
  return argv.includes("--version") || argv.includes("-v");
}

async function main(): Promise<void> {
  const version = loadPackageVersion();

  if (hasVersionFlag()) {
    console.error(`mendix-copilot v${version}`);
    return;
  }

  const config = loadConfig();
  const mendixClient = new MendixClient(config);

  await mendixClient.connect();
  const appInfo = await mendixClient.getAppInfo();
  const modelStats = await mendixClient.getModelStats();

  console.error(`Mendix Copilot v${version}`);
  console.error(`Verbinden met app: ${appInfo.name} (branch: ${config.branch})`);
  console.error(
    `Model geladen: ${modelStats.moduleCount} modules, ${modelStats.entityCount} entities, ${modelStats.microflowCount} microflows`
  );

  const server = new McpServer({
    name: "mendix-copilot",
    version,
  });

  registerNavigationTools(server, mendixClient);
  registerDomainModelTools(server, mendixClient);
  registerLogicTools(server, mendixClient);
  registerPageTools(server, mendixClient);
  registerSecurityTools(server, mendixClient);
  registerAnalysisTools(server, mendixClient);
  registerAppOverviewResource(server, mendixClient);
  registerReviewModulePrompt(server);
  registerExplainMicroflowPrompt(server);
  registerSecurityAuditPrompt(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP server gestart - klaar voor Claude");

  let shuttingDown = false;

  const shutdown = async (signal: "SIGINT" | "SIGTERM"): Promise<void> => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    console.error(`Received ${signal}. Shutting down Mendix Copilot...`);
    try {
      await server.close();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Failed to close MCP server transport: ${message}`);
    }

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
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Fatal startup error in Mendix Copilot: ${message}`);
  console.error("Controleer MENDIX_TOKEN, MENDIX_APP_ID, branch en netwerktoegang.");
  process.exit(1);
});
