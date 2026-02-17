import { describe, expect, it, vi } from "vitest";
import { planFromNaturalLanguage } from "../../../src/change-planner/planner/planFromNaturalLanguage.js";

function makeCoreMock() {
  return {
    listModules: vi.fn().mockResolvedValue({
      text: "Modules",
      meta: {
        modules: [
          { name: "Sales", fromMarketplace: false },
          { name: "MarketplaceModule", fromMarketplace: true },
        ],
      },
    }),
    searchModel: vi.fn().mockResolvedValue({
      text: "Search",
      meta: { results: [] },
    }),
    getEntityDetails: vi.fn().mockResolvedValue({
      text: "Entity",
      meta: {
        entity: {
          moduleName: "Sales",
          name: "Invoice",
          qualifiedName: "Sales.Invoice",
          attributes: [],
        },
      },
    }),
    getMicroflowDetails: vi.fn().mockResolvedValue({
      text: "Microflow",
      meta: {
        microflow: {
          moduleName: "Sales",
          name: "ACT_Test",
          qualifiedName: "Sales.ACT_Test",
          parameters: [],
          returnType: "Void",
          isSubMicroflow: false,
          steps: [],
          hasErrorHandling: true,
          unknownActivityTypes: [],
        },
      },
    }),
  };
}

describe("planFromNaturalLanguage", () => {
  it("generates create_entity plan", async () => {
    const core = makeCoreMock();

    const result = await planFromNaturalLanguage(core as never, {
      message: "Create entity Invoice in module Sales",
    });

    expect(result.changePlan.intent).toBe("create_entity");
    expect(result.changePlan.commands[0]?.type).toBe("create_entity");
    expect(result.preview.destructive).toBe(false);
  });

  it("generates generate_crud plan", async () => {
    const core = makeCoreMock();

    const result = await planFromNaturalLanguage(core as never, {
      message: "Generate CRUD for Sales.Invoice",
    });

    expect(result.changePlan.intent).toBe("generate_crud");
    expect(result.changePlan.commands[0]?.type).toBe("generate_crud");
    expect(result.preview.summary[0]).toContain("CRUD");
  });

  it("generates add_attribute plan", async () => {
    const core = makeCoreMock();

    const result = await planFromNaturalLanguage(core as never, {
      message: "Voeg attribute TotalAmount Decimal toe aan Sales.Invoice",
    });

    expect(result.changePlan.intent).toBe("add_attribute");
    expect(result.changePlan.commands[0]?.type).toBe("add_attribute");
    expect(result.changePlan.commands[0]).toMatchObject({
      name: "TotalAmount",
      dataType: "Decimal",
    });
  });

  it("infers module from qualified context when module is not provided", async () => {
    const core = makeCoreMock();

    const result = await planFromNaturalLanguage(core as never, {
      message: "Maak een microflow voor order validatie",
      context: {
        selectedType: "microflow",
        qualifiedName: "Sales.ACT_Order_Create",
      },
    });

    expect(result.changePlan.target.module).toBe("Sales");
  });
});
