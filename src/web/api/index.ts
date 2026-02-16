import { createRequire } from "node:module";
import { createCopilotApiApp } from "./app.js";

interface PackageJson {
  version?: string;
}

function loadPackageVersion(): string {
  const require = createRequire(import.meta.url);
  const packageJson = require("../../../package.json") as PackageJson;
  return packageJson.version ?? "0.0.0";
}

function resolvePort(rawPort: string | undefined): number {
  const parsed = rawPort ? Number.parseInt(rawPort, 10) : 8787;
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 65535) {
    throw new Error("COPILOT_API_PORT moet een geldig poortnummer zijn.");
  }
  return parsed;
}

async function main(): Promise<void> {
  const version = loadPackageVersion();
  const port = resolvePort(process.env.COPILOT_API_PORT);
  const host = process.env.COPILOT_API_HOST?.trim() || "127.0.0.1";

  const { app, session } = createCopilotApiApp({ version });
  const server = app.listen(port, host, () => {
    console.error(`copilot-api v${version} gestart op http://${host}:${port}`);
  });

  let shuttingDown = false;

  const shutdown = async (signal: "SIGINT" | "SIGTERM"): Promise<void> => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    console.error(`Received ${signal}. Shutting down copilot-api...`);

    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
    await session.disconnect();
    process.exit(0);
  };

  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });
  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Fatal startup error in copilot-api: ${message}`);
  process.exit(1);
});
