import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const ADMIN_COOKIE = "podscape-owner-session";
const SESSION_VALUE = "podscape-owner-preview-v1";
const SESSION_DURATION_SECONDS = 60 * 60 * 12;

function adminPassword() {
  return process.env.PODSCAPE_ADMIN_PASSWORD?.trim() || "";
}

function adminSecret() {
  return process.env.PODSCAPE_ADMIN_SECRET?.trim() || "";
}

function constantTimeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function sessionToken() {
  const signature = createHmac("sha256", adminSecret()).update(SESSION_VALUE).digest("hex");
  return `v1.${signature}`;
}

export function isAdminConfigured() {
  return Boolean(adminPassword() && adminSecret());
}

export function isValidAdminPassword(candidate: string) {
  const configuredPassword = adminPassword();
  return Boolean(configuredPassword) && constantTimeEqual(candidate, configuredPassword);
}

export async function isAdminAuthenticated() {
  if (!isAdminConfigured()) return false;

  const cookieStore = await cookies();
  const suppliedToken = cookieStore.get(ADMIN_COOKIE)?.value || "";
  const expectedToken = sessionToken();

  return Boolean(suppliedToken) && constantTimeEqual(suppliedToken, expectedToken);
}

export async function createAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, sessionToken(), {
    httpOnly: true,
    maxAge: SESSION_DURATION_SECONDS,
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}
