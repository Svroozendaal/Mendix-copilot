import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MendixClient } from "../mendix/client.js";
import {
  serializeEntityAccess,
  serializeSecurityOverview,
} from "../mendix/serializers/security.js";

export function registerSecurityTools(
  server: McpServer,
  mendixClient: MendixClient
): void {
  server.tool(
    "get_security_overview",
    "Inspect user-role and entity access matrix for the full app or a single module.",
    {
      module: z.string().optional(),
    },
    async (params) => {
      try {
        const overview = await mendixClient.getSecurityOverview(params.module);
        return {
          content: [{ type: "text" as const, text: serializeSecurityOverview(overview) }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: params.module
                ? `Error getting security overview for module '${params.module}': ${message}`
                : `Error getting security overview: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "get_entity_access",
    "Get detailed access rights for one entity by qualified name (Module.Entity).",
    {
      qualifiedName: z.string().min(1),
    },
    async (params) => {
      try {
        const access = await mendixClient.getEntityAccess(params.qualifiedName);
        return {
          content: [{ type: "text" as const, text: serializeEntityAccess(access) }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: `Error getting entity access for '${params.qualifiedName}': ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
