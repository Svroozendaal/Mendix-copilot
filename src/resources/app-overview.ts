import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { MendixClient } from "../mendix/client.js";

interface ModuleSummary {
  name: string;
  entityCount: number;
  microflowCount: number;
  pageCount: number;
}

function pickModuleWithMostEntities(modules: ModuleSummary[]): ModuleSummary | undefined {
  return [...modules].sort((left, right) => right.entityCount - left.entityCount)[0];
}

function pickModuleWithMostMicroflows(modules: ModuleSummary[]): ModuleSummary | undefined {
  return [...modules].sort((left, right) => right.microflowCount - left.microflowCount)[0];
}

function buildResourceText(input: {
  appName: string;
  appId: string;
  mendixVersion: string;
  modules: ModuleSummary[];
  userRoleCount: number;
  securityEnabled: boolean;
}): string {
  const biggestModule = pickModuleWithMostEntities(input.modules);
  const mostMicroflows = pickModuleWithMostMicroflows(input.modules);

  const lines: string[] = [
    "## App Overview",
    "",
    `App: ${input.appName}`,
    `App ID: ${input.appId}`,
    `Mendix versie: ${input.mendixVersion}`,
    "",
    "### Modules",
  ];

  if (input.modules.length === 0) {
    lines.push("- (geen modules gevonden)");
  } else {
    for (const module of input.modules) {
      lines.push(
        `- ${module.name}: ${module.entityCount} entities, ${module.microflowCount} microflows, ${module.pageCount} pages`
      );
    }
  }

  lines.push("");
  lines.push("### Security");
  lines.push(`- Security ingeschakeld: ${input.securityEnabled ? "ja" : "nee"}`);
  lines.push(`- User roles: ${input.userRoleCount}`);

  lines.push("");
  lines.push("### Highlights");
  if (!biggestModule && !mostMicroflows) {
    lines.push("- (onvoldoende data voor highlights)");
  } else {
    if (biggestModule) {
      lines.push(
        `- Grootste module (entities): ${biggestModule.name} (${biggestModule.entityCount})`
      );
    }
    if (mostMicroflows) {
      lines.push(
        `- Meeste microflows: ${mostMicroflows.name} (${mostMicroflows.microflowCount})`
      );
    }
  }

  return lines.join("\n");
}

export function registerAppOverviewResource(
  server: McpServer,
  mendixClient: MendixClient
): void {
  server.registerResource(
    "app_overview",
    "mendix://app/overview",
    {
      title: "Mendix app overview",
      description: "Auto-generated overview of modules, model size, and security posture.",
      mimeType: "text/markdown",
    },
    async (uri) => {
      const appInfo = await mendixClient.getAppInfo();
      const securityOverview = await mendixClient.getSecurityOverview();

      const modules: ModuleSummary[] = [];
      for (const module of await mendixClient.listModules()) {
        const domainModel = await mendixClient.getDomainModel(module.name);
        modules.push({
          name: domainModel.moduleName,
          entityCount: domainModel.entities.length,
          microflowCount: domainModel.microflowCount,
          pageCount: domainModel.pageCount,
        });
      }

      const text = buildResourceText({
        appName: appInfo.name,
        appId: appInfo.appId,
        mendixVersion: appInfo.mendixVersion,
        modules,
        userRoleCount: securityOverview.userRoles.length,
        securityEnabled: securityOverview.securityEnabled,
      });

      return {
        contents: [
          {
            uri: uri.toString(),
            mimeType: "text/markdown",
            text,
          },
        ],
      };
    }
  );
}
