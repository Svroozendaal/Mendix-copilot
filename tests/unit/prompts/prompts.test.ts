import { describe, expect, it, vi } from "vitest";
import { registerExplainMicroflowPrompt } from "../../../src/prompts/explain-microflow.js";
import { registerReviewModulePrompt } from "../../../src/prompts/review-module.js";
import { registerSecurityAuditPrompt } from "../../../src/prompts/security-audit.js";

type PromptHandler = (args: Record<string, string>) => Promise<{
  description?: string;
  messages: Array<{ role: string; content: { type: string; text: string } }>;
}>;

function makeServerMock() {
  const handlers = new Map<string, PromptHandler>();

  return {
    registerPrompt: vi.fn(
      (
        name: string,
        _config: unknown,
        handler: PromptHandler
      ) => {
        handlers.set(name, handler);
      }
    ),
    getHandler: (name: string) => handlers.get(name),
  };
}

describe("prompt registrations", () => {
  it("registers review-module prompt with expected tool instructions", async () => {
    const server = makeServerMock();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerReviewModulePrompt(server as any);
    const handler = server.getHandler("review-module");
    const result = await handler!({ module: "Sales" });
    const text = result.messages[0].content.text;

    expect(text).toContain("get_domain_model");
    expect(text).toContain("list_microflows");
    expect(text).toContain("get_security_overview");
    expect(text).toContain("check_best_practices");
  });

  it("registers explain-microflow prompt", async () => {
    const server = makeServerMock();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerExplainMicroflowPrompt(server as any);
    const handler = server.getHandler("explain-microflow");
    const result = await handler!({ qualifiedName: "Sales.ACT_Order_Create" });
    const text = result.messages[0].content.text;

    expect(text).toContain("get_microflow_details");
    expect(text).toContain("Sales.ACT_Order_Create");
  });

  it("registers security-audit prompt with optional module handling", async () => {
    const server = makeServerMock();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerSecurityAuditPrompt(server as any);
    const handler = server.getHandler("security-audit");

    const fullApp = await handler!({});
    expect(fullApp.messages[0].content.text).toContain("get_security_overview");
    expect(fullApp.messages[0].content.text).toContain("check_best_practices");

    const moduleSpecific = await handler!({ module: "Sales" });
    expect(moduleSpecific.messages[0].content.text).toContain("module='Sales'");
  });
});
