"use server";

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET_KEY);

export async function setCookies(userId: number) {
  const token = await new SignJWT({ id: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1h")
    .sign(secret);

  const cookieJar = await cookies();
  cookieJar.set({
    name: String(process.env.COOKIE_NAME),
    value: token,
    httpOnly: true,
    maxAge: 60 * 60,
    path: "/",
    secure: process.env.DEBUG_MODE === "true",
  });
}

export async function clearCookies() {
  (await cookies()).delete(String(process.env.COOKIE_NAME));
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload ? token : null;
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

export async function getUserIdFromCookies() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(String(process.env.COOKIE_NAME))?.value;

    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(token, secret);

    return payload && typeof payload.id === "number" ? payload.id : null;
  } catch (error) {
    console.error("Error getting user ID from token:", error);
    return null;
  }
}
