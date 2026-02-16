import type { ChangeCommand, ChangePlan } from "../change-planner/dsl/changePlan.schema.js";
import { CrudGenerator } from "./builders/crudGenerator.js";
import { EntityBuilder, type BuilderResult } from "./builders/entityBuilder.js";
import { MicroflowBuilder } from "./builders/microflowBuilder.js";

export interface ExecutionCommandStartEvent {
  type: "command_start";
  commandIndex: number;
  totalCommands: number;
  command: ChangeCommand;
}

export interface ExecutionCommandSuccessEvent {
  type: "command_success";
  commandIndex: number;
  totalCommands: number;
  command: ChangeCommand;
  notes: string[];
}

export interface ExecutionCommandFailedEvent {
  type: "command_failed";
  commandIndex: number;
  totalCommands: number;
  command: ChangeCommand;
  error: string;
}

export interface ExecutionCommitDoneEvent {
  type: "commit_done";
  commitMessage: string;
}

export type ExecutionEvent =
  | ExecutionCommandStartEvent
  | ExecutionCommandSuccessEvent
  | ExecutionCommandFailedEvent
  | ExecutionCommitDoneEvent;

export interface ExecutePlanOptions {
  entityBuilder?: EntityBuilder;
  microflowBuilder?: MicroflowBuilder;
  crudGenerator?: CrudGenerator;
  onEvent?: (event: ExecutionEvent) => void;
}

export interface ExecutePlanResult {
  success: true;
  commitMessage: string;
  affectedArtifacts: string[];
  notes: string[];
  executionMode: "simulated";
}

function mergeResults(results: BuilderResult[]): { affectedArtifacts: string[]; notes: string[] } {
  const artifactSet = new Set<string>();
  const notes: string[] = [];

  for (const result of results) {
    result.affectedArtifacts.forEach((artifact) => artifactSet.add(artifact));
    notes.push(...result.notes);
  }

  return {
    affectedArtifacts: Array.from(artifactSet).sort((left, right) => left.localeCompare(right)),
    notes,
  };
}

function planSummary(plan: ChangePlan): string {
  const commands = plan.commands.slice(0, 2).map((command) => command.type);
  const suffix = plan.commands.length > 2 ? ", ..." : "";
  return commands.join(", ") + suffix;
}

export function requiredConfirmationText(plan: ChangePlan): string {
  return plan.target.microflow || plan.target.entity || plan.target.module || plan.planId;
}

export async function executePlan(
  validatedPlan: ChangePlan,
  options: ExecutePlanOptions = {}
): Promise<ExecutePlanResult> {
  const entityBuilder = options.entityBuilder ?? new EntityBuilder();
  const microflowBuilder = options.microflowBuilder ?? new MicroflowBuilder();
  const crudGenerator = options.crudGenerator ?? new CrudGenerator();
  const onEvent = options.onEvent;

  const builderResults: BuilderResult[] = [];

  for (let commandIndex = 0; commandIndex < validatedPlan.commands.length; commandIndex += 1) {
    const command = validatedPlan.commands[commandIndex];
    const totalCommands = validatedPlan.commands.length;

    onEvent?.({
      type: "command_start",
      commandIndex,
      totalCommands,
      command,
    });

    try {
      const commandResults: BuilderResult[] = [];

      switch (command.type) {
        case "create_entity":
          commandResults.push(await entityBuilder.createEntity(command));
          break;
        case "add_attribute":
          commandResults.push(await entityBuilder.addAttribute(command));
          break;
        case "create_microflow":
          commandResults.push(await microflowBuilder.createMicroflow(command));
          break;
        case "add_microflow_step":
          commandResults.push(await microflowBuilder.addStep(command));
          commandResults.push(await microflowBuilder.wireSequenceFlow(command));
          commandResults.push(await microflowBuilder.addDefaultErrorHandler(command));
          break;
        case "generate_crud":
          commandResults.push(await crudGenerator.generateCreate(command));
          commandResults.push(await crudGenerator.generateRetrieve(command));
          commandResults.push(await crudGenerator.generateUpdate(command));
          commandResults.push(await crudGenerator.generateDelete(command));
          break;
        case "delete_microflow":
          commandResults.push(await microflowBuilder.deleteMicroflow(command));
          break;
        case "rename_element":
          commandResults.push({
            affectedArtifacts: [command.from, command.to],
            notes: [`Rename ${command.from} -> ${command.to} gepland (simulated).`],
          });
          break;
        default:
          commandResults.push({
            affectedArtifacts: [],
            notes: ["Onbekend command overgeslagen."],
          });
      }

      commandResults.forEach((result) => builderResults.push(result));
      onEvent?.({
        type: "command_success",
        commandIndex,
        totalCommands,
        command,
        notes: commandResults.flatMap((result) => result.notes),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      onEvent?.({
        type: "command_failed",
        commandIndex,
        totalCommands,
        command,
        error: message,
      });
      throw error;
    }
  }

  const merged = mergeResults(builderResults);
  const commitMessage = `Copilot: ${planSummary(validatedPlan)}`;
  onEvent?.({
    type: "commit_done",
    commitMessage,
  });

  return {
    success: true,
    commitMessage,
    affectedArtifacts: merged.affectedArtifacts,
    notes: merged.notes,
    executionMode: "simulated",
  };
}
