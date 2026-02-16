import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerReviewModulePrompt(server: McpServer): void {
  server.registerPrompt(
    "review-module",
    {
      title: "Review Mendix module",
      description:
        "Run a complete module review using domain, logic, security, and best-practices tools.",
      argsSchema: {
        module: z.string().min(1),
      },
    },
    async (args) => {
      const moduleName = args.module;
      const text = [
        `Voer een volledige review uit voor module '${moduleName}'.`,
        "",
        "Gebruik deze stappen in volgorde:",
        `1. Roep \`get_domain_model\` aan met \`module='${moduleName}'\` en \`detailed=true\`.`,
        `2. Roep \`list_microflows\` aan met \`module='${moduleName}'\`.`,
        `3. Roep \`get_security_overview\` aan met \`module='${moduleName}'\`.`,
        `4. Roep \`check_best_practices\` aan met \`module='${moduleName}'\`.`,
        "5. Geef een compacte samenvatting met:",
        "- belangrijkste risico's",
        "- impact op onderhoudbaarheid en security",
        "- concrete aanbevelingen met prioriteit (hoog/midden/laag)",
      ].join("\n");

      return {
        description: `Module review prompt voor ${moduleName}`,
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
