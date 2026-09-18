import { NextResponse } from "next/server";
import { z } from "zod";
import { fieldErrors } from "@/lib/validation";

export function jsonError(message: string, status: number, extra?: unknown) {
  return NextResponse.json({ error: message, details: extra }, { status });
}

export function unauthorized() {
  return jsonError("You must be signed in.", 401);
}

export function forbidden(message = "Your account is not approved yet.") {
  return jsonError(message, 403);
}

export function notFound(message = "Not found.") {
  return jsonError(message, 404);
}

export function validationFailed(error: z.ZodError) {
  return jsonError("Some fields need attention.", 422, fieldErrors(error));
}
