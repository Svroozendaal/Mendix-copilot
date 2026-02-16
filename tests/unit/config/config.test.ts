import { afterEach, describe, expect, it, vi } from "vitest";
import { loadConfig, parseCliConfig } from "../../../src/config/index.js";

describe("loadConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("throws an error when MENDIX_TOKEN is missing", () => {
    vi.stubEnv("MENDIX_TOKEN", "");
    vi.stubEnv("MENDIX_APP_ID", "app-from-env");

    expect(() => loadConfig(["--app-id", "app-from-cli"])).toThrow("MENDIX_TOKEN");
    expect(() => loadConfig(["--app-id", "app-from-cli"])).toThrow(
      "https://user-settings.mendixcloud.com"
    );
  });

  it("throws an error when app ID is missing in both env and CLI", () => {
    vi.stubEnv("MENDIX_TOKEN", "my-token");
    vi.stubEnv("MENDIX_APP_ID", "");

    expect(() => loadConfig()).toThrow("MENDIX_APP_ID");
    expect(() => loadConfig()).toThrow("--app-id");
  });

  it("uses app ID from CLI when env is not set", () => {
    vi.stubEnv("MENDIX_TOKEN", "my-token");
    vi.stubEnv("MENDIX_APP_ID", "");
    vi.stubEnv("MENDIX_BRANCH", "");

    const result = loadConfig(["--app-id", "cli-app-id"]);

    expect(result.appId).toBe("cli-app-id");
  });

  it("prefers environment app ID over CLI app ID", () => {
    vi.stubEnv("MENDIX_TOKEN", "my-token");
    vi.stubEnv("MENDIX_APP_ID", "env-app-id");
    vi.stubEnv("MENDIX_BRANCH", "");

    const result = loadConfig(["--app-id", "cli-app-id"]);

    expect(result.appId).toBe("env-app-id");
  });

  it("uses default branch 'main' when branch is missing everywhere", () => {
    vi.stubEnv("MENDIX_TOKEN", "my-token");
    vi.stubEnv("MENDIX_APP_ID", "app-id");
    delete process.env.MENDIX_BRANCH;

    const result = loadConfig(["--app-id", "cli-app-id"]);
    expect(result.branch).toBe("main");
  });

  it("uses default branch 'main' when MENDIX_BRANCH is whitespace", () => {
    vi.stubEnv("MENDIX_TOKEN", "my-token");
    vi.stubEnv("MENDIX_APP_ID", "my-app-id");
    vi.stubEnv("MENDIX_BRANCH", "   ");

    const result = loadConfig();
    expect(result.branch).toBe("main");
  });

  it("uses CLI branch when env branch is not set", () => {
    vi.stubEnv("MENDIX_TOKEN", "my-token");
    vi.stubEnv("MENDIX_APP_ID", "my-app-id");
    delete process.env.MENDIX_BRANCH;

    const result = loadConfig(["--branch", "develop"]);
    expect(result.branch).toBe("develop");
  });

  it("prefers env branch over CLI branch", () => {
    vi.stubEnv("MENDIX_TOKEN", "my-token");
    vi.stubEnv("MENDIX_APP_ID", "my-app-id");
    vi.stubEnv("MENDIX_BRANCH", "feature/env");

    const result = loadConfig(["--branch", "feature/cli"]);
    expect(result.branch).toBe("feature/env");
  });

  it("returns a correct config object with all values", () => {
    vi.stubEnv("MENDIX_TOKEN", "secret-token");
    vi.stubEnv("MENDIX_APP_ID", "app-12345");
    vi.stubEnv("MENDIX_BRANCH", "develop");

    const result = loadConfig();

    expect(result).toEqual({
      mendixToken: "secret-token",
      appId: "app-12345",
      branch: "develop",
    });
  });
});

describe("parseCliConfig", () => {
  it("parses flag and equals formats", () => {
    expect(parseCliConfig(["--app-id=app-1", "--branch", "trunk"])).toEqual({
      appId: "app-1",
      branch: "trunk",
    });
  });

  it("ignores empty values", () => {
    expect(parseCliConfig(["--app-id", "", "--branch="])).toEqual({});
  });
});
