import { prisma } from "@/lib/db";
import { getApprovedUser } from "@/lib/auth";
import { serializeEntry } from "@/lib/entries";
import { coerceCurrency, formatMoney } from "@/lib/currency";
import { forbidden, notFound } from "@/lib/http";
import type { ReceiptData } from "@/pdf/ReceiptDocument";
import { renderReceiptPdf } from "@/pdf/render";

// @react-pdf/renderer needs the Node runtime (it is not Edge-compatible).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/entries/:id/pdf — download a watermarked receipt for one entry.
 *
 * Query params:
 *   ?amount=1200        override the printed amount (custom price)
 *   ?currency=IQD       print the amount in another currency
 *   ?inline=1           render in the browser instead of downloading
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getApprovedUser();
  if (!user) return forbidden();

  const { id } = await params;
  const record = await prisma.entry.findUnique({ where: { id } });
  if (!record) return notFound("That entry no longer exists.");

  const entry = serializeEntry(record);
  const { searchParams } = new URL(request.url);

  const overrideAmount = Number(searchParams.get("amount"));
  const amount =
    searchParams.has("amount") && Number.isFinite(overrideAmount)
      ? overrideAmount
      : entry.amount;
  const currency = coerceCurrency(searchParams.get("currency") ?? entry.currency);
  const inline = searchParams.get("inline") === "1";

  const data: ReceiptData = {
    receiptNo: `R-${entry.code}-${entry.id.slice(0, 4).toUpperCase()}`,
    code: entry.code,
    name: entry.name,
    type: entry.type,
    status: entry.status,
    entryDate: entry.date,
    issuedDate: new Date().toISOString().slice(0, 10),
    dueDate: entry.dueDate,
    amountLabel: formatMoney(amount, currency),
    currency,
    notes: entry.notes,
    linkUrl: entry.linkUrl,
    issuedBy: user.email,
  };

  const buffer = await renderReceiptPdf(data);

  const filename = `receipt-${entry.code}.pdf`;
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
