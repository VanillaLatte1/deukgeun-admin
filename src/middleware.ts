import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ADMIN_COOKIE_NAME } from "@/lib/auth";

const bypassPrefixes = ["/_next", "/favicon.ico", "/public"];
const staticFilePattern = /\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map|txt|xml)$/i;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (bypassPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  if (staticFilePattern.test(pathname)) {
    return NextResponse.next();
  }

  if (pathname === "/login" || pathname.startsWith("/auth/")) {
    return NextResponse.next();
  }

  const isAuthed = request.cookies.get(ADMIN_COOKIE_NAME)?.value === "ok";

  if (!isAuthed) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api).*)"],
};
