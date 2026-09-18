import { ShieldAlert } from "lucide-react";
import { prisma } from "@/lib/db";
import { adminEmail, getCurrentUser } from "@/lib/auth";
import { TopBar } from "@/components/TopBar";
import { SecurityPanel } from "@/components/SecurityPanel";

export const metadata = { title: "Security · CoreOs Track" };
export const dynamic = "force-dynamic";

export default async function SecurityPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return (
      <>
        <TopBar title="Security · Access" />
        <main className="flex-1 p-6">
          <div className="card flex items-center gap-4">
            <ShieldAlert className="h-5 w-5 text-warning" aria-hidden />
            <p className="text-sm text-muted">
              Only admins can review access requests and manage members.
            </p>
          </div>
        </main>
      </>
    );
  }

  const users = await prisma.user.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    select: { id: true, email: true, role: true, status: true, createdAt: true },
  });

  return (
    <>
      <TopBar title="Security · Access" />
      <main className="flex-1 p-6">
        <SecurityPanel
          users={users.map((member) => ({
            ...member,
            createdAt: member.createdAt.toISOString(),
          }))}
          currentUserId={user.id}
          bootstrapEmail={adminEmail()}
        />
      </main>
    </>
  );
}
