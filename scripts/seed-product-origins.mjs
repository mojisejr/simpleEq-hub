import { readFile } from "node:fs/promises";
import path from "node:path";

import { disconnectPrisma, prisma } from "./prisma-client.mjs";

const CHROME_EXTENSION_PREFIX = "chrome-extension://";
const EXTENSION_ID_REGEX = /^[a-p]{32}$/;

const argv = process.argv.slice(2);
const applyMode = argv.includes("--apply");
const configPathArg = argv.find((entry) => entry.startsWith("--file="));
const configuredPath = configPathArg ? configPathArg.slice("--file=".length) : null;
const configPath = configuredPath
  ? path.resolve(process.cwd(), configuredPath)
  : path.resolve(process.cwd(), ".secrets/product-origins.local.json");

const normalizeExtensionId = (value) => {
  if (!value) {
    return null;
  }

  const normalized = String(value).trim().toLowerCase();
  if (!EXTENSION_ID_REGEX.test(normalized)) {
    throw new Error(`Invalid extensionId '${value}'. Expected 32 chars in range a-p.`);
  }

  return normalized;
};

const normalizeOrigin = (origin) => {
  const raw = String(origin).trim();
  if (!raw) {
    return null;
  }

  const lower = raw.toLowerCase();
  if (lower.startsWith(CHROME_EXTENSION_PREFIX)) {
    const extensionId = lower.slice(CHROME_EXTENSION_PREFIX.length);
    if (!EXTENSION_ID_REGEX.test(extensionId)) {
      throw new Error(`Invalid chrome-extension origin '${origin}'.`);
    }
    return `${CHROME_EXTENSION_PREFIX}${extensionId}`;
  }

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`Invalid origin URL '${origin}'.`);
  }

  if (!parsed.protocol.startsWith("http")) {
    throw new Error(`Unsupported origin protocol for '${origin}'. Use http/https or chrome-extension://.`);
  }

  return parsed.origin;
};

const normalizeEntry = (entry) => {
  if (!entry || typeof entry !== "object") {
    throw new Error("Each product config must be an object.");
  }

  const slug = String(entry.slug ?? "").trim().toLowerCase();
  if (!slug) {
    throw new Error("Missing product slug.");
  }

  const extensionId = normalizeExtensionId(entry.extensionId ?? null);
  const explicitOrigins = Array.isArray(entry.allowedOrigins) ? entry.allowedOrigins : [];
  const normalizedExplicitOrigins = explicitOrigins
    .map((origin) => normalizeOrigin(origin))
    .filter((origin) => Boolean(origin));

  const mergedOrigins = new Set(normalizedExplicitOrigins);
  if (extensionId) {
    mergedOrigins.add(`${CHROME_EXTENSION_PREFIX}${extensionId}`);
  }

  return {
    slug,
    extensionId,
    allowedOrigins: Array.from(mergedOrigins),
  };
};

const run = async () => {
  const fileContent = await readFile(configPath, "utf8");
  const parsed = JSON.parse(fileContent);

  if (!Array.isArray(parsed.products)) {
    throw new Error("Config must contain a 'products' array.");
  }

  const normalizedEntries = parsed.products.map((entry) => normalizeEntry(entry));

  console.log(`[phasec] config: ${configPath}`);
  console.log(`[phasec] mode: ${applyMode ? "APPLY" : "DRY_RUN"}`);
  console.log(`[phasec] products: ${normalizedEntries.map((entry) => entry.slug).join(", ")}`);

  if (!applyMode) {
    for (const entry of normalizedEntries) {
      console.log(
        `[phasec] dry-run -> ${entry.slug} extensionId=${entry.extensionId ?? "<null>"} origins=${entry.allowedOrigins.length}`,
      );
    }
    console.log("[phasec] Dry run completed. Re-run with --apply to persist changes.");
    return;
  }

  for (const entry of normalizedEntries) {
    await prisma.product.update({
      where: {
        slug: entry.slug,
      },
      data: {
        extensionId: entry.extensionId,
        allowedOrigins: entry.allowedOrigins,
      },
    });

    console.log(
      `[phasec] updated ${entry.slug} extensionId=${entry.extensionId ?? "<null>"} origins=${entry.allowedOrigins.length}`,
    );
  }
};

run()
  .catch((error) => {
    console.error("[phasec] failed to seed product origins", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectPrisma();
  });