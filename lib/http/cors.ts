import { getConfiguredAllowedOrigins } from "@/lib/http/allowed-origins";

const DEFAULT_ALLOWED_ORIGINS = ["http://localhost:3000"];

const allowedOrigins = new Set<string>([
  ...DEFAULT_ALLOWED_ORIGINS,
  ...getConfiguredAllowedOrigins(),
]);

export const isOriginAllowed = (requestOrigin: string | null): boolean => {
  if (!requestOrigin) {
    return false;
  }

  return allowedOrigins.has(requestOrigin);
};

export const createCorsHeaders = (requestOrigin: string | null): HeadersInit => {
  const allowOrigin = requestOrigin && isOriginAllowed(requestOrigin) ? requestOrigin : "null";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
};