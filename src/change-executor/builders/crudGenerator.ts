import type { GenerateCrudCommand } from "../../change-planner/dsl/commandTypes.js";
import type { BuilderResult } from "./entityBuilder.js";

export class CrudGenerator {
  async generateCreate(command: GenerateCrudCommand): Promise<BuilderResult> {
    return {
      affectedArtifacts: [command.entity],
      notes: [`Create logic gegenereerd voor ${command.entity} (simulated).`],
    };
  }

  async generateUpdate(command: GenerateCrudCommand): Promise<BuilderResult> {
    return {
      affectedArtifacts: [command.entity],
      notes: [`Update logic gegenereerd voor ${command.entity} (simulated).`],
    };
  }

  async generateDelete(command: GenerateCrudCommand): Promise<BuilderResult> {
    return {
      affectedArtifacts: [command.entity],
      notes: [`Delete logic gegenereerd voor ${command.entity} (simulated).`],
    };
  }

  async generateRetrieve(command: GenerateCrudCommand): Promise<BuilderResult> {
    return {
      affectedArtifacts: [command.entity],
      notes: [`Retrieve logic gegenereerd voor ${command.entity} (simulated).`],
    };
  }
}
