import type { ChangeCommand, ChangePlan } from "../change-planner/dsl/changePlan.schema.js";

export interface ExecutionPreview {
  summary: string[];
  affectedArtifacts: string[];
  destructive: boolean;
}

function renderCommand(command: ChangeCommand): string {
  switch (command.type) {
    case "create_entity":
      return `+ Create entity ${command.module}.${command.name}`;
    case "add_attribute":
      return `+ Add attribute ${command.name} (${command.dataType}) to ${command.entity}`;
    case "create_microflow":
      return `+ Create microflow ${command.module}.${command.name}`;
    case "add_microflow_step":
      return `+ Add ${command.stepType} step to ${command.microflow}`;
    case "generate_crud":
      return `+ Generate CRUD for ${command.entity}`;
    case "delete_microflow":
      return `- Delete microflow ${command.microflow}`;
    case "rename_element":
      return `- Rename ${command.elementKind}: ${command.from} -> ${command.to}`;
    default:
      return "+ Unknown command";
  }
}

function affectedArtifact(command: ChangeCommand): string[] {
  switch (command.type) {
    case "create_entity":
      return [`${command.module}.${command.name}`];
    case "add_attribute":
    case "generate_crud":
      return [command.entity];
    case "create_microflow":
      return [`${command.module}.${command.name}`];
    case "add_microflow_step":
    case "delete_microflow":
      return [command.microflow];
    case "rename_element":
      return [command.from, command.to];
    default:
      return [];
  }
}

export function generatePreview(changePlan: ChangePlan): ExecutionPreview {
  const summary = changePlan.commands.map((command) => renderCommand(command));
  const affected = new Set<string>();

  for (const command of changePlan.commands) {
    for (const artifact of affectedArtifact(command)) {
      affected.add(artifact);
    }
  }

  return {
    summary,
    affectedArtifacts: Array.from(affected).sort((left, right) => left.localeCompare(right)),
    destructive: changePlan.risk.destructive,
  };
}
