import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MendixClient } from "../mendix/client.js";
import {
  serializeAppInfo,
  serializeModuleList,
  serializeSearchResults,
} from "../mendix/serializers/navigation.js";

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
        return {
          content: [{ type: "text" as const, text: serializeAppInfo(appInfo) }],
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
        return {
          content: [{ type: "text" as const, text: serializeModuleList(modules, params.filter) }],
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

  server.tool(
    "search_model",
    "Search model documents by name across entities, microflows, pages, and enumerations.",
    {
      query: z.string().min(1),
      scope: z
        .enum(["all", "entities", "microflows", "pages", "enumerations"])
        .optional(),
    },
    async (params) => {
      try {
        const results = await mendixClient.searchModel(
          params.query,
          params.scope ?? "all"
        );

        return {
          content: [{ type: "text" as const, text: serializeSearchResults(params.query, results) }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: `Error searching model for '${params.query}': ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
