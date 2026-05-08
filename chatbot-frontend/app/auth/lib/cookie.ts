"use server";

import { cookies } from "next/headers";

const AUTH_COOKIE_NAME = "auth_token";
const AUTH_USER_COOKIE_NAME = "auth_user";
const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: AUTH_COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function setAuthUserCookie(user: {
  id: string;
  email: string;
  role?: "user" | "admin";
  name?: string;
}): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_USER_COOKIE_NAME, JSON.stringify(user), {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: AUTH_COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function getAuthCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(AUTH_COOKIE_NAME);
  return cookie?.value || null;
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  cookieStore.delete(AUTH_USER_COOKIE_NAME);
}
