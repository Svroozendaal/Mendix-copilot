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
  const value = record?.[key];
  if (typeof value === "string") {
    return value;
  }
  return fallback;
}

function readBoolean(record: RecordLike | undefined, key: string, fallback = false): boolean {
  const value = record?.[key];
  if (typeof value === "boolean") {
    return value;
  }
  return fallback;
}

function readUnknownArray(record: RecordLike | undefined, key: string): unknown[] {
  const value = record?.[key];
  if (Array.isArray(value)) {
    return value;
  }
  return [];
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

  private modelCollectionByName(model: IModel, methodName: "allMicroflows" | "allPages"): unknown[] {
    const modelRecord = asRecord(model);
    const maybeMethod = modelRecord?.[methodName];

    if (typeof maybeMethod !== "function") {
      return [];
    }

    const result = maybeMethod.call(model);
    return Array.isArray(result) ? result : [];
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
}
