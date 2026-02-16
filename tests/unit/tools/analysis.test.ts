import { beforeEach, describe, expect, it, vi } from "vitest";
import { registerAnalysisTools } from "../../../src/tools/analysis.js";
import {
  createMockBestPracticeFinding,
  createMockDependency,
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

describe("registerAnalysisTools", () => {
  let server: ReturnType<typeof makeServerMock>;

  beforeEach(() => {
    server = makeServerMock();
  });

  it("registers check_best_practices and get_dependencies", () => {
    const mendixClient = {
      getBestPracticeFindings: vi.fn(),
      getDependencies: vi.fn(),
    } as never;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerAnalysisTools(server as any, mendixClient);

    expect(server.getHandler("check_best_practices")).toBeDefined();
    expect(server.getHandler("get_dependencies")).toBeDefined();
  });

  it("serializes best-practice findings", async () => {
    const mendixClient = {
      getBestPracticeFindings: vi
        .fn()
        .mockResolvedValue([createMockBestPracticeFinding()]),
      getDependencies: vi.fn(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerAnalysisTools(server as any, mendixClient as never);
    const handler = server.getHandler("check_best_practices");
    const result = await handler!({ module: "Sales" });

    expect(mendixClient.getBestPracticeFindings).toHaveBeenCalledWith("Sales");
    expect(result.content[0].text).toContain("Best-practice bevindingen (1):");
    expect(result.content[0].text).toContain("[warning] Sales.ACT_Order_Create");
  });

  it("serializes dependencies", async () => {
    const mendixClient = {
      getBestPracticeFindings: vi.fn(),
      getDependencies: vi.fn().mockResolvedValue(createMockDependency()),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerAnalysisTools(server as any, mendixClient as never);
    const handler = server.getHandler("get_dependencies");
    const result = await handler!({ qualifiedName: "Sales.ACT_Order_Create" });

    expect(result.content[0].text).toContain("## Dependencies: Sales.ACT_Order_Create");
    expect(result.content[0].text).toContain("Uitgaand:");
    expect(result.content[0].text).toContain("Inkomend:");
  });
});
