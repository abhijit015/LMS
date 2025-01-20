"use server";
import { handleErrorMsg } from "../utils/common";

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET_KEY);

export async function setUserIdCookie(userId: number) {
  const token = await new SignJWT({ id: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .sign(secret);

  const cookieJar = await cookies();
  cookieJar.set({
    name: String(process.env.USER_ID_COOKIE),
    value: token,
    httpOnly: true,
    maxAge: 60 * 60 * 24,
    path: "/",
    secure: true,
  });
}

export async function setBusinessIdCookie(businessId: number) {
  const token = await new SignJWT({ id: businessId })
    .setProtectedHeader({ alg: "HS256" })
    .sign(secret);

  const cookieJar = await cookies();
  cookieJar.set({
    name: String(process.env.BUSINESS_ID_COOKIE),
    value: token,
    httpOnly: true,
    path: "/",
    secure: true,
  });
}

export async function clearUserIdCookie() {
  (await cookies()).delete(String(process.env.USER_ID_COOKIE));
}

export async function clearBusinessCookie() {
  (await cookies()).delete(String(process.env.BUSINESS_ID_COOKIE));
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
    const token = cookieStore.get(String(process.env.USER_ID_COOKIE))?.value;

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

export async function getBusinessIdFromCookies() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(
      String(process.env.BUSINESS_ID_COOKIE)
    )?.value;

    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(token, secret);

    return payload && typeof payload.id === "number" ? payload.id : null;
  } catch (error) {
    console.error("Error getting business ID from token:", error);
    return null;
  }
}
