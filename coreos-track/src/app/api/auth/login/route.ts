import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  adminEmail,
  createSession,
  ensureBootstrapAdmin,
  normalizeEmail,
  verifyPassword,
} from "@/lib/auth";
import { credentialsSchema } from "@/lib/validation";
import { jsonError, validationFailed } from "@/lib/http";

export async function POST(request: Request) {
  const parsed = credentialsSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return validationFailed(parsed.error);

  const email = normalizeEmail(parsed.data.email);

  // Repair/create the bootstrap admin before authenticating it, so a wiped or
  // demoted admin row never locks the owner out of the Security dashboard.
  if (email === adminEmail()) await ensureBootstrapAdmin();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return jsonError("Email or password is incorrect.", 401);
  }

  if (user.status === "denied") {
    return jsonError("Access for this account was declined.", 403);
  }

  const session = {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
  };
  await createSession(session);

  return NextResponse.json({
    user: session,
    next: user.status === "approved" ? "/entries" : "/pending",
  });
}
