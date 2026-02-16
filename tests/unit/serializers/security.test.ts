import { describe, expect, it } from "vitest";
import {
  createMockEntityAccess,
  createMockSecurityOverview,
} from "../../mocks/mendix-model.js";
import {
  serializeEntityAccess,
  serializeSecurityOverview,
} from "../../../src/mendix/serializers/security.js";

describe("security serializers", () => {
  it("serializes security overview matrix", () => {
    const overview = createMockSecurityOverview();

    const output = serializeSecurityOverview(overview);

    expect(output).toContain("## Security Overview");
    expect(output).toContain("Security ingeschakeld: ja");
    expect(output).toContain("| Entity | Administrator | RegularUser |");
    expect(output).toContain("| Order | CRUD | R (eigen) |");
  });

  it("serializes security overview without roles", () => {
    const overview = createMockSecurityOverview({ userRoles: [], modules: [] });
    const output = serializeSecurityOverview(overview);
    expect(output).toContain("(geen user roles gevonden)");
  });

  it("serializes detailed entity access", () => {
    const access = createMockEntityAccess();

    const output = serializeEntityAccess(access);

    expect(output).toContain("## Entity: Sales.Order");
    expect(output).toContain("### Role: Administrator");
    expect(output).toContain("Create: ✅");
    expect(output).toContain("### Role: RegularUser");
    expect(output).toContain("XPath constraint:");
    expect(output).toContain("OrderNumber: Read");
  });

  it("handles entity without access rules", () => {
    const access = createMockEntityAccess({ rules: [] });
    const output = serializeEntityAccess(access);
    expect(output).toContain("Geen access rules gevonden.");
  });
});
