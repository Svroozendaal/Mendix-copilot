import type { TextResult } from "../../core/copilot-core.js";
import type { CopilotSessionManager } from "./session-manager.js";
import type { ApiHealthShape, ApiStatusShape, ApiTextShape } from "./types.js";

export function toTextResponse<TMeta>(result: TextResult<TMeta>): ApiTextShape<TMeta> {
  return {
    ok: true,
    text: result.text,
    meta: result.meta,
  };
}

export function buildHealthResponse(version: string): ApiHealthShape {
  return {
    ok: true,
    version,
  };
}

export function buildStatusResponse(session: CopilotSessionManager): ApiStatusShape {
  return session.getStatus();
}

export async function handleConnect(
  session: CopilotSessionManager,
  input: { appId?: string; branch?: string }
): Promise<{ ok: true; status: ApiStatusShape }> {
  const status = await session.connect(input);
  return {
    ok: true,
    status,
  };
}

export async function handleDisconnect(
  session: CopilotSessionManager
): Promise<{ ok: true }> {
  await session.disconnect();
  return { ok: true };
}
