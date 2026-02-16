import express, { type Express, type NextFunction, type Request, type Response } from "express";
import { type ZodTypeAny, z } from "zod";
import { executePlan, requiredConfirmationText } from "../../change-executor/executor.js";
import { generatePreview } from "../../change-executor/previewGenerator.js";
import { validatePlan, type ValidationAppContext } from "../../change-executor/validator.js";
import { planFromNaturalLanguage } from "../../change-planner/planner/planFromNaturalLanguage.js";
import type { ChangePlan } from "../../change-planner/dsl/changePlan.schema.js";
import { ChatRunner } from "./chat-runner.js";
import { ApiError, toApiError, toApiErrorResponse } from "./errors.js";
import {
  buildHealthResponse,
  buildStatusResponse,
  handleConnect,
  handleDisconnect,
  toTextResponse,
} from "./handlers.js";
import {
  chatBodySchema,
  connectBodySchema,
  domainModelQuerySchema,
  moduleFilterQuerySchema,
  moduleNameParamSchema,
  moduleQuerySchema,
  optionalModuleQuerySchema,
  planBodySchema,
  planExecuteBodySchema,
  planValidateBodySchema,
  qualifiedNameParamSchema,
  searchQuerySchema,
} from "./schemas.js";
import { CopilotSessionManager } from "./session-manager.js";
import type { SseEventName } from "./types.js";

export interface CreateCopilotApiAppOptions {
  version: string;
  session?: CopilotSessionManager;
}

export interface CopilotApiApp {
  app: Express;
  session: CopilotSessionManager;
}

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

function wrap(handler: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    void handler(req, res, next).catch(next);
  };
}

function parseWithSchema<TSchema extends ZodTypeAny>(
  schema: TSchema,
  value: unknown
): z.infer<TSchema> {
  const parsed = schema.safeParse(value);
  if (parsed.success) {
    return parsed.data;
  }

  const details = parsed.error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "input";
      return `${path}: ${issue.message}`;
    })
    .join("; ");
  throw new ApiError(400, `Ongeldige input (${details}).`);
}

function decodedPathValue(value: string | string[] | undefined): string {
  const rawValue = Array.isArray(value) ? value[0] : value;
  if (!rawValue) {
    return "";
  }

  try {
    return decodeURIComponent(rawValue);
  } catch {
    return rawValue;
  }
}

function writeSseEvent(
  response: Response,
  event: SseEventName,
  payload: unknown
): void {
  response.write(`event: ${event}\n`);
  response.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function parsePositiveIntegerEnv(
  value: string | undefined,
  fallback: number
): number {
  if (!value?.trim()) {
    return fallback;
  }

  const parsed = Number.parseInt(value.trim(), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function moduleFromQualifiedName(qualifiedName: string): string | undefined {
  const separatorIndex = qualifiedName.indexOf(".");
  if (separatorIndex <= 0) {
    return undefined;
  }
  return qualifiedName.slice(0, separatorIndex);
}

function approvalTokenIsValid(token: string): boolean {
  const expectedToken = process.env.COPILOT_APPROVAL_TOKEN?.trim();
  if (!expectedToken) {
    return token.trim().length > 0;
  }
  return expectedToken === token.trim();
}

async function buildValidationContext(
  core: ReturnType<CopilotSessionManager["getCoreOrThrow"]>,
  plan: ChangePlan
): Promise<ValidationAppContext> {
  const modules = (await core.listModules()).meta.modules;
  const entityMap = new Map<string, { qualifiedName: string; module: string; attributes: string[] }>();
  const microflowSet = new Set<string>();
  const moduleNamesToScanForMicroflows = new Set<string>();

  for (const command of plan.commands) {
    if (command.type === "add_attribute" || command.type === "generate_crud") {
      const entityName = command.entity;
      if (!entityMap.has(entityName.toLowerCase())) {
        try {
          const entity = (await core.getEntityDetails(entityName)).meta.entity;
          entityMap.set(entityName.toLowerCase(), {
            qualifiedName: entity.qualifiedName,
            module: entity.moduleName,
            attributes: entity.attributes.map((attribute) => attribute.name),
          });
        } catch {
          // validator zal entity-not-found afhandelen.
        }
      }
    }

    if (command.type === "create_microflow") {
      moduleNamesToScanForMicroflows.add(command.module);
    }
  }

  for (const moduleName of moduleNamesToScanForMicroflows) {
    try {
      const microflows = (await core.listMicroflows(moduleName)).meta.microflows;
      microflows.forEach((microflow) => microflowSet.add(microflow.qualifiedName));
    } catch {
      // validator zal module errors afhandelen.
    }
  }

  return {
    modules,
    entities: Array.from(entityMap.values()),
    microflows: Array.from(microflowSet),
    systemModules: ["System", "Administration"],
  };
}

function affectedModulesFromArtifacts(artifacts: string[]): string[] {
  const moduleSet = new Set<string>();
  for (const artifact of artifacts) {
    const moduleName = moduleFromQualifiedName(artifact);
    if (moduleName) {
      moduleSet.add(moduleName);
    }
  }
  return Array.from(moduleSet).sort((left, right) => left.localeCompare(right));
}

function configureCors(app: Express): void {
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");

    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }

    next();
  });
}

export function createCopilotApiApp(options: CreateCopilotApiAppOptions): CopilotApiApp {
  const app = express();
  const session = options.session ?? new CopilotSessionManager();
  const version = options.version;
  const stepTimeoutMs = parsePositiveIntegerEnv(
    process.env.COPILOT_CHAT_STEP_TIMEOUT_MS,
    120000
  );
  const totalTimeoutMs = parsePositiveIntegerEnv(
    process.env.COPILOT_CHAT_TOTAL_TIMEOUT_MS,
    240000
  );
  const planStore = new Map<string, ChangePlan>();

  app.disable("x-powered-by");
  configureCors(app);
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => {
    res.json(buildHealthResponse(version));
  });

  app.get("/api/status", (_req, res) => {
    res.json(buildStatusResponse(session));
  });

  app.post(
    "/api/connect",
    wrap(async (req, res) => {
      const body = parseWithSchema(connectBodySchema, req.body ?? {});
      const result = await handleConnect(session, body);
      res.json(result);
    })
  );

  app.post(
    "/api/disconnect",
    wrap(async (_req, res) => {
      const result = await handleDisconnect(session);
      res.json(result);
    })
  );

  app.get(
    "/api/app-info",
    wrap(async (_req, res) => {
      const result = await session.getCoreOrThrow().getAppInfo();
      res.json(toTextResponse(result));
    })
  );

  app.get(
    "/api/modules",
    wrap(async (_req, res) => {
      const query = parseWithSchema(moduleFilterQuerySchema, _req.query);
      const result = await session.getCoreOrThrow().listModules(query.filter);
      res.json(toTextResponse(result));
    })
  );

  app.get(
    "/api/module/:name/domain-model",
    wrap(async (req, res) => {
      const params = parseWithSchema(moduleNameParamSchema, {
        name: decodedPathValue(req.params.name),
      });
      const query = parseWithSchema(domainModelQuerySchema, req.query);
      const result = await session
        .getCoreOrThrow()
        .getDomainModel(params.name, query.detailed ?? false);
      res.json(toTextResponse(result));
    })
  );

  app.get(
    "/api/search",
    wrap(async (req, res) => {
      const query = parseWithSchema(searchQuerySchema, req.query);
      const result = await session
        .getCoreOrThrow()
        .searchModel(query.q, query.scope ?? "all");
      res.json(toTextResponse(result));
    })
  );

  app.get(
    "/api/entity/:qualifiedName/associations",
    wrap(async (req, res) => {
      const params = parseWithSchema(qualifiedNameParamSchema, {
        qualifiedName: decodedPathValue(req.params.qualifiedName),
      });
      const result = await session
        .getCoreOrThrow()
        .getAssociations(params.qualifiedName);
      res.json(toTextResponse(result));
    })
  );

  app.get(
    "/api/entity/:qualifiedName",
    wrap(async (req, res) => {
      const params = parseWithSchema(qualifiedNameParamSchema, {
        qualifiedName: decodedPathValue(req.params.qualifiedName),
      });
      const result = await session
        .getCoreOrThrow()
        .getEntityDetails(params.qualifiedName);
      res.json(toTextResponse(result));
    })
  );

  app.get(
    "/api/microflows",
    wrap(async (req, res) => {
      const query = parseWithSchema(moduleQuerySchema, req.query);
      const result = await session.getCoreOrThrow().listMicroflows(query.module);
      res.json(toTextResponse(result));
    })
  );

  app.get(
    "/api/microflow/:qualifiedName",
    wrap(async (req, res) => {
      const params = parseWithSchema(qualifiedNameParamSchema, {
        qualifiedName: decodedPathValue(req.params.qualifiedName),
      });
      const result = await session
        .getCoreOrThrow()
        .getMicroflowDetails(params.qualifiedName);
      res.json(toTextResponse(result));
    })
  );

  app.get(
    "/api/pages",
    wrap(async (req, res) => {
      const query = parseWithSchema(moduleQuerySchema, req.query);
      const result = await session.getCoreOrThrow().listPages(query.module);
      res.json(toTextResponse(result));
    })
  );

  app.get(
    "/api/page/:qualifiedName",
    wrap(async (req, res) => {
      const params = parseWithSchema(qualifiedNameParamSchema, {
        qualifiedName: decodedPathValue(req.params.qualifiedName),
      });
      const result = await session
        .getCoreOrThrow()
        .getPageStructure(params.qualifiedName);
      res.json(toTextResponse(result));
    })
  );

  app.get(
    "/api/security",
    wrap(async (req, res) => {
      const query = parseWithSchema(optionalModuleQuerySchema, req.query);
      const result = await session.getCoreOrThrow().getSecurityOverview(query.module);
      res.json(toTextResponse(result));
    })
  );

  app.get(
    "/api/entity-access/:qualifiedName",
    wrap(async (req, res) => {
      const params = parseWithSchema(qualifiedNameParamSchema, {
        qualifiedName: decodedPathValue(req.params.qualifiedName),
      });
      const result = await session
        .getCoreOrThrow()
        .getEntityAccess(params.qualifiedName);
      res.json(toTextResponse(result));
    })
  );

  app.get(
    "/api/best-practices",
    wrap(async (req, res) => {
      const query = parseWithSchema(optionalModuleQuerySchema, req.query);
      const result = await session.getCoreOrThrow().getBestPractices(query.module);
      res.json(toTextResponse(result));
    })
  );

  app.get(
    "/api/dependencies/:qualifiedName",
    wrap(async (req, res) => {
      const params = parseWithSchema(qualifiedNameParamSchema, {
        qualifiedName: decodedPathValue(req.params.qualifiedName),
      });
      const result = await session
        .getCoreOrThrow()
        .getDependencies(params.qualifiedName);
      res.json(toTextResponse(result));
    })
  );

  app.post(
    "/api/plan",
    wrap(async (req, res) => {
      const body = parseWithSchema(planBodySchema, req.body ?? {});
      const planned = await planFromNaturalLanguage(session.getCoreOrThrow(), {
        message: body.message,
        context: body.context,
      });
      planStore.set(planned.changePlan.planId, planned.changePlan);

      res.json({
        ok: true,
        changePlan: planned.changePlan,
        preview: planned.preview,
      });
    })
  );

  app.post(
    "/api/plan/validate",
    wrap(async (req, res) => {
      const body = parseWithSchema(planValidateBodySchema, req.body ?? {});
      const plan = planStore.get(body.planId);
      if (!plan) {
        throw new ApiError(404, `Plan '${body.planId}' niet gevonden.`);
      }

      const validationContext = await buildValidationContext(session.getCoreOrThrow(), plan);
      const validation = validatePlan(plan, validationContext);
      const preview = generatePreview(validation.validatedPlan);

      res.json({
        ok: validation.errors.length === 0,
        validatedPlan: validation.validatedPlan,
        warnings: validation.warnings,
        errors: validation.errors,
        preview,
      });
    })
  );

  app.post(
    "/api/plan/execute",
    wrap(async (req, res) => {
      const body = parseWithSchema(planExecuteBodySchema, req.body ?? {});
      if (!approvalTokenIsValid(body.approvalToken)) {
        throw new ApiError(403, "approvalToken ongeldig.");
      }

      const plan = planStore.get(body.planId);
      if (!plan) {
        throw new ApiError(404, `Plan '${body.planId}' niet gevonden.`);
      }

      const validationContext = await buildValidationContext(session.getCoreOrThrow(), plan);
      const validation = validatePlan(plan, validationContext);
      if (validation.errors.length > 0) {
        res.status(400).json({
          ok: false,
          warnings: validation.warnings,
          errors: validation.errors,
          preview: generatePreview(validation.validatedPlan),
        });
        return;
      }

      if (validation.validatedPlan.risk.destructive) {
        const expectedConfirmText = requiredConfirmationText(validation.validatedPlan);
        if ((body.confirmText ?? "").trim() !== expectedConfirmText) {
          throw new ApiError(
            400,
            `Destructive plan vereist confirmText '${expectedConfirmText}'.`
          );
        }
      }

      res.status(200);
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();

      let isClosed = false;
      req.on("close", () => {
        isClosed = true;
      });

      const emit = (event: SseEventName, data: unknown): void => {
        if (isClosed) {
          return;
        }
        writeSseEvent(res, event, data);
      };

      try {
        const execution = await executePlan(validation.validatedPlan, {
          onEvent: (event) => {
            emit(event.type, event);
          },
        });
        const affectedModules = affectedModulesFromArtifacts(execution.affectedArtifacts);
        const postCheck = await Promise.all(
          affectedModules.map(async (moduleName) => {
            const bestPractices = await session.getCoreOrThrow().getBestPractices(moduleName);
            return {
              module: moduleName,
              text: bestPractices.text,
              findingCount: bestPractices.meta.findings.length,
            };
          })
        );

        emit("postcheck_results", {
          affectedModules,
          postCheck,
        });
        emit("final", {
          ok: true,
          execution,
          warnings: validation.warnings,
          affectedModules,
          postCheck,
        });
        planStore.delete(body.planId);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        emit("error", { message });
      } finally {
        if (!isClosed) {
          res.end();
        }
      }
    })
  );

  app.post(
    "/api/chat",
    wrap(async (req, res) => {
      const body = parseWithSchema(chatBodySchema, req.body ?? {});
      const runner = new ChatRunner(session.getCoreOrThrow(), {
        stepTimeoutMs,
        totalTimeoutMs,
      });

      res.status(200);
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();

      let isClosed = false;
      req.on("close", () => {
        isClosed = true;
      });

      const emit = (event: SseEventName, data: unknown): void => {
        if (isClosed) {
          return;
        }
        writeSseEvent(res, event, data);
      };

      try {
        await runner.run(body, emit);
      } catch (error) {
        const apiError = toApiError(error);
        emit("error", { message: apiError.message });
      } finally {
        if (!isClosed) {
          res.end();
        }
      }
    })
  );

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const apiError = toApiError(error);
    res.status(apiError.statusCode).json(toApiErrorResponse(apiError));
  });

  return { app, session };
}
