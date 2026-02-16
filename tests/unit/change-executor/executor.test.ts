import { describe, expect, it } from "vitest";
import {
  executePlan,
  requiredConfirmationText,
  type ExecutionEvent,
} from "../../../src/change-executor/executor.js";
import { generatePreview } from "../../../src/change-executor/previewGenerator.js";
import type { ChangePlan } from "../../../src/change-planner/dsl/changePlan.schema.js";

function makeCrudPlan(): ChangePlan {
  return {
    planId: "11111111-1111-4111-8111-111111111111",
    createdAt: "2026-02-16T17:00:00.000Z",
    intent: "generate_crud",
    target: { module: "Sales", entity: "Sales.Invoice" },
    preconditions: ["none"],
    commands: [
      {
        type: "generate_crud",
        entity: "Sales.Invoice",
        module: "Sales",
        includePages: true,
      },
    ],
    risk: {
      destructive: false,
      impactLevel: "medium",
      notes: ["safe"],
    },
  };
}

describe("preview and executor", () => {
  it("generates readable preview", () => {
    const preview = generatePreview(makeCrudPlan());
    expect(preview.summary[0]).toContain("Generate CRUD");
    expect(preview.affectedArtifacts).toContain("Sales.Invoice");
    expect(preview.destructive).toBe(false);
  });

  it("executes plan in simulated mode", async () => {
    const result = await executePlan(makeCrudPlan());
    expect(result.success).toBe(true);
    expect(result.executionMode).toBe("simulated");
    expect(result.affectedArtifacts).toContain("Sales.Invoice");
    expect(result.commitMessage).toContain("Copilot:");
  });

  it("emits command and commit events during execution", async () => {
    const events: ExecutionEvent[] = [];

    await executePlan(makeCrudPlan(), {
      onEvent: (event) => {
        events.push(event);
      },
    });

    expect(events.map((event) => event.type)).toEqual([
      "command_start",
      "command_success",
      "commit_done",
    ]);

    const [startEvent, successEvent, commitEvent] = events;
    expect(startEvent.type).toBe("command_start");
    if (startEvent.type === "command_start") {
      expect(startEvent.command.type).toBe("generate_crud");
      expect(startEvent.commandIndex).toBe(0);
      expect(startEvent.totalCommands).toBe(1);
    }

    expect(successEvent.type).toBe("command_success");
    if (successEvent.type === "command_success") {
      expect(successEvent.command.type).toBe("generate_crud");
      expect(successEvent.notes.length).toBeGreaterThan(0);
    }

    expect(commitEvent.type).toBe("commit_done");
    if (commitEvent.type === "commit_done") {
      expect(commitEvent.commitMessage).toContain("Copilot:");
    }
  });

  it("uses target artifact for destructive confirmation text", () => {
    const destructivePlan: ChangePlan = {
      ...makeCrudPlan(),
      intent: "delete",
      target: { microflow: "Sales.ACT_Old" },
      commands: [
        {
          type: "delete_microflow",
          microflow: "Sales.ACT_Old",
          destructive: true,
        },
      ],
      risk: {
        destructive: true,
        impactLevel: "high",
        notes: ["destructive"],
      },
    };

    expect(requiredConfirmationText(destructivePlan)).toBe("Sales.ACT_Old");
  });
});
