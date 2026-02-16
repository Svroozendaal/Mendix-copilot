import type {
  BestPracticeFindingInfo,
  DependencyInfo,
  EntityAccessInfo,
  MicroflowDetailsInfo,
  MicroflowInfo,
  PageInfo,
  PageStructureInfo,
  SecurityOverviewInfo,
} from "../../src/mendix/client.js";

export function createMockMicroflowListItem(
  overrides: Partial<MicroflowInfo> = {}
): MicroflowInfo {
  return {
    moduleName: "Sales",
    name: "ACT_Order_Create",
    qualifiedName: "Sales.ACT_Order_Create",
    parameters: [{ name: "OrderData", type: "Object" }],
    returnType: "Boolean",
    isSubMicroflow: false,
    ...overrides,
  };
}

export function createMockMicroflowDetails(
  overrides: Partial<MicroflowDetailsInfo> = {}
): MicroflowDetailsInfo {
  return {
    ...createMockMicroflowListItem(),
    steps: [
      {
        type: "CreateObject",
        description: "Maak nieuw Sales.Order object",
        transitions: [],
      },
      {
        type: "Commit",
        description: "Sla object op",
        transitions: [],
      },
    ],
    hasErrorHandling: false,
    unknownActivityTypes: [],
    ...overrides,
  };
}

export function createMockPageListItem(overrides: Partial<PageInfo> = {}): PageInfo {
  return {
    moduleName: "Sales",
    name: "Order_Overview",
    qualifiedName: "Sales.Order_Overview",
    layoutName: "Atlas_Default",
    url: "/orders",
    ...overrides,
  };
}

export function createMockPageStructure(
  overrides: Partial<PageStructureInfo> = {}
): PageStructureInfo {
  return {
    ...createMockPageListItem(),
    widgets: [
      {
        type: "DataGrid",
        dataSource: "Database",
        entity: "Sales.Order",
        children: [
          {
            type: "Column",
            attribute: "OrderNumber",
            children: [],
          },
        ],
      },
      {
        type: "Button",
        label: "Nieuwe Order",
        action: "Microflow Sales.ACT_Order_Create",
        children: [],
      },
    ],
    ...overrides,
  };
}

export function createMockSecurityOverview(
  overrides: Partial<SecurityOverviewInfo> = {}
): SecurityOverviewInfo {
  return {
    securityEnabled: true,
    userRoles: [
      {
        name: "Administrator",
        moduleRoles: ["Sales.Admin"],
      },
      {
        name: "RegularUser",
        moduleRoles: ["Sales.User"],
      },
    ],
    modules: [
      {
        moduleName: "Sales",
        entities: [
          {
            qualifiedName: "Sales.Order",
            entityName: "Order",
            permissions: [
              {
                role: "Administrator",
                create: true,
                read: true,
                update: true,
                delete: true,
                ownOnly: false,
              },
              {
                role: "RegularUser",
                create: false,
                read: true,
                update: false,
                delete: false,
                ownOnly: true,
              },
            ],
          },
        ],
      },
    ],
    ...overrides,
  };
}

export function createMockEntityAccess(
  overrides: Partial<EntityAccessInfo> = {}
): EntityAccessInfo {
  return {
    moduleName: "Sales",
    entityName: "Order",
    qualifiedName: "Sales.Order",
    rules: [
      {
        role: "Administrator",
        create: true,
        read: true,
        update: true,
        delete: true,
        ownOnly: false,
        attributePermissions: [
          { attribute: "OrderNumber", read: true, write: true },
          { attribute: "Status", read: true, write: true },
        ],
      },
      {
        role: "RegularUser",
        create: false,
        read: true,
        update: false,
        delete: false,
        ownOnly: true,
        xpathConstraint: "[Sales.Order_Account='[%CurrentUser%]']",
        attributePermissions: [
          { attribute: "OrderNumber", read: true, write: false },
          { attribute: "Status", read: true, write: false },
        ],
      },
    ],
    ...overrides,
  };
}

export function createMockBestPracticeFinding(
  overrides: Partial<BestPracticeFindingInfo> = {}
): BestPracticeFindingInfo {
  return {
    severity: "warning",
    category: "microflow",
    location: "Sales.ACT_Order_Create",
    description: "Microflow heeft geen error handling.",
    recommendation: "Voeg een error handler toe.",
    ...overrides,
  };
}

export function createMockDependency(
  overrides: Partial<DependencyInfo> = {}
): DependencyInfo {
  return {
    document: "Sales.ACT_Order_Create",
    outgoing: ["Sales.SUB_ValidateOrder", "Sales.Order"],
    incoming: ["Sales.ACT_Order_Submit"],
    notes: ["Heuristische afhankelijkheden op basis van calls en bindings."],
    ...overrides,
  };
}
