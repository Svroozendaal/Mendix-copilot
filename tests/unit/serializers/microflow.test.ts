import { describe, expect, it } from "vitest";
import {
  createMockMicroflowDetails,
  createMockMicroflowListItem,
} from "../../mocks/mendix-model.js";
import {
  serializeMicroflowDetails,
  serializeMicroflowList,
} from "../../../src/mendix/serializers/microflow.js";

describe("microflow serializers", () => {
  it("serializes a simple microflow list and marks sub-microflows", () => {
    const list = [
      createMockMicroflowListItem({
        name: "SUB_Helper",
        qualifiedName: "Sales.SUB_Helper",
        isSubMicroflow: true,
      }),
      createMockMicroflowListItem({
        name: "ACT_Order_Create",
        qualifiedName: "Sales.ACT_Order_Create",
      }),
    ];

    const output = serializeMicroflowList(list);

    expect(output).toContain("Microflows (2):");
    expect(output).toContain("- ACT_Order_Create");
    expect(output).toContain("- SUB_Helper [sub-microflow]");
  });

  it("serializes details for a simple create+commit microflow", () => {
    const details = createMockMicroflowDetails({
      steps: [
        {
          type: "Create",
          description: "Maak nieuw Sales.Order object",
          transitions: [],
        },
        {
          type: "Commit",
          description: "Sla object op",
          transitions: ["Volgende stap"],
        },
      ],
      hasErrorHandling: true,
    });

    const output = serializeMicroflowDetails(details);

    expect(output).toContain("## Microflow: ACT_Order_Create");
    expect(output).toContain("1. [Create] Maak nieuw Sales.Order object");
    expect(output).toContain("2. [Commit] Sla object op");
    expect(output).toContain("-> Volgende stap");
    expect(output).toContain("Error handling: Aanwezig.");
  });

  it("serializes a microflow with a decision", () => {
    const details = createMockMicroflowDetails({
      name: "ACT_Order_Validate",
      qualifiedName: "Sales.ACT_Order_Validate",
      steps: [
        {
          type: "Decision",
          description: "Is $OrderData/CustomerID leeg?",
          transitions: ["Ja: ga naar stap 3", "Nee: ga naar stap 4"],
        },
      ],
    });

    const output = serializeMicroflowDetails(details);

    expect(output).toContain("[Decision] Is $OrderData/CustomerID leeg?");
    expect(output).toContain("Ja: ga naar stap 3");
    expect(output).toContain("Nee: ga naar stap 4");
  });

  it("serializes empty microflow details", () => {
    const details = createMockMicroflowDetails({
      name: "ACT_Empty",
      qualifiedName: "Sales.ACT_Empty",
      steps: [],
      hasErrorHandling: false,
    });

    const output = serializeMicroflowDetails(details);

    expect(output).toContain("Geen activiteiten gevonden.");
    expect(output).toContain("Error handling: Geen (aanbeveling: voeg error handler toe).");
  });

  it("handles unknown activity type gracefully", () => {
    const details = createMockMicroflowDetails({
      name: "ACT_Unknown",
      qualifiedName: "Sales.ACT_Unknown",
      steps: [
        {
          type: "Unknown: QuantumAction",
          description: "Onbekend activity type",
          transitions: [],
        },
      ],
      unknownActivityTypes: ["QuantumAction"],
    });

    const output = serializeMicroflowDetails(details);

    expect(output).toContain("[Unknown: QuantumAction] Onbekend activity type");
    expect(output).toContain("Onbekende activity types: QuantumAction");
  });
});
