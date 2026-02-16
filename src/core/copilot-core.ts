import type {
  AssociationInfo,
  BestPracticeFindingInfo,
  DependencyInfo,
  DomainModelInfo,
  EntityAccessInfo,
  EntityInfo,
  MicroflowDetailsInfo,
  MicroflowInfo,
  PageInfo,
  PageStructureInfo,
  SearchResultInfo,
  SearchScope,
  SecurityOverviewInfo,
} from "../mendix/client.js";
import { MendixClient } from "../mendix/client.js";
import {
  serializeAssociations,
  serializeDomainModel,
  serializeEntityDetails,
} from "../mendix/serializers/domain-model.js";
import { serializeMicroflowDetails, serializeMicroflowList } from "../mendix/serializers/microflow.js";
import { serializePageList, serializePageStructure } from "../mendix/serializers/page.js";
import { serializeEntityAccess, serializeSecurityOverview } from "../mendix/serializers/security.js";
import {
  serializeAppInfo,
  serializeModuleList,
  serializeSearchResults,
} from "../mendix/serializers/navigation.js";
import {
  serializeBestPracticeFindings,
  serializeDependencies,
} from "../mendix/serializers/analysis.js";

export interface TextResult<TMeta = unknown> {
  text: string;
  meta: TMeta;
}

export interface AppInfoMeta {
  appInfo: Awaited<ReturnType<MendixClient["getAppInfo"]>>;
}

export interface ModuleListMeta {
  modules: Awaited<ReturnType<MendixClient["listModules"]>>;
}

export interface DomainModelMeta {
  domainModel: DomainModelInfo;
  entities: Array<{
    name: string;
    qualifiedName: string;
    attributeCount: number;
    associationCount: number;
  }>;
}

export interface SearchMeta {
  query: string;
  scope: SearchScope;
  results: SearchResultInfo[];
}

export interface EntityDetailsMeta {
  entity: EntityInfo;
}

export interface AssociationsMeta {
  entity: EntityInfo;
  associations: AssociationInfo[];
}

export interface MicroflowListMeta {
  module: string;
  microflows: MicroflowInfo[];
}

export interface MicroflowDetailsMeta {
  microflow: MicroflowDetailsInfo;
}

export interface PageListMeta {
  module: string;
  pages: PageInfo[];
}

export interface PageStructureMeta {
  page: PageStructureInfo;
}

export interface SecurityOverviewMeta {
  overview: SecurityOverviewInfo;
}

export interface EntityAccessMeta {
  entityAccess: EntityAccessInfo;
}

export interface BestPracticeMeta {
  module?: string;
  findings: BestPracticeFindingInfo[];
}

export interface DependenciesMeta {
  dependencies: DependencyInfo;
}

function dedupeAssociations(associations: AssociationInfo[]): AssociationInfo[] {
  const seen = new Set<string>();
  const unique: AssociationInfo[] = [];

  for (const association of associations) {
    const key = [
      association.name,
      association.type,
      association.sourceEntity,
      association.targetEntity,
      association.owner,
      association.deleteBehavior,
      association.navigability,
    ].join("|");
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(association);
  }

  return unique;
}

function findAssociationsForEntity(entity: EntityInfo, allEntities: EntityInfo[]): AssociationInfo[] {
  return dedupeAssociations(
    allEntities.flatMap((candidate) =>
      candidate.associations.filter(
        (association) =>
          association.sourceEntity === entity.qualifiedName ||
          association.targetEntity === entity.qualifiedName ||
          association.sourceEntity === entity.name ||
          association.targetEntity === entity.name
      )
    )
  );
}

export class CopilotCore {
  constructor(private readonly mendixClient: MendixClient) {}

  async getAppInfo(): Promise<TextResult<AppInfoMeta>> {
    const appInfo = await this.mendixClient.getAppInfo();
    return {
      text: serializeAppInfo(appInfo),
      meta: { appInfo },
    };
  }

  async listModules(filter?: string): Promise<TextResult<ModuleListMeta>> {
    const modules = await this.mendixClient.listModules(filter);
    return {
      text: serializeModuleList(modules, filter),
      meta: { modules },
    };
  }

  async getDomainModel(moduleName: string, detailed = false): Promise<TextResult<DomainModelMeta>> {
    const domainModel = await this.mendixClient.getDomainModel(moduleName);
    return {
      text: serializeDomainModel(domainModel, { detailed }),
      meta: {
        domainModel,
        entities: domainModel.entities.map((entity) => ({
          name: entity.name,
          qualifiedName: entity.qualifiedName,
          attributeCount: entity.attributes.length,
          associationCount: entity.associations.length,
        })),
      },
    };
  }

  async searchModel(query: string, scope: SearchScope = "all"): Promise<TextResult<SearchMeta>> {
    const results = await this.mendixClient.searchModel(query, scope);
    return {
      text: serializeSearchResults(query, results),
      meta: {
        query,
        scope,
        results,
      },
    };
  }

  async getEntityDetails(qualifiedName: string): Promise<TextResult<EntityDetailsMeta>> {
    const entity = await this.mendixClient.getEntityDetails(qualifiedName);
    return {
      text: serializeEntityDetails(entity),
      meta: { entity },
    };
  }

  async getAssociations(qualifiedName: string): Promise<TextResult<AssociationsMeta>> {
    const entity = await this.mendixClient.getEntityDetails(qualifiedName);
    const allEntities = await this.mendixClient.getAllEntities();
    const associations = findAssociationsForEntity(entity, allEntities);
    return {
      text: serializeAssociations(entity, allEntities),
      meta: {
        entity,
        associations,
      },
    };
  }

  async listMicroflows(moduleName: string, filter?: string): Promise<TextResult<MicroflowListMeta>> {
    const microflows = await this.mendixClient.listMicroflows(moduleName, filter);
    return {
      text: serializeMicroflowList(microflows),
      meta: {
        module: moduleName,
        microflows,
      },
    };
  }

  async getMicroflowDetails(qualifiedName: string): Promise<TextResult<MicroflowDetailsMeta>> {
    const microflow = await this.mendixClient.getMicroflowDetails(qualifiedName);
    return {
      text: serializeMicroflowDetails(microflow),
      meta: {
        microflow,
      },
    };
  }

  async listPages(moduleName: string): Promise<TextResult<PageListMeta>> {
    const pages = await this.mendixClient.listPages(moduleName);
    return {
      text: serializePageList(pages),
      meta: {
        module: moduleName,
        pages,
      },
    };
  }

  async getPageStructure(qualifiedName: string): Promise<TextResult<PageStructureMeta>> {
    const page = await this.mendixClient.getPageStructure(qualifiedName);
    return {
      text: serializePageStructure(page),
      meta: {
        page,
      },
    };
  }

  async getSecurityOverview(moduleName?: string): Promise<TextResult<SecurityOverviewMeta>> {
    const overview = await this.mendixClient.getSecurityOverview(moduleName);
    return {
      text: serializeSecurityOverview(overview),
      meta: {
        overview,
      },
    };
  }

  async getEntityAccess(qualifiedName: string): Promise<TextResult<EntityAccessMeta>> {
    const entityAccess = await this.mendixClient.getEntityAccess(qualifiedName);
    return {
      text: serializeEntityAccess(entityAccess),
      meta: {
        entityAccess,
      },
    };
  }

  async getBestPractices(moduleName?: string): Promise<TextResult<BestPracticeMeta>> {
    const findings = await this.mendixClient.getBestPracticeFindings(moduleName);
    return {
      text: serializeBestPracticeFindings(findings),
      meta: {
        module: moduleName,
        findings,
      },
    };
  }

  async getDependencies(qualifiedName: string): Promise<TextResult<DependenciesMeta>> {
    const dependencies = await this.mendixClient.getDependencies(qualifiedName);
    return {
      text: serializeDependencies(dependencies),
      meta: {
        dependencies,
      },
    };
  }
}
