import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerSecurityAuditPrompt(server: McpServer): void {
  server.registerPrompt(
    "security-audit",
    {
      title: "Run security audit",
      description:
        "Run a full Mendix security audit over roles, entity permissions, and best-practice findings.",
      argsSchema: {
        module: z.string().optional(),
      },
    },
    async (args) => {
      const modulePart = args.module
        ? `voor module '${args.module}'`
        : "voor de volledige app";
      const overviewCall = args.module
        ? `\`get_security_overview\` met \`module='${args.module}'\``
        : "`get_security_overview` zonder modulefilter";
      const bestPracticeCall = args.module
        ? `\`check_best_practices\` met \`module='${args.module}'\``
        : "`check_best_practices` zonder filter";

      const text = [
        `Voer een volledige security audit uit ${modulePart}.`,
        "",
        "Gebruik deze stappen:",
        `1. Roep ${overviewCall}.`,
        "2. Identificeer kritieke entities uit de security matrix.",
        "3. Roep voor die entities `get_entity_access` aan om detailrechten te controleren.",
        `4. Roep ${bestPracticeCall}.`,
        "5. Rapporteer bevindingen met prioriteit en concrete remediaties.",
      ].join("\n");

      return {
        description: `Security audit prompt ${modulePart}`,
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
