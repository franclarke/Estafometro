import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AppError } from "@/lib/errors";
import type { ApiErrorPayload, ApiSuccessPayload } from "@/types/api";

export function apiOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiSuccessPayload<T>>({ ok: true, data }, init);
}

export function apiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json<ApiErrorPayload>(
      {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "La solicitud no tiene el formato esperado.",
          details: error.flatten(),
        },
      },
      { status: 400 },
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json<ApiErrorPayload>(
      {
        ok: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.statusCode },
    );
  }

  return NextResponse.json<ApiErrorPayload>(
    {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Ocurrió un error inesperado.",
      },
    },
    { status: 500 },
  );
}
