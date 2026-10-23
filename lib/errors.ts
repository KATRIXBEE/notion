import { NextResponse } from "next/server";
import { logger } from "./logger";

export interface ApiErrorShape {
  error: {
    code: string;
    message: string;
  };
}

export function apiError(code: string, message: string, status = 400) {
  logger.warn("API Error returned", { code, status });
  return NextResponse.json<ApiErrorShape>(
    {
      error: { code, message },
    },
    { status }
  );
}

export function internalError(error: unknown) {
  logger.error("Internal Server Error", {
    err: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  // Never return raw stack traces or internal AWS error messages to client
  return NextResponse.json<ApiErrorShape>(
    {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred. Please try again later.",
      },
    },
    { status: 500 }
  );
}

export function getZodErrorMessage(error: any): string {
  if (Array.isArray(error?.issues) && error.issues.length > 0) {
    return error.issues[0].message;
  }
  if (Array.isArray(error?.errors) && error.errors.length > 0) {
    return error.errors[0].message;
  }
  return error?.message || "Validation failed";
}
