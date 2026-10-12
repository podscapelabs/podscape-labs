import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "podscape-customer-password-recovery";
const LIFETIME_SECONDS = 15 * 60;

function sign(value: string): string | null {
  const secret = process.env.CUSTOMER_AUTH_RECOVERY_SECRET;
  if (!secret || secret.length < 32) return null;
  return createHmac("sha256", secret).update(value).digest("hex");
}

/** Only call this following an actual Supabase recovery token/code exchange. */
export async function setCustomerRecoveryPermission(userId: string): Promise<boolean> {
  const expires = Math.floor(Date.now() / 1000) + LIFETIME_SECONDS;
  const payload = `${userId}.${expires}`;
  const signature = sign(payload);
  if (!signature) return false;
  const store = await cookies();
  store.set(COOKIE, `${expires}.${signature}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/account",
    maxAge: LIFETIME_SECONDS,
  });
  return true;
}

export async function hasCustomerRecoveryPermission(userId: string): Promise<boolean> {
  const store = await cookies();
  const value = store.get(COOKIE)?.value || "";
  const [expiresString, provided, extra] = value.split(".");
  if (!expiresString || !provided || extra || !/^\d+$/.test(expiresString)) return false;
  const expires = Number(expiresString);
  if (!Number.isSafeInteger(expires) || expires <= Math.floor(Date.now() / 1000)) return false;
  const expected = sign(`${userId}.${expires}`);
  if (!expected) return false;
  const left = Buffer.from(provided, "utf8");
  const right = Buffer.from(expected, "utf8");
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function clearCustomerRecoveryPermission() {
  const store = await cookies();
  store.set(COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/account",
    maxAge: 0,
  });
}
