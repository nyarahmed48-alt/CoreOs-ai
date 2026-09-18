import { prisma } from "@/lib/db";
import { serializeEntry } from "@/lib/entries";
import { TopBar } from "@/components/TopBar";
import { StatsDashboard } from "@/components/StatsDashboard";

export const metadata = { title: "Statistics · CoreOs Track" };
export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const records = await prisma.entry.findMany({
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  return (
    <>
      <TopBar title="Statistics" />
      <main className="flex-1 p-6">
        <StatsDashboard entries={records.map(serializeEntry)} />
      </main>
    </>
  );
}
