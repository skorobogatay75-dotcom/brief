import { cookies } from "next/headers";

const AUTH_COOKIE = "brief_admin_auth";

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const auth = cookieStore.get(AUTH_COOKIE);
  const password = process.env.ADMIN_PASSWORD || "admin123";
  return auth?.value === password;
}

export async function setAuthCookie(password: string): Promise<boolean> {
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  if (password !== adminPassword) return false;

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, password, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return true;
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
}
