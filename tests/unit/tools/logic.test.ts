import { beforeEach, describe, expect, it, vi } from "vitest";
import { registerLogicTools } from "../../../src/tools/logic.js";

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

describe("registerLogicTools", () => {
  let server: ReturnType<typeof makeServerMock>;

  beforeEach(() => {
    server = makeServerMock();
  });

  it("registers list_microflows, get_microflow_details and list_nanoflows", () => {
    const mendixClient = {
      listMicroflows: vi.fn(),
      getMicroflowDetails: vi.fn(),
      listNanoflows: vi.fn(),
    } as never;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerLogicTools(server as any, mendixClient);

    expect(server.getHandler("list_microflows")).toBeDefined();
    expect(server.getHandler("get_microflow_details")).toBeDefined();
    expect(server.getHandler("list_nanoflows")).toBeDefined();
  });

  it("returns serialized microflow list", async () => {
    const mendixClient = {
      listMicroflows: vi.fn().mockResolvedValue([
        {
          moduleName: "Sales",
          name: "ACT_Order_Create",
          qualifiedName: "Sales.ACT_Order_Create",
          parameters: [],
          returnType: "Boolean",
          isSubMicroflow: false,
        },
      ]),
      getMicroflowDetails: vi.fn(),
      listNanoflows: vi.fn(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerLogicTools(server as any, mendixClient as never);
    const handler = server.getHandler("list_microflows");
    const result = await handler!({ module: "Sales" });

    expect(result.content[0].text).toContain("Microflows (1):");
    expect(result.content[0].text).toContain("ACT_Order_Create");
  });

  it("returns serialized microflow details", async () => {
    const mendixClient = {
      listMicroflows: vi.fn(),
      getMicroflowDetails: vi.fn().mockResolvedValue({
        moduleName: "Sales",
        name: "ACT_Order_Create",
        qualifiedName: "Sales.ACT_Order_Create",
        parameters: [],
        returnType: "Boolean",
        isSubMicroflow: false,
        steps: [],
        hasErrorHandling: false,
        unknownActivityTypes: [],
      }),
      listNanoflows: vi.fn(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerLogicTools(server as any, mendixClient as never);
    const handler = server.getHandler("get_microflow_details");
    const result = await handler!({ qualifiedName: "Sales.ACT_Order_Create" });

    expect(result.content[0].text).toContain("## Microflow: ACT_Order_Create");
  });
});
