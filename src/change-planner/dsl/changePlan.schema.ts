import { z } from "zod";
import { commandSchema, type ChangeCommand } from "./commandTypes.js";

export const changeTargetSchema = z
  .object({
    module: z.string().trim().min(1).max(120).optional(),
    entity: z.string().trim().min(1).max(240).optional(),
    microflow: z.string().trim().min(1).max(240).optional(),
  })
  .strict();

export const changeRiskSchema = z
  .object({
    destructive: z.boolean(),
    impactLevel: z.enum(["low", "medium", "high"]),
    notes: z.array(z.string().trim().min(1).max(240)).max(20),
  })
  .strict();

export const changePlanSchema = z
  .object({
    planId: z.string().uuid(),
    createdAt: z.string().datetime(),
    intent: z.string().trim().min(1).max(80),
    target: changeTargetSchema,
    preconditions: z.array(z.string().trim().min(1).max(240)).max(20),
    commands: z.array(commandSchema).min(1).max(25),
    risk: changeRiskSchema,
  })
  .strict()
  .superRefine((plan, context) => {
    const hasDestructiveCommand = plan.commands.some((command) => {
      if (command.type === "delete_microflow" || command.type === "rename_element") {
        return true;
      }
      return false;
    });

    if (hasDestructiveCommand && !plan.risk.destructive) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["risk", "destructive"],
        message: "risk.destructive moet true zijn bij delete/rename commands.",
      });
    }
  });

export type ChangePlan = z.infer<typeof changePlanSchema>;
export type ChangeRisk = z.infer<typeof changeRiskSchema>;
export type ChangeTarget = z.infer<typeof changeTargetSchema>;
export type { ChangeCommand };
