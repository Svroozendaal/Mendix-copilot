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

function makeRemovedTypeParameter(name: string, variableTypeName: string) {
  const parameter: Record<string, unknown> = {
    name,
    variableType: { name: variableTypeName },
  };

  Object.defineProperty(parameter, "type", {
    get: () => {
      throw new Error(
        "Property 'type' of type 'Microflows$MicroflowParameterObject' can no longer be instantiated."
      );
    },
    enumerable: true,
  });

  return parameter;
}

function makeMicroflowWithRemovedReturnType() {
  const microflow: Record<string, unknown> = {
    name: "ACT_Order_Validate",
    qualifiedName: "Sales.ACT_Order_Validate",
    moduleName: "Sales",
    parameters: [],
    microflowReturnType: { name: "Boolean" },
    objectCollection: { objects: [] },
  };

  Object.defineProperty(microflow, "returnType", {
    get: () => {
      throw new Error(
        "Property 'returnType' of type 'Microflows$Microflow' can no longer be instantiated."
      );
    },
    enumerable: true,
  });

  return microflow;
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

  it("uses variableType for microflow parameters when deprecated type property throws", async () => {
    const parameter = makeRemovedTypeParameter("inputOrder", "Order");
    const microflow = {
      name: "ACT_Order_Create",
      qualifiedName: "Sales.ACT_Order_Create",
      moduleName: "Sales",
      parameters: [parameter],
      returnType: "Void",
      objectCollection: { objects: [] },
    };

    const mockModel = {
      allMicroflows: vi.fn().mockReturnValue([microflow]),
    };
    mockOpenModel.mockResolvedValue(mockModel);

    const client = new MendixClient(testConfig);
    const microflows = await client.listMicroflows("Sales");

    expect(microflows).toHaveLength(1);
    expect(microflows[0]?.parameters).toEqual([{ name: "inputOrder", type: "Order" }]);
  });

  it("uses microflowReturnType when deprecated returnType property throws", async () => {
    const microflow = makeMicroflowWithRemovedReturnType();
    const mockModel = {
      allMicroflows: vi.fn().mockReturnValue([microflow]),
    };
    mockOpenModel.mockResolvedValue(mockModel);

    const client = new MendixClient(testConfig);
    const microflows = await client.listMicroflows("Sales");

    expect(microflows).toHaveLength(1);
    expect(microflows[0]?.returnType).toBe("Boolean");
  });
});
