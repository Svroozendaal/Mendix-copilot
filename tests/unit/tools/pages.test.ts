import { beforeEach, describe, expect, it, vi } from "vitest";
import { registerPageTools } from "../../../src/tools/pages.js";
import {
  createMockPageListItem,
  createMockPageStructure,
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

describe("registerPageTools", () => {
  let server: ReturnType<typeof makeServerMock>;

  beforeEach(() => {
    server = makeServerMock();
  });

  it("registers list_pages and get_page_structure", () => {
    const mendixClient = {
      listPages: vi.fn(),
      getPageStructure: vi.fn(),
    } as never;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerPageTools(server as any, mendixClient);

    expect(server.getHandler("list_pages")).toBeDefined();
    expect(server.getHandler("get_page_structure")).toBeDefined();
  });

  it("returns serialized page list", async () => {
    const mendixClient = {
      listPages: vi.fn().mockResolvedValue([createMockPageListItem()]),
      getPageStructure: vi.fn(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerPageTools(server as any, mendixClient as never);
    const handler = server.getHandler("list_pages");
    const result = await handler!({ module: "Sales" });

    expect(mendixClient.listPages).toHaveBeenCalledWith("Sales");
    expect(result.content[0].text).toContain("Pages (1):");
    expect(result.content[0].text).toContain("Order_Overview");
  });

  it("returns serialized page structure", async () => {
    const mendixClient = {
      listPages: vi.fn(),
      getPageStructure: vi.fn().mockResolvedValue(createMockPageStructure()),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerPageTools(server as any, mendixClient as never);
    const handler = server.getHandler("get_page_structure");
    const result = await handler!({ qualifiedName: "Sales.Order_Overview" });

    expect(result.content[0].text).toContain("## Page: Order_Overview");
    expect(result.content[0].text).toContain("Structuur:");
  });

  it("returns isError when page lookup fails", async () => {
    const mendixClient = {
      listPages: vi.fn(),
      getPageStructure: vi.fn().mockRejectedValue(new Error("Page not found")),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerPageTools(server as any, mendixClient as never);
    const handler = server.getHandler("get_page_structure");
    const result = await handler!({ qualifiedName: "Sales.MissingPage" });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Sales.MissingPage");
  });
});
