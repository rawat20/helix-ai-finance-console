import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    const res = NextResponse.next();
    if (req.nextUrl.pathname.startsWith("/dashboard")) {
      res.headers.set(
        "Cache-Control",
        "private, no-cache, no-store, must-revalidate, max-age=0"
      );
      res.headers.set("Pragma", "no-cache");
    }
    return res;
  },
  {
    pages: {
      signIn: "/login",
    },
    callbacks: {
      authorized: ({ token }) => Boolean(token),
    },
  }
);

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*"],
};
