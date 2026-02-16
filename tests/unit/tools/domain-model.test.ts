import { beforeEach, describe, expect, it, vi } from "vitest";
import { registerDomainModelTools } from "../../../src/tools/domain-model.js";

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

function createDomainModel() {
  return {
    moduleName: "Sales",
    entities: [
      {
        moduleName: "Sales",
        name: "Order",
        qualifiedName: "Sales.Order",
        attributes: [{ name: "Number", type: "String", validationRules: [] }],
        associations: [],
        accessRules: [],
        eventHandlers: {},
        indexes: [],
        validationRules: [],
      },
    ],
    associations: [],
    microflowCount: 1,
    pageCount: 1,
  };
}

describe("registerDomainModelTools", () => {
  let server: ReturnType<typeof makeServerMock>;

  beforeEach(() => {
    server = makeServerMock();
  });

  it("registers get_domain_model, get_entity_details and get_associations", () => {
    const mendixClient = {
      getDomainModel: vi.fn(),
      getEntityDetails: vi.fn(),
      getAllEntities: vi.fn(),
    } as never;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerDomainModelTools(server as any, mendixClient);

    expect(server.getHandler("get_domain_model")).toBeDefined();
    expect(server.getHandler("get_entity_details")).toBeDefined();
    expect(server.getHandler("get_associations")).toBeDefined();
  });

  it("caches domain model per module", async () => {
    const mendixClient = {
      getDomainModel: vi.fn().mockResolvedValue(createDomainModel()),
      getEntityDetails: vi.fn(),
      getAllEntities: vi.fn(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerDomainModelTools(server as any, mendixClient as never);
    const handler = server.getHandler("get_domain_model");

    await handler!({ module: "Sales", detailed: false });
    await handler!({ module: "Sales", detailed: true });

    expect(mendixClient.getDomainModel).toHaveBeenCalledTimes(1);
  });

  it("returns isError for entity-not-found scenario", async () => {
    const mendixClient = {
      getDomainModel: vi.fn(),
      getEntityDetails: vi
        .fn()
        .mockRejectedValue(new Error("Entity 'Sales.Unknown' not found.")),
      getAllEntities: vi.fn(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerDomainModelTools(server as any, mendixClient as never);
    const handler = server.getHandler("get_entity_details");

    const result = await handler!({ qualifiedName: "Sales.Unknown" });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Sales.Unknown");
  });
});
