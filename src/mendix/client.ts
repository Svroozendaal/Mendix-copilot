import { IModel } from "mendixmodelsdk";
import { MendixPlatformClient, setLogger, setPlatformConfig } from "mendixplatformsdk";
import { MendixCopilotConfig } from "../config/index.js";

interface RecordLike {
  [key: string]: unknown;
}

interface Loadable {
  load: () => Promise<unknown>;
}

interface DeleteableWorkingCopy extends RecordLike {
  openModel: () => Promise<unknown>;
  delete?: () => Promise<void>;
}

interface AppHandle {
  createTemporaryWorkingCopy: (branch: string) => Promise<DeleteableWorkingCopy>;
}

const platformSdkLogger = {
  info: (...optionalParams: unknown[]): void => {
    console.error(...optionalParams);
  },
  warn: (...optionalParams: unknown[]): void => {
    console.error(...optionalParams);
  },
  error: (...optionalParams: unknown[]): void => {
    console.error(...optionalParams);
  },
};

export interface ModuleInfo {
  name: string;
  fromMarketplace: boolean;
}

export interface AppInfo {
  name: string;
  appId: string;
  branch: string;
  mendixVersion: string;
  moduleCount: number;
  modules: ModuleInfo[];
}

export interface AttributeInfo {
  name: string;
  type: string;
  defaultValue?: string;
  validationRules: string[];
}

export interface AssociationInfo {
  name: string;
  type: string;
  sourceEntity: string;
  targetEntity: string;
  owner: string;
  deleteBehavior: string;
  navigability: string;
}

export interface EntityAccessRuleInfo {
  role: string;
  create: boolean;
  delete: boolean;
  read: boolean;
  write: boolean;
  xpathConstraint?: string;
}

export interface EntityEventHandlers {
  beforeCommit?: string;
  afterCommit?: string;
  beforeDelete?: string;
  afterDelete?: string;
}

export interface EntityInfo {
  moduleName: string;
  name: string;
  qualifiedName: string;
  attributes: AttributeInfo[];
  associations: AssociationInfo[];
  accessRules: EntityAccessRuleInfo[];
  eventHandlers: EntityEventHandlers;
  indexes: string[];
  validationRules: string[];
  generalization?: string;
}

export interface DomainModelInfo {
  moduleName: string;
  entities: EntityInfo[];
  associations: AssociationInfo[];
  microflowCount: number;
  pageCount: number;
}

export interface MicroflowParameterInfo {
  name: string;
  type: string;
}

export interface MicroflowStepInfo {
  type: string;
  description: string;
  transitions: string[];
}

export interface MicroflowInfo {
  moduleName: string;
  name: string;
  qualifiedName: string;
  parameters: MicroflowParameterInfo[];
  returnType: string;
  isSubMicroflow: boolean;
}

export interface MicroflowDetailsInfo extends MicroflowInfo {
  steps: MicroflowStepInfo[];
  hasErrorHandling: boolean;
  unknownActivityTypes: string[];
}

export interface PageInfo {
  moduleName: string;
  name: string;
  qualifiedName: string;
  layoutName: string;
  url?: string;
}

export interface PageWidgetInfo {
  type: string;
  label?: string;
  dataSource?: string;
  entity?: string;
  attribute?: string;
  action?: string;
  children: PageWidgetInfo[];
}

export interface PageStructureInfo extends PageInfo {
  widgets: PageWidgetInfo[];
}

export interface SecurityUserRoleInfo {
  name: string;
  moduleRoles: string[];
}

export interface EntityPermissionInfo {
  role: string;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  ownOnly: boolean;
}

export interface ModuleEntitySecurityInfo {
  qualifiedName: string;
  entityName: string;
  permissions: EntityPermissionInfo[];
}

export interface SecurityModuleInfo {
  moduleName: string;
  entities: ModuleEntitySecurityInfo[];
}

export interface SecurityOverviewInfo {
  securityEnabled: boolean;
  userRoles: SecurityUserRoleInfo[];
  modules: SecurityModuleInfo[];
}

export interface AttributePermissionInfo {
  attribute: string;
  read: boolean;
  write: boolean;
}

export interface EntityAccessRuleDetailsInfo {
  role: string;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  ownOnly: boolean;
  xpathConstraint?: string;
  attributePermissions: AttributePermissionInfo[];
}

export interface EntityAccessInfo {
  moduleName: string;
  entityName: string;
  qualifiedName: string;
  rules: EntityAccessRuleDetailsInfo[];
}

export type SearchScope = "all" | "entities" | "microflows" | "pages" | "enumerations";

export interface SearchResultInfo {
  type: "entity" | "microflow" | "page" | "enumeration";
  moduleName: string;
  name: string;
  qualifiedName: string;
  relevance: number;
}

export interface BestPracticeFindingInfo {
  severity: "warning" | "info";
  category: string;
  location: string;
  description: string;
  recommendation: string;
}

export interface DependencyInfo {
  document: string;
  outgoing: string[];
  incoming: string[];
  notes: string[];
}

export interface ModelStatsInfo {
  moduleCount: number;
  entityCount: number;
  microflowCount: number;
  pageCount: number;
  userRoleCount: number;
  securityEnabled: boolean;
}

function asRecord(value: unknown): RecordLike | undefined {
  return typeof value === "object" && value !== null ? (value as RecordLike) : undefined;
}

function hasLoad(value: unknown): value is Loadable {
  const record = asRecord(value);
  return Boolean(record && typeof record.load === "function");
}

async function loadIfAvailable<T>(value: T): Promise<T> {
  if (hasLoad(value)) {
    const loaded = await value.load();
    return loaded as T;
  }
  return value;
}

function readString(record: RecordLike | undefined, key: string, fallback = ""): string {
  const value = readProperty(record, key);
  if (typeof value === "string") {
    return value;
  }
  return fallback;
}

function readBoolean(record: RecordLike | undefined, key: string, fallback = false): boolean {
  const value = readProperty(record, key);
  if (typeof value === "boolean") {
    return value;
  }
  return fallback;
}

function readNumber(record: RecordLike | undefined, key: string): number | undefined {
  const value = readProperty(record, key);
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function readUnknownArray(record: RecordLike | undefined, key: string): unknown[] {
  const value = readProperty(record, key);
  if (Array.isArray(value)) {
    return value;
  }
  return [];
}

function readProperty(record: RecordLike | undefined, key: string): unknown {
  if (!record) {
    return undefined;
  }

  try {
    return record[key];
  } catch {
    // Mendix SDK kan throwen bij toegang tot deprecated/removed properties.
    return undefined;
  }
}

function readTypeName(value: unknown): string {
  const record = asRecord(value);
  const nestedType = asRecord(readProperty(record, "type"));

  return (
    readString(record, "name") ||
    readString(record, "typeName") ||
    readString(record, "qualifiedName") ||
    readString(record, "returnTypeName") ||
    readString(nestedType, "name") ||
    readString(nestedType, "typeName") ||
    readString(nestedType, "qualifiedName") ||
    (typeof value === "string" ? value : "")
  );
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const value of values) {
    const normalized = value.trim();
    if (!normalized) {
      continue;
    }
    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(normalized);
  }

  return unique;
}

function splitRoleNames(roleValue: string): string[] {
  if (!roleValue.trim()) {
    return [];
  }
  return uniqueStrings(
    roleValue
      .split(",")
      .map((value) => value.trim())
      .filter((value) => Boolean(value))
  );
}

function hasOwnConstraint(xpathConstraint?: string): boolean {
  if (!xpathConstraint) {
    return false;
  }
  const normalized = xpathConstraint.toLowerCase();
  return normalized.includes("%currentuser%") || normalized.includes("currentuser");
}

function readEntityReferenceName(value: unknown, fallback: string): string {
  if (typeof value === "string") {
    return value;
  }

  const record = asRecord(value);
  if (!record) {
    return fallback;
  }

  const qualifiedName = readString(record, "qualifiedName");
  if (qualifiedName) {
    return qualifiedName;
  }

  const name = readString(record, "name");
  return name || fallback;
}

function constructorName(value: unknown): string {
  if (typeof value !== "object" || value === null) {
    return "Unknown";
  }

  const prototype = Object.getPrototypeOf(value);
  if (!prototype || typeof prototype !== "object") {
    return "Unknown";
  }

  const ctor = asRecord(prototype)?.constructor;
  if (typeof ctor === "function" && ctor.name) {
    return ctor.name;
  }

  return "Unknown";
}

function uniqueAssociations(associations: AssociationInfo[]): AssociationInfo[] {
  const seen = new Set<string>();
  const unique: AssociationInfo[] = [];

  for (const association of associations) {
    const key = [
      association.name,
      association.type,
      association.sourceEntity,
      association.targetEntity,
    ].join("|");

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(association);
  }

  return unique;
}

function parseQualifiedName(qualifiedName: string): { moduleName: string; entityName: string } {
  const separatorIndex = qualifiedName.indexOf(".");
  if (separatorIndex <= 0 || separatorIndex === qualifiedName.length - 1) {
    throw new Error(
      `Invalid qualified name '${qualifiedName}'. Expected format 'Module.Entity'.`
    );
  }

  return {
    moduleName: qualifiedName.slice(0, separatorIndex),
    entityName: qualifiedName.slice(separatorIndex + 1),
  };
}

function readModuleFromQualifiedName(qualifiedName: string, fallback = ""): string {
  const separatorIndex = qualifiedName.indexOf(".");
  if (separatorIndex <= 0) {
    return fallback;
  }
  return qualifiedName.slice(0, separatorIndex);
}

export class MendixClient {
  private readonly config: MendixCopilotConfig;
  private model: IModel | null = null;
  private workingCopy: DeleteableWorkingCopy | null = null;

  constructor(config: MendixCopilotConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    if (this.model) {
      return;
    }

    try {
      console.error(
        `Connecting to Mendix app '${this.config.appId}' on branch '${this.config.branch}'...`
      );

      setLogger(platformSdkLogger);
      setPlatformConfig({ mendixToken: this.config.mendixToken });
      const platformClient = new MendixPlatformClient();
      const app = platformClient.getApp(this.config.appId) as unknown as AppHandle;
      this.workingCopy = await app.createTemporaryWorkingCopy(this.config.branch);
      this.model = (await this.workingCopy.openModel()) as IModel;

      console.error("Mendix model connected successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to connect to Mendix app '${this.config.appId}': ${message}`);
    }
  }

  getModel(): IModel {
    if (!this.model) {
      throw new Error("Mendix model is not connected. Call connect() first.");
    }
    return this.model;
  }

  async disconnect(): Promise<void> {
    if (!this.workingCopy) {
      this.model = null;
      return;
    }

    try {
      if (typeof this.workingCopy.delete === "function") {
        await this.workingCopy.delete();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Failed to clean up working copy: ${message}`);
    } finally {
      this.workingCopy = null;
      this.model = null;
      console.error("Mendix client disconnected.");
    }
  }

  private async ensureConnectedModel(): Promise<IModel> {
    if (!this.model) {
      await this.connect();
    }

    return this.getModel();
  }

  private getModules(model: IModel): unknown[] {
    return model.allModules().map((module) => module as unknown);
  }

  private moduleToInfo(module: unknown): ModuleInfo {
    const moduleRecord = asRecord(module);
    return {
      name: readString(moduleRecord, "name", "UnknownModule"),
      fromMarketplace: readBoolean(moduleRecord, "fromAppStore"),
    };
  }

  private countDocumentsByModule(items: unknown[], moduleName: string): number {
    return items.filter((item) => {
      const record = asRecord(item);
      const qualifiedName = readString(record, "qualifiedName");
      const name = readString(record, "name");
      const value = qualifiedName || name;
      return value.startsWith(`${moduleName}.`) || value === moduleName;
    }).length;
  }

  private modelCollectionByName(
    model: IModel,
    methodName: "allMicroflows" | "allPages" | "allNanoflows" | "allUserRoles"
  ): unknown[] {
    const modelRecord = asRecord(model);
    const maybeMethod = modelRecord?.[methodName];

    if (typeof maybeMethod !== "function") {
      return [];
    }

    const result = maybeMethod.call(model);
    return Array.isArray(result) ? result : [];
  }

  private matchesModuleName(document: unknown, moduleName: string): boolean {
    const record = asRecord(document);
    const qualifiedName = readString(record, "qualifiedName");
    const name = readString(record, "name");
    const documentModule =
      readString(record, "moduleName") ||
      readModuleFromQualifiedName(qualifiedName, "") ||
      readModuleFromQualifiedName(name, "");

    return documentModule.toLowerCase() === moduleName.toLowerCase();
  }

  private extractDocumentReturnType(document: unknown): string {
    const record = asRecord(document);
    const microflowReturnType = readTypeName(readProperty(record, "microflowReturnType"));
    const legacyReturnType = readTypeName(readProperty(record, "returnType"));

    return microflowReturnType || legacyReturnType || "Void";
  }

  private extractActivityTransitions(activityRecord: RecordLike | undefined): string[] {
    if (!activityRecord) {
      return [];
    }

    const explicitTransitions = readUnknownArray(activityRecord, "transitions")
      .map((transition) =>
        typeof transition === "string"
          ? transition
          : readString(asRecord(transition), "label") ||
            readString(asRecord(transition), "caption") ||
            readString(asRecord(transition), "name")
      )
      .filter((transition) => Boolean(transition));

    if (explicitTransitions.length > 0) {
      return explicitTransitions;
    }

    const flowCandidates = [
      ...readUnknownArray(activityRecord, "flows"),
      ...readUnknownArray(activityRecord, "outgoingFlows"),
      ...readUnknownArray(activityRecord, "outFlows"),
      ...readUnknownArray(activityRecord, "sequenceFlows"),
    ];

    const parsedFlows = flowCandidates
      .map((flow) => {
        const flowRecord = asRecord(flow);
        return (
          readString(flowRecord, "caseValue") ||
          readString(flowRecord, "caption") ||
          readString(flowRecord, "name")
        );
      })
      .filter((label) => Boolean(label));

    return parsedFlows;
  }

  private describeAction(actionType: string, actionRecord: RecordLike | undefined): string {
    const entityName =
      readEntityReferenceName(actionRecord?.entity, "") ||
      readString(actionRecord, "entityQualifiedName");
    const variableName = readString(actionRecord, "outputVariableName");
    const expression =
      readString(actionRecord, "expression") ||
      readString(actionRecord, "condition") ||
      readString(actionRecord, "value");
    const calledMicroflow =
      readEntityReferenceName(actionRecord?.microflow, "") ||
      readString(actionRecord, "microflowQualifiedName") ||
      readString(actionRecord, "calledMicroflowName");
    const message =
      readString(actionRecord, "messageTemplate") ||
      readString(actionRecord, "template") ||
      readString(actionRecord, "text");

    if (actionType.includes("Create")) {
      return entityName
        ? `Maak nieuw ${entityName} object`
        : "Maak nieuw object";
    }
    if (actionType.includes("Change")) {
      return expression ? `Wijzig object (${expression})` : "Wijzig object";
    }
    if (actionType.includes("Delete")) {
      return expression ? `Verwijder object (${expression})` : "Verwijder object";
    }
    if (actionType.includes("Retrieve")) {
      return entityName
        ? `Haal ${entityName} op`
        : "Haal object op";
    }
    if (actionType.includes("Commit")) {
      return "Sla object op";
    }
    if (actionType.includes("Rollback")) {
      return "Rollback object wijzigingen";
    }
    if (actionType.includes("MicroflowCall")) {
      return calledMicroflow
        ? `Roep microflow ${calledMicroflow} aan`
        : "Roep sub-microflow aan";
    }
    if (actionType.includes("ShowMessage")) {
      return message ? `"${message}"` : "Toon melding";
    }

    const actionLabel = actionType.replace(/Action$/, "");
    const details = [entityName, variableName, expression].filter((value) => Boolean(value));
    return details.length > 0
      ? `${actionLabel}: ${details.join(", ")}`
      : actionLabel || "Onbekende actie";
  }

  private extractActivityPosition(activity: unknown): { x: number; y: number } {
    const record = asRecord(activity);
    const middle = asRecord(record?.relativeMiddlePoint);
    const top = readNumber(record, "top");
    const left = readNumber(record, "left");
    const x = readNumber(middle, "x") ?? left ?? Number.MAX_SAFE_INTEGER;
    const y = readNumber(middle, "y") ?? top ?? Number.MAX_SAFE_INTEGER;

    return { x, y };
  }

  private async extractMicroflowActivityNodes(document: unknown): Promise<unknown[]> {
    const loadedDocument = await loadIfAvailable(document);
    const documentRecord = asRecord(loadedDocument);
    const objectCollection = await loadIfAvailable(documentRecord?.objectCollection);
    const objectCollectionRecord = asRecord(objectCollection);

    const rawNodes = [
      ...readUnknownArray(objectCollectionRecord, "objects"),
      ...readUnknownArray(documentRecord, "activities"),
      ...readUnknownArray(documentRecord, "actionActivities"),
      ...readUnknownArray(documentRecord, "decisions"),
      ...readUnknownArray(documentRecord, "loops"),
      ...readUnknownArray(documentRecord, "startEvents"),
      ...readUnknownArray(documentRecord, "endEvents"),
    ];

    const uniqueNodes = new Set<unknown>();
    for (const node of rawNodes) {
      uniqueNodes.add(node);
    }

    const loadedNodes = await Promise.all(
      Array.from(uniqueNodes).map((node) => loadIfAvailable(node))
    );

    return loadedNodes.sort((left, right) => {
      const leftPos = this.extractActivityPosition(left);
      const rightPos = this.extractActivityPosition(right);
      if (leftPos.y !== rightPos.y) {
        return leftPos.y - rightPos.y;
      }
      return leftPos.x - rightPos.x;
    });
  }

  private async mapActivityToStep(
    activity: unknown
  ): Promise<{
    step: MicroflowStepInfo;
    unknownType?: string;
    hasErrorHandling: boolean;
    calledMicroflow?: string;
  }> {
    const activityRecord = asRecord(activity);
    const explicitType = readString(activityRecord, "activityType") || readString(activityRecord, "type");
    const activityType = explicitType || constructorName(activity);
    const activityName =
      readString(activityRecord, "caption") ||
      readString(activityRecord, "name") ||
      readString(activityRecord, "documentation");
    const transitions = this.extractActivityTransitions(activityRecord);

    const action = await loadIfAvailable(activityRecord?.action);
    const actionRecord = asRecord(action);
    const actionType =
      readString(actionRecord, "actionType") ||
      readString(actionRecord, "type") ||
      constructorName(action);

    const hasErrorHandling =
      activityType.includes("ErrorHandler") ||
      readBoolean(activityRecord, "hasErrorHandling") ||
      readBoolean(activityRecord, "useErrorHandling") ||
      Boolean(readString(activityRecord, "errorHandlingType"));

    if (activityType.includes("StartEvent")) {
      return {
        step: {
          type: "Start",
          description: activityName || "Start event",
          transitions,
        },
        hasErrorHandling,
      };
    }

    if (activityType.includes("EndEvent")) {
      const returnValue =
        readString(activityRecord, "returnValue") ||
        readString(activityRecord, "expression");
      return {
        step: {
          type: "Return",
          description: returnValue || activityName || "End event",
          transitions,
        },
        hasErrorHandling,
      };
    }

    if (activityType.includes("Decision") || activityType.includes("ExclusiveSplit")) {
      const condition =
        readString(activityRecord, "conditionExpression") ||
        readString(activityRecord, "condition") ||
        activityName ||
        "Beslissing";
      return {
        step: {
          type: "Decision",
          description: condition,
          transitions: transitions.length > 0 ? transitions : ["Ja", "Nee"],
        },
        hasErrorHandling,
      };
    }

    if (activityType.includes("Loop")) {
      const iterator =
        readString(activityRecord, "iteratorName") ||
        readString(activityRecord, "loopVariableName");
      return {
        step: {
          type: "Loop",
          description: iterator ? `Loop over ${iterator}` : activityName || "Loop",
          transitions,
        },
        hasErrorHandling,
      };
    }

    if (activityType.includes("ActionActivity") || actionRecord) {
      const actionDescription = this.describeAction(actionType, actionRecord);
      const calledMicroflow =
        readEntityReferenceName(actionRecord?.microflow, "") ||
        readString(actionRecord, "microflowQualifiedName") ||
        readString(actionRecord, "calledMicroflowName");
      const mappedType = actionType
        .replace(/Action$/, "")
        .replace("MicroflowCall", "Call")
        .replace("ShowMessage", "Show Message");

      return {
        step: {
          type: mappedType || "Action",
          description: actionDescription,
          transitions,
        },
        hasErrorHandling,
        calledMicroflow: calledMicroflow || undefined,
      };
    }

    return {
      step: {
        type: `Unknown: ${activityType}`,
        description: activityName || "Onbekend activity type",
        transitions,
      },
      unknownType: activityType || "Unknown",
      hasErrorHandling,
    };
  }

  private async extractMicroflowParameters(document: unknown): Promise<MicroflowParameterInfo[]> {
    const loadedDocument = await loadIfAvailable(document);
    const documentRecord = asRecord(loadedDocument);
    const rawParameters = readUnknownArray(documentRecord, "parameters");

    const parameters: MicroflowParameterInfo[] = [];
    for (const rawParameter of rawParameters) {
      const parameter = await loadIfAvailable(rawParameter);
      const parameterRecord = asRecord(parameter);
      const rawVariableType = await loadIfAvailable(readProperty(parameterRecord, "variableType"));
      const variableType = asRecord(rawVariableType);
      const parameterType =
        readString(variableType, "name") ||
        readString(variableType, "typeName") ||
        readString(variableType, "qualifiedName") ||
        (typeof rawVariableType === "string" ? rawVariableType : "") ||
        constructorName(rawVariableType);

      parameters.push({
        name: readString(parameterRecord, "name", "UnnamedParameter"),
        type: parameterType || "UnknownType",
      });
    }

    return parameters;
  }

  private async extractCalledMicroflowNames(document: unknown): Promise<Set<string>> {
    const called = new Set<string>();
    const activities = await this.extractMicroflowActivityNodes(document);

    for (const activity of activities) {
      const mapped = await this.mapActivityToStep(activity);
      if (!mapped.calledMicroflow) {
        continue;
      }
      called.add(mapped.calledMicroflow.toLowerCase());
    }

    return called;
  }

  private async toMicroflowInfo(
    document: unknown,
    calledMicroflowNames: Set<string>
  ): Promise<MicroflowInfo> {
    const loadedDocument = await loadIfAvailable(document);
    const record = asRecord(loadedDocument);
    const qualifiedName =
      readString(record, "qualifiedName") || readString(record, "name", "UnknownMicroflow");
    const name = readString(record, "name") || qualifiedName;
    const moduleName =
      readString(record, "moduleName") || readModuleFromQualifiedName(qualifiedName, "UnknownModule");

    const parameters = await this.extractMicroflowParameters(loadedDocument);
    const returnType = this.extractDocumentReturnType(loadedDocument);

    return {
      moduleName,
      name,
      qualifiedName,
      parameters,
      returnType,
      isSubMicroflow: calledMicroflowNames.has(qualifiedName.toLowerCase()),
    };
  }

  private async findDocumentByQualifiedName(
    methodName: "allMicroflows" | "allNanoflows",
    qualifiedName: string
  ): Promise<unknown> {
    const model = await this.ensureConnectedModel();
    const documents = this.modelCollectionByName(model, methodName);

    const matchingDocument = documents.find((document) => {
      const record = asRecord(document);
      const recordQualifiedName = readString(record, "qualifiedName");
      const recordName = readString(record, "name");

      return (
        recordQualifiedName.toLowerCase() === qualifiedName.toLowerCase() ||
        recordName.toLowerCase() === qualifiedName.toLowerCase()
      );
    });

    if (!matchingDocument) {
      throw new Error(`Document '${qualifiedName}' not found.`);
    }

    return loadIfAvailable(matchingDocument);
  }

  private async extractAttributes(entity: unknown): Promise<AttributeInfo[]> {
    const entityRecord = asRecord(entity);
    const rawAttributes = readUnknownArray(entityRecord, "attributes");
    const attributes: AttributeInfo[] = [];

    for (const rawAttribute of rawAttributes) {
      const attribute = await loadIfAvailable(rawAttribute);
      const attributeRecord = asRecord(attribute);

      const typeRecord = asRecord(attributeRecord?.type);
      const enumRecord = asRecord(attributeRecord?.enumeration);
      const attributeType =
        readString(attributeRecord, "type") ||
        readString(typeRecord, "name") ||
        (readString(enumRecord, "name") ? `Enumeration: ${readString(enumRecord, "name")}` : "") ||
        constructorName(attribute);

      const validationRules = readUnknownArray(attributeRecord, "validationRules").map((rule) => {
        const ruleRecord = asRecord(rule);
        return readString(ruleRecord, "errorMessage") || readString(ruleRecord, "ruleInfo") || constructorName(rule);
      });

      const defaultValue = readString(attributeRecord, "defaultValue");
      attributes.push({
        name: readString(attributeRecord, "name", "UnknownAttribute"),
        type: attributeType,
        defaultValue: defaultValue || undefined,
        validationRules,
      });
    }

    return attributes;
  }

  private async extractAssociations(entity: unknown, fallbackEntityName: string): Promise<AssociationInfo[]> {
    const entityRecord = asRecord(entity);
    const rawAssociations = readUnknownArray(entityRecord, "associations");
    const associations: AssociationInfo[] = [];

    for (const rawAssociation of rawAssociations) {
      const association = await loadIfAvailable(rawAssociation);
      const associationRecord = asRecord(association);

      const parent = associationRecord?.parent;
      const child = associationRecord?.child;

      const sourceEntity = readEntityReferenceName(parent, fallbackEntityName);
      const targetEntity = readEntityReferenceName(child, "UnknownEntity");

      const type =
        readString(associationRecord, "type") ||
        readString(asRecord(associationRecord?.associationType), "name") ||
        constructorName(association);

      associations.push({
        name: readString(associationRecord, "name", "UnknownAssociation"),
        type,
        sourceEntity,
        targetEntity,
        owner: readString(associationRecord, "owner", "default"),
        deleteBehavior: readString(associationRecord, "deleteBehavior", "none"),
        navigability: readString(associationRecord, "navigability", "both"),
      });
    }

    return associations;
  }

  private async extractAccessRules(entity: unknown): Promise<EntityAccessRuleInfo[]> {
    const entityRecord = asRecord(entity);
    const rawAccessRules = readUnknownArray(entityRecord, "accessRules");
    const accessRules: EntityAccessRuleInfo[] = [];

    for (const rawAccessRule of rawAccessRules) {
      const accessRule = await loadIfAvailable(rawAccessRule);
      const accessRuleRecord = asRecord(accessRule);
      const moduleRoles = readUnknownArray(accessRuleRecord, "moduleRoles");

      const roleNames =
        moduleRoles
          .map((role) => readString(asRecord(role), "name"))
          .filter((name) => Boolean(name))
          .join(", ") ||
        readString(accessRuleRecord, "role", "UnknownRole");

      accessRules.push({
        role: roleNames,
        create:
          readBoolean(accessRuleRecord, "allowCreate") ||
          readBoolean(accessRuleRecord, "canCreate"),
        delete:
          readBoolean(accessRuleRecord, "allowDelete") ||
          readBoolean(accessRuleRecord, "canDelete"),
        read:
          readBoolean(accessRuleRecord, "allowRead", true) ||
          readBoolean(accessRuleRecord, "defaultMemberReadAccess"),
        write:
          readBoolean(accessRuleRecord, "allowWrite") ||
          readBoolean(accessRuleRecord, "defaultMemberWriteAccess"),
        xpathConstraint:
          readString(accessRuleRecord, "xPathConstraint") ||
          readString(accessRuleRecord, "xpathConstraint") ||
          undefined,
      });
    }

    return accessRules;
  }

  private async extractIndexes(entity: unknown): Promise<string[]> {
    const entityRecord = asRecord(entity);
    const rawIndexes = readUnknownArray(entityRecord, "indexes");
    const indexes: string[] = [];

    for (const rawIndex of rawIndexes) {
      const index = await loadIfAvailable(rawIndex);
      const indexRecord = asRecord(index);
      const indexAttributes = readUnknownArray(indexRecord, "attributes")
        .map((attribute) => readEntityReferenceName(attribute, "UnknownAttribute"))
        .join(", ");

      const indexName = readString(indexRecord, "name", "UnnamedIndex");
      indexes.push(indexAttributes ? `${indexName} (${indexAttributes})` : indexName);
    }

    return indexes;
  }

  private extractEventHandlers(entity: unknown): EntityEventHandlers {
    const entityRecord = asRecord(entity);
    return {
      beforeCommit:
        readString(entityRecord, "beforeCommitMicroflow") ||
        readString(entityRecord, "beforeCommitEvent") ||
        undefined,
      afterCommit:
        readString(entityRecord, "afterCommitMicroflow") ||
        readString(entityRecord, "afterCommitEvent") ||
        undefined,
      beforeDelete:
        readString(entityRecord, "beforeDeleteMicroflow") ||
        readString(entityRecord, "beforeDeleteEvent") ||
        undefined,
      afterDelete:
        readString(entityRecord, "afterDeleteMicroflow") ||
        readString(entityRecord, "afterDeleteEvent") ||
        undefined,
    };
  }

  private extractEntityValidationRules(entity: unknown): string[] {
    const entityRecord = asRecord(entity);
    return readUnknownArray(entityRecord, "validationRules").map((rule) => {
      const ruleRecord = asRecord(rule);
      return readString(ruleRecord, "errorMessage") || readString(ruleRecord, "ruleInfo") || constructorName(rule);
    });
  }

  private extractGeneralization(entity: unknown): string | undefined {
    const entityRecord = asRecord(entity);
    const generalization = entityRecord?.generalization;
    if (!generalization) {
      return undefined;
    }

    return readEntityReferenceName(generalization, "");
  }

  private async extractEntities(moduleName: string, module: unknown): Promise<EntityInfo[]> {
    const loadedModule = await loadIfAvailable(module);
    const moduleRecord = asRecord(loadedModule);
    const domainModel = moduleRecord?.domainModel;

    if (!domainModel) {
      return [];
    }

    const loadedDomainModel = await loadIfAvailable(domainModel);
    const domainModelRecord = asRecord(loadedDomainModel);
    const rawEntities = readUnknownArray(domainModelRecord, "entities");
    const entities: EntityInfo[] = [];

    for (const rawEntity of rawEntities) {
      const entity = await loadIfAvailable(rawEntity);
      const entityRecord = asRecord(entity);

      const entityName = readString(entityRecord, "name", "UnknownEntity");
      const qualifiedName =
        readString(entityRecord, "qualifiedName") || `${moduleName}.${entityName}`;

      const attributes = await this.extractAttributes(entity);
      const associations = await this.extractAssociations(entity, qualifiedName);
      const accessRules = await this.extractAccessRules(entity);
      const indexes = await this.extractIndexes(entity);
      const validationRules = this.extractEntityValidationRules(entity);
      const generalization = this.extractGeneralization(entity);

      entities.push({
        moduleName,
        name: entityName,
        qualifiedName,
        attributes,
        associations,
        accessRules,
        eventHandlers: this.extractEventHandlers(entity),
        indexes,
        validationRules,
        generalization,
      });
    }

    return entities;
  }

  async getAppInfo(): Promise<AppInfo> {
    const model = await this.ensureConnectedModel();
    const modules = this.getModules(model).map((module) => this.moduleToInfo(module));
    const modelRecord = asRecord(model as unknown);

    return {
      name: this.config.appId,
      appId: this.config.appId,
      branch: this.config.branch,
      mendixVersion:
        readString(modelRecord, "metaModelVersion", "Unknown") ||
        readString(modelRecord, "version", "Unknown"),
      moduleCount: modules.length,
      modules,
    };
  }

  async listModules(filter?: string): Promise<ModuleInfo[]> {
    const appInfo = await this.getAppInfo();
    const filterValue = filter?.trim().toLowerCase();

    const filtered = appInfo.modules.filter((moduleInfo) => {
      if (!filterValue) {
        return true;
      }

      return moduleInfo.name.toLowerCase().includes(filterValue);
    });

    return filtered.sort((left, right) => {
      if (left.fromMarketplace !== right.fromMarketplace) {
        return left.fromMarketplace ? 1 : -1;
      }

      return left.name.localeCompare(right.name);
    });
  }

  async getDomainModel(moduleName: string): Promise<DomainModelInfo> {
    const model = await this.ensureConnectedModel();
    const modules = this.getModules(model);

    const module = modules.find((candidate) => {
      const candidateName = readString(asRecord(candidate), "name");
      return candidateName.toLowerCase() === moduleName.toLowerCase();
    });

    if (!module) {
      throw new Error(`Module '${moduleName}' not found.`);
    }

    const normalizedModuleName = readString(asRecord(module), "name", moduleName);
    const entities = await this.extractEntities(normalizedModuleName, module);
    const associations = uniqueAssociations(
      entities.flatMap((entity) => entity.associations)
    );

    const microflows = this.modelCollectionByName(model, "allMicroflows");
    const pages = this.modelCollectionByName(model, "allPages");

    return {
      moduleName: normalizedModuleName,
      entities,
      associations,
      microflowCount: this.countDocumentsByModule(microflows, normalizedModuleName),
      pageCount: this.countDocumentsByModule(pages, normalizedModuleName),
    };
  }

  async getEntityDetails(qualifiedName: string): Promise<EntityInfo> {
    const parsed = parseQualifiedName(qualifiedName);
    const domainModel = await this.getDomainModel(parsed.moduleName);
    const entity = domainModel.entities.find(
      (candidate) =>
        candidate.qualifiedName.toLowerCase() === qualifiedName.toLowerCase() ||
        candidate.name.toLowerCase() === parsed.entityName.toLowerCase()
    );

    if (!entity) {
      throw new Error(`Entity '${qualifiedName}' not found.`);
    }

    return entity;
  }

  async getAllEntities(): Promise<EntityInfo[]> {
    const model = await this.ensureConnectedModel();
    const modules = this.getModules(model);
    const allEntities: EntityInfo[] = [];

    for (const module of modules) {
      const moduleName = readString(asRecord(module), "name", "UnknownModule");
      const entities = await this.extractEntities(moduleName, module);
      allEntities.push(...entities);
    }

    return allEntities;
  }

  async listMicroflows(moduleName: string, filter?: string): Promise<MicroflowInfo[]> {
    const model = await this.ensureConnectedModel();
    const allMicroflows = this.modelCollectionByName(model, "allMicroflows");
    const calledMicroflowNames = new Set<string>();

    for (const microflow of allMicroflows) {
      const called = await this.extractCalledMicroflowNames(microflow);
      for (const qualifiedName of called) {
        calledMicroflowNames.add(qualifiedName);
      }
    }

    const filtered = allMicroflows.filter((microflow) => {
      if (!this.matchesModuleName(microflow, moduleName)) {
        return false;
      }

      if (!filter) {
        return true;
      }

      const filterValue = filter.toLowerCase();
      const record = asRecord(microflow);
      const name = readString(record, "name").toLowerCase();
      const qualifiedName = readString(record, "qualifiedName").toLowerCase();
      return name.includes(filterValue) || qualifiedName.includes(filterValue);
    });

    const mapped = await Promise.all(
      filtered.map((microflow) => this.toMicroflowInfo(microflow, calledMicroflowNames))
    );

    return mapped.sort((left, right) => left.name.localeCompare(right.name));
  }

  async getMicroflowDetails(qualifiedName: string): Promise<MicroflowDetailsInfo> {
    const microflow = await this.findDocumentByQualifiedName("allMicroflows", qualifiedName);
    const calledMicroflowNames = new Set<string>();
    const baseInfo = await this.toMicroflowInfo(microflow, calledMicroflowNames);
    const activities = await this.extractMicroflowActivityNodes(microflow);

    const steps: MicroflowStepInfo[] = [];
    const unknownActivityTypes = new Set<string>();
    let hasErrorHandling = false;

    for (const activity of activities) {
      const mapped = await this.mapActivityToStep(activity);
      steps.push(mapped.step);

      if (mapped.unknownType) {
        unknownActivityTypes.add(mapped.unknownType);
      }
      if (mapped.hasErrorHandling) {
        hasErrorHandling = true;
      }
    }

    return {
      ...baseInfo,
      steps,
      hasErrorHandling,
      unknownActivityTypes: Array.from(unknownActivityTypes).sort(),
    };
  }

  async listNanoflows(moduleName: string, filter?: string): Promise<MicroflowInfo[]> {
    const model = await this.ensureConnectedModel();
    const allNanoflows = this.modelCollectionByName(model, "allNanoflows");

    const filtered = allNanoflows.filter((nanoflow) => {
      if (!this.matchesModuleName(nanoflow, moduleName)) {
        return false;
      }

      if (!filter) {
        return true;
      }

      const filterValue = filter.toLowerCase();
      const record = asRecord(nanoflow);
      const name = readString(record, "name").toLowerCase();
      const qualifiedName = readString(record, "qualifiedName").toLowerCase();
      return name.includes(filterValue) || qualifiedName.includes(filterValue);
    });

    const mapped = await Promise.all(
      filtered.map((nanoflow) => this.toMicroflowInfo(nanoflow, new Set<string>()))
    );

    return mapped.sort((left, right) => left.name.localeCompare(right.name));
  }

  private extractPageLayoutName(pageRecord: RecordLike | undefined): string {
    const layoutCall = asRecord(pageRecord?.layoutCall);
    const layoutRecord = asRecord(layoutCall?.layout);

    return (
      readString(layoutRecord, "qualifiedName") ||
      readString(layoutRecord, "name") ||
      readString(layoutCall, "layoutName") ||
      readString(pageRecord, "layoutName") ||
      "UnknownLayout"
    );
  }

  private extractWidgetChildren(widgetRecord: RecordLike | undefined): unknown[] {
    if (!widgetRecord) {
      return [];
    }

    const keys = [
      "widgets",
      "children",
      "contents",
      "rows",
      "columns",
      "cells",
      "items",
      "tabs",
      "tabPages",
      "controls",
      "body",
    ];
    const singleValueKeys = ["widget", "child", "content", "header", "footer"];
    const children: unknown[] = [];

    for (const key of keys) {
      children.push(...readUnknownArray(widgetRecord, key));
    }

    for (const key of singleValueKeys) {
      const value = widgetRecord[key];
      if (value) {
        children.push(value);
      }
    }

    const unique = new Set<unknown>();
    for (const child of children) {
      unique.add(child);
    }

    return Array.from(unique);
  }

  private extractWidgetDataSource(widgetRecord: RecordLike | undefined): string | undefined {
    if (!widgetRecord) {
      return undefined;
    }

    const dataSource = widgetRecord.dataSource;
    const dataSourceRecord = asRecord(dataSource);
    const sourceType =
      (typeof dataSource === "string" ? dataSource : "") ||
      readString(dataSourceRecord, "sourceType") ||
      readString(dataSourceRecord, "type") ||
      readString(widgetRecord, "dataSourceType");
    const entity =
      readEntityReferenceName(dataSourceRecord?.entity, "") ||
      readString(dataSourceRecord, "entityQualifiedName");
    const constraint =
      readString(dataSourceRecord, "xPathConstraint") ||
      readString(dataSourceRecord, "constraint");

    if (!sourceType && !entity) {
      return undefined;
    }

    const details = [sourceType, entity, constraint].filter((value) => Boolean(value));
    return details.join(", ");
  }

  private extractWidgetEntity(widgetRecord: RecordLike | undefined): string | undefined {
    if (!widgetRecord) {
      return undefined;
    }

    const directEntity =
      readEntityReferenceName(widgetRecord.entity, "") ||
      readString(widgetRecord, "entityQualifiedName");
    if (directEntity) {
      return directEntity;
    }

    const dataSourceRecord = asRecord(widgetRecord.dataSource);
    const dataSourceEntity =
      readEntityReferenceName(dataSourceRecord?.entity, "") ||
      readString(dataSourceRecord, "entityQualifiedName");
    return dataSourceEntity || undefined;
  }

  private extractWidgetAttribute(widgetRecord: RecordLike | undefined): string | undefined {
    if (!widgetRecord) {
      return undefined;
    }

    const directAttribute =
      readEntityReferenceName(widgetRecord.attributeRef, "") ||
      readEntityReferenceName(widgetRecord.attribute, "") ||
      readString(widgetRecord, "attributePath") ||
      readString(widgetRecord, "attributeName");

    if (directAttribute) {
      return directAttribute;
    }

    const valueRecord = asRecord(widgetRecord.value);
    const valueAttribute =
      readString(valueRecord, "attributePath") ||
      readString(valueRecord, "attributeName") ||
      readEntityReferenceName(valueRecord?.attribute, "");
    return valueAttribute || undefined;
  }

  private extractWidgetAction(widgetRecord: RecordLike | undefined): string | undefined {
    if (!widgetRecord) {
      return undefined;
    }

    const directAction = widgetRecord.onClickAction ?? widgetRecord.action;
    if (typeof directAction === "string" && directAction.trim()) {
      return directAction.trim();
    }

    const actionRecord = asRecord(directAction);
    const actionType =
      readString(actionRecord, "actionType") ||
      readString(actionRecord, "type") ||
      readString(widgetRecord, "actionType");
    const microflow =
      readEntityReferenceName(actionRecord?.microflow, "") ||
      readString(actionRecord, "microflowQualifiedName");
    const page =
      readEntityReferenceName(actionRecord?.page, "") ||
      readString(actionRecord, "pageQualifiedName");
    const caption =
      readString(actionRecord, "caption") ||
      readString(actionRecord, "text");

    if (microflow) {
      return `Microflow ${microflow}`;
    }
    if (page) {
      return `Toon pagina ${page}`;
    }
    if (actionType.includes("Microflow")) {
      return "Microflow actie";
    }
    if (actionType.includes("Page")) {
      return "Toon pagina";
    }
    if (caption) {
      return caption;
    }
    return actionType || undefined;
  }

  private async mapWidgetInfo(
    widget: unknown,
    visited: Set<unknown>
  ): Promise<PageWidgetInfo | null> {
    const loadedWidget = await loadIfAvailable(widget);
    const widgetRecord = asRecord(loadedWidget);
    if (!widgetRecord) {
      return null;
    }

    if (visited.has(loadedWidget)) {
      return null;
    }
    visited.add(loadedWidget);

    const type =
      readString(widgetRecord, "widgetType") ||
      readString(widgetRecord, "type") ||
      constructorName(loadedWidget);
    const label =
      readString(widgetRecord, "caption") ||
      readString(widgetRecord, "text") ||
      readString(widgetRecord, "title") ||
      readString(widgetRecord, "name");
    const dataSource = this.extractWidgetDataSource(widgetRecord);
    const entity = this.extractWidgetEntity(widgetRecord);
    const attribute = this.extractWidgetAttribute(widgetRecord);
    const action = this.extractWidgetAction(widgetRecord);

    const childWidgets = this.extractWidgetChildren(widgetRecord);
    const children: PageWidgetInfo[] = [];

    for (const childWidget of childWidgets) {
      const mappedChild = await this.mapWidgetInfo(childWidget, visited);
      if (mappedChild) {
        children.push(mappedChild);
      }
    }

    return {
      type: type || "UnknownWidget",
      label: label || undefined,
      dataSource,
      entity,
      attribute,
      action,
      children,
    };
  }

  private async mapPageWidgets(pageRecord: RecordLike | undefined): Promise<PageWidgetInfo[]> {
    if (!pageRecord) {
      return [];
    }

    const layoutCall = asRecord(pageRecord.layoutCall);
    const roots: unknown[] = [
      ...readUnknownArray(pageRecord, "widgets"),
      ...readUnknownArray(pageRecord, "widgetTree"),
      ...readUnknownArray(pageRecord, "contents"),
      ...readUnknownArray(layoutCall, "widgets"),
      ...readUnknownArray(layoutCall, "contents"),
    ];

    const singleRoots = [layoutCall?.widget, pageRecord.widget, pageRecord.content];
    for (const root of singleRoots) {
      if (root) {
        roots.push(root);
      }
    }

    const uniqueRoots = new Set<unknown>();
    for (const root of roots) {
      uniqueRoots.add(root);
    }

    const visited = new Set<unknown>();
    const widgets: PageWidgetInfo[] = [];
    for (const root of uniqueRoots) {
      const mapped = await this.mapWidgetInfo(root, visited);
      if (mapped) {
        widgets.push(mapped);
      }
    }

    return widgets;
  }

  private async toPageInfo(page: unknown): Promise<PageInfo> {
    const loadedPage = await loadIfAvailable(page);
    const pageRecord = asRecord(loadedPage);
    const qualifiedName =
      readString(pageRecord, "qualifiedName") || readString(pageRecord, "name", "UnknownPage");
    const name = readString(pageRecord, "name") || qualifiedName;
    const moduleName =
      readString(pageRecord, "moduleName") || readModuleFromQualifiedName(qualifiedName, "UnknownModule");

    return {
      moduleName,
      name,
      qualifiedName,
      layoutName: this.extractPageLayoutName(pageRecord),
      url:
        readString(pageRecord, "url") ||
        readString(pageRecord, "urlPath") ||
        readString(pageRecord, "location") ||
        undefined,
    };
  }

  async listPages(moduleName: string, filter?: string): Promise<PageInfo[]> {
    const model = await this.ensureConnectedModel();
    const allPages = this.modelCollectionByName(model, "allPages");

    const filtered = allPages.filter((page) => {
      if (!this.matchesModuleName(page, moduleName)) {
        return false;
      }

      if (!filter) {
        return true;
      }

      const filterValue = filter.toLowerCase();
      const pageRecord = asRecord(page);
      const pageName = readString(pageRecord, "name").toLowerCase();
      const qualifiedName = readString(pageRecord, "qualifiedName").toLowerCase();

      return pageName.includes(filterValue) || qualifiedName.includes(filterValue);
    });

    const pageInfos = await Promise.all(filtered.map((page) => this.toPageInfo(page)));
    return pageInfos.sort((left, right) => left.name.localeCompare(right.name));
  }

  async getPageStructure(qualifiedName: string): Promise<PageStructureInfo> {
    const model = await this.ensureConnectedModel();
    const allPages = this.modelCollectionByName(model, "allPages");

    const page = allPages.find((candidate) => {
      const candidateRecord = asRecord(candidate);
      const candidateQualifiedName = readString(candidateRecord, "qualifiedName");
      const candidateName = readString(candidateRecord, "name");

      return (
        candidateQualifiedName.toLowerCase() === qualifiedName.toLowerCase() ||
        candidateName.toLowerCase() === qualifiedName.toLowerCase()
      );
    });

    if (!page) {
      throw new Error(`Page '${qualifiedName}' not found.`);
    }

    const loadedPage = await loadIfAvailable(page);
    const pageRecord = asRecord(loadedPage);
    const pageInfo = await this.toPageInfo(loadedPage);
    const widgets = await this.mapPageWidgets(pageRecord);

    return {
      ...pageInfo,
      widgets,
    };
  }

  private async extractUserRoles(model: IModel): Promise<SecurityUserRoleInfo[]> {
    const allUserRoles = this.modelCollectionByName(model, "allUserRoles");
    const roles: SecurityUserRoleInfo[] = [];

    for (const rawRole of allUserRoles) {
      const role = await loadIfAvailable(rawRole);
      const roleRecord = asRecord(role);
      const moduleRoles = readUnknownArray(roleRecord, "moduleRoles")
        .map((moduleRole) =>
          readString(asRecord(moduleRole), "name") ||
          readEntityReferenceName(moduleRole, "")
        )
        .filter((name) => Boolean(name));

      roles.push({
        name: readString(roleRecord, "name", "UnknownUserRole"),
        moduleRoles: uniqueStrings(moduleRoles).sort((left, right) => left.localeCompare(right)),
      });
    }

    return roles.sort((left, right) => left.name.localeCompare(right.name));
  }

  private isSecurityEnabled(model: IModel, userRoleCount: number): boolean {
    const modelRecord = asRecord(model as unknown);
    const projectSecurity = asRecord(modelRecord?.projectSecurity);
    const securityLevel =
      readString(projectSecurity, "securityLevel") ||
      readString(modelRecord, "securityLevel");

    if (readBoolean(modelRecord, "securityEnabled")) {
      return true;
    }

    if (readBoolean(projectSecurity, "checkSecurity")) {
      return true;
    }

    if (securityLevel) {
      return !["none", "off", "no_security"].includes(securityLevel.toLowerCase());
    }

    return userRoleCount > 0;
  }

  async getSecurityOverview(moduleName?: string): Promise<SecurityOverviewInfo> {
    const model = await this.ensureConnectedModel();
    const userRoles = await this.extractUserRoles(model);
    const entities = moduleName
      ? (await this.getDomainModel(moduleName)).entities
      : await this.getAllEntities();

    const moduleMap = new Map<string, ModuleEntitySecurityInfo[]>();

    for (const entity of entities) {
      const permissionMap = new Map<string, EntityPermissionInfo>();

      for (const accessRule of entity.accessRules) {
        const roleNames = splitRoleNames(accessRule.role);
        const roles = roleNames.length > 0 ? roleNames : [accessRule.role || "UnknownRole"];

        for (const role of roles) {
          const existing = permissionMap.get(role);
          permissionMap.set(role, {
            role,
            create: (existing?.create ?? false) || accessRule.create,
            read: (existing?.read ?? false) || accessRule.read,
            update: (existing?.update ?? false) || accessRule.write,
            delete: (existing?.delete ?? false) || accessRule.delete,
            ownOnly: (existing?.ownOnly ?? false) || hasOwnConstraint(accessRule.xpathConstraint),
          });
        }
      }

      const moduleEntities = moduleMap.get(entity.moduleName) ?? [];
      moduleEntities.push({
        qualifiedName: entity.qualifiedName,
        entityName: entity.name,
        permissions: Array.from(permissionMap.values()).sort((left, right) =>
          left.role.localeCompare(right.role)
        ),
      });
      moduleMap.set(entity.moduleName, moduleEntities);
    }

    const modules = Array.from(moduleMap.entries())
      .map(([moduleNameKey, moduleEntities]) => ({
        moduleName: moduleNameKey,
        entities: moduleEntities.sort((left, right) =>
          left.entityName.localeCompare(right.entityName)
        ),
      }))
      .sort((left, right) => left.moduleName.localeCompare(right.moduleName));

    return {
      securityEnabled: this.isSecurityEnabled(model, userRoles.length),
      userRoles,
      modules,
    };
  }

  async getEntityAccess(qualifiedName: string): Promise<EntityAccessInfo> {
    const entity = await this.getEntityDetails(qualifiedName);
    const rules: EntityAccessRuleDetailsInfo[] = [];

    for (const accessRule of entity.accessRules) {
      const roleNames = splitRoleNames(accessRule.role);
      const roles = roleNames.length > 0 ? roleNames : [accessRule.role || "UnknownRole"];

      for (const role of roles) {
        rules.push({
          role,
          create: accessRule.create,
          read: accessRule.read,
          update: accessRule.write,
          delete: accessRule.delete,
          ownOnly: hasOwnConstraint(accessRule.xpathConstraint),
          xpathConstraint: accessRule.xpathConstraint,
          attributePermissions: entity.attributes.map((attribute) => ({
            attribute: attribute.name,
            read: accessRule.read,
            write: accessRule.write,
          })),
        });
      }
    }

    return {
      moduleName: entity.moduleName,
      entityName: entity.name,
      qualifiedName: entity.qualifiedName,
      rules: rules.sort((left, right) => left.role.localeCompare(right.role)),
    };
  }

  private flattenWidgets(widgets: PageWidgetInfo[]): PageWidgetInfo[] {
    const flattened: PageWidgetInfo[] = [];

    for (const widget of widgets) {
      flattened.push(widget);
      flattened.push(...this.flattenWidgets(widget.children));
    }

    return flattened;
  }

  private isDataContainerWidget(widgetType: string): boolean {
    const normalized = widgetType.toLowerCase();
    return (
      normalized.includes("dataview") ||
      normalized.includes("datagrid") ||
      normalized.includes("listview") ||
      normalized.includes("templategrid") ||
      normalized.includes("gallery")
    );
  }

  private parseCalledMicroflow(step: MicroflowStepInfo): string | undefined {
    if (!step.type.toLowerCase().includes("call")) {
      return undefined;
    }

    const match = step.description.match(/microflow\s+([A-Za-z0-9_.]+)/i);
    return match?.[1];
  }

  private extractActionReferences(action: string): string[] {
    const references: string[] = [];
    const microflowMatch = action.match(/Microflow\s+([A-Za-z0-9_.]+)/i);
    if (microflowMatch?.[1]) {
      references.push(microflowMatch[1]);
    }

    const pageMatch = action.match(/pagina\s+([A-Za-z0-9_.]+)/i);
    if (pageMatch?.[1]) {
      references.push(pageMatch[1]);
    }

    return references;
  }

  private async extractEnumerations(): Promise<
    Array<{ moduleName: string; name: string; qualifiedName: string }>
  > {
    const model = await this.ensureConnectedModel();
    const modules = this.getModules(model);
    const enumerations: Array<{ moduleName: string; name: string; qualifiedName: string }> = [];

    for (const module of modules) {
      const loadedModule = await loadIfAvailable(module);
      const moduleRecord = asRecord(loadedModule);
      const moduleName = readString(moduleRecord, "name", "UnknownModule");
      const domainModel = await loadIfAvailable(moduleRecord?.domainModel);
      const domainModelRecord = asRecord(domainModel);
      const rawEnumerations = readUnknownArray(domainModelRecord, "enumerations");

      for (const rawEnumeration of rawEnumerations) {
        const enumeration = await loadIfAvailable(rawEnumeration);
        const enumerationRecord = asRecord(enumeration);
        const name = readString(enumerationRecord, "name", "UnknownEnumeration");
        const qualifiedName =
          readString(enumerationRecord, "qualifiedName") || `${moduleName}.${name}`;

        enumerations.push({
          moduleName,
          name,
          qualifiedName,
        });
      }
    }

    return enumerations;
  }

  private scoreSearchMatch(query: string, name: string, qualifiedName: string): number {
    const normalizedQuery = query.toLowerCase();
    const normalizedName = name.toLowerCase();
    const normalizedQualifiedName = qualifiedName.toLowerCase();

    if (
      normalizedName === normalizedQuery ||
      normalizedQualifiedName === normalizedQuery
    ) {
      return 3;
    }

    if (
      normalizedName.startsWith(normalizedQuery) ||
      normalizedQualifiedName.startsWith(normalizedQuery)
    ) {
      return 2;
    }

    if (
      normalizedName.includes(normalizedQuery) ||
      normalizedQualifiedName.includes(normalizedQuery)
    ) {
      return 1;
    }

    return 0;
  }

  async searchModel(query: string, scope: SearchScope = "all"): Promise<SearchResultInfo[]> {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      return [];
    }

    const results: SearchResultInfo[] = [];
    const shouldInclude = (value: SearchScope): boolean => scope === "all" || scope === value;

    if (shouldInclude("entities")) {
      const entities = await this.getAllEntities();
      for (const entity of entities) {
        const relevance = this.scoreSearchMatch(normalizedQuery, entity.name, entity.qualifiedName);
        if (relevance === 0) {
          continue;
        }
        results.push({
          type: "entity",
          moduleName: entity.moduleName,
          name: entity.name,
          qualifiedName: entity.qualifiedName,
          relevance,
        });
      }
    }

    if (shouldInclude("microflows")) {
      const model = await this.ensureConnectedModel();
      const allMicroflows = this.modelCollectionByName(model, "allMicroflows");
      for (const microflow of allMicroflows) {
        const microflowRecord = asRecord(microflow);
        const qualifiedName =
          readString(microflowRecord, "qualifiedName") ||
          readString(microflowRecord, "name", "UnknownMicroflow");
        const name = readString(microflowRecord, "name") || qualifiedName;
        const relevance = this.scoreSearchMatch(normalizedQuery, name, qualifiedName);
        if (relevance === 0) {
          continue;
        }
        results.push({
          type: "microflow",
          moduleName:
            readString(microflowRecord, "moduleName") ||
            readModuleFromQualifiedName(qualifiedName, "UnknownModule"),
          name,
          qualifiedName,
          relevance,
        });
      }
    }

    if (shouldInclude("pages")) {
      const model = await this.ensureConnectedModel();
      const allPages = this.modelCollectionByName(model, "allPages");
      for (const page of allPages) {
        const pageRecord = asRecord(page);
        const qualifiedName =
          readString(pageRecord, "qualifiedName") ||
          readString(pageRecord, "name", "UnknownPage");
        const name = readString(pageRecord, "name") || qualifiedName;
        const relevance = this.scoreSearchMatch(normalizedQuery, name, qualifiedName);
        if (relevance === 0) {
          continue;
        }
        results.push({
          type: "page",
          moduleName:
            readString(pageRecord, "moduleName") ||
            readModuleFromQualifiedName(qualifiedName, "UnknownModule"),
          name,
          qualifiedName,
          relevance,
        });
      }
    }

    if (shouldInclude("enumerations")) {
      const enumerations = await this.extractEnumerations();
      for (const enumeration of enumerations) {
        const relevance = this.scoreSearchMatch(
          normalizedQuery,
          enumeration.name,
          enumeration.qualifiedName
        );
        if (relevance === 0) {
          continue;
        }
        results.push({
          type: "enumeration",
          moduleName: enumeration.moduleName,
          name: enumeration.name,
          qualifiedName: enumeration.qualifiedName,
          relevance,
        });
      }
    }

    const deduped = new Map<string, SearchResultInfo>();
    for (const result of results) {
      const key = `${result.type}:${result.qualifiedName.toLowerCase()}`;
      const existing = deduped.get(key);
      if (!existing || existing.relevance < result.relevance) {
        deduped.set(key, result);
      }
    }

    return Array.from(deduped.values())
      .sort((left, right) => {
        if (left.relevance !== right.relevance) {
          return right.relevance - left.relevance;
        }
        return left.qualifiedName.localeCompare(right.qualifiedName);
      })
      .slice(0, 50);
  }

  async getBestPracticeFindings(moduleName?: string): Promise<BestPracticeFindingInfo[]> {
    const modulesToScan = moduleName
      ? [moduleName]
      : (await this.listModules()).map((module) => module.name);
    const findings: BestPracticeFindingInfo[] = [];

    for (const module of modulesToScan) {
      let domainModel: DomainModelInfo;
      try {
        domainModel = await this.getDomainModel(module);
      } catch (error) {
        findings.push({
          severity: "info",
          category: "module",
          location: module,
          description:
            error instanceof Error ? error.message : `Module '${module}' kan niet worden geladen.`,
          recommendation: "Controleer of de module bestaat en toegankelijk is.",
        });
        continue;
      }

      for (const entity of domainModel.entities) {
        if (entity.accessRules.length === 0) {
          findings.push({
            severity: "warning",
            category: "security",
            location: entity.qualifiedName,
            description: "Entity heeft geen access rules.",
            recommendation: "Voeg minimaal een module role met expliciete rechten toe.",
          });
        }

        for (const association of entity.associations) {
          const deleteBehavior = association.deleteBehavior.trim().toLowerCase();
          if (!deleteBehavior || ["none", "unknown", "default"].includes(deleteBehavior)) {
            findings.push({
              severity: "warning",
              category: "domain-model",
              location: `${entity.qualifiedName}.${association.name}`,
              description: "Associatie heeft geen expliciet delete behavior.",
              recommendation: "Stel een expliciete delete-behavior in voor voorspelbare cascades.",
            });
          }
        }
      }

      const microflows = await this.listMicroflows(module);
      for (const microflow of microflows) {
        const details = await this.getMicroflowDetails(microflow.qualifiedName);

        if (!details.hasErrorHandling) {
          findings.push({
            severity: "warning",
            category: "microflow",
            location: details.qualifiedName,
            description: "Microflow heeft geen error handling.",
            recommendation: "Voeg een error handler flow toe met fallback logica.",
          });
        }

        if (details.steps.length > 25) {
          findings.push({
            severity: "info",
            category: "microflow",
            location: details.qualifiedName,
            description: `Microflow heeft ${details.steps.length} stappen en is mogelijk te complex.`,
            recommendation: "Splits de microflow op in kleinere sub-microflows.",
          });
        }
      }

      const pages = await this.listPages(module);
      for (const page of pages) {
        const structure = await this.getPageStructure(page.qualifiedName);
        const widgets = this.flattenWidgets(structure.widgets);

        for (const widget of widgets) {
          if (this.isDataContainerWidget(widget.type) && !widget.dataSource) {
            findings.push({
              severity: "warning",
              category: "page",
              location: `${structure.qualifiedName}:${widget.type}`,
              description: "Data container heeft geen data source.",
              recommendation: "Configureer een database/xpath/microflow datasource voor deze container.",
            });
          }
        }
      }
    }

    findings.push({
      severity: "info",
      category: "analysis",
      location: moduleName ?? "App",
      description:
        "Check op ongebruikte microflow-variabelen is in deze MVP niet volledig geimplementeerd.",
      recommendation: "Controleer variabelegebruik handmatig in complexe microflows.",
    });

    if (findings.length === 0) {
      findings.push({
        severity: "info",
        category: "summary",
        location: moduleName ?? "App",
        description: "Geen best-practice afwijkingen gevonden met de huidige heuristieken.",
        recommendation: "Voer periodiek handmatige review uit voor niet-detecteerbare issues.",
      });
    }

    return findings.sort((left, right) => {
      if (left.severity !== right.severity) {
        return left.severity === "warning" ? -1 : 1;
      }
      return left.location.localeCompare(right.location);
    });
  }

  async getDependencies(qualifiedName: string): Promise<DependencyInfo> {
    try {
      const entity = await this.getEntityDetails(qualifiedName);
      const allEntities = await this.getAllEntities();

      const outgoing = uniqueStrings(
        entity.associations.map((association) => association.targetEntity)
      ).sort((left, right) => left.localeCompare(right));

      const incoming = uniqueStrings(
        allEntities.flatMap((candidate) =>
          candidate.associations
            .filter(
              (association) =>
                association.targetEntity.toLowerCase() === entity.qualifiedName.toLowerCase() ||
                association.targetEntity.toLowerCase() === entity.name.toLowerCase()
            )
            .map((association) => association.sourceEntity)
        )
      ).sort((left, right) => left.localeCompare(right));

      return {
        document: entity.qualifiedName,
        outgoing,
        incoming,
        notes: ["Entity dependencies zijn gebaseerd op associaties in het domain model."],
      };
    } catch {
      // Not an entity, continue with other document types.
    }

    try {
      const microflow = await this.getMicroflowDetails(qualifiedName);
      const outgoing = uniqueStrings(
        microflow.steps
          .map((step) => this.parseCalledMicroflow(step))
          .filter((value): value is string => Boolean(value))
      ).sort((left, right) => left.localeCompare(right));

      const incomingCandidates: string[] = [];
      const modules = await this.listModules();
      for (const module of modules) {
        const moduleMicroflows = await this.listMicroflows(module.name);
        for (const candidate of moduleMicroflows) {
          if (candidate.qualifiedName.toLowerCase() === microflow.qualifiedName.toLowerCase()) {
            continue;
          }

          const candidateDetails = await this.getMicroflowDetails(candidate.qualifiedName);
          const callsTarget = candidateDetails.steps.some((step) => {
            const called = this.parseCalledMicroflow(step);
            return called?.toLowerCase() === microflow.qualifiedName.toLowerCase();
          });
          if (callsTarget) {
            incomingCandidates.push(candidateDetails.qualifiedName);
          }
        }
      }

      return {
        document: microflow.qualifiedName,
        outgoing,
        incoming: uniqueStrings(incomingCandidates).sort((left, right) => left.localeCompare(right)),
        notes: [
          "Microflow dependencies zijn heuristisch bepaald via call-acties in de stappenlijst.",
          "Entity- en page-verwijzingen vanuit expressions zijn niet volledig gedekt.",
        ],
      };
    } catch {
      // Not a microflow, continue with page detection.
    }

    try {
      const page = await this.getPageStructure(qualifiedName);
      const widgets = this.flattenWidgets(page.widgets);
      const outgoingCandidates: string[] = [];

      for (const widget of widgets) {
        if (widget.entity) {
          outgoingCandidates.push(widget.entity);
        }
        if (widget.action) {
          outgoingCandidates.push(...this.extractActionReferences(widget.action));
        }
      }

      const incomingCandidates: string[] = [];
      const modules = await this.listModules();
      for (const module of modules) {
        const modulePages = await this.listPages(module.name);
        for (const candidate of modulePages) {
          if (candidate.qualifiedName.toLowerCase() === page.qualifiedName.toLowerCase()) {
            continue;
          }

          const structure = await this.getPageStructure(candidate.qualifiedName);
          const referencesPage = this.flattenWidgets(structure.widgets).some((widget) => {
            if (!widget.action) {
              return false;
            }
            const references = this.extractActionReferences(widget.action).map((ref) =>
              ref.toLowerCase()
            );
            return (
              references.includes(page.qualifiedName.toLowerCase()) ||
              references.includes(page.name.toLowerCase())
            );
          });
          if (referencesPage) {
            incomingCandidates.push(structure.qualifiedName);
          }
        }
      }

      return {
        document: page.qualifiedName,
        outgoing: uniqueStrings(outgoingCandidates).sort((left, right) => left.localeCompare(right)),
        incoming: uniqueStrings(incomingCandidates).sort((left, right) => left.localeCompare(right)),
        notes: [
          "Page dependencies zijn gebaseerd op widget actions en entity bindings.",
          "Niet alle client-side nanoflow verwijzingen zijn detecteerbaar via deze heuristiek.",
        ],
      };
    } catch {
      // No match.
    }

    throw new Error(
      `Document '${qualifiedName}' niet gevonden als entity, microflow of page.`
    );
  }

  private async countEntities(model: IModel): Promise<number> {
    const modules = this.getModules(model);
    let total = 0;

    for (const module of modules) {
      const loadedModule = await loadIfAvailable(module);
      const moduleRecord = asRecord(loadedModule);
      const domainModel = await loadIfAvailable(moduleRecord?.domainModel);
      const domainModelRecord = asRecord(domainModel);
      total += readUnknownArray(domainModelRecord, "entities").length;
    }

    return total;
  }

  async getModelStats(): Promise<ModelStatsInfo> {
    const model = await this.ensureConnectedModel();
    const moduleCount = this.getModules(model).length;
    const microflowCount = this.modelCollectionByName(model, "allMicroflows").length;
    const pageCount = this.modelCollectionByName(model, "allPages").length;
    const userRoleCount = (await this.extractUserRoles(model)).length;
    const entityCount = await this.countEntities(model);

    return {
      moduleCount,
      entityCount,
      microflowCount,
      pageCount,
      userRoleCount,
      securityEnabled: this.isSecurityEnabled(model, userRoleCount),
    };
  }
}
