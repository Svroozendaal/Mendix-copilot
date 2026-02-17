import type { ModelStatsInfo } from "../../mendix/client.js";

export interface ApiErrorShape {
  ok: false;
  error: {
    message: string;
  };
}

export interface ApiTextShape<TMeta = unknown> {
  ok: true;
  text: string;
  meta: TMeta;
}

export interface ApiHealthShape {
  ok: true;
  version: string;
}

export interface ApiStatusShape {
  connected: boolean;
  appId?: string;
  branch?: string;
  modelLoaded: boolean;
  counts?: ModelStatsInfo;
  connectedAt?: string;
}

export interface ApiChatContext {
  selectedType?: "module" | "entity" | "microflow" | "page";
  module?: string;
  qualifiedName?: string;
}

export interface ApiChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ApiChatRequest {
  message?: string;
  messages?: ApiChatMessage[];
  mode?: "assistant" | "tooling";
  context?: ApiChatContext;
}

export interface ApiToolCallEvent {
  toolName: string;
  input: Record<string, unknown>;
}

export interface ApiToolResultEvent {
  toolName: string;
  summary: string;
  textLength: number;
}

export interface ApiFinalEvent {
  answer: string;
  sources?: string[];
  suggestedPlanPrompt?: string;
}

export type SseEventName =
  | "assistant_token"
  | "tool_call"
  | "tool_result"
  | "command_start"
  | "command_success"
  | "command_failed"
  | "commit_done"
  | "postcheck_results"
  | "final"
  | "error";
