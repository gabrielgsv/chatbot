export const AUTH_COOKIE_NAME = "auth_token";
export const AUTH_USER_COOKIE_NAME = "auth_user";

export interface AuthUser {
  id: string;
  email: string;
  role?: "user" | "admin";
  name?: string;
}

export function getAuthTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${AUTH_COOKIE_NAME}=`));

  if (!match) return null;

  const value = match.split("=")[1];
  return decodeURIComponent(value);
}

export function getAuthUserFromCookie(): AuthUser | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${AUTH_USER_COOKIE_NAME}=`));

  if (!match) return null;

  const value = match.split("=")[1];
  try {
    return JSON.parse(decodeURIComponent(value)) as AuthUser;
  } catch {
    return null;
  }
}

export function deleteAuthCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  document.cookie = `${AUTH_USER_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}
