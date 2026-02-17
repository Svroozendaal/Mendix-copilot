import { z } from "zod";

function stringFromQuery(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
    return value[0];
  }
  return undefined;
}

export const connectBodySchema = z
  .object({
    appId: z.string().trim().min(1).optional(),
    branch: z.string().trim().min(1).optional(),
  })
  .strict();

export const domainModelQuerySchema = z.object({
  detailed: z
    .preprocess((value) => {
      const raw = stringFromQuery(value);
      if (raw === undefined) {
        return undefined;
      }
      const normalized = raw.trim().toLowerCase();
      if (["1", "true", "yes"].includes(normalized)) {
        return true;
      }
      if (["0", "false", "no"].includes(normalized)) {
        return false;
      }
      return value;
    }, z.boolean().optional())
    .optional(),
});

export const searchQuerySchema = z.object({
  q: z.preprocess(
    (value) => stringFromQuery(value),
    z.string().trim().min(1, "q is verplicht")
  ),
  scope: z
    .preprocess((value) => stringFromQuery(value), z.enum(["all", "entities", "microflows", "pages", "enumerations"]).optional())
    .optional(),
});

export const moduleQuerySchema = z.object({
  module: z.preprocess(
    (value) => stringFromQuery(value),
    z.string().trim().min(1, "module is verplicht")
  ),
});

export const moduleFilterQuerySchema = z.object({
  filter: z
    .preprocess((value) => stringFromQuery(value), z.string().trim().min(1).optional())
    .optional(),
});

export const optionalModuleQuerySchema = z.object({
  module: z
    .preprocess((value) => stringFromQuery(value), z.string().trim().min(1).optional())
    .optional(),
});

export const qualifiedNameParamSchema = z.object({
  qualifiedName: z.string().trim().min(1, "qualifiedName is verplicht"),
});

export const moduleNameParamSchema = z.object({
  name: z.string().trim().min(1, "name is verplicht"),
});

export const chatBodySchema = z
  .object({
    message: z.string().trim().min(1).optional(),
    messages: z
      .array(
        z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string().trim().min(1, "message content is verplicht"),
        })
      )
      .min(1)
      .optional(),
    mode: z.enum(["assistant", "tooling"]).optional(),
    context: z
      .object({
        selectedType: z.enum(["module", "entity", "microflow", "page"]).optional(),
        module: z.string().trim().min(1).optional(),
        qualifiedName: z.string().trim().min(1).optional(),
      })
      .optional(),
  })
  .strict()
  .superRefine((value, context) => {
    const hasSingleMessage = Boolean(value.message?.trim());
    const hasConversationMessages = Array.isArray(value.messages) && value.messages.length > 0;
    if (!hasSingleMessage && !hasConversationMessages) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Geef message of messages op.",
        path: ["message"],
      });
    }
  });

export const planBodySchema = z
  .object({
    message: z.string().trim().min(1, "message is verplicht"),
    context: z
      .object({
        selectedType: z.enum(["module", "entity", "microflow", "page"]).optional(),
        module: z.string().trim().min(1).optional(),
        qualifiedName: z.string().trim().min(1).optional(),
      })
      .optional(),
  })
  .strict();

export const planValidateBodySchema = z
  .object({
    planId: z.string().uuid("planId moet een geldige UUID zijn"),
  })
  .strict();

export const planExecuteBodySchema = z
  .object({
    planId: z.string().uuid("planId moet een geldige UUID zijn"),
    approvalToken: z.string().trim().min(1, "approvalToken is verplicht"),
    confirmText: z.string().trim().min(1).optional(),
  })
  .strict();
