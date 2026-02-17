import type { CopilotCore } from "../../core/copilot-core.js";
import {
  LlmClient,
  type LlmConversationMessage,
  type LlmToolDefinition,
} from "./llm-client.js";
import type { ApiChatRequest, SseEventName } from "./types.js";

type EventEmitter = (event: SseEventName, data: unknown) => void;

interface ChatRunnerOptions {
  stepTimeoutMs?: number;
  totalTimeoutMs?: number;
}

interface AppKnowledgeSnapshot {
  appKey: string;
  appName: string;
  appId: string;
  branch: string;
  moduleNames: string[];
  overviewText: string;
  loadedAtMs: number;
}

interface ModuleKnowledgeSnapshot {
  appKey: string;
  module: string;
  snapshotText: string;
  loadedAtMs: number;
}

interface ToolExecutionOutput {
  text: string;
  sources: string[];
}

const DEFAULT_STEP_TIMEOUT_MS = 120_000;
const DEFAULT_TOTAL_TIMEOUT_MS = 240_000;
const DEFAULT_APP_CACHE_TTL_MS = 300_000;
const DEFAULT_MODULE_CACHE_TTL_MS = 300_000;
const DEFAULT_MAX_TOOL_ROUNDS = 8;
const DEFAULT_MAX_TOOL_CALLS = 14;
const MAX_HISTORY_MESSAGES = 12;
const MAX_TOOL_OUTPUT_CHARS = 8_000;

const appKnowledgeCache = new Map<string, AppKnowledgeSnapshot>();
const moduleKnowledgeCache = new Map<string, ModuleKnowledgeSnapshot>();

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  if (!value?.trim()) {
    return fallback;
  }
  const parsed = Number.parseInt(value.trim(), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength)}\n\n[...truncated...]`;
}

function latestUserMessage(request: ApiChatRequest): string {
  const messages = request.messages ?? [];
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role === "user" && message.content.trim().length > 0) {
      return message.content.trim();
    }
  }
  return request.message?.trim() ?? "";
}

function toConversationHistory(request: ApiChatRequest): LlmConversationMessage[] {
  const messages = (request.messages ?? [])
    .filter((message) => message.content.trim().length > 0)
    .slice(-MAX_HISTORY_MESSAGES)
    .map<LlmConversationMessage>((message) => ({
      role: message.role,
      content: message.content.trim(),
    }));

  if (messages.length > 0) {
    return messages;
  }

  if (request.message?.trim()) {
    return [
      {
        role: "user",
        content: request.message.trim(),
      },
    ];
  }

  return [];
}

function moduleFromQualifiedName(qualifiedName: string): string | undefined {
  const separatorIndex = qualifiedName.indexOf(".");
  if (separatorIndex <= 0) {
    return undefined;
  }
  return qualifiedName.slice(0, separatorIndex);
}

function dedupeStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const value of values) {
    const normalized = value.trim();
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    unique.push(normalized);
  }
  return unique;
}

function readOptionalStringArgument(args: Record<string, unknown>, key: string): string | undefined {
  const value = args[key];
  if (typeof value !== "string") {
    return undefined;
  }
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function readRequiredStringArgument(args: Record<string, unknown>, key: string): string {
  const value = readOptionalStringArgument(args, key);
  if (!value) {
    throw new Error(`Verplichte parameter '${key}' ontbreekt.`);
  }
  return value;
}

function parseToolArguments(argumentsJson: string): Record<string, unknown> {
  const normalized = argumentsJson.trim();
  if (!normalized) {
    return {};
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(normalized);
  } catch {
    throw new Error(`Tool arguments zijn geen geldige JSON: ${normalized}`);
  }

  const record = asRecord(parsed);
  if (!record) {
    throw new Error("Tool arguments moeten een JSON object zijn.");
  }
  return record;
}

function inferPreferredModule(request: ApiChatRequest, userMessage: string): string | undefined {
  const fromContext = request.context?.module?.trim();
  if (fromContext) {
    return fromContext;
  }

  const fromQualified = request.context?.qualifiedName
    ? moduleFromQualifiedName(request.context.qualifiedName)
    : undefined;
  if (fromQualified) {
    return fromQualified;
  }

  const prefixedMatch = userMessage.match(/\bmodule\s+([A-Za-z_][A-Za-z0-9_]*)\b/i);
  if (prefixedMatch?.[1]) {
    return prefixedMatch[1];
  }

  const suffixedMatch = userMessage.match(/\b([A-Za-z_][A-Za-z0-9_]*)\s+module\b/i);
  if (suffixedMatch?.[1]) {
    return suffixedMatch[1];
  }

  return undefined;
}

function normalizeSearchScope(value: string | undefined): "all" | "entities" | "microflows" | "pages" | "enumerations" {
  switch ((value ?? "all").trim().toLowerCase()) {
    case "entities":
    case "microflows":
    case "pages":
    case "enumerations":
      return value!.trim().toLowerCase() as "entities" | "microflows" | "pages" | "enumerations";
    case "all":
    default:
      return "all";
  }
}

function shouldSuggestPlanPrompt(userMessage: string): boolean {
  const normalized = normalize(userMessage);
  return [
    "plan",
    "uitvoer",
    "execute",
    "implement",
    "bouw",
    "wijzig",
    "aanpassen",
  ].some((term) => normalized.includes(term));
}

function preferredToolNamesForIntent(userMessage: string): string[] {
  const normalized = normalize(userMessage);
  const names: string[] = [];

  if (normalized.includes("module")) {
    names.push("get_module_snapshot", "list_modules");
  }
  if (normalized.includes("microflow") || normalized.includes("nanoflow")) {
    names.push("get_microflow_details", "search_model");
  }
  if (normalized.includes("entity") || normalized.includes("entiteit")) {
    names.push("get_entity_details", "get_entity_access", "search_model");
  }
  if (normalized.includes("page")) {
    names.push("get_page_structure", "search_model");
  }
  if (normalized.includes("security") || normalized.includes("beveilig")) {
    names.push("get_security_overview", "get_best_practices");
  }
  if (normalized.includes("dependency") || normalized.includes("afhankelijk")) {
    names.push("get_dependencies", "search_model");
  }

  return dedupeStrings(names);
}

function buildCodexSystemPrompt(
  userMessage: string,
  preferredModule: string | undefined,
  preferredTools: string[]
): string {
  return [
    "You are WellBased Mendix Copilot in Codex-style agent mode.",
    "Your job: have a natural conversation and answer based on Mendix app facts.",
    "Before answering, decide which tools are needed and call them iteratively.",
    "Do not fabricate model facts. If uncertain, call another tool or state uncertainty clearly.",
    "Always answer in Dutch unless the user explicitly asks for another language.",
    "Be direct and practical; no generic fluff.",
    "When useful, propose concrete next steps or implementation options.",
    "End the final answer with a short 'Bronnen' section listing used artifacts/modules.",
    "",
    `Gebruikersvraag: ${userMessage}`,
    `Voorkeursmodule: ${preferredModule ?? "niet gespecificeerd"}`,
    `Aanbevolen tools voor deze vraag: ${
      preferredTools.length > 0 ? preferredTools.join(", ") : "geen specifieke voorkeur"
    }`,
  ].join("\n");
}

const TOOL_DEFINITIONS: LlmToolDefinition[] = [
  {
    name: "get_prefetched_overview",
    description:
      "Get preloaded app overview with app metadata and module list. Use this before broad exploratory answers.",
    parameters: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "list_modules",
    description: "List modules, optionally filtered by name fragment.",
    parameters: {
      type: "object",
      properties: {
        filter: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "get_module_snapshot",
    description:
      "Load focused knowledge for one module (domain model, microflows, pages). Best for module deep-dives.",
    parameters: {
      type: "object",
      properties: {
        module: { type: "string" },
      },
      required: ["module"],
      additionalProperties: false,
    },
  },
  {
    name: "search_model",
    description: "Search entities, microflows, pages, and enumerations by query.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
        scope: {
          type: "string",
          enum: ["all", "entities", "microflows", "pages", "enumerations"],
        },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    name: "get_entity_details",
    description: "Get detailed entity information including attributes and rules.",
    parameters: {
      type: "object",
      properties: {
        qualifiedName: { type: "string" },
      },
      required: ["qualifiedName"],
      additionalProperties: false,
    },
  },
  {
    name: "get_entity_access",
    description: "Get access rules and permissions for an entity.",
    parameters: {
      type: "object",
      properties: {
        qualifiedName: { type: "string" },
      },
      required: ["qualifiedName"],
      additionalProperties: false,
    },
  },
  {
    name: "get_microflow_details",
    description: "Get detailed microflow information and steps.",
    parameters: {
      type: "object",
      properties: {
        qualifiedName: { type: "string" },
      },
      required: ["qualifiedName"],
      additionalProperties: false,
    },
  },
  {
    name: "get_page_structure",
    description: "Get detailed page structure and widgets.",
    parameters: {
      type: "object",
      properties: {
        qualifiedName: { type: "string" },
      },
      required: ["qualifiedName"],
      additionalProperties: false,
    },
  },
  {
    name: "get_dependencies",
    description: "Get incoming and outgoing dependencies for a document.",
    parameters: {
      type: "object",
      properties: {
        qualifiedName: { type: "string" },
      },
      required: ["qualifiedName"],
      additionalProperties: false,
    },
  },
  {
    name: "get_security_overview",
    description: "Get app or module-level security overview.",
    parameters: {
      type: "object",
      properties: {
        module: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "get_best_practices",
    description: "Get best-practice findings for app or module.",
    parameters: {
      type: "object",
      properties: {
        module: { type: "string" },
      },
      additionalProperties: false,
    },
  },
];

export class ChatRunner {
  private readonly core: CopilotCore;
  private readonly llmClient: LlmClient;
  private readonly stepTimeoutMs: number;
  private readonly totalTimeoutMs: number;
  private readonly appCacheTtlMs: number;
  private readonly moduleCacheTtlMs: number;
  private readonly maxToolRounds: number;
  private readonly maxToolCalls: number;

  constructor(core: CopilotCore, options: ChatRunnerOptions = {}) {
    this.core = core;
    this.llmClient = new LlmClient();
    this.stepTimeoutMs = options.stepTimeoutMs ?? DEFAULT_STEP_TIMEOUT_MS;
    this.totalTimeoutMs = options.totalTimeoutMs ?? DEFAULT_TOTAL_TIMEOUT_MS;
    this.appCacheTtlMs = parsePositiveInteger(
      process.env.COPILOT_CHAT_APP_CACHE_TTL_MS,
      DEFAULT_APP_CACHE_TTL_MS
    );
    this.moduleCacheTtlMs = parsePositiveInteger(
      process.env.COPILOT_CHAT_MODULE_CACHE_TTL_MS,
      DEFAULT_MODULE_CACHE_TTL_MS
    );
    this.maxToolRounds = parsePositiveInteger(
      process.env.COPILOT_CHAT_MAX_TOOL_ROUNDS,
      DEFAULT_MAX_TOOL_ROUNDS
    );
    this.maxToolCalls = parsePositiveInteger(
      process.env.COPILOT_CHAT_MAX_TOOL_CALLS,
      DEFAULT_MAX_TOOL_CALLS
    );
  }

  private withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
      return promise;
    }

    let timeoutHandle: NodeJS.Timeout | null = null;
    const timeoutPromise = new Promise<T>((_resolve, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(new Error(`Timeout tijdens ${label} na ${timeoutMs}ms.`));
      }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]).finally(() => {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    });
  }

  private async resolveAppKnowledge(emit: EventEmitter): Promise<AppKnowledgeSnapshot> {
    emit("tool_call", {
      toolName: "preload_app_knowledge",
      input: {},
    });

    const appInfo = await this.withTimeout(this.core.getAppInfo(), this.stepTimeoutMs, "get_app_info");
    const appId = appInfo.meta.appInfo.appId;
    const branch = appInfo.meta.appInfo.branch;
    const appKey = `${appId}:${branch}`;
    const now = Date.now();

    const cached = appKnowledgeCache.get(appKey);
    if (cached && now - cached.loadedAtMs <= this.appCacheTtlMs) {
      emit("tool_result", {
        toolName: "preload_app_knowledge",
        summary: "cache-hit",
        textLength: cached.overviewText.length,
      });
      return cached;
    }

    const modules = await this.withTimeout(this.core.listModules(), this.stepTimeoutMs, "list_modules");
    const moduleNames = modules.meta.modules.map((moduleInfo) => moduleInfo.name);
    const overviewText = [
      appInfo.text,
      "",
      modules.text,
      "",
      `Knowledge cache timestamp: ${new Date(now).toISOString()}`,
    ].join("\n");

    const snapshot: AppKnowledgeSnapshot = {
      appKey,
      appName: appInfo.meta.appInfo.name,
      appId,
      branch,
      moduleNames,
      overviewText,
      loadedAtMs: now,
    };
    appKnowledgeCache.set(appKey, snapshot);

    emit("tool_result", {
      toolName: "preload_app_knowledge",
      summary: `loaded ${moduleNames.length} modules`,
      textLength: overviewText.length,
    });

    return snapshot;
  }

  private async resolveModuleSnapshot(
    appKnowledge: AppKnowledgeSnapshot,
    moduleName: string
  ): Promise<ModuleKnowledgeSnapshot> {
    const normalizedModule = moduleName.trim();
    const moduleKey = `${appKnowledge.appKey}:${normalizedModule.toLowerCase()}`;
    const now = Date.now();
    const cached = moduleKnowledgeCache.get(moduleKey);
    if (cached && now - cached.loadedAtMs <= this.moduleCacheTtlMs) {
      return cached;
    }

    const [domainModel, microflows, pages] = await Promise.all([
      this.withTimeout(
        this.core.getDomainModel(normalizedModule, true),
        this.stepTimeoutMs,
        `get_domain_model:${normalizedModule}`
      ),
      this.withTimeout(
        this.core.listMicroflows(normalizedModule),
        this.stepTimeoutMs,
        `list_microflows:${normalizedModule}`
      ),
      this.withTimeout(
        this.core.listPages(normalizedModule),
        this.stepTimeoutMs,
        `list_pages:${normalizedModule}`
      ),
    ]);

    const snapshotText = [
      `# Module snapshot: ${normalizedModule}`,
      "",
      "## Domain model",
      domainModel.text,
      "",
      "## Microflows",
      microflows.text,
      "",
      "## Pages",
      pages.text,
    ].join("\n");

    const snapshot: ModuleKnowledgeSnapshot = {
      appKey: appKnowledge.appKey,
      module: normalizedModule,
      snapshotText,
      loadedAtMs: now,
    };
    moduleKnowledgeCache.set(moduleKey, snapshot);
    return snapshot;
  }

  private async executeTool(
    toolName: string,
    argumentsJson: string,
    appKnowledge: AppKnowledgeSnapshot
  ): Promise<ToolExecutionOutput> {
    const args = parseToolArguments(argumentsJson);

    switch (toolName) {
      case "get_prefetched_overview": {
        return {
          text: truncate(appKnowledge.overviewText, MAX_TOOL_OUTPUT_CHARS),
          sources: [
            `app:${appKnowledge.appId}`,
            ...appKnowledge.moduleNames.slice(0, 20).map((name) => `module:${name}`),
          ],
        };
      }
      case "list_modules": {
        const filter = readOptionalStringArgument(args, "filter");
        const result = await this.core.listModules(filter);
        return {
          text: truncate(result.text, MAX_TOOL_OUTPUT_CHARS),
          sources: result.meta.modules.map((moduleInfo) => `module:${moduleInfo.name}`),
        };
      }
      case "get_module_snapshot": {
        const moduleName = readRequiredStringArgument(args, "module");
        const snapshot = await this.resolveModuleSnapshot(appKnowledge, moduleName);
        return {
          text: truncate(snapshot.snapshotText, MAX_TOOL_OUTPUT_CHARS),
          sources: [`module:${snapshot.module}`],
        };
      }
      case "search_model": {
        const query = readRequiredStringArgument(args, "query");
        const scope = normalizeSearchScope(readOptionalStringArgument(args, "scope"));
        const result = await this.core.searchModel(query, scope);
        return {
          text: truncate(result.text, MAX_TOOL_OUTPUT_CHARS),
          sources: result.meta.results.map((item) => `${item.type}:${item.qualifiedName}`),
        };
      }
      case "get_entity_details": {
        const qualifiedName = readRequiredStringArgument(args, "qualifiedName");
        const result = await this.core.getEntityDetails(qualifiedName);
        return {
          text: truncate(result.text, MAX_TOOL_OUTPUT_CHARS),
          sources: [`entity:${result.meta.entity.qualifiedName}`],
        };
      }
      case "get_entity_access": {
        const qualifiedName = readRequiredStringArgument(args, "qualifiedName");
        const result = await this.core.getEntityAccess(qualifiedName);
        return {
          text: truncate(result.text, MAX_TOOL_OUTPUT_CHARS),
          sources: [`entity:${result.meta.entityAccess.qualifiedName}`],
        };
      }
      case "get_microflow_details": {
        const qualifiedName = readRequiredStringArgument(args, "qualifiedName");
        const result = await this.core.getMicroflowDetails(qualifiedName);
        return {
          text: truncate(result.text, MAX_TOOL_OUTPUT_CHARS),
          sources: [`microflow:${result.meta.microflow.qualifiedName}`],
        };
      }
      case "get_page_structure": {
        const qualifiedName = readRequiredStringArgument(args, "qualifiedName");
        const result = await this.core.getPageStructure(qualifiedName);
        return {
          text: truncate(result.text, MAX_TOOL_OUTPUT_CHARS),
          sources: [`page:${result.meta.page.qualifiedName}`],
        };
      }
      case "get_dependencies": {
        const qualifiedName = readRequiredStringArgument(args, "qualifiedName");
        const result = await this.core.getDependencies(qualifiedName);
        return {
          text: truncate(result.text, MAX_TOOL_OUTPUT_CHARS),
          sources: [`artifact:${result.meta.dependencies.document}`],
        };
      }
      case "get_security_overview": {
        const moduleName = readOptionalStringArgument(args, "module");
        const result = await this.core.getSecurityOverview(moduleName);
        return {
          text: truncate(result.text, MAX_TOOL_OUTPUT_CHARS),
          sources: moduleName ? [`module:${moduleName}`] : [`app:${appKnowledge.appId}`],
        };
      }
      case "get_best_practices": {
        const moduleName = readOptionalStringArgument(args, "module");
        const result = await this.core.getBestPractices(moduleName);
        return {
          text: truncate(result.text, MAX_TOOL_OUTPUT_CHARS),
          sources: moduleName ? [`module:${moduleName}`] : [`app:${appKnowledge.appId}`],
        };
      }
      default:
        throw new Error(`Onbekende tool '${toolName}'.`);
    }
  }

  private fallbackAnswer(
    userMessage: string,
    appKnowledge: AppKnowledgeSnapshot,
    collectedSources: string[]
  ): string {
    return [
      "OPENAI_API_KEY ontbreekt of LLM was niet beschikbaar.",
      "Hierdoor draait chat nu zonder Codex-agent redenering.",
      "",
      `Vraag: ${userMessage}`,
      "",
      "Bekende app context:",
      `- App: ${appKnowledge.appName} (${appKnowledge.appId})`,
      `- Branch: ${appKnowledge.branch}`,
      `- Modules: ${appKnowledge.moduleNames.join(", ")}`,
      "",
      "Bronnen:",
      ...dedupeStrings(collectedSources).map((source) => `- ${source}`),
    ].join("\n");
  }

  private async runConversation(request: ApiChatRequest, emit: EventEmitter): Promise<string> {
    const userMessage = latestUserMessage(request);
    if (!userMessage) {
      throw new Error("Geen gebruikersvraag ontvangen.");
    }

    const appKnowledge = await this.resolveAppKnowledge(emit);
    const preferredModule = inferPreferredModule(request, userMessage);
    if (preferredModule) {
      emit("tool_call", {
        toolName: "preload_module_snapshot",
        input: { module: preferredModule },
      });
      try {
        const snapshot = await this.resolveModuleSnapshot(appKnowledge, preferredModule);
        emit("tool_result", {
          toolName: "preload_module_snapshot",
          summary: `${preferredModule} ready`,
          textLength: snapshot.snapshotText.length,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        emit("tool_result", {
          toolName: "preload_module_snapshot",
          summary: `mislukt: ${message}`,
          textLength: 0,
        });
      }
    }

    const preferredTools = preferredToolNamesForIntent(userMessage);
    const collectedSources = new Set<string>([
      `app:${appKnowledge.appId}`,
    ]);

    if (!this.llmClient.isConfigured()) {
      const answer = this.fallbackAnswer(userMessage, appKnowledge, Array.from(collectedSources));
      emit("final", {
        answer,
        sources: Array.from(collectedSources),
        suggestedPlanPrompt: shouldSuggestPlanPrompt(userMessage) ? userMessage : undefined,
      });
      return answer;
    }

    const messages: LlmConversationMessage[] = [
      {
        role: "system",
        content: buildCodexSystemPrompt(userMessage, preferredModule, preferredTools),
      },
      {
        role: "system",
        content: [
          "Preloaded knowledge:",
          truncate(appKnowledge.overviewText, 6000),
          "",
          "Gebruik tools voor detailvragen; dump niet blind volledige outputs in je antwoord.",
        ].join("\n"),
      },
      ...toConversationHistory(request),
    ];

    let finalAnswer: string | null = null;
    let toolCallsUsed = 0;

    for (let round = 0; round < this.maxToolRounds; round += 1) {
      emit("assistant_token", round === 0 ? "Thinking..." : "Refining answer...");
      const completion = await this.withTimeout(
        this.llmClient.completeWithTools({
          messages,
          tools: TOOL_DEFINITIONS,
          temperature: 0.1,
        }),
        this.stepTimeoutMs,
        `llm_round_${round + 1}`
      );

      if (completion.type === "text") {
        finalAnswer = completion.text.trim();
        break;
      }

      messages.push(completion.assistantMessage);

      for (const toolCall of completion.toolCalls) {
        if (toolCallsUsed >= this.maxToolCalls) {
          const budgetError = "Tool budget bereikt. Rond af met de huidige informatie.";
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: budgetError,
          });
          continue;
        }

        toolCallsUsed += 1;
        emit("tool_call", {
          toolName: toolCall.name,
          input: toolCall.argumentsJson,
        });

        try {
          const output = await this.withTimeout(
            this.executeTool(toolCall.name, toolCall.argumentsJson, appKnowledge),
            this.stepTimeoutMs,
            `tool:${toolCall.name}`
          );
          output.sources.forEach((source) => collectedSources.add(source));

          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: output.text,
          });

          emit("tool_result", {
            toolName: toolCall.name,
            summary: `${toolCall.name} voltooid`,
            textLength: output.text.length,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: `Tool error: ${message}`,
          });
          emit("tool_result", {
            toolName: toolCall.name,
            summary: `mislukt: ${message}`,
            textLength: 0,
          });
        }
      }
    }

    if (!finalAnswer) {
      finalAnswer = [
        "Ik kon geen definitief antwoord genereren binnen de ingestelde tool-rondes.",
        "Probeer je vraag specifieker te maken (module/entity/microflow) of stel een vervolgvraag.",
      ].join("\n");
    }

    const sources = dedupeStrings(Array.from(collectedSources));
    emit("final", {
      answer: finalAnswer,
      sources,
      suggestedPlanPrompt: shouldSuggestPlanPrompt(userMessage) ? userMessage : undefined,
    });
    return finalAnswer;
  }

  async run(request: ApiChatRequest, emit: EventEmitter): Promise<string> {
    return this.withTimeout(
      this.runConversation(request, emit),
      this.totalTimeoutMs,
      "chat workflow"
    );
  }
}
