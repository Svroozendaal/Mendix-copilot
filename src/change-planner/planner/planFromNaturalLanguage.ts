import { randomUUID } from "node:crypto";
import type { CopilotCore } from "../../core/copilot-core.js";
import { changePlanSchema, type ChangePlan, type ChangeCommand } from "../dsl/changePlan.schema.js";
import { collectPlanningContext, type PlannerRequestContext } from "./contextCollector.js";
import { classifyIntent, type IntentClassification } from "./intentClassifier.js";

export interface PlanPreview {
  summary: string[];
  affectedArtifacts: string[];
  destructive: boolean;
}

export interface PlannedChangeResult {
  changePlan: ChangePlan;
  preview: PlanPreview;
}

function firstUserModule(modules: Array<{ name: string; fromMarketplace: boolean }>): string | undefined {
  return modules.find((moduleInfo) => !moduleInfo.fromMarketplace)?.name;
}

function ensureNotMarketplaceModule(
  moduleName: string | undefined,
  modules: Array<{ name: string; fromMarketplace: boolean }>
): void {
  if (!moduleName) {
    return;
  }

  const match = modules.find((moduleInfo) => moduleInfo.name.toLowerCase() === moduleName.toLowerCase());
  if (!match) {
    return;
  }

  if (match.fromMarketplace) {
    throw new Error(`Changes in marketplace module '${moduleName}' zijn niet toegestaan.`);
  }
}

function normalizeEntityQualifiedName(entity: string | undefined, moduleName: string | undefined): string | undefined {
  if (!entity) {
    return undefined;
  }
  if (entity.includes(".")) {
    return entity;
  }
  if (!moduleName) {
    return undefined;
  }
  return `${moduleName}.${entity}`;
}

function inferModule(intent: IntentClassification, context: { module?: string }, modules: Array<{ name: string; fromMarketplace: boolean }>): string {
  return context.module || intent.module || firstUserModule(modules) || "Main";
}

function inferEntityName(intent: IntentClassification): string {
  if (!intent.entity) {
    return "NewEntity";
  }
  if (!intent.entity.includes(".")) {
    return intent.entity;
  }
  return intent.entity.split(".")[1] || "NewEntity";
}

function inferMicroflowName(intent: IntentClassification): string {
  if (!intent.microflow) {
    return "ACT_NewMicroflow";
  }
  if (!intent.microflow.includes(".")) {
    return intent.microflow;
  }
  return intent.microflow.split(".")[1] || "ACT_NewMicroflow";
}

function toAttributeType(value: string | undefined): "String" | "Integer" | "Long" | "Decimal" | "Boolean" | "DateTime" | "AutoNumber" | "Enumeration" | "Reference" | "Unknown" {
  if (!value) {
    return "String";
  }
  const normalized = value.toLowerCase();
  if (normalized === "string") return "String";
  if (normalized === "integer") return "Integer";
  if (normalized === "long") return "Long";
  if (normalized === "decimal") return "Decimal";
  if (normalized === "boolean") return "Boolean";
  if (normalized === "datetime") return "DateTime";
  if (normalized === "autonumber") return "AutoNumber";
  if (normalized === "enumeration") return "Enumeration";
  if (normalized === "reference") return "Reference";
  return "Unknown";
}

function createCommands(
  intent: IntentClassification,
  plannerModule: string,
  inferredEntityQualifiedName: string
): ChangeCommand[] {
  switch (intent.intent) {
    case "create_entity":
      return [
        {
          type: "create_entity",
          module: plannerModule,
          name: inferEntityName(intent),
        },
      ];

    case "add_attribute":
      return [
        {
          type: "add_attribute",
          entity: inferredEntityQualifiedName,
          name: intent.attributeName || "NewAttribute",
          dataType: toAttributeType(intent.attributeType),
          required: false,
        },
      ];

    case "generate_crud":
      return [
        {
          type: "generate_crud",
          entity: inferredEntityQualifiedName,
          module: plannerModule,
          includePages: true,
        },
      ];

    case "create_microflow":
      return [
        {
          type: "create_microflow",
          module: plannerModule,
          name: inferMicroflowName(intent),
          returnType: "Void",
        },
      ];

    case "modify_microflow":
      return [
        {
          type: "add_microflow_step",
          microflow: intent.microflow || `${plannerModule}.ACT_NewMicroflow`,
          stepType: "Decision",
          description: "Voeg een controle-stap toe volgens de gebruikersvraag.",
        },
      ];

    case "delete":
      return [
        {
          type: "delete_microflow",
          microflow: intent.microflow || `${plannerModule}.ACT_ToDelete`,
          destructive: true,
        },
      ];

    case "rename": {
      const renameMatch = intent.originalMessage.match(
        /\b(?:rename|hernoem)\s+([A-Za-z0-9_.]+)\s+(?:to|naar)\s+([A-Za-z0-9_.]+)/i
      );
      const from = renameMatch?.[1] || intent.entity || intent.microflow || `${plannerModule}.Unknown`;
      const to = renameMatch?.[2] || `${from}_Renamed`;
      const elementKind = from.includes(".") ? "entity" : "module";

      return [
        {
          type: "rename_element",
          elementKind,
          from,
          to,
          destructive: true,
        },
      ];
    }

    case "unknown":
    default:
      return [
        {
          type: "create_microflow",
          module: plannerModule,
          name: "ACT_TODO",
          returnType: "Void",
        },
      ];
  }
}

function deriveRisk(commands: ChangeCommand[]): ChangePlan["risk"] {
  const destructive = commands.some(
    (command) => command.type === "delete_microflow" || command.type === "rename_element"
  );

  if (destructive) {
    return {
      destructive: true,
      impactLevel: "high",
      notes: ["Plan bevat destructive operations (delete/rename)."],
    };
  }

  const hasStructuralChange = commands.some(
    (command) =>
      command.type === "create_entity" ||
      command.type === "add_attribute" ||
      command.type === "generate_crud"
  );

  return {
    destructive: false,
    impactLevel: hasStructuralChange ? "medium" : "low",
    notes: hasStructuralChange
      ? ["Plan wijzigt domain model of genereert meerdere artifacts."]
      : ["Plan heeft beperkte impact."],
  };
}

function describeCommand(command: ChangeCommand): string {
  switch (command.type) {
    case "create_entity":
      return `Create entity ${command.module}.${command.name}`;
    case "add_attribute":
      return `Add attribute ${command.name} (${command.dataType}) to ${command.entity}`;
    case "create_microflow":
      return `Create microflow ${command.module}.${command.name}`;
    case "add_microflow_step":
      return `Add ${command.stepType} step to ${command.microflow}`;
    case "generate_crud":
      return `Generate CRUD artifacts for ${command.entity}`;
    case "delete_microflow":
      return `Delete microflow ${command.microflow}`;
    case "rename_element":
      return `Rename ${command.elementKind} ${command.from} -> ${command.to}`;
    default:
      return "Unknown command";
  }
}

function toAffectedArtifacts(commands: ChangeCommand[]): string[] {
  const affected = new Set<string>();

  for (const command of commands) {
    if (command.type === "create_entity") {
      affected.add(`${command.module}.${command.name}`);
      continue;
    }
    if (command.type === "add_attribute" || command.type === "generate_crud") {
      affected.add(command.entity);
      continue;
    }
    if (command.type === "create_microflow") {
      affected.add(`${command.module}.${command.name}`);
      continue;
    }
    if (command.type === "add_microflow_step" || command.type === "delete_microflow") {
      affected.add(command.microflow);
      continue;
    }
    if (command.type === "rename_element") {
      affected.add(command.from);
      affected.add(command.to);
    }
  }

  return Array.from(affected).sort((left, right) => left.localeCompare(right));
}

function buildPreview(plan: ChangePlan): PlanPreview {
  return {
    summary: plan.commands.map((command) => describeCommand(command)),
    affectedArtifacts: toAffectedArtifacts(plan.commands),
    destructive: plan.risk.destructive,
  };
}

export async function planFromNaturalLanguage(
  core: CopilotCore,
  input: { message: string; context?: PlannerRequestContext }
): Promise<PlannedChangeResult> {
  const classification = classifyIntent(input.message);
  const planningContext = await collectPlanningContext(core, classification, input.context);
  const plannerModule = inferModule(classification, input.context ?? {}, planningContext.modules);
  ensureNotMarketplaceModule(plannerModule, planningContext.modules);

  const entityQualifiedName =
    normalizeEntityQualifiedName(classification.entity, plannerModule) ||
    planningContext.entityDetails?.qualifiedName ||
    `${plannerModule}.Entity`;

  const commands = createCommands(classification, plannerModule, entityQualifiedName).slice(0, 25);
  const risk = deriveRisk(commands);

  const changePlanCandidate: ChangePlan = {
    planId: randomUUID(),
    createdAt: new Date().toISOString(),
    intent: classification.intent,
    target: {
      module: plannerModule,
      entity:
        classification.intent === "create_entity" ||
        classification.intent === "add_attribute" ||
        classification.intent === "generate_crud"
          ? entityQualifiedName
          : undefined,
      microflow:
        classification.intent === "create_microflow" ||
        classification.intent === "modify_microflow" ||
        classification.intent === "delete"
          ? classification.microflow || `${plannerModule}.${inferMicroflowName(classification)}`
          : undefined,
    },
    preconditions: [
      "Werk op een feature branch en review de preview voor execute.",
      "Geen writes in marketplace modules.",
    ],
    commands,
    risk,
  };

  const validatedPlan = changePlanSchema.parse(changePlanCandidate);
  return {
    changePlan: validatedPlan,
    preview: buildPreview(validatedPlan),
  };
}
