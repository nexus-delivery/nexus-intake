import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { MANAGE_IT_ACCESS_COOKIE, MANAGE_IT_SESSION_COOKIE } from "@/lib/manageIt";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/manage-it")) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get(MANAGE_IT_SESSION_COOKIE)?.value;
  const canAccessManageIt = request.cookies.get(MANAGE_IT_ACCESS_COOKIE)?.value === "1";

  if (!sessionToken) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  if (!canAccessManageIt) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/manage-it/:path*"],
};
