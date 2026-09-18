import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser } from "@/lib/auth";
import { forbidden } from "@/lib/http";

/** GET /api/admin/users — pending requests + approved members. Admins only. */
export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return forbidden("Admins only.");

  const users = await prisma.user.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ users, currentUserId: admin.id });
}
