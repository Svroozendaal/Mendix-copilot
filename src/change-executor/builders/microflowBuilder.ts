import type {
  AddMicroflowStepCommand,
  CreateMicroflowCommand,
  DeleteMicroflowCommand,
} from "../../change-planner/dsl/commandTypes.js";
import type { BuilderResult } from "./entityBuilder.js";

export class MicroflowBuilder {
  async createMicroflow(command: CreateMicroflowCommand): Promise<BuilderResult> {
    const qualifiedName = `${command.module}.${command.name}`;
    return {
      affectedArtifacts: [qualifiedName],
      notes: [`Microflow ${qualifiedName} gepland voor creatie.`],
    };
  }

  async addStep(command: AddMicroflowStepCommand): Promise<BuilderResult> {
    return {
      affectedArtifacts: [command.microflow],
      notes: [`Stap (${command.stepType}) toegevoegd in ${command.microflow} (simulated).`],
    };
  }

  async wireSequenceFlow(command: AddMicroflowStepCommand): Promise<BuilderResult> {
    return {
      affectedArtifacts: [command.microflow],
      notes: [`Sequence flow wired voor ${command.microflow} (simulated).`],
    };
  }

  async addDefaultErrorHandler(command: AddMicroflowStepCommand): Promise<BuilderResult> {
    return {
      affectedArtifacts: [command.microflow],
      notes: [`Default error handler toegevoegd aan ${command.microflow} (simulated).`],
    };
  }

  async deleteMicroflow(command: DeleteMicroflowCommand): Promise<BuilderResult> {
    return {
      affectedArtifacts: [command.microflow],
      notes: [`Microflow ${command.microflow} gepland voor verwijdering.`],
    };
  }
}
