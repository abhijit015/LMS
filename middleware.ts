import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "./app/controllers/cookies.controller";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(String(process.env.COOKIE_NAME));
  const isAuthenticated = token ? await verifyToken(token.value) : null;
  if (!isAuthenticated && req.nextUrl.pathname.startsWith("/cap")) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
}
