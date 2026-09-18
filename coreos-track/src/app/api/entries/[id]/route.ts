import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getApprovedUser } from "@/lib/auth";
import { parseDateOnly, serializeEntry } from "@/lib/entries";
import { updateEntrySchema } from "@/lib/validation";
import { forbidden, jsonError, notFound, validationFailed } from "@/lib/http";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const user = await getApprovedUser();
  if (!user) return forbidden();

  const { id } = await params;
  const entry = await prisma.entry.findUnique({ where: { id } });
  if (!entry) return notFound("That entry no longer exists.");

  return NextResponse.json({ entry: serializeEntry(entry) });
}

/** PATCH /api/entries/:id — partial update (name, amount, code, notes, link …). */
export async function PATCH(request: Request, { params }: Params) {
  const user = await getApprovedUser();
  if (!user) return forbidden();

  const { id } = await params;
  const parsed = updateEntrySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return validationFailed(parsed.error);
  const input = parsed.data;

  const data: Prisma.EntryUpdateInput = {};
  if (input.code !== undefined) data.code = input.code;
  if (input.name !== undefined) data.name = input.name;
  if (input.type !== undefined) data.type = input.type;
  if (input.amount !== undefined) data.amount = new Prisma.Decimal(input.amount);
  if (input.currency !== undefined) data.currency = input.currency;
  if (input.status !== undefined) data.status = input.status;
  if (input.date !== undefined) data.date = parseDateOnly(input.date);
  if (input.dueDate !== undefined) {
    data.dueDate = input.dueDate ? parseDateOnly(input.dueDate) : null;
  }
  if (input.notes !== undefined) data.notes = input.notes;
  if (input.linkUrl !== undefined) data.linkUrl = input.linkUrl;

  if (Object.keys(data).length === 0) {
    return jsonError("Nothing to update.", 400);
  }

  try {
    const entry = await prisma.entry.update({ where: { id }, data });
    return NextResponse.json({ entry: serializeEntry(entry) });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") return notFound("That entry no longer exists.");
      if (error.code === "P2002") {
        return jsonError(`Code ${input.code} is already in use.`, 409);
      }
    }
    throw error;
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const user = await getApprovedUser();
  if (!user) return forbidden();

  const { id } = await params;
  try {
    await prisma.entry.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return notFound("That entry no longer exists.");
    }
    throw error;
  }
}
