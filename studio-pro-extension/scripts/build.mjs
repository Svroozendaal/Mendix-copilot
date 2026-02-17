import { build } from "esbuild";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const outDir = path.join(rootDir, "dist");

const buildTimePort = process.env.WB_COPILOT_WEB_UI_PORT?.trim() ?? "";

const define = {
  "process.env.WB_COPILOT_WEB_UI_PORT": JSON.stringify(buildTimePort),
};

const external = [
  "@mendix/extensions-api",
  "@mendix/component-framework",
  "@mendix/model-access-sdk",
];

async function main() {
  await mkdir(outDir, { recursive: true });

  await Promise.all([
    build({
      entryPoints: [path.join(rootDir, "src", "main", "index.ts")],
      outfile: path.join(outDir, "main.js"),
      bundle: true,
      format: "esm",
      target: "es2022",
      sourcemap: true,
      define,
      external,
      logLevel: "info",
    }),
    build({
      entryPoints: [path.join(rootDir, "src", "ui", "dockablepane.ts")],
      outfile: path.join(outDir, "dockablepane.js"),
      bundle: true,
      format: "esm",
      target: "es2022",
      sourcemap: true,
      define,
      external,
      logLevel: "info",
    }),
  ]);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[studio-pro-extension] Build failed: ${message}`);
  process.exit(1);
});
