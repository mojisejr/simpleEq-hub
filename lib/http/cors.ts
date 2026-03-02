import { createProductOriginResolver, getConfiguredAllowedOrigins } from "@/lib/http/allowed-origins";

const DEFAULT_ALLOWED_ORIGINS = ["http://localhost:3000"];

const allowedOrigins = new Set<string>([
  ...DEFAULT_ALLOWED_ORIGINS,
  ...getConfiguredAllowedOrigins(),
]);

const resolveProductOrigins = async (productSlug: string): Promise<string[]> => {
  const { prisma } = await import("@/lib/prisma");

  const resolver = createProductOriginResolver((slug) =>
    prisma.product.findUnique({
      where: { slug },
      select: {
        extensionId: true,
        allowedOrigins: true,
      },
    }),
  );

  return resolver(productSlug);
};

export const isOriginAllowed = (requestOrigin: string | null): boolean => {
  if (!requestOrigin) {
    return false;
  }

  return allowedOrigins.has(requestOrigin);
};

export const isOriginAllowedForProduct = async (
  requestOrigin: string | null,
  productSlug?: string,
): Promise<boolean> => {
  if (!requestOrigin) {
    return false;
  }

  if (isOriginAllowed(requestOrigin)) {
    return true;
  }

  if (!productSlug || !productSlug.trim()) {
    return false;
  }

  try {
    const productOrigins = await resolveProductOrigins(productSlug);
    return productOrigins.includes(requestOrigin);
  } catch {
    return false;
  }
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

export const createCorsHeadersForProduct = async (
  requestOrigin: string | null,
  productSlug?: string,
): Promise<HeadersInit> => {
  const allowed = await isOriginAllowedForProduct(requestOrigin, productSlug);
  const allowOrigin = requestOrigin && allowed ? requestOrigin : "null";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
};