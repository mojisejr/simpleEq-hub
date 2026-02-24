const DEFAULT_ALLOWED_ORIGINS = ["http://localhost:3000"];

const readAllowedOrigins = (): Set<string> => {
  const rawOrigins = process.env.ALLOWED_EXTENSION_ORIGINS;
  if (!rawOrigins) {
    return new Set(DEFAULT_ALLOWED_ORIGINS);
  }

  const origins = rawOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  return new Set(origins);
};

const allowedOrigins = readAllowedOrigins();

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
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
};