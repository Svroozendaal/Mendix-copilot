import { describe, expect, it } from "vitest";
import {
  createMockPageListItem,
  createMockPageStructure,
} from "../../mocks/mendix-model.js";
import {
  serializePageList,
  serializePageStructure,
} from "../../../src/mendix/serializers/page.js";

describe("page serializers", () => {
  it("serializes page list with layout and URL", () => {
    const pages = [
      createMockPageListItem({ name: "Z_Page", qualifiedName: "Sales.Z_Page" }),
      createMockPageListItem({ name: "A_Page", qualifiedName: "Sales.A_Page" }),
    ];

    const output = serializePageList(pages);

    expect(output).toContain("Pages (2):");
    expect(output).toContain("- A_Page | Layout: Atlas_Default | URL: /orders");
    expect(output).toContain("- Z_Page | Layout: Atlas_Default | URL: /orders");
  });

  it("serializes empty page list", () => {
    expect(serializePageList([])).toContain("Geen pages gevonden.");
  });

  it("serializes hierarchical page structure", () => {
    const page = createMockPageStructure();

    const output = serializePageStructure(page);

    expect(output).toContain("## Page: Order_Overview");
    expect(output).toContain("Layout: Atlas_Default");
    expect(output).toContain("└── Button \"Nieuwe Order\" (Actie: Microflow Sales.ACT_Order_Create)");
    expect(output).toContain("DataGrid (bron: Database, entity: Sales.Order)");
    expect(output).toContain("Kolom: OrderNumber");
  });

  it("handles page without widgets", () => {
    const page = createMockPageStructure({ widgets: [] });
    const output = serializePageStructure(page);
    expect(output).toContain("- (geen widgets gevonden)");
  });
});
