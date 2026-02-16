import { describe, it, expect, vi, beforeEach } from "vitest";

const mockOpenModel = vi.hoisted(() => vi.fn());
const mockCreateTemporaryWorkingCopy = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ openModel: mockOpenModel })
);
const mockGetApp = vi.hoisted(() =>
  vi.fn().mockReturnValue({ createTemporaryWorkingCopy: mockCreateTemporaryWorkingCopy })
);
const mockSetPlatformConfig = vi.hoisted(() => vi.fn());
const mockSetLogger = vi.hoisted(() => vi.fn());
const MockMendixPlatformClient = vi.hoisted(() =>
  vi.fn().mockImplementation(() => ({ getApp: mockGetApp }))
);

vi.mock("mendixplatformsdk", () => ({
  MendixPlatformClient: MockMendixPlatformClient,
  setLogger: mockSetLogger,
  setPlatformConfig: mockSetPlatformConfig,
}));

import { MendixClient } from "../../../src/mendix/client.js";
import type { MendixCopilotConfig } from "../../../src/config/index.js";

const testConfig: MendixCopilotConfig = {
  mendixToken: "test-token",
  appId: "test-app-id",
  branch: "main",
};

function makeMockModel(modules: Array<{ name: string; fromAppStore: boolean }>) {
  return {
    allModules: vi.fn().mockReturnValue(modules),
  };
}

function makeModule(name: string, fromAppStore: boolean) {
  return { name, fromAppStore };
}

describe("MendixClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateTemporaryWorkingCopy.mockResolvedValue({ openModel: mockOpenModel });
    mockGetApp.mockReturnValue({ createTemporaryWorkingCopy: mockCreateTemporaryWorkingCopy });
    MockMendixPlatformClient.mockImplementation(() => ({ getApp: mockGetApp }));
  });

  it("initializes lazily: model is opened only once across multiple getAppInfo calls", async () => {
    const mockModel = makeMockModel([makeModule("MyModule", false)]);
    mockOpenModel.mockResolvedValue(mockModel);

    const client = new MendixClient(testConfig);

    await client.getAppInfo();
    await client.getAppInfo();

    expect(MockMendixPlatformClient).toHaveBeenCalledTimes(1);
    expect(mockCreateTemporaryWorkingCopy).toHaveBeenCalledTimes(1);
    expect(mockOpenModel).toHaveBeenCalledTimes(1);
  });

  it("returns correct AppInfo with appId, branch, and modules", async () => {
    const mockModel = makeMockModel([
      makeModule("Administration", false),
      makeModule("CommunityCommons", true),
    ]);
    mockOpenModel.mockResolvedValue(mockModel);

    const client = new MendixClient(testConfig);
    const info = await client.getAppInfo();

    expect(info.appId).toBe("test-app-id");
    expect(info.branch).toBe("main");
    expect(info.name).toBe("test-app-id");
  });

  it("maps fromAppStore to fromMarketplace correctly", async () => {
    const mockModel = makeMockModel([
      makeModule("UserModule", false),
      makeModule("MarketplaceModule", true),
    ]);
    mockOpenModel.mockResolvedValue(mockModel);

    const client = new MendixClient(testConfig);
    const info = await client.getAppInfo();

    expect(info.modules).toHaveLength(2);

    const userModule = info.modules.find((m) => m.name === "UserModule");
    expect(userModule?.fromMarketplace).toBe(false);

    const marketplaceModule = info.modules.find((m) => m.name === "MarketplaceModule");
    expect(marketplaceModule?.fromMarketplace).toBe(true);
  });

  it("calls setPlatformConfig with the mendixToken", async () => {
    const mockModel = makeMockModel([]);
    mockOpenModel.mockResolvedValue(mockModel);

    const client = new MendixClient(testConfig);
    await client.getAppInfo();

    expect(mockSetLogger).toHaveBeenCalledTimes(1);
    expect(mockSetPlatformConfig).toHaveBeenCalledWith({ mendixToken: "test-token" });
  });

  it("creates a working copy for the configured branch", async () => {
    const mockModel = makeMockModel([]);
    mockOpenModel.mockResolvedValue(mockModel);

    const client = new MendixClient({ ...testConfig, branch: "develop" });
    await client.getAppInfo();

    expect(mockCreateTemporaryWorkingCopy).toHaveBeenCalledWith("develop");
  });
});
