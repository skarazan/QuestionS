import { auth } from "./lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Admin routes: require admin role
  if (pathname.startsWith("/admin")) {
    if (!session || session.user?.role !== "admin") {
      const loginUrl = new URL("/login", req.nextUrl);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protected user routes: require any logged-in user
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/quiz")) {
    if (!session) {
      const loginUrl = new URL("/login", req.nextUrl);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/quiz/:path*"],
};
