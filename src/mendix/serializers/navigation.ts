import type { AppInfo, ModuleInfo, SearchResultInfo } from "../client.js";

export function serializeAppInfo(appInfo: AppInfo): string {
  const lines: string[] = [
    `App: ${appInfo.name}`,
    `App ID: ${appInfo.appId}`,
    `Branch: ${appInfo.branch}`,
    `Mendix Version: ${appInfo.mendixVersion}`,
    `Modules: ${appInfo.moduleCount}`,
    "",
    "Module Names:",
    ...appInfo.modules.map((moduleInfo) => `- ${moduleInfo.name}`),
  ];

  return lines.join("\n");
}

export function serializeModuleList(modules: ModuleInfo[], filter?: string): string {
  const header = filter
    ? `Modules matching '${filter}' (${modules.length}):`
    : `Modules (${modules.length}):`;

  const lines: string[] = [header];
  for (const moduleInfo of modules) {
    lines.push(`- ${moduleInfo.name} (${moduleInfo.fromMarketplace ? "marketplace" : "user"})`);
  }

  return lines.join("\n");
}

export function serializeSearchResults(query: string, results: SearchResultInfo[]): string {
  if (results.length === 0) {
    return `Geen resultaten gevonden voor '${query}'.`;
  }

  const lines = [
    `Zoekresultaten voor '${query}' (${results.length}):`,
    ...results.map(
      (result) => `- [${result.type}] ${result.qualifiedName} (module: ${result.moduleName})`
    ),
  ];

  return lines.join("\n");
}
