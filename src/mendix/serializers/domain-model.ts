import type { AssociationInfo, DomainModelInfo, EntityInfo } from "../client.js";

interface ModuleOverviewInput {
  name: string;
  entities?: unknown[];
  microflows?: unknown[];
  pages?: unknown[];
  entityCount?: number;
  microflowCount?: number;
  pageCount?: number;
}

export interface SerializeDomainModelOptions {
  detailed?: boolean;
}

function countItems(items: unknown[] | undefined, fallback: number | undefined): number {
  if (typeof fallback === "number") {
    return fallback;
  }
  return Array.isArray(items) ? items.length : 0;
}

function formatAssociationLine(association: AssociationInfo): string {
  return `- ${association.name} -> ${association.targetEntity} (${association.type}, owner: ${association.owner}, delete: ${association.deleteBehavior})`;
}

function uniqAssociations(associations: AssociationInfo[]): AssociationInfo[] {
  const seen = new Set<string>();
  const result: AssociationInfo[] = [];

  for (const association of associations) {
    const key = [
      association.name,
      association.type,
      association.sourceEntity,
      association.targetEntity,
      association.owner,
      association.deleteBehavior,
    ].join("|");

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(association);
  }

  return result;
}

export function serializeModuleOverview(moduleInfo: ModuleOverviewInput): string {
  const entityCount = countItems(moduleInfo.entities, moduleInfo.entityCount);
  const microflowCount = countItems(moduleInfo.microflows, moduleInfo.microflowCount);
  const pageCount = countItems(moduleInfo.pages, moduleInfo.pageCount);

  return [
    `## Module: ${moduleInfo.name}`,
    ``,
    `- Entities: ${entityCount}`,
    `- Microflows: ${microflowCount}`,
    `- Pages: ${pageCount}`,
  ].join("\n");
}

export function serializeDomainModel(
  domainModel: DomainModelInfo,
  options: SerializeDomainModelOptions = {}
): string {
  const lines: string[] = [`## Module: ${domainModel.moduleName}`, ``];

  if (domainModel.entities.length === 0) {
    lines.push("Geen entities gevonden in deze module.");
    return lines.join("\n");
  }

  for (const entity of domainModel.entities) {
    lines.push(`### Entity: ${entity.name}`);
    lines.push("Attributen:");
    if (entity.attributes.length === 0) {
      lines.push("- (geen attributen)");
    } else {
      for (const attribute of entity.attributes) {
        lines.push(`- ${attribute.name} (${attribute.type})`);
      }
    }

    lines.push("");
    lines.push("Associaties:");
    if (entity.associations.length === 0) {
      lines.push("- (geen associaties)");
    } else {
      for (const association of entity.associations) {
        lines.push(formatAssociationLine(association));
      }
    }

    if (options.detailed) {
      lines.push("");
      lines.push("Validatieregels:");
      if (entity.validationRules.length === 0) {
        lines.push("- (geen validatieregels)");
      } else {
        for (const rule of entity.validationRules) {
          lines.push(`- ${rule}`);
        }
      }

      lines.push("");
      lines.push("Indexes:");
      if (entity.indexes.length === 0) {
        lines.push("- (geen indexes)");
      } else {
        for (const index of entity.indexes) {
          lines.push(`- ${index}`);
        }
      }
    }

    lines.push("");
  }

  lines.push(
    `Samenvatting: ${domainModel.entities.length} entities, ` +
      `${domainModel.microflowCount} microflows, ${domainModel.pageCount} pages.`
  );

  return lines.join("\n");
}

export function serializeEntityDetails(entity: EntityInfo): string {
  const lines: string[] = [
    `## Entity: ${entity.qualifiedName}`,
    "",
    `Generalisatie: ${entity.generalization ?? "(geen)"}`,
    "",
    "Attributen:",
  ];

  if (entity.attributes.length === 0) {
    lines.push("- (geen attributen)");
  } else {
    for (const attribute of entity.attributes) {
      lines.push(`- ${attribute.name}`);
      lines.push(`  Type: ${attribute.type}`);
      lines.push(`  Default: ${attribute.defaultValue ?? "(geen)"}`);
      if (attribute.validationRules.length === 0) {
        lines.push("  Validatie: (geen)");
      } else {
        lines.push("  Validatie:");
        for (const validationRule of attribute.validationRules) {
          lines.push(`  - ${validationRule}`);
        }
      }
    }
  }

  lines.push("");
  lines.push("Access Rules:");
  if (entity.accessRules.length === 0) {
    lines.push("- (geen access rules)");
  } else {
    for (const rule of entity.accessRules) {
      lines.push(`- Role: ${rule.role}`);
      lines.push(`  Create: ${rule.create ? "yes" : "no"}`);
      lines.push(`  Delete: ${rule.delete ? "yes" : "no"}`);
      lines.push(`  Read: ${rule.read ? "yes" : "no"}`);
      lines.push(`  Write: ${rule.write ? "yes" : "no"}`);
      if (rule.xpathConstraint) {
        lines.push(`  XPath: ${rule.xpathConstraint}`);
      }
    }
  }

  lines.push("");
  lines.push("Event Handlers:");
  lines.push(`- Before commit: ${entity.eventHandlers.beforeCommit ?? "(geen)"}`);
  lines.push(`- After commit: ${entity.eventHandlers.afterCommit ?? "(geen)"}`);
  lines.push(`- Before delete: ${entity.eventHandlers.beforeDelete ?? "(geen)"}`);
  lines.push(`- After delete: ${entity.eventHandlers.afterDelete ?? "(geen)"}`);

  lines.push("");
  lines.push("Indexes:");
  if (entity.indexes.length === 0) {
    lines.push("- (geen indexes)");
  } else {
    for (const index of entity.indexes) {
      lines.push(`- ${index}`);
    }
  }

  lines.push("");
  lines.push("Entity validatieregels:");
  if (entity.validationRules.length === 0) {
    lines.push("- (geen validatieregels)");
  } else {
    for (const rule of entity.validationRules) {
      lines.push(`- ${rule}`);
    }
  }

  return lines.join("\n");
}

export function serializeAssociations(entity: EntityInfo, allEntities: EntityInfo[]): string {
  const involvedAssociations = uniqAssociations(
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

  const lines: string[] = [
    `## Associaties voor entity: ${entity.qualifiedName}`,
    "",
  ];

  if (involvedAssociations.length === 0) {
    lines.push("Geen associaties gevonden.");
    return lines.join("\n");
  }

  for (const association of involvedAssociations) {
    lines.push(`- ${association.name}`);
    lines.push(`  Type: ${association.type}`);
    lines.push(`  Source: ${association.sourceEntity}`);
    lines.push(`  Target: ${association.targetEntity}`);
    lines.push(`  Owner: ${association.owner}`);
    lines.push(`  Delete behavior: ${association.deleteBehavior}`);
    lines.push(`  Navigability: ${association.navigability}`);
  }

  return lines.join("\n");
}
