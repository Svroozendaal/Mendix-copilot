import type { CopilotCore } from "../../core/copilot-core.js";
import type { EntityInfo, MicroflowDetailsInfo, SearchResultInfo } from "../../mendix/client.js";
import type { IntentClassification } from "./intentClassifier.js";

export interface PlannerRequestContext {
  selectedType?: "module" | "entity" | "microflow" | "page";
  module?: string;
  qualifiedName?: string;
}

export interface PlanningContext {
  modules: Array<{ name: string; fromMarketplace: boolean }>;
  requestedModule?: string;
  inferredModule?: string;
  searchResults: SearchResultInfo[];
  entityDetails?: EntityInfo;
  microflowDetails?: MicroflowDetailsInfo;
}

function ensureQualifiedEntityName(value: string | undefined, moduleName?: string): string | undefined {
  if (!value) {
    return undefined;
  }
  if (value.includes(".")) {
    return value;
  }
  if (!moduleName) {
    return undefined;
  }
  return `${moduleName}.${value}`;
}

function searchQueryForIntent(intent: IntentClassification): string {
  return (
    intent.microflow ||
    intent.entity ||
    intent.attributeName ||
    intent.module ||
    intent.originalMessage
  );
}

function searchScopeForIntent(intent: IntentClassification): "all" | "entities" | "microflows" {
  if (intent.intent === "create_microflow" || intent.intent === "modify_microflow") {
    return "microflows";
  }
  if (intent.intent === "create_entity" || intent.intent === "add_attribute" || intent.intent === "generate_crud") {
    return "entities";
  }
  return "all";
}

function moduleFromQualifiedName(qualifiedName: string | undefined): string | undefined {
  if (!qualifiedName) {
    return undefined;
  }

  const separatorIndex = qualifiedName.indexOf(".");
  if (separatorIndex <= 0) {
    return undefined;
  }
  return qualifiedName.slice(0, separatorIndex);
}

export async function collectPlanningContext(
  core: CopilotCore,
  intent: IntentClassification,
  requestContext: PlannerRequestContext = {}
): Promise<PlanningContext> {
  const modulesResponse = await core.listModules();
  const modules = modulesResponse.meta.modules;
  const inferredModule =
    requestContext.module || moduleFromQualifiedName(requestContext.qualifiedName) || intent.module;

  const searchResults = (
    await core.searchModel(searchQueryForIntent(intent), searchScopeForIntent(intent))
  ).meta.results;

  const entityQualifiedName = ensureQualifiedEntityName(intent.entity, inferredModule);
  let entityDetails: EntityInfo | undefined;
  if (entityQualifiedName) {
    try {
      entityDetails = (await core.getEntityDetails(entityQualifiedName)).meta.entity;
    } catch {
      entityDetails = undefined;
    }
  }

  let microflowDetails: MicroflowDetailsInfo | undefined;
  if (intent.microflow) {
    try {
      microflowDetails = (await core.getMicroflowDetails(intent.microflow)).meta.microflow;
    } catch {
      microflowDetails = undefined;
    }
  }

  return {
    modules,
    requestedModule: requestContext.module,
    inferredModule,
    searchResults,
    entityDetails,
    microflowDetails,
  };
}
