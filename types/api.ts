export type UserStatus = "FREE" | "PRO";

export interface UserStatusResponse {
  status: UserStatus;
  link: string | null;
}