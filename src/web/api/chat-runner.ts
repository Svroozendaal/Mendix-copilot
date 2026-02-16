import type { CopilotCore, TextResult } from "../../core/copilot-core.js";
import type { ApiChatRequest, SseEventName } from "./types.js";

interface WorkflowStep {
  toolName: string;
  input: Record<string, unknown>;
  sectionTitle: string;
  run: () => Promise<TextResult<unknown>>;
}

type Intent =
  | "review_module"
  | "security_audit"
  | "explain_microflow"
  | "inspect_entity"
  | "dependencies"
  | "search";

type EventEmitter = (event: SseEventName, data: unknown) => void;

interface ChatRunnerOptions {
  stepTimeoutMs?: number;
  totalTimeoutMs?: number;
}

const DEFAULT_STEP_TIMEOUT_MS = 120_000;
const DEFAULT_TOTAL_TIMEOUT_MS = 240_000;

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function extractQualifiedName(text: string): string | undefined {
  const match = text.match(/\b([A-Za-z_][A-Za-z0-9_]*)\.([A-Za-z_][A-Za-z0-9_]*)\b/);
  return match ? `${match[1]}.${match[2]}` : undefined;
}

function extractModuleName(text: string): string | undefined {
  const match = text.match(/\bmodule\s+([A-Za-z_][A-Za-z0-9_]*)\b/i);
  return match?.[1];
}

function inferIntent(message: string): Intent {
  const text = normalize(message);

  if (text.includes("review") && text.includes("module")) {
    return "review_module";
  }
  if (text.includes("security") || text.includes("audit") || text.includes("beveilig")) {
    return "security_audit";
  }
  if (text.includes("dependency") || text.includes("afhankelijk")) {
    return "dependencies";
  }
  if (text.includes("microflow") || text.includes("nanoflow") || text.includes("uitleg")) {
    return "explain_microflow";
  }
  if (text.includes("entity") || text.includes("entiteit")) {
    return "inspect_entity";
  }

  return "search";
}

function intentLabel(intent: Intent): string {
  switch (intent) {
    case "review_module":
      return "Module review";
    case "security_audit":
      return "Security audit";
    case "explain_microflow":
      return "Microflow uitleg";
    case "inspect_entity":
      return "Entity inspectie";
    case "dependencies":
      return "Dependency analyse";
    case "search":
      return "Modelverkenning";
    default:
      return "Analyse";
  }
}

export class ChatRunner {
  private readonly core: CopilotCore;
  private readonly stepTimeoutMs: number;
  private readonly totalTimeoutMs: number;

  constructor(core: CopilotCore, options: ChatRunnerOptions = {}) {
    this.core = core;
    this.stepTimeoutMs = options.stepTimeoutMs ?? DEFAULT_STEP_TIMEOUT_MS;
    this.totalTimeoutMs = options.totalTimeoutMs ?? DEFAULT_TOTAL_TIMEOUT_MS;
  }

  private buildReviewWorkflow(request: ApiChatRequest): WorkflowStep[] {
    const moduleName = request.context?.module || extractModuleName(request.message);
    if (!moduleName) {
      return [
        {
          toolName: "list_modules",
          input: {},
          sectionTitle: "Beschikbare modules",
          run: async () => this.core.listModules(),
        },
      ];
    }

    return [
      {
        toolName: "get_domain_model",
        input: { module: moduleName, detailed: true },
        sectionTitle: `Domain model (${moduleName})`,
        run: async () => this.core.getDomainModel(moduleName, true),
      },
      {
        toolName: "list_microflows",
        input: { module: moduleName },
        sectionTitle: `Microflows (${moduleName})`,
        run: async () => this.core.listMicroflows(moduleName),
      },
      {
        toolName: "get_security_overview",
        input: { module: moduleName },
        sectionTitle: `Security (${moduleName})`,
        run: async () => this.core.getSecurityOverview(moduleName),
      },
      {
        toolName: "check_best_practices",
        input: { module: moduleName },
        sectionTitle: `Best practices (${moduleName})`,
        run: async () => this.core.getBestPractices(moduleName),
      },
    ];
  }

  private buildSecurityWorkflow(request: ApiChatRequest): WorkflowStep[] {
    const moduleName = request.context?.module || extractModuleName(request.message);
    if (!moduleName) {
      return [
        {
          toolName: "get_security_overview",
          input: {},
          sectionTitle: "Security overview",
          run: async () => this.core.getSecurityOverview(),
        },
      ];
    }

    return [
      {
        toolName: "get_security_overview",
        input: { module: moduleName },
        sectionTitle: `Security overview (${moduleName})`,
        run: async () => this.core.getSecurityOverview(moduleName),
      },
      {
        toolName: "check_best_practices",
        input: { module: moduleName },
        sectionTitle: `Best practices (${moduleName})`,
        run: async () => this.core.getBestPractices(moduleName),
      },
    ];
  }

  private buildMicroflowWorkflow(request: ApiChatRequest): WorkflowStep[] {
    const qualifiedName = request.context?.qualifiedName || extractQualifiedName(request.message);
    if (!qualifiedName) {
      return [
        {
          toolName: "search_model",
          input: { query: request.message, scope: "microflows" },
          sectionTitle: "Microflow zoekresultaten",
          run: async () => this.core.searchModel(request.message, "microflows"),
        },
      ];
    }

    return [
      {
        toolName: "get_microflow_details",
        input: { qualifiedName },
        sectionTitle: `Microflow details (${qualifiedName})`,
        run: async () => this.core.getMicroflowDetails(qualifiedName),
      },
    ];
  }

  private buildEntityWorkflow(request: ApiChatRequest): WorkflowStep[] {
    const qualifiedName = request.context?.qualifiedName || extractQualifiedName(request.message);
    if (!qualifiedName) {
      return [
        {
          toolName: "search_model",
          input: { query: request.message, scope: "entities" },
          sectionTitle: "Entity zoekresultaten",
          run: async () => this.core.searchModel(request.message, "entities"),
        },
      ];
    }

    return [
      {
        toolName: "get_entity_details",
        input: { qualifiedName },
        sectionTitle: `Entity details (${qualifiedName})`,
        run: async () => this.core.getEntityDetails(qualifiedName),
      },
      {
        toolName: "get_associations",
        input: { qualifiedName },
        sectionTitle: `Associaties (${qualifiedName})`,
        run: async () => this.core.getAssociations(qualifiedName),
      },
    ];
  }

  private buildDependenciesWorkflow(request: ApiChatRequest): WorkflowStep[] {
    const qualifiedName = request.context?.qualifiedName || extractQualifiedName(request.message);
    if (!qualifiedName) {
      return [
        {
          toolName: "search_model",
          input: { query: request.message, scope: "all" },
          sectionTitle: "Zoekresultaten",
          run: async () => this.core.searchModel(request.message, "all"),
        },
      ];
    }

    return [
      {
        toolName: "get_dependencies",
        input: { qualifiedName },
        sectionTitle: `Dependencies (${qualifiedName})`,
        run: async () => this.core.getDependencies(qualifiedName),
      },
    ];
  }

  private buildSearchWorkflow(request: ApiChatRequest): WorkflowStep[] {
    return [
      {
        toolName: "get_app_info",
        input: {},
        sectionTitle: "App info",
        run: async () => this.core.getAppInfo(),
      },
      {
        toolName: "search_model",
        input: { query: request.message, scope: "all" },
        sectionTitle: "Zoekresultaten",
        run: async () => this.core.searchModel(request.message, "all"),
      },
    ];
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

  private buildWorkflow(request: ApiChatRequest): { intent: Intent; steps: WorkflowStep[] } {
    const intent = inferIntent(request.message);

    switch (intent) {
      case "review_module":
        return { intent, steps: this.buildReviewWorkflow(request) };
      case "security_audit":
        return { intent, steps: this.buildSecurityWorkflow(request) };
      case "explain_microflow":
        return { intent, steps: this.buildMicroflowWorkflow(request) };
      case "inspect_entity":
        return { intent, steps: this.buildEntityWorkflow(request) };
      case "dependencies":
        return { intent, steps: this.buildDependenciesWorkflow(request) };
      case "search":
      default:
        return { intent: "search", steps: this.buildSearchWorkflow(request) };
    }
  }

  private async runWorkflow(request: ApiChatRequest, emit: EventEmitter): Promise<string> {
    const workflow = this.buildWorkflow(request);
    const sections: string[] = [];

    for (const step of workflow.steps) {
      emit("tool_call", {
        toolName: step.toolName,
        input: step.input,
      });

      emit("assistant_token", `Running ${step.toolName}...`);

      let result: TextResult<unknown>;
      try {
        result = await this.withTimeout(step.run(), this.stepTimeoutMs, step.toolName);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        emit("tool_result", {
          toolName: step.toolName,
          summary: `mislukt: ${message}`,
          textLength: 0,
        });
        throw error;
      }

      emit("tool_result", {
        toolName: step.toolName,
        summary: `${step.toolName} voltooid`,
        textLength: result.text.length,
      });

      sections.push(`## ${step.sectionTitle}\n${result.text}`);
    }

    const answerLines = [
      `Intent: ${intentLabel(workflow.intent)}`,
      "",
      ...sections,
      "",
      "Samenvatting:",
      `- Workflow uitgevoerd met ${workflow.steps.length} tool-calls.`,
      "- Bekijk de tool trace voor exacte volgorde en inputs.",
    ];

    if (request.mode === "tooling") {
      answerLines.push("- Mode tooling actief: focus op traceerbare resultaten.");
    }

    const answer = answerLines.join("\n");
    emit("final", { answer });
    return answer;
  }

  async run(request: ApiChatRequest, emit: EventEmitter): Promise<string> {
    return this.withTimeout(
      this.runWorkflow(request, emit),
      this.totalTimeoutMs,
      "chat workflow"
    );
  }
}
