import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerExplainMicroflowPrompt(server: McpServer): void {
  server.registerPrompt(
    "explain-microflow",
    {
      title: "Explain Mendix microflow",
      description: "Explain a microflow in plain language and suggest improvements.",
      argsSchema: {
        qualifiedName: z.string().min(1),
      },
    },
    async (args) => {
      const qualifiedName = args.qualifiedName;
      const text = [
        `Leg microflow '${qualifiedName}' uit in begrijpelijke taal.`,
        "",
        "Gebruik deze aanpak:",
        `1. Roep \`get_microflow_details\` aan met \`qualifiedName='${qualifiedName}'\`.`,
        "2. Beschrijf de flow als stappen met input, beslissingen en output.",
        "3. Benoem risico's (foutafhandeling, complexiteit, onderhoud).",
        "4. Geef concrete verbetervoorstellen.",
      ].join("\n");

      return {
        description: `Microflow-uitleg prompt voor ${qualifiedName}`,
        messages: [
          {
            role: "user" as const,
            content: { type: "text" as const, text },
          },
        ],
      };
    }
  );
}
