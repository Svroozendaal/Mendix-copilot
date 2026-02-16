import { describe, expect, it } from "vitest";
import {
  chatBodySchema,
  connectBodySchema,
  domainModelQuerySchema,
  moduleQuerySchema,
  qualifiedNameParamSchema,
  searchQuerySchema,
} from "../../../src/web/api/schemas.js";

describe("web api schemas", () => {
  it("parses connect body with optional appId and branch", () => {
    const parsed = connectBodySchema.parse({
      appId: "app-123",
      branch: "main",
    });

    expect(parsed).toEqual({
      appId: "app-123",
      branch: "main",
    });
  });

  it("rejects connect body with unknown properties", () => {
    expect(() =>
      connectBodySchema.parse({
        appId: "app-123",
        token: "should-not-be-here",
      })
    ).toThrow();
  });

  it("parses domain model query boolean values from query string", () => {
    expect(domainModelQuerySchema.parse({ detailed: "true" })).toEqual({ detailed: true });
    expect(domainModelQuerySchema.parse({ detailed: "0" })).toEqual({ detailed: false });
  });

  it("requires search query parameter q", () => {
    expect(() => searchQuerySchema.parse({ q: "" })).toThrow();
    expect(searchQuerySchema.parse({ q: "order", scope: "microflows" })).toEqual({
      q: "order",
      scope: "microflows",
    });
  });

  it("requires module query parameter for module endpoints", () => {
    expect(() => moduleQuerySchema.parse({})).toThrow();
    expect(moduleQuerySchema.parse({ module: "Sales" })).toEqual({ module: "Sales" });
  });

  it("requires qualifiedName path parameter", () => {
    expect(() => qualifiedNameParamSchema.parse({ qualifiedName: "" })).toThrow();
    expect(qualifiedNameParamSchema.parse({ qualifiedName: "Sales.Order" })).toEqual({
      qualifiedName: "Sales.Order",
    });
  });

  it("parses chat body with mode and context", () => {
    const parsed = chatBodySchema.parse({
      message: "review module Sales",
      mode: "tooling",
      context: {
        module: "Sales",
      },
    });

    expect(parsed).toEqual({
      message: "review module Sales",
      mode: "tooling",
      context: {
        module: "Sales",
      },
    });
  });
});
