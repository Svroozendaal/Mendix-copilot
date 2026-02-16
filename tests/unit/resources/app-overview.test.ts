import { describe, expect, it, vi } from "vitest";
import { registerAppOverviewResource } from "../../../src/resources/app-overview.js";

type ResourceHandler = (uri: URL) => Promise<{
  contents: Array<{ uri: string; mimeType?: string; text?: string }>;
}>;

function makeServerMock() {
  const handlers = new Map<string, ResourceHandler>();

  return {
    registerResource: vi.fn(
      (
        name: string,
        _uri: string,
        _config: unknown,
        handler: ResourceHandler
      ) => {
        handlers.set(name, handler);
      }
    ),
    getHandler: (name: string) => handlers.get(name),
  };
}

describe("registerAppOverviewResource", () => {
  it("registers mendix://app/overview and returns generated markdown", async () => {
    const server = makeServerMock();
    const mendixClient = {
      getAppInfo: vi.fn().mockResolvedValue({
        name: "MyMendixApp",
        appId: "app-123",
        mendixVersion: "10.15.0",
      }),
      getSecurityOverview: vi.fn().mockResolvedValue({
        securityEnabled: true,
        userRoles: [{ name: "Administrator", moduleRoles: ["Sales.Admin"] }],
        modules: [],
      }),
      listModules: vi.fn().mockResolvedValue([
        { name: "Sales", fromMarketplace: false },
        { name: "Administration", fromMarketplace: true },
      ]),
      getDomainModel: vi
        .fn()
        .mockResolvedValueOnce({
          moduleName: "Sales",
          entities: [{}, {}],
          microflowCount: 4,
          pageCount: 2,
        })
        .mockResolvedValueOnce({
          moduleName: "Administration",
          entities: [{}],
          microflowCount: 1,
          pageCount: 1,
        }),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerAppOverviewResource(server as any, mendixClient as never);

    const handler = server.getHandler("app_overview");
    expect(handler).toBeDefined();

    const result = await handler!(new URL("mendix://app/overview"));
    const text = result.contents[0].text ?? "";

    expect(text).toContain("## App Overview");
    expect(text).toContain("App: MyMendixApp");
    expect(text).toContain("Sales: 2 entities, 4 microflows, 2 pages");
    expect(text).toContain("Security ingeschakeld: ja");
    expect(text).toContain("Highlights");
  });
});
