import type { ApiErrorShape } from "./types.js";

export class ApiError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  const message = error instanceof Error ? error.message : "Onbekende fout.";
  return new ApiError(500, message);
}

export function toApiErrorResponse(error: unknown): ApiErrorShape {
  const apiError = toApiError(error);
  return {
    ok: false,
    error: {
      message: apiError.message,
    },
  };
}
