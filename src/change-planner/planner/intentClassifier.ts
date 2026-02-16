export type ChangeIntent =
  | "create_entity"
  | "add_attribute"
  | "generate_crud"
  | "create_microflow"
  | "modify_microflow"
  | "delete"
  | "rename"
  | "unknown";

export interface IntentClassification {
  intent: ChangeIntent;
  module?: string;
  entity?: string;
  microflow?: string;
  attributeName?: string;
  attributeType?: string;
  originalMessage: string;
}

function extractModule(message: string): string | undefined {
  const match = message.match(/\bmodule\s+([A-Za-z_][A-Za-z0-9_]*)\b/i);
  return match?.[1];
}

function extractQualifiedName(message: string): string | undefined {
  const match = message.match(/\b([A-Za-z_][A-Za-z0-9_]*)\.([A-Za-z_][A-Za-z0-9_]*)\b/);
  return match ? `${match[1]}.${match[2]}` : undefined;
}

function extractEntityName(message: string): string | undefined {
  const explicit = message.match(/\bentity\s+([A-Za-z_][A-Za-z0-9_]*)\b/i);
  if (explicit?.[1]) {
    return explicit[1];
  }
  return undefined;
}

function extractAttributeName(message: string): string | undefined {
  const match = message.match(/\battribute\s+([A-Za-z_][A-Za-z0-9_]*)\b/i);
  return match?.[1];
}

function extractAttributeType(message: string): string | undefined {
  const match = message.match(
    /\b(String|Integer|Long|Decimal|Boolean|DateTime|AutoNumber|Enumeration)\b/i
  );
  return match?.[1];
}

function isCreateEntity(message: string): boolean {
  return /(create|maak|nieuw).*(entity|entiteit)/i.test(message);
}

function isAddAttribute(message: string): boolean {
  return /(add|voeg).*(attribute|attribuut)/i.test(message);
}

function isGenerateCrud(message: string): boolean {
  return /\bcrud\b/i.test(message) || /(generate|maak).*(create|retrieve|update|delete)/i.test(message);
}

function isCreateMicroflow(message: string): boolean {
  return /(create|maak|nieuw).*(microflow)/i.test(message);
}

function isModifyMicroflow(message: string): boolean {
  return /(modify|update|pas aan|wijzig).*(microflow)/i.test(message);
}

function isDelete(message: string): boolean {
  return /(delete|verwijder)/i.test(message);
}

function isRename(message: string): boolean {
  return /(rename|hernoem)/i.test(message);
}

export function classifyIntent(message: string): IntentClassification {
  const trimmedMessage = message.trim();
  const module = extractModule(trimmedMessage);
  const qualifiedName = extractQualifiedName(trimmedMessage);
  const entityFromName = extractEntityName(trimmedMessage);
  const attributeName = extractAttributeName(trimmedMessage);
  const attributeType = extractAttributeType(trimmedMessage);

  const entityFromQualifiedName = qualifiedName?.split(".")[1];
  const moduleFromQualifiedName = qualifiedName?.split(".")[0];
  const targetModule = module ?? moduleFromQualifiedName;

  if (isDelete(trimmedMessage)) {
    return {
      intent: "delete",
      module: targetModule,
      microflow: qualifiedName,
      entity: entityFromQualifiedName ?? entityFromName,
      originalMessage: trimmedMessage,
    };
  }

  if (isRename(trimmedMessage)) {
    return {
      intent: "rename",
      module: targetModule,
      entity: entityFromQualifiedName ?? entityFromName,
      microflow: qualifiedName,
      originalMessage: trimmedMessage,
    };
  }

  if (isGenerateCrud(trimmedMessage)) {
    return {
      intent: "generate_crud",
      module: targetModule,
      entity: qualifiedName ?? entityFromName,
      originalMessage: trimmedMessage,
    };
  }

  if (isAddAttribute(trimmedMessage)) {
    return {
      intent: "add_attribute",
      module: targetModule,
      entity: qualifiedName ?? entityFromName,
      attributeName,
      attributeType,
      originalMessage: trimmedMessage,
    };
  }

  if (isCreateEntity(trimmedMessage)) {
    return {
      intent: "create_entity",
      module: targetModule,
      entity: entityFromName ?? entityFromQualifiedName,
      originalMessage: trimmedMessage,
    };
  }

  if (isCreateMicroflow(trimmedMessage)) {
    return {
      intent: "create_microflow",
      module: targetModule,
      microflow: qualifiedName,
      originalMessage: trimmedMessage,
    };
  }

  if (isModifyMicroflow(trimmedMessage)) {
    return {
      intent: "modify_microflow",
      module: targetModule,
      microflow: qualifiedName,
      originalMessage: trimmedMessage,
    };
  }

  return {
    intent: "unknown",
    module: targetModule,
    entity: qualifiedName ?? entityFromName,
    microflow: qualifiedName,
    originalMessage: trimmedMessage,
  };
}
