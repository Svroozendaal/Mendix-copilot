import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MendixClient } from "../mendix/client.js";
import {
  serializeBestPracticeFindings,
  serializeDependencies,
} from "../mendix/serializers/analysis.js";

export function registerAnalysisTools(
  server: McpServer,
  mendixClient: MendixClient
): void {
  server.tool(
    "check_best_practices",
    "Scan model quality: missing error handling, weak security rules, and page binding issues.",
    {
      module: z.string().optional(),
    },
    async (params) => {
      try {
        const findings = await mendixClient.getBestPracticeFindings(params.module);
        return {
          content: [{ type: "text" as const, text: serializeBestPracticeFindings(findings) }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: params.module
                ? `Error checking best practices for module '${params.module}': ${message}`
                : `Error checking best practices: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "get_dependencies",
    "Get outgoing and incoming dependencies for one entity, microflow, or page.",
    {
      qualifiedName: z.string().min(1),
    },
    async (params) => {
      try {
        const dependencies = await mendixClient.getDependencies(params.qualifiedName);
        return {
          content: [{ type: "text" as const, text: serializeDependencies(dependencies) }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: `Error getting dependencies for '${params.qualifiedName}': ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
