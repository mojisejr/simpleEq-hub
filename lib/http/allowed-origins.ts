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
    return new URL(value).origin;
  } catch {
    return null;
  }
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
