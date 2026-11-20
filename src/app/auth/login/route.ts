import { NextResponse } from "next/server";

import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createAdminSessionCookieValue,
} from "@/lib/auth";
import { verifyAdminCredentials } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const formData = await request.formData();
  const adminId = String(formData.get("admin_id") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();

  if (!adminId || !password) {
    return NextResponse.redirect(new URL("/login?error=1", request.url));
  }

  const ok = await verifyAdminCredentials(adminId, password);
  if (!ok) {
    return NextResponse.redirect(new URL("/login?error=1", request.url));
  }

  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set(ADMIN_COOKIE_NAME, await createAdminSessionCookieValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });

  return response;
}
