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

export const createCorsHeaders = (requestOrigin: string | null): HeadersInit => {
  const isChromeExtension = requestOrigin?.startsWith("chrome-extension://") ?? false;
  const isConfiguredOrigin = requestOrigin ? allowedOrigins.has(requestOrigin) : false;
  const allowOrigin = isChromeExtension || isConfiguredOrigin ? (requestOrigin ?? "null") : "null";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
};