import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MendixClient } from "../mendix/client.js";
import {
  serializeMicroflowDetails,
  serializeMicroflowList,
} from "../mendix/serializers/microflow.js";

export function registerLogicTools(
  server: McpServer,
  mendixClient: MendixClient
): void {
  server.tool(
    "list_microflows",
    "List microflows in a module, optionally filtered by name.",
    {
      module: z.string().min(1),
      filter: z.string().optional(),
    },
    async (params) => {
      try {
        const microflows = await mendixClient.listMicroflows(params.module, params.filter);
        return {
          content: [{ type: "text" as const, text: serializeMicroflowList(microflows) }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: `Error listing microflows for module '${params.module}': ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "get_microflow_details",
    "Get a step-by-step readable breakdown of one microflow by qualified name.",
    {
      qualifiedName: z.string().min(1),
    },
    async (params) => {
      try {
        const microflow = await mendixClient.getMicroflowDetails(params.qualifiedName);
        return {
          content: [
            {
              type: "text" as const,
              text: serializeMicroflowDetails(microflow),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: `Error getting microflow details for '${params.qualifiedName}': ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "list_nanoflows",
    "List nanoflows in a module, optionally filtered by name.",
    {
      module: z.string().min(1),
      filter: z.string().optional(),
    },
    async (params) => {
      try {
        const nanoflows = await mendixClient.listNanoflows(params.module, params.filter);
        return {
          content: [{ type: "text" as const, text: serializeMicroflowList(nanoflows) }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: `Error listing nanoflows for module '${params.module}': ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
