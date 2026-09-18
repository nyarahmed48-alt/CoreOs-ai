import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getApprovedUser } from "@/lib/auth";
import { generateUniqueEntryCode } from "@/lib/codes";
import { parseDateOnly, serializeEntry } from "@/lib/entries";
import { createEntrySchema } from "@/lib/validation";
import { forbidden, jsonError, validationFailed } from "@/lib/http";

/** GET /api/entries?q=&status=&type= — list entries, newest first. */
export async function GET(request: Request) {
  const user = await getApprovedUser();
  if (!user) return forbidden();

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const status = searchParams.get("status")?.trim();
  const type = searchParams.get("type")?.trim();

  const where: Prisma.EntryWhereInput = {
    ...(status && status !== "all" ? { status } : {}),
    ...(type && type !== "all" ? { type } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { code: { contains: q, mode: "insensitive" as const } },
            { type: { contains: q, mode: "insensitive" as const } },
            { notes: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const entries = await prisma.entry.findMany({
    where,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ entries: entries.map(serializeEntry) });
}

/** POST /api/entries — create an entry, auto-generating its code when omitted. */
export async function POST(request: Request) {
  const user = await getApprovedUser();
  if (!user) return forbidden();

  const parsed = createEntrySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return validationFailed(parsed.error);
  const input = parsed.data;

  const code =
    input.code ??
    (await generateUniqueEntryCode(
      async (candidate) =>
        (await prisma.entry.count({ where: { code: candidate } })) > 0,
    ));

  try {
    const entry = await prisma.entry.create({
      data: {
        code,
        name: input.name,
        type: input.type,
        amount: new Prisma.Decimal(input.amount),
        currency: input.currency,
        status: input.status,
        date: parseDateOnly(input.date),
        dueDate: input.dueDate ? parseDateOnly(input.dueDate) : null,
        notes: input.notes,
        linkUrl: input.linkUrl,
        createdById: user.id,
      },
    });
    return NextResponse.json({ entry: serializeEntry(entry) }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return jsonError(`Code ${code} is already in use.`, 409);
    }
    throw error;
  }
}
