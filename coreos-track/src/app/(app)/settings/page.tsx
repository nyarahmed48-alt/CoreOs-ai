import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { TopBar } from "@/components/TopBar";
import { SettingsPanel } from "@/components/SettingsPanel";

export const metadata = { title: "Settings · CoreOs Track" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <>
      <TopBar title="Settings" />
      <main className="flex-1 p-6">
        <SettingsPanel userEmail={user.email} />
      </main>
    </>
  );
}
