import { describe, expect, it } from "vitest";
import { changePlanSchema } from "../../../src/change-planner/dsl/changePlan.schema.js";

describe("changePlanSchema", () => {
  it("accepts a valid non-destructive plan", () => {
    const plan = {
      planId: "11111111-1111-4111-8111-111111111111",
      createdAt: "2026-02-16T17:00:00.000Z",
      intent: "create_entity",
      target: { module: "Sales", entity: "Sales.Invoice" },
      preconditions: ["Feature branch actief"],
      commands: [
        {
          type: "create_entity",
          module: "Sales",
          name: "Invoice",
        },
      ],
      risk: {
        destructive: false,
        impactLevel: "medium",
        notes: ["Nieuwe entity"],
      },
    };

    const parsed = changePlanSchema.parse(plan);
    expect(parsed.intent).toBe("create_entity");
    expect(parsed.commands).toHaveLength(1);
  });

  it("rejects destructive commands when risk.destructive is false", () => {
    const plan = {
      planId: "11111111-1111-4111-8111-111111111111",
      createdAt: "2026-02-16T17:00:00.000Z",
      intent: "delete",
      target: { microflow: "Sales.ACT_Old" },
      preconditions: ["Backup gemaakt"],
      commands: [
        {
          type: "delete_microflow",
          microflow: "Sales.ACT_Old",
          destructive: true,
        },
      ],
      risk: {
        destructive: false,
        impactLevel: "high",
        notes: ["Destructive"],
      },
    };

    expect(() => changePlanSchema.parse(plan)).toThrow("risk.destructive");
  });
});
