import "server-only";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  signSession,
  verifySession,
  type SessionPayload,
} from "@/lib/jwt";

export type AuthUser = {
  id: string;
  email: string;
  role: "admin" | "member";
  status: "pending" | "approved" | "denied";
  createdAt: Date;
};

const BCRYPT_ROUNDS = 10;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export function adminEmail(): string {
  return (process.env.ADMIN_EMAIL ?? "nyarahmed48@gmail.com").trim().toLowerCase();
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * The bootstrap admin can never be locked out: whenever it signs up or signs in
 * we (re)assert `role=admin, status=approved`. If it does not exist yet and an
 * ADMIN_PASSWORD is configured, it is created.
 */
export async function ensureBootstrapAdmin(): Promise<void> {
  const email = adminEmail();
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (existing.role !== "admin" || existing.status !== "approved") {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: "admin", status: "approved" },
      });
    }
    return;
  }

  const password = process.env.ADMIN_PASSWORD;
  if (!password) return; // Nothing to create from — the account is made at signup.

  await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(password),
      role: "admin",
      status: "approved",
    },
  });
}

export async function createSession(user: AuthUser): Promise<void> {
  const payload: SessionPayload = { sub: user.id, email: user.email };
  const token = await signSession(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/**
 * Resolve the signed-in user from the session cookie.
 *
 * The database row — not the cookie — is the source of truth for role/status,
 * so revoking a member takes effect on their very next request.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const store = await cookies();
  const session = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });
  return user ?? null;
}

/** Approved members only. Returns null for signed-out, pending or denied users. */
export async function getApprovedUser(): Promise<AuthUser | null> {
  const user = await getCurrentUser();
  return user && user.status === "approved" ? user : null;
}

export async function getAdminUser(): Promise<AuthUser | null> {
  const user = await getApprovedUser();
  return user && user.role === "admin" ? user : null;
}
