export type UserStatus = "ANONYMOUS" | "FREE" | "PRO";

export interface UserStatusResponse {
  status: UserStatus;
  code?: "AUTH_REQUIRED";
  link: string | null;
  onboardingRequired?: boolean;
  onboardingLink?: string | null;
  product?: string;
}

export interface ApiErrorResponse {
  error: string;
  code: "ORIGIN_NOT_ALLOWED" | "INVALID_QUERY" | "INTERNAL_ERROR" | "AUTH_REQUIRED";
}