import { describe, expect, it } from "vitest";
import { validatePlan } from "../../../src/change-executor/validator.js";
import type { ChangePlan } from "../../../src/change-planner/dsl/changePlan.schema.js";

function basePlan(): ChangePlan {
  return {
    planId: "11111111-1111-4111-8111-111111111111",
    createdAt: "2026-02-16T17:00:00.000Z",
    intent: "add_attribute",
    target: { module: "Sales", entity: "Sales.Invoice" },
    preconditions: ["none"],
    commands: [
      {
        type: "add_attribute",
        entity: "Sales.Invoice",
        name: "TotalAmount",
        dataType: "Decimal",
      },
    ],
    risk: {
      destructive: false,
      impactLevel: "medium",
      notes: ["safe"],
    },
  };
}

describe("validatePlan", () => {
  it("returns errors when module/entity is missing", () => {
    const plan = basePlan();
    const result = validatePlan(plan, {
      modules: [{ name: "Sales", fromMarketplace: false }],
      entities: [],
      microflows: [],
    });

    expect(result.errors).toContain("Entity 'Sales.Invoice' bestaat niet.");
  });

  it("blocks writes in marketplace modules", () => {
    const plan = {
      ...basePlan(),
      commands: [
        {
          type: "create_entity" as const,
          module: "MarketplaceModule",
          name: "Invoice",
        },
      ],
      target: { module: "MarketplaceModule" },
      intent: "create_entity",
    };

    const result = validatePlan(plan, {
      modules: [{ name: "MarketplaceModule", fromMarketplace: true }],
      entities: [],
      microflows: [],
    });

    expect(result.errors.join(" ")).toContain("marketplace");
  });
});
