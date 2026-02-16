export interface MendixCopilotConfig {
  mendixToken: string;
  appId: string;
  branch: string;
}

interface CliConfig {
  appId?: string;
  branch?: string;
}

export function parseCliConfig(argv: string[]): CliConfig {
  const parsed: CliConfig = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg.startsWith("--app-id=")) {
      const value = arg.split("=", 2)[1]?.trim();
      if (value) {
        parsed.appId = value;
      }
      continue;
    }

    if (arg === "--app-id") {
      const value = argv[index + 1]?.trim();
      if (value && !value.startsWith("--")) {
        parsed.appId = value;
        index += 1;
      }
      continue;
    }

    if (arg.startsWith("--branch=")) {
      const value = arg.split("=", 2)[1]?.trim();
      if (value) {
        parsed.branch = value;
      }
      continue;
    }

    if (arg === "--branch") {
      const value = argv[index + 1]?.trim();
      if (value && !value.startsWith("--")) {
        parsed.branch = value;
        index += 1;
      }
    }
  }

  return parsed;
}

export function loadConfig(argv: string[] = process.argv.slice(2)): MendixCopilotConfig {
  const cliConfig = parseCliConfig(argv);

  const mendixToken = process.env.MENDIX_TOKEN?.trim();
  const appId = process.env.MENDIX_APP_ID?.trim() || cliConfig.appId;
  const branch = process.env.MENDIX_BRANCH?.trim() || cliConfig.branch || "main";

  if (!mendixToken) {
    throw new Error(
      "MENDIX_TOKEN environment variable is required. " +
      "Create a PAT at https://user-settings.mendixcloud.com/link/developersettings"
    );
  }

  if (!appId) {
    throw new Error(
      "MENDIX_APP_ID environment variable or --app-id CLI flag is required. " +
      "Find your App ID on the General tab in the Mendix Developer Portal."
    );
  }

  return { mendixToken, appId, branch };
}
