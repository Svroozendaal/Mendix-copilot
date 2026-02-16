import { describe, expect, it, vi } from "vitest";
import type { CopilotSessionManager } from "../../../src/web/api/session-manager.js";
import {
  buildHealthResponse,
  buildStatusResponse,
  handleConnect,
  handleDisconnect,
  toTextResponse,
} from "../../../src/web/api/handlers.js";

describe("web api handlers", () => {
  it("builds health response with version", () => {
    expect(buildHealthResponse("0.1.0")).toEqual({
      ok: true,
      version: "0.1.0",
    });
  });

  it("builds status response from session manager", () => {
    const expectedStatus = {
      connected: true,
      modelLoaded: true,
      appId: "app-123",
      branch: "main",
      counts: {
        moduleCount: 1,
        entityCount: 2,
        microflowCount: 3,
        pageCount: 4,
        userRoleCount: 5,
        securityEnabled: true,
      },
      connectedAt: "2026-02-16T12:00:00.000Z",
    };

    const session = {
      getStatus: vi.fn().mockReturnValue(expectedStatus),
    } as unknown as CopilotSessionManager;

    expect(buildStatusResponse(session)).toEqual(expectedStatus);
    expect(session.getStatus).toHaveBeenCalled();
  });

  it("maps text result to API text response shape", () => {
    expect(
      toTextResponse({
        text: "hello",
        meta: { module: "Sales" },
      })
    ).toEqual({
      ok: true,
      text: "hello",
      meta: { module: "Sales" },
    });
  });

  it("calls connect on session manager and returns status", async () => {
    const status = {
      connected: true,
      modelLoaded: true,
      appId: "app-123",
      branch: "main",
    };

    const session = {
      connect: vi.fn().mockResolvedValue(status),
    } as unknown as CopilotSessionManager;

    const result = await handleConnect(session, { appId: "app-123", branch: "main" });

    expect(session.connect).toHaveBeenCalledWith({ appId: "app-123", branch: "main" });
    expect(result).toEqual({
      ok: true,
      status,
    });
  });

  it("calls disconnect on session manager", async () => {
    const session = {
      disconnect: vi.fn().mockResolvedValue(undefined),
    } as unknown as CopilotSessionManager;

    const result = await handleDisconnect(session);

    expect(session.disconnect).toHaveBeenCalled();
    expect(result).toEqual({ ok: true });
  });
});
