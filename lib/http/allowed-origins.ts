const CHROME_EXTENSION_PROTOCOL = "chrome-extension://";
const EXTENSION_ID_REGEX = /^[a-p]{32}$/;

const parseList = (value?: string): string[] => {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
};

const isValidExtensionId = (value: string): boolean => EXTENSION_ID_REGEX.test(value);

const extensionIdsToOrigins = (rawIds?: string): string[] =>
  parseList(rawIds)
    .map((id) => id.toLowerCase())
    .filter(isValidExtensionId)
    .map((id) => `${CHROME_EXTENSION_PROTOCOL}${id}`);

const toOrigin = (value?: string): string | null => {
  if (!value) {
    return null;
  }

  try {
    const origin = new URL(value).origin;
    return origin === "null" ? null : origin;
  } catch {
    return null;
  }
};

const normalizeChromeExtensionOrigin = (value: string): string | null => {
  const normalized = value.trim().toLowerCase();
  if (!normalized.startsWith(CHROME_EXTENSION_PROTOCOL)) {
    return null;
  }

  const extensionId = normalized.slice(CHROME_EXTENSION_PROTOCOL.length);
  if (!isValidExtensionId(extensionId)) {
    return null;
  }

  return `${CHROME_EXTENSION_PROTOCOL}${extensionId}`;
};

const toAllowedOrigin = (value?: string): string | null => {
  if (!value) {
    return null;
  }

  const extensionOrigin = normalizeChromeExtensionOrigin(value);
  if (extensionOrigin) {
    return extensionOrigin;
  }

  return toOrigin(value);
};

export const getConfiguredAllowedOrigins = (): string[] => {
  const extensionOrigins = extensionIdsToOrigins(process.env.ALLOWED_EXTENSION_IDS);
  const explicitOrigins = parseList(process.env.ALLOWED_EXTENSION_ORIGINS);

  return Array.from(new Set([...explicitOrigins, ...extensionOrigins]));
};

export const getTrustedOrigins = (baseUrl?: string, publicBaseUrl?: string): string[] => {
  return Array.from(
    new Set([
      ...getConfiguredAllowedOrigins(),
      toOrigin(baseUrl),
      toOrigin(publicBaseUrl),
    ].filter((origin): origin is string => Boolean(origin))),
  );
};

type ProductOriginSource = {
  extensionId: string | null;
  allowedOrigins: string[];
};

export const getNormalizedProductOrigins = (source: ProductOriginSource): string[] => {
  const extensionOrigins = source.extensionId ? extensionIdsToOrigins(source.extensionId) : [];
  const explicitOrigins = source.allowedOrigins
    .map((origin) => toAllowedOrigin(origin))
    .filter((origin): origin is string => Boolean(origin));

  return Array.from(new Set([...explicitOrigins, ...extensionOrigins]));
};

export const createProductOriginResolver = <TProduct extends ProductOriginSource>(
  findProductBySlug: (productSlug: string) => Promise<TProduct | null>,
) => {
  return async (productSlug?: string): Promise<string[]> => {
    if (!productSlug || !productSlug.trim()) {
      return [];
    }

    const product = await findProductBySlug(productSlug.trim());

    if (!product) {
      return [];
    }

    return getNormalizedProductOrigins(product);
  };
};
