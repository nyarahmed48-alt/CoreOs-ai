import { Clock3, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SignOutButton } from "@/components/SignOutButton";

export const metadata = { title: "Awaiting approval · CoreOs Track" };
export const dynamic = "force-dynamic";

/**
 * The approval gate. Pending (and denied) accounts can reach this page and
 * nothing else — middleware redirects every other route here.
 */
export default async function PendingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.status === "approved") redirect("/entries");

  const denied = user.status === "denied";

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="card w-full max-w-lg space-y-5 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-surface-2">
          {denied ? (
            <ShieldCheck className="h-5 w-5 text-danger" aria-hidden />
          ) : (
            <Clock3 className="h-5 w-5 text-warning" aria-hidden />
          )}
        </div>

        <h1 className="page-title">
          {denied ? "Access declined" : "Waiting for approval"}
        </h1>

        <p className="text-sm leading-relaxed text-muted">
          {denied ? (
            <>
              An admin declined access for <strong className="text-ink">{user.email}</strong>.
              Contact your workspace admin if you think this is a mistake.
            </>
          ) : (
            <>
              <strong className="text-ink">{user.email}</strong> is registered but
              locked out until an approved member accepts it on the Security
              page. This screen refreshes access as soon as they do — just sign
              in again.
            </>
          )}
        </p>

        <div className="flex justify-center">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
