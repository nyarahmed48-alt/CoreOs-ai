import { prisma } from "@/lib/db";
import { serializeEntry } from "@/lib/entries";
import { TopBar } from "@/components/TopBar";
import { ExportPanel } from "@/components/ExportPanel";

export const metadata = { title: "Export · CoreOs Track" };
export const dynamic = "force-dynamic";

export default async function ExportPage() {
  const records = await prisma.entry.findMany({
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  return (
    <>
      <TopBar title="Export" />
      <main className="flex-1 p-6">
        <ExportPanel entries={records.map(serializeEntry)} />
      </main>
    </>
  );
}
