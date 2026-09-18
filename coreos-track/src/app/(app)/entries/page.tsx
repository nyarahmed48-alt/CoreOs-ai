import { prisma } from "@/lib/db";
import { serializeEntry } from "@/lib/entries";
import { TopBar } from "@/components/TopBar";
import { EntriesTable } from "@/components/EntriesTable";

export const metadata = { title: "Entries · CoreOs Track" };
export const dynamic = "force-dynamic";

export default async function EntriesPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const { new: openCreate } = await searchParams;

  const records = await prisma.entry.findMany({
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
  const entries = records.map(serializeEntry);
  const types = [...new Set(entries.map((entry) => entry.type))].sort();

  return (
    <>
      <TopBar title="Entries" />
      <main className="flex-1 p-6">
        <EntriesTable
          entries={entries}
          types={types}
          openCreateOnMount={openCreate === "1"}
        />
      </main>
    </>
  );
}
