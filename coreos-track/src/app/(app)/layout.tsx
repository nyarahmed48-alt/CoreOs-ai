import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { MobileNav, Sidebar } from "@/components/Sidebar";

export const dynamic = "force-dynamic";

/**
 * Shell for every internal route. Middleware already blocks signed-out and
 * pending users; this re-checks against the database so a revoked member is
 * dropped on their next navigation even with a still-valid cookie.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.status !== "approved") redirect("/pending");

  const isAdmin = user.role === "admin";

  return (
    <div className="flex min-h-screen">
      <Sidebar email={user.email} isAdmin={isAdmin} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav isAdmin={isAdmin} />
        {children}
      </div>
    </div>
  );
}
