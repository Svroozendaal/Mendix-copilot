import { beforeEach, describe, expect, it, vi } from "vitest";
import { registerSecurityTools } from "../../../src/tools/security.js";
import {
  createMockEntityAccess,
  createMockSecurityOverview,
} from "../../mocks/mendix-model.js";

type ToolResponse = {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
};

type ToolHandler = (params: Record<string, unknown>) => Promise<ToolResponse>;

function makeServerMock() {
  const handlers = new Map<string, ToolHandler>();

  return {
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
  };
}

describe("registerSecurityTools", () => {
  let server: ReturnType<typeof makeServerMock>;

  beforeEach(() => {
    server = makeServerMock();
  });

  it("registers get_security_overview and get_entity_access", () => {
    const mendixClient = {
      getSecurityOverview: vi.fn(),
      getEntityAccess: vi.fn(),
    } as never;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerSecurityTools(server as any, mendixClient);

    expect(server.getHandler("get_security_overview")).toBeDefined();
    expect(server.getHandler("get_entity_access")).toBeDefined();
  });

  it("returns serialized security overview", async () => {
    const mendixClient = {
      getSecurityOverview: vi.fn().mockResolvedValue(createMockSecurityOverview()),
      getEntityAccess: vi.fn(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerSecurityTools(server as any, mendixClient as never);
    const handler = server.getHandler("get_security_overview");
    const result = await handler!({});

    expect(result.content[0].text).toContain("## Security Overview");
    expect(result.content[0].text).toContain("Module: Sales");
  });

  it("returns serialized entity access", async () => {
    const mendixClient = {
      getSecurityOverview: vi.fn(),
      getEntityAccess: vi.fn().mockResolvedValue(createMockEntityAccess()),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerSecurityTools(server as any, mendixClient as never);
    const handler = server.getHandler("get_entity_access");
    const result = await handler!({ qualifiedName: "Sales.Order" });

    expect(result.content[0].text).toContain("## Entity: Sales.Order");
    expect(result.content[0].text).toContain("Role: Administrator");
  });
});
