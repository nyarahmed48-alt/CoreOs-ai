import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  adminEmail,
  createSession,
  ensureBootstrapAdmin,
  hashPassword,
  normalizeEmail,
} from "@/lib/auth";
import { credentialsSchema } from "@/lib/validation";
import { jsonError, validationFailed } from "@/lib/http";

/**
 * Sign up. Every new account lands in `pending` and stays locked out until an
 * approved admin accepts it on the Security page — except the bootstrap admin,
 * which is approved on the spot so access can never be lost.
 */
export async function POST(request: Request) {
  const parsed = credentialsSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return validationFailed(parsed.error);

  const email = normalizeEmail(parsed.data.email);
  const isBootstrapAdmin = email === adminEmail();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (isBootstrapAdmin) await ensureBootstrapAdmin();
    return jsonError("An account with that email already exists.", 409);
  }

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(parsed.data.password),
      role: isBootstrapAdmin ? "admin" : "member",
      status: isBootstrapAdmin ? "approved" : "pending",
    },
    select: { id: true, email: true, role: true, status: true, createdAt: true },
  });

  await createSession(user);

  return NextResponse.json({
    user,
    next: user.status === "approved" ? "/entries" : "/pending",
  });
}
