import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { prisma } from "@/lib/prisma";

const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("Missing BETTER_AUTH_SECRET");
}

if (!googleClientId || !googleClientSecret) {
  throw new Error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
}

const trustedOrigins = (process.env.ALLOWED_EXTENSION_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL,
  basePath: "/api/auth",
  trustedOrigins,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  socialProviders: {
    google: {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      redirectURI: `${baseURL}/api/auth/callback/google`,
    },
  },
});