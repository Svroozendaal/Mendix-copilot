import { describe, expect, it } from "vitest";
import {
  WB_CONTEXT_MESSAGE_TYPE,
  WB_CONTEXT_REQUEST_MESSAGE_TYPE,
  createEmptyContextPayload,
  isContextMessage,
  isContextRequestMessage,
  normalizeWbContextPayload,
} from "../../../shared/studio-context";

describe("shared studio context contract", () => {
  it("creates an empty payload", () => {
    expect(createEmptyContextPayload()).toEqual({ selectedType: null });
  });

  it("normalizes valid payload values", () => {
    const normalized = normalizeWbContextPayload({
      selectedType: "microflow",
      qualifiedName: "Sales.ACT_CreateOrder",
      module: "Sales",
    });

    expect(normalized).toEqual({
      selectedType: "microflow",
      qualifiedName: "Sales.ACT_CreateOrder",
      module: "Sales",
    });
  });

  it("derives module from qualified name when module is missing", () => {
    const normalized = normalizeWbContextPayload({
      selectedType: "entity",
      qualifiedName: "Inventory.Product",
    });

    expect(normalized.module).toBe("Inventory");
  });

  it("keeps module when selectedType is module and qualifiedName has no dot", () => {
    const normalized = normalizeWbContextPayload({
      selectedType: "module",
      qualifiedName: "Sales",
    });

    expect(normalized).toEqual({
      selectedType: "module",
      qualifiedName: "Sales",
      module: "Sales",
    });
  });

  it("falls back to selectedType null for invalid types", () => {
    const normalized = normalizeWbContextPayload({
      selectedType: "invalid",
      module: "Sales",
    });

    expect(normalized).toEqual({
      selectedType: null,
      module: "Sales",
    });
  });

  it("validates context and context request message shapes", () => {
    expect(
      isContextMessage({
        type: WB_CONTEXT_MESSAGE_TYPE,
        payload: { selectedType: null },
      })
    ).toBe(true);

    expect(
      isContextRequestMessage({
        type: WB_CONTEXT_REQUEST_MESSAGE_TYPE,
      })
    ).toBe(true);

    expect(isContextMessage({ type: "OTHER", payload: {} })).toBe(false);
    expect(isContextRequestMessage({ type: "OTHER" })).toBe(false);
  });
});
