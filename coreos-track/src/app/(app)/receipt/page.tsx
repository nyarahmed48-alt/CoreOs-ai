import { prisma } from "@/lib/db";
import { serializeEntry } from "@/lib/entries";
import { TopBar } from "@/components/TopBar";
import { ReceiptStudio } from "@/components/ReceiptStudio";

export const metadata = { title: "Receipt · CoreOs Track" };
export const dynamic = "force-dynamic";

export default async function ReceiptPage({
  searchParams,
}: {
  searchParams: Promise<{ entry?: string }>;
}) {
  const { entry: initialEntryId } = await searchParams;
  const records = await prisma.entry.findMany({
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  return (
    <>
      <TopBar title="Receipt" />
      <main className="flex-1 p-6">
        <ReceiptStudio
          entries={records.map(serializeEntry)}
          initialEntryId={initialEntryId}
        />
      </main>
    </>
  );
}
