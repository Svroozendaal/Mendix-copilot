import { describe, expect, it } from "vitest";
import { classifyIntent } from "../../../src/change-planner/planner/intentClassifier.js";

describe("classifyIntent", () => {
  it("detects create entity intent", () => {
    const result = classifyIntent("Create entity Invoice in module Sales");
    expect(result.intent).toBe("create_entity");
    expect(result.module).toBe("Sales");
    expect(result.entity).toBe("Invoice");
  });

  it("detects add attribute intent with datatype", () => {
    const result = classifyIntent("Voeg attribute TotalAmount Decimal toe aan Sales.Invoice");
    expect(result.intent).toBe("add_attribute");
    expect(result.attributeName).toBe("TotalAmount");
    expect(result.attributeType).toBe("Decimal");
  });

  it("detects generate crud intent", () => {
    const result = classifyIntent("Generate CRUD for Sales.Invoice");
    expect(result.intent).toBe("generate_crud");
    expect(result.entity).toBe("Sales.Invoice");
  });
});
