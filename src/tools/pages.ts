import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MendixClient } from "../mendix/client.js";
import {
  serializePageList,
  serializePageStructure,
} from "../mendix/serializers/page.js";

export function registerPageTools(server: McpServer, mendixClient: MendixClient): void {
  server.tool(
    "list_pages",
    "List pages in a module with layout and URL metadata.",
    {
      module: z.string().min(1),
    },
    async (params) => {
      try {
        const pages = await mendixClient.listPages(params.module);
        return {
          content: [{ type: "text" as const, text: serializePageList(pages) }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: `Error listing pages for module '${params.module}': ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "get_page_structure",
    "Inspect page widget hierarchy, data bindings, and click actions.",
    {
      qualifiedName: z.string().min(1),
    },
    async (params) => {
      try {
        const page = await mendixClient.getPageStructure(params.qualifiedName);
        return {
          content: [{ type: "text" as const, text: serializePageStructure(page) }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: `Error getting page structure for '${params.qualifiedName}': ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
