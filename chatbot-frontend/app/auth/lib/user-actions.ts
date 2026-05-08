"use server";

import { jwtVerify } from "jose";
import { getAuthCookie } from "./cookie";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export interface TokenUser {
  id: string;
  email: string;
  role: "user" | "admin";
  name?: string;
}

export async function getUserFromCookie(): Promise<TokenUser | null> {
  const token = await getAuthCookie();
  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return {
      id: payload.sub as string,
      email: payload.email as string,
      role: (payload.role as "user" | "admin") || "user",
      name: payload.name as string | undefined,
    };
  } catch {
    return null;
  }
}

export async function clearAuth(): Promise<void> {
  const { clearAuthCookie } = await import("./cookie");
  await clearAuthCookie();
}
