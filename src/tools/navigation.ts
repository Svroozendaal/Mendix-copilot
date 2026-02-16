import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MendixClient } from "../mendix/client.js";

export function registerNavigationTools(
  server: McpServer,
  mendixClient: MendixClient
): void {
  server.tool(
    "get_app_info",
    "Get high-level app metadata to quickly understand the project structure.",
    {},
    async () => {
      try {
        const appInfo = await mendixClient.getAppInfo();

        const lines: string[] = [
          `App: ${appInfo.name}`,
          `App ID: ${appInfo.appId}`,
          `Branch: ${appInfo.branch}`,
          `Mendix Version: ${appInfo.mendixVersion}`,
          `Modules: ${appInfo.moduleCount}`,
          ``,
          "Module Names:",
          ...appInfo.modules.map((moduleInfo) => `- ${moduleInfo.name}`),
        ];

        return {
          content: [{ type: "text" as const, text: lines.join("\n") }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text" as const, text: `Error getting app info: ${message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "list_modules",
    "List all app modules with optional name filtering. User modules are listed before marketplace modules.",
    {
      filter: z.string().optional(),
    },
    async (params) => {
      try {
        const modules = await mendixClient.listModules(params.filter);
        const header = params.filter
          ? `Modules matching '${params.filter}' (${modules.length}):`
          : `Modules (${modules.length}):`;

        const lines: string[] = [header];
        for (const moduleInfo of modules) {
          lines.push(
            `- ${moduleInfo.name} (${moduleInfo.fromMarketplace ? "marketplace" : "user"})`
          );
        }

        return {
          content: [{ type: "text" as const, text: lines.join("\n") }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            { type: "text" as const, text: `Error listing modules: ${message}` },
          ],
          isError: true,
        };
      }
    }
  );
}
