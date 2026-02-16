import { z } from "zod";

const identifierSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[A-Za-z_][A-Za-z0-9_]*$/, "Gebruik alleen letters, cijfers en underscores.");

const qualifiedNameSchema = z
  .string()
  .trim()
  .min(3)
  .max(240)
  .regex(
    /^[A-Za-z_][A-Za-z0-9_]*\.[A-Za-z_][A-Za-z0-9_]*$/,
    "Gebruik format Module.Name."
  );

const attributeDataTypeSchema = z.enum([
  "String",
  "Integer",
  "Long",
  "Decimal",
  "Boolean",
  "DateTime",
  "AutoNumber",
  "Enumeration",
  "Reference",
  "Unknown",
]);

export const createEntityCommandSchema = z.object({
  type: z.literal("create_entity"),
  module: identifierSchema,
  name: identifierSchema,
  description: z.string().trim().max(400).optional(),
});

export const addAttributeCommandSchema = z.object({
  type: z.literal("add_attribute"),
  entity: qualifiedNameSchema,
  name: identifierSchema,
  dataType: attributeDataTypeSchema,
  required: z.boolean().optional(),
  defaultValue: z.string().trim().max(200).optional(),
});

export const createMicroflowCommandSchema = z.object({
  type: z.literal("create_microflow"),
  module: identifierSchema,
  name: identifierSchema,
  returnType: z.string().trim().min(1).max(120).optional(),
});

export const addMicroflowStepCommandSchema = z.object({
  type: z.literal("add_microflow_step"),
  microflow: qualifiedNameSchema,
  stepType: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(300),
});

export const generateCrudCommandSchema = z.object({
  type: z.literal("generate_crud"),
  entity: qualifiedNameSchema,
  module: identifierSchema.optional(),
  includePages: z.boolean().optional(),
});

export const deleteMicroflowCommandSchema = z.object({
  type: z.literal("delete_microflow"),
  microflow: qualifiedNameSchema,
  destructive: z.literal(true),
});

export const renameElementCommandSchema = z.object({
  type: z.literal("rename_element"),
  elementKind: z.enum(["module", "entity", "attribute", "microflow", "page"]),
  from: z.string().trim().min(1).max(240),
  to: z.string().trim().min(1).max(240),
  destructive: z.literal(true),
});

export const commandSchema = z.discriminatedUnion("type", [
  createEntityCommandSchema,
  addAttributeCommandSchema,
  createMicroflowCommandSchema,
  addMicroflowStepCommandSchema,
  generateCrudCommandSchema,
  deleteMicroflowCommandSchema,
  renameElementCommandSchema,
]);

export type ChangeCommand = z.infer<typeof commandSchema>;
export type CreateEntityCommand = z.infer<typeof createEntityCommandSchema>;
export type AddAttributeCommand = z.infer<typeof addAttributeCommandSchema>;
export type CreateMicroflowCommand = z.infer<typeof createMicroflowCommandSchema>;
export type AddMicroflowStepCommand = z.infer<typeof addMicroflowStepCommandSchema>;
export type GenerateCrudCommand = z.infer<typeof generateCrudCommandSchema>;
export type DeleteMicroflowCommand = z.infer<typeof deleteMicroflowCommandSchema>;
export type RenameElementCommand = z.infer<typeof renameElementCommandSchema>;
