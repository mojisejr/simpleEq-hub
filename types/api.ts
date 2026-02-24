export type UserStatus = "FREE" | "PRO";

export interface UserStatusResponse {
  status: UserStatus;
  link: string | null;
}

export interface ApiErrorResponse {
  error: string;
  code: "ORIGIN_NOT_ALLOWED" | "INVALID_QUERY" | "INTERNAL_ERROR";
}