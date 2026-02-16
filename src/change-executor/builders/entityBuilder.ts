import type {
  AddAttributeCommand,
  CreateEntityCommand,
} from "../../change-planner/dsl/commandTypes.js";

export interface BuilderResult {
  affectedArtifacts: string[];
  notes: string[];
}

export class EntityBuilder {
  async createEntity(command: CreateEntityCommand): Promise<BuilderResult> {
    return {
      affectedArtifacts: [`${command.module}.${command.name}`],
      notes: [`Entity ${command.module}.${command.name} gepland voor creatie.`],
    };
  }

  async addAttribute(command: AddAttributeCommand): Promise<BuilderResult> {
    return {
      affectedArtifacts: [command.entity],
      notes: [`Attribuut ${command.name} toegevoegd aan ${command.entity} (simulated).`],
    };
  }
}
