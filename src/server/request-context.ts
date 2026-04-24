import type { NextRequest } from "next/server";

import { getServerEnv } from "@/lib/config/env";
import { UnauthorizedAppError } from "@/lib/errors";
import { hashLike } from "@/lib/utils";

export function getIpHash(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  return hashLike(ip);
}

export function getUserAgentHash(request: NextRequest) {
  return hashLike(request.headers.get("user-agent") || "unknown");
}

export function assertInternalSecret(request: NextRequest) {
  const configuredSecret = getServerEnv().PATTERNS_SYNC_SECRET;
  const secret = request.headers.get("x-internal-secret");
  if (!configuredSecret || !secret || secret !== configuredSecret) {
    throw new UnauthorizedAppError("No autorizado.");
  }
}
