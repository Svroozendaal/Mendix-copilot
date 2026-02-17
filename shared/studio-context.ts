export const WB_CONTEXT_MESSAGE_TYPE = "WB_CONTEXT" as const;
export const WB_CONTEXT_REQUEST_MESSAGE_TYPE = "WB_CONTEXT_REQUEST" as const;
export const WB_EMBEDDED_MESSAGE_TYPE = "WB_EMBEDDED" as const;
export const WB_MESSAGE_LISTENER_REGISTERED = "MessageListenerRegistered" as const;

export type WbSelectedType = "module" | "entity" | "microflow" | "page" | null;

export interface WbContextPayload {
  selectedType: WbSelectedType;
  qualifiedName?: string;
  module?: string;
}

export interface WbContextMessage {
  type: typeof WB_CONTEXT_MESSAGE_TYPE;
  payload: WbContextPayload;
}

export interface WbContextRequestMessage {
  type: typeof WB_CONTEXT_REQUEST_MESSAGE_TYPE;
}

export interface WbEmbeddedMessage {
  type: typeof WB_EMBEDDED_MESSAGE_TYPE;
  payload?: {
    embedded?: boolean;
    host?: string;
  };
}

export type WbBridgeMessage = WbContextMessage | WbContextRequestMessage | WbEmbeddedMessage;

const VALID_SELECTED_TYPES = new Set<WbSelectedType>([
  "module",
  "entity",
  "microflow",
  "page",
  null,
]);

function isSelectedType(value: unknown): value is WbSelectedType {
  if (value === null) {
    return true;
  }
  return typeof value === "string" && VALID_SELECTED_TYPES.has(value as WbSelectedType);
}

export function moduleFromQualifiedName(qualifiedName: string | undefined): string | undefined {
  if (!qualifiedName) {
    return undefined;
  }

  const separatorIndex = qualifiedName.indexOf(".");
  if (separatorIndex <= 0) {
    return undefined;
  }
  return qualifiedName.slice(0, separatorIndex);
}

export function createEmptyContextPayload(): WbContextPayload {
  return { selectedType: null };
}

export function normalizeWbContextPayload(payload: unknown): WbContextPayload {
  const record =
    typeof payload === "object" && payload !== null ? (payload as Record<string, unknown>) : {};

  const selectedType = isSelectedType(record.selectedType) ? record.selectedType : null;
  const qualifiedName =
    typeof record.qualifiedName === "string" && record.qualifiedName.trim().length > 0
      ? record.qualifiedName.trim()
      : undefined;
  const moduleName =
    typeof record.module === "string" && record.module.trim().length > 0
      ? record.module.trim()
      : moduleFromQualifiedName(qualifiedName);

  const normalized: WbContextPayload = {
    selectedType,
  };

  if (qualifiedName) {
    normalized.qualifiedName = qualifiedName;
  }
  if (moduleName) {
    normalized.module = moduleName;
  }

  if (!normalized.module && selectedType === "module" && qualifiedName && !qualifiedName.includes(".")) {
    normalized.module = qualifiedName;
  }

  return normalized;
}

export function isContextMessage(message: unknown): message is WbContextMessage {
  if (typeof message !== "object" || message === null) {
    return false;
  }

  const record = message as Record<string, unknown>;
  return record.type === WB_CONTEXT_MESSAGE_TYPE && "payload" in record;
}

export function isContextRequestMessage(message: unknown): message is WbContextRequestMessage {
  if (typeof message !== "object" || message === null) {
    return false;
  }

  return (message as Record<string, unknown>).type === WB_CONTEXT_REQUEST_MESSAGE_TYPE;
}
