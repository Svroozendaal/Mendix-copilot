const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || "http://127.0.0.1:8787";

interface ApiErrorResponse {
  ok: false;
  error: {
    message: string;
  };
}

export interface ApiStatus {
  connected: boolean;
  appId?: string;
  branch?: string;
  modelLoaded: boolean;
  counts?: {
    moduleCount: number;
    entityCount: number;
    microflowCount: number;
    pageCount: number;
    userRoleCount: number;
    securityEnabled: boolean;
  };
  connectedAt?: string;
}

export interface ApiTextResponse<TMeta> {
  ok: true;
  text: string;
  meta: TMeta;
}

export interface ChatRequest {
  message?: string;
  messages?: ChatMessage[];
  mode?: "assistant" | "tooling";
  context?: {
    selectedType?: "module" | "entity" | "microflow" | "page";
    module?: string;
    qualifiedName?: string;
  };
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface PlanRequestContext {
  selectedType?: "module" | "entity" | "microflow" | "page";
  module?: string;
  qualifiedName?: string;
}

export interface StreamEvent {
  event: string;
  data: unknown;
}

export interface ChangePlan {
  planId: string;
  createdAt: string;
  intent: string;
  target: {
    module?: string;
    entity?: string;
    microflow?: string;
  };
  preconditions: string[];
  commands: Array<{
    type: string;
    [key: string]: unknown;
  }>;
  risk: {
    destructive: boolean;
    impactLevel: "low" | "medium" | "high";
    notes: string[];
  };
}

export interface PlanPreview {
  summary: string[];
  affectedArtifacts: string[];
  destructive: boolean;
}

export interface PlanResponse {
  ok: true;
  changePlan: ChangePlan;
  preview: PlanPreview;
}

export interface PlanValidateResponse {
  ok: boolean;
  validatedPlan: ChangePlan;
  warnings: string[];
  errors: string[];
  preview: PlanPreview;
}

async function parseError(response: Response): Promise<Error> {
  try {
    const body = (await response.json()) as ApiErrorResponse;
    if (body?.error?.message) {
      return new Error(body.error.message);
    }
  } catch {
    // Ignore parse errors and use status text fallback.
  }
  return new Error(`HTTP ${response.status}: ${response.statusText}`);
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  return (await response.json()) as T;
}

export async function getStatus(): Promise<ApiStatus> {
  return requestJson<ApiStatus>("/api/status");
}

export async function connect(appId?: string, branch?: string): Promise<{ ok: true; status: ApiStatus }> {
  return requestJson<{ ok: true; status: ApiStatus }>("/api/connect", {
    method: "POST",
    body: JSON.stringify({
      appId: appId?.trim() || undefined,
      branch: branch?.trim() || undefined,
    }),
  });
}

export async function disconnect(): Promise<{ ok: true }> {
  return requestJson<{ ok: true }>("/api/disconnect", { method: "POST", body: "{}" });
}

export async function getAppInfo<TMeta>(): Promise<ApiTextResponse<TMeta>> {
  return requestJson<ApiTextResponse<TMeta>>("/api/app-info");
}

export async function listModules<TMeta>(filter?: string): Promise<ApiTextResponse<TMeta>> {
  const query = filter ? `?filter=${encodeURIComponent(filter)}` : "";
  return requestJson<ApiTextResponse<TMeta>>(`/api/modules${query}`);
}

export async function getDomainModel<TMeta>(
  moduleName: string,
  detailed = false
): Promise<ApiTextResponse<TMeta>> {
  const encodedModule = encodeURIComponent(moduleName);
  const query = detailed ? "?detailed=true" : "";
  return requestJson<ApiTextResponse<TMeta>>(`/api/module/${encodedModule}/domain-model${query}`);
}

export async function searchModel<TMeta>(
  query: string,
  scope = "all"
): Promise<ApiTextResponse<TMeta>> {
  return requestJson<ApiTextResponse<TMeta>>(
    `/api/search?q=${encodeURIComponent(query)}&scope=${encodeURIComponent(scope)}`
  );
}

export async function getEntityDetails<TMeta>(qualifiedName: string): Promise<ApiTextResponse<TMeta>> {
  return requestJson<ApiTextResponse<TMeta>>(`/api/entity/${encodeURIComponent(qualifiedName)}`);
}

export async function getAssociations<TMeta>(qualifiedName: string): Promise<ApiTextResponse<TMeta>> {
  return requestJson<ApiTextResponse<TMeta>>(
    `/api/entity/${encodeURIComponent(qualifiedName)}/associations`
  );
}

export async function listMicroflows<TMeta>(moduleName: string): Promise<ApiTextResponse<TMeta>> {
  return requestJson<ApiTextResponse<TMeta>>(`/api/microflows?module=${encodeURIComponent(moduleName)}`);
}

export async function getMicroflowDetails<TMeta>(
  qualifiedName: string
): Promise<ApiTextResponse<TMeta>> {
  return requestJson<ApiTextResponse<TMeta>>(`/api/microflow/${encodeURIComponent(qualifiedName)}`);
}

export async function listPages<TMeta>(moduleName: string): Promise<ApiTextResponse<TMeta>> {
  return requestJson<ApiTextResponse<TMeta>>(`/api/pages?module=${encodeURIComponent(moduleName)}`);
}

export async function getPageStructure<TMeta>(qualifiedName: string): Promise<ApiTextResponse<TMeta>> {
  return requestJson<ApiTextResponse<TMeta>>(`/api/page/${encodeURIComponent(qualifiedName)}`);
}

export async function getSecurityOverview<TMeta>(moduleName?: string): Promise<ApiTextResponse<TMeta>> {
  const query = moduleName ? `?module=${encodeURIComponent(moduleName)}` : "";
  return requestJson<ApiTextResponse<TMeta>>(`/api/security${query}`);
}

export async function getEntityAccess<TMeta>(qualifiedName: string): Promise<ApiTextResponse<TMeta>> {
  return requestJson<ApiTextResponse<TMeta>>(
    `/api/entity-access/${encodeURIComponent(qualifiedName)}`
  );
}

export async function getBestPractices<TMeta>(moduleName?: string): Promise<ApiTextResponse<TMeta>> {
  const query = moduleName ? `?module=${encodeURIComponent(moduleName)}` : "";
  return requestJson<ApiTextResponse<TMeta>>(`/api/best-practices${query}`);
}

export async function getDependencies<TMeta>(qualifiedName: string): Promise<ApiTextResponse<TMeta>> {
  return requestJson<ApiTextResponse<TMeta>>(
    `/api/dependencies/${encodeURIComponent(qualifiedName)}`
  );
}

export async function createPlan(message: string, context?: PlanRequestContext): Promise<PlanResponse> {
  return requestJson<PlanResponse>("/api/plan", {
    method: "POST",
    body: JSON.stringify({
      message,
      context,
    }),
  });
}

export async function validatePlan(planId: string): Promise<PlanValidateResponse> {
  return requestJson<PlanValidateResponse>("/api/plan/validate", {
    method: "POST",
    body: JSON.stringify({ planId }),
  });
}

function parseEventChunk(chunk: string): StreamEvent | null {
  const lines = chunk.split(/\r?\n/);
  let eventName = "message";
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("event:")) {
      eventName = line.slice("event:".length).trim();
      continue;
    }

    if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trim());
    }
  }

  if (dataLines.length === 0) {
    return null;
  }

  const rawData = dataLines.join("\n");
  let parsedData: unknown = rawData;

  try {
    parsedData = JSON.parse(rawData);
  } catch {
    parsedData = rawData;
  }

  return {
    event: eventName,
    data: parsedData,
  };
}

export async function streamChat(
  request: ChatRequest,
  onEvent: (event: StreamEvent) => void,
  options?: { timeoutMs?: number }
): Promise<void> {
  const timeoutMs = options?.timeoutMs ?? 180000;
  const controller = new AbortController();
  const timeoutHandle = window.setTimeout(() => controller.abort(), timeoutMs);

  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
    signal: controller.signal,
  });

  try {
    if (!response.ok) {
      throw await parseError(response);
    }

    if (!response.body) {
      throw new Error("Chat streaming niet beschikbaar: response body ontbreekt.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      while (true) {
        const separatorIndex = buffer.indexOf("\n\n");
        if (separatorIndex < 0) {
          break;
        }

        const chunk = buffer.slice(0, separatorIndex).trim();
        buffer = buffer.slice(separatorIndex + 2);
        if (!chunk) {
          continue;
        }

        const parsed = parseEventChunk(chunk);
        if (parsed) {
          onEvent(parsed);
        }
      }
    }

    const remainder = buffer.trim();
    if (remainder) {
      const parsed = parseEventChunk(remainder);
      if (parsed) {
        onEvent(parsed);
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Chat request timeout na ${timeoutMs}ms.`);
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutHandle);
  }
}

export async function streamPlanExecute(
  input: {
    planId: string;
    approvalToken: string;
    confirmText?: string;
  },
  onEvent: (event: StreamEvent) => void
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/plan/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  if (!response.body) {
    throw new Error("Execution streaming niet beschikbaar: response body ontbreekt.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    while (true) {
      const separatorIndex = buffer.indexOf("\n\n");
      if (separatorIndex < 0) {
        break;
      }

      const chunk = buffer.slice(0, separatorIndex).trim();
      buffer = buffer.slice(separatorIndex + 2);
      if (!chunk) {
        continue;
      }

      const parsed = parseEventChunk(chunk);
      if (parsed) {
        onEvent(parsed);
      }
    }
  }

  const remainder = buffer.trim();
  if (remainder) {
    const parsed = parseEventChunk(remainder);
    if (parsed) {
      onEvent(parsed);
    }
  }
}
