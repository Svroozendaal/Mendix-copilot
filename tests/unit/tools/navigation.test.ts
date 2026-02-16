import { beforeEach, describe, expect, it, vi } from "vitest";
import { serializeModuleOverview } from "../../../src/mendix/serializers/domain-model.js";
import { registerNavigationTools } from "../../../src/tools/navigation.js";

type ToolResponse = {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
};

type ToolHandler = (params?: Record<string, unknown>) => Promise<ToolResponse>;

function makeServerMock() {
  const handlers = new Map<string, ToolHandler>();

  const server = {
    tool: vi.fn(
      (
        name: string,
        _description: string,
        _schema: unknown,
        handler: ToolHandler
      ) => {
        handlers.set(name, handler);
      }
    ),
    getHandler: (name: string) => handlers.get(name),
    hasTool: (name: string) => handlers.has(name),
  };

  return server;
}

describe("registerNavigationTools", () => {
  let server: ReturnType<typeof makeServerMock>;

  beforeEach(() => {
    server = makeServerMock();
  });

  it("registers get_app_info and list_modules", () => {
    const mendixClient = {
      getAppInfo: vi.fn(),
      listModules: vi.fn(),
      searchModel: vi.fn(),
    } as never;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerNavigationTools(server as any, mendixClient);

    expect(server.hasTool("get_app_info")).toBe(true);
    expect(server.hasTool("list_modules")).toBe(true);
    expect(server.hasTool("search_model")).toBe(true);
  });

  it("get_app_info returns app name, version, module count and module names", async () => {
    const mendixClient = {
      getAppInfo: vi.fn().mockResolvedValue({
        name: "my-mendix-app",
        appId: "app-12345",
        branch: "main",
        mendixVersion: "10.15.0",
        moduleCount: 2,
        modules: [
          { name: "Administration", fromMarketplace: false },
          { name: "CommunityCommons", fromMarketplace: true },
        ],
      }),
      listModules: vi.fn(),
      searchModel: vi.fn(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerNavigationTools(server as any, mendixClient as never);
    const handler = server.getHandler("get_app_info");
    const result = await handler!({});

    expect(result.content[0].text).toContain("App: my-mendix-app");
    expect(result.content[0].text).toContain("Mendix Version: 10.15.0");
    expect(result.content[0].text).toContain("Modules: 2");
    expect(result.content[0].text).toContain("- Administration");
    expect(result.content[0].text).toContain("- CommunityCommons");
  });

  it("list_modules returns module type and supports filter", async () => {
    const mendixClient = {
      getAppInfo: vi.fn(),
      listModules: vi.fn().mockResolvedValue([
        { name: "Administration", fromMarketplace: false },
        { name: "CommunityCommons", fromMarketplace: true },
      ]),
      searchModel: vi.fn(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerNavigationTools(server as any, mendixClient as never);
    const handler = server.getHandler("list_modules");
    const result = await handler!({ filter: "comm" });

    expect(mendixClient.listModules).toHaveBeenCalledWith("comm");
    expect(result.content[0].text).toContain("Modules matching 'comm' (2):");
    expect(result.content[0].text).toContain("- Administration (user)");
    expect(result.content[0].text).toContain("- CommunityCommons (marketplace)");
  });

  it("returns isError when get_app_info fails", async () => {
    const mendixClient = {
      getAppInfo: vi.fn().mockRejectedValue(new Error("Connection failed")),
      listModules: vi.fn(),
      searchModel: vi.fn(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerNavigationTools(server as any, mendixClient as never);
    const handler = server.getHandler("get_app_info");
    const result = await handler!({});

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Error getting app info:");
  });

  it("serializes module overview with mock data", () => {
    const text = serializeModuleOverview({
      name: "Sales",
      entities: [{}, {}],
      microflows: [{}],
      pages: [{}, {}, {}],
    });

    expect(text).toContain("## Module: Sales");
    expect(text).toContain("- Entities: 2");
    expect(text).toContain("- Microflows: 1");
    expect(text).toContain("- Pages: 3");
  });

  it("search_model returns scoped results", async () => {
    const mendixClient = {
      getAppInfo: vi.fn(),
      listModules: vi.fn(),
      searchModel: vi.fn().mockResolvedValue([
        {
          type: "microflow",
          moduleName: "Sales",
          name: "ACT_Order_Create",
          qualifiedName: "Sales.ACT_Order_Create",
          relevance: 3,
        },
      ]),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerNavigationTools(server as any, mendixClient as never);
    const handler = server.getHandler("search_model");
    const result = await handler!({ query: "order", scope: "microflows" });

    expect(mendixClient.searchModel).toHaveBeenCalledWith("order", "microflows");
    expect(result.content[0].text).toContain("Zoekresultaten voor 'order' (1):");
    expect(result.content[0].text).toContain("[microflow] Sales.ACT_Order_Create");
  });
});
