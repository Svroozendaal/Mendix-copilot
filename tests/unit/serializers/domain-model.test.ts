import { describe, expect, it } from "vitest";
import { DomainModelInfo, EntityInfo } from "../../../src/mendix/client.js";
import {
  serializeAssociations,
  serializeDomainModel,
  serializeEntityDetails,
  serializeModuleOverview,
} from "../../../src/mendix/serializers/domain-model.js";

function createOrderEntity(): EntityInfo {
  return {
    moduleName: "Sales",
    name: "Order",
    qualifiedName: "Sales.Order",
    attributes: [
      {
        name: "OrderNumber",
        type: "AutoNumber",
        defaultValue: "",
        validationRules: [],
      },
      {
        name: "Status",
        type: "Enumeration: OrderStatus",
        defaultValue: "New",
        validationRules: ["Status is verplicht"],
      },
    ],
    associations: [
      {
        name: "Order_Customer",
        type: "Reference",
        sourceEntity: "Sales.Order",
        targetEntity: "Sales.Customer",
        owner: "default",
        deleteBehavior: "deleteSource",
        navigability: "both",
      },
    ],
    accessRules: [
      {
        role: "Admin",
        create: true,
        delete: true,
        read: true,
        write: true,
      },
    ],
    eventHandlers: {
      beforeCommit: "Sales.BC_Order",
      afterCommit: "Sales.AC_Order",
    },
    indexes: ["Idx_OrderNumber (OrderNumber)"],
    validationRules: ["Order should have a customer"],
    generalization: "System.Entity",
  };
}

function createCustomerEntity(): EntityInfo {
  return {
    moduleName: "Sales",
    name: "Customer",
    qualifiedName: "Sales.Customer",
    attributes: [
      {
        name: "Name",
        type: "String",
        validationRules: [],
      },
    ],
    associations: [
      {
        name: "Order_Customer",
        type: "Reference",
        sourceEntity: "Sales.Order",
        targetEntity: "Sales.Customer",
        owner: "default",
        deleteBehavior: "deleteSource",
        navigability: "both",
      },
    ],
    accessRules: [],
    eventHandlers: {},
    indexes: [],
    validationRules: [],
  };
}

describe("domain-model serializers", () => {
  it("serializes module overview", () => {
    const output = serializeModuleOverview({
      name: "Sales",
      entityCount: 2,
      microflowCount: 4,
      pageCount: 3,
    });

    expect(output).toContain("## Module: Sales");
    expect(output).toContain("- Entities: 2");
    expect(output).toContain("- Microflows: 4");
    expect(output).toContain("- Pages: 3");
  });

  it("serializes empty domain model", () => {
    const emptyModel: DomainModelInfo = {
      moduleName: "EmptyModule",
      entities: [],
      associations: [],
      microflowCount: 0,
      pageCount: 0,
    };

    const output = serializeDomainModel(emptyModel);
    expect(output).toContain("Geen entities gevonden");
  });

  it("serializes domain model in detailed and non-detailed mode", () => {
    const domainModel: DomainModelInfo = {
      moduleName: "Sales",
      entities: [createOrderEntity(), createCustomerEntity()],
      associations: [],
      microflowCount: 3,
      pageCount: 2,
    };

    const concise = serializeDomainModel(domainModel, { detailed: false });
    const detailed = serializeDomainModel(domainModel, { detailed: true });

    expect(concise).toContain("### Entity: Order");
    expect(concise).not.toContain("Validatieregels:");

    expect(detailed).toContain("Validatieregels:");
    expect(detailed).toContain("Indexes:");
    expect(detailed).toContain("Idx_OrderNumber (OrderNumber)");
  });

  it("serializes entity details", () => {
    const output = serializeEntityDetails(createOrderEntity());

    expect(output).toContain("## Entity: Sales.Order");
    expect(output).toContain("Generalisatie: System.Entity");
    expect(output).toContain("Type: Enumeration: OrderStatus");
    expect(output).toContain("Role: Admin");
    expect(output).toContain("Before commit: Sales.BC_Order");
    expect(output).toContain("Idx_OrderNumber (OrderNumber)");
  });

  it("serializes associations where entity is parent or child", () => {
    const order = createOrderEntity();
    const customer = createCustomerEntity();

    const output = serializeAssociations(order, [order, customer]);

    expect(output).toContain("## Associaties voor entity: Sales.Order");
    expect(output).toContain("Order_Customer");
    expect(output).toContain("Source: Sales.Order");
    expect(output).toContain("Target: Sales.Customer");
  });
});
