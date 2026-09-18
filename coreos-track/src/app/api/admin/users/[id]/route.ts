import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { adminEmail, getAdminUser } from "@/lib/auth";
import { forbidden, jsonError, notFound, validationFailed } from "@/lib/http";

const patchSchema = z.object({
  status: z.enum(["pending", "approved", "denied"]).optional(),
  role: z.enum(["admin", "member"]).optional(),
});

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/admin/users/:id — approve, deny, revoke, or change a role. */
export async function PATCH(request: Request, { params }: Params) {
  const admin = await getAdminUser();
  if (!admin) return forbidden("Admins only.");

  const { id } = await params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return validationFailed(parsed.error);
  if (!parsed.data.status && !parsed.data.role) {
    return jsonError("Nothing to update.", 400);
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return notFound("That account no longer exists.");

  // Guard rails: the bootstrap admin stays an approved admin, and an admin
  // cannot revoke or demote themselves out of the Security dashboard.
  if (target.email === adminEmail()) {
    return jsonError("The bootstrap admin account cannot be changed.", 400);
  }
  if (target.id === admin.id) {
    return jsonError("You cannot change your own access.", 400);
  }

  const user = await prisma.user.update({
    where: { id },
    data: parsed.data,
    select: { id: true, email: true, role: true, status: true, createdAt: true },
  });

  return NextResponse.json({ user });
}

/** DELETE /api/admin/users/:id — remove an account entirely. */
export async function DELETE(_request: Request, { params }: Params) {
  const admin = await getAdminUser();
  if (!admin) return forbidden("Admins only.");

  const { id } = await params;
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return notFound("That account no longer exists.");
  if (target.email === adminEmail()) {
    return jsonError("The bootstrap admin account cannot be removed.", 400);
  }
  if (target.id === admin.id) {
    return jsonError("You cannot remove your own account.", 400);
  }

  try {
    await prisma.user.delete({ where: { id } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return notFound("That account no longer exists.");
    }
    throw error;
  }

  return NextResponse.json({ ok: true });
}
