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
  module?: string;
  qualifiedName?: string;
}

export interface ApiChatRequest {
  message: string;
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
}

export type SseEventName = "assistant_token" | "tool_call" | "tool_result" | "final" | "error";
