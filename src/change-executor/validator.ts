import {
  changePlanSchema,
  type ChangeCommand,
  type ChangePlan,
} from "../change-planner/dsl/changePlan.schema.js";

export interface EntityValidationContext {
  qualifiedName: string;
  module: string;
  attributes: string[];
}

export interface ValidationAppContext {
  modules: Array<{ name: string; fromMarketplace: boolean }>;
  entities: EntityValidationContext[];
  microflows: string[];
  systemModules?: string[];
}

export interface ValidatePlanResult {
  validatedPlan: ChangePlan;
  warnings: string[];
  errors: string[];
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function moduleFromQualifiedName(qualifiedName: string): string | undefined {
  const separator = qualifiedName.indexOf(".");
  if (separator <= 0) {
    return undefined;
  }
  return qualifiedName.slice(0, separator);
}

function commandModule(command: ChangeCommand): string | undefined {
  switch (command.type) {
    case "create_entity":
      return command.module;
    case "create_microflow":
      return command.module;
    case "add_attribute":
      return moduleFromQualifiedName(command.entity);
    case "generate_crud":
      return command.module ?? moduleFromQualifiedName(command.entity);
    case "add_microflow_step":
      return moduleFromQualifiedName(command.microflow);
    case "delete_microflow":
      return moduleFromQualifiedName(command.microflow);
    case "rename_element":
      return moduleFromQualifiedName(command.from) ?? moduleFromQualifiedName(command.to);
    default:
      return undefined;
  }
}

function isDestructiveCommand(command: ChangeCommand): boolean {
  return command.type === "delete_microflow" || command.type === "rename_element";
}

export function validatePlan(
  changePlan: ChangePlan,
  appContext: ValidationAppContext
): ValidatePlanResult {
  const validatedPlan = changePlanSchema.parse(changePlan);
  const warnings: string[] = [];
  const errors: string[] = [];
  const systemModules = new Set((appContext.systemModules ?? ["System", "Administration"]).map(normalize));

  const moduleMap = new Map(
    appContext.modules.map((moduleInfo) => [normalize(moduleInfo.name), moduleInfo] as const)
  );
  const entityMap = new Map(
    appContext.entities.map((entity) => [normalize(entity.qualifiedName), entity] as const)
  );
  const microflowSet = new Set(appContext.microflows.map((microflow) => normalize(microflow)));

  for (const command of validatedPlan.commands) {
    const moduleName = commandModule(command);
    if (moduleName) {
      const moduleInfo = moduleMap.get(normalize(moduleName));
      if (!moduleInfo) {
        errors.push(`Module '${moduleName}' bestaat niet.`);
      } else {
        if (moduleInfo.fromMarketplace) {
          errors.push(`Writes in marketplace module '${moduleName}' zijn niet toegestaan.`);
        }
        if (systemModules.has(normalize(moduleName))) {
          errors.push(`Writes in system module '${moduleName}' zijn niet toegestaan.`);
        }
      }
    }

    if (isDestructiveCommand(command) && !validatedPlan.risk.destructive) {
      errors.push(`Command '${command.type}' vereist risk.destructive=true.`);
    }

    if (command.type === "add_attribute") {
      const entity = entityMap.get(normalize(command.entity));
      if (!entity) {
        errors.push(`Entity '${command.entity}' bestaat niet.`);
      } else if (entity.attributes.some((attribute) => normalize(attribute) === normalize(command.name))) {
        errors.push(`Attribuut '${command.name}' bestaat al op '${command.entity}'.`);
      }
    }

    if (command.type === "generate_crud") {
      if (!entityMap.has(normalize(command.entity))) {
        errors.push(`Entity '${command.entity}' bestaat niet voor CRUD generation.`);
      }
    }

    if (command.type === "create_microflow") {
      const qualifiedName = `${command.module}.${command.name}`;
      if (microflowSet.has(normalize(qualifiedName))) {
        errors.push(`Microflow '${qualifiedName}' bestaat al.`);
      }
    }
  }

  if (validatedPlan.commands.length > 25) {
    errors.push("Plan bevat meer dan 25 commands.");
  }

  if (!validatedPlan.risk.destructive) {
    warnings.push("Plan is non-destructive; controleer nog steeds naming-conflicten.");
  }

  return {
    validatedPlan,
    warnings,
    errors,
  };
}
