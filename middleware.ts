import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "./app/utils/cookies";

export async function middleware(req: NextRequest) {
  const userIdToken = req.cookies.get(String(process.env.USER_ID_COOKIE));
  const businessIdToken = req.cookies.get(
    String(process.env.BUSINESS_ID_COOKIE)
  );
  const isUserAuthenticated = userIdToken
    ? await verifyToken(userIdToken.value)
    : null;
  if (!isUserAuthenticated) {
    if (req.nextUrl.pathname.startsWith("/cap")) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  } else {
    const isBusinessAuthenticated = businessIdToken
      ? await verifyToken(businessIdToken.value)
      : null;
    if (!isBusinessAuthenticated) {
      if (
        req.nextUrl.pathname !== "/cap/business" &&
        req.nextUrl.pathname.startsWith("/cap")
      ) {
        return NextResponse.redirect(new URL("/cap/business", req.url));
      }
    }
  }
  return NextResponse.next();
}
