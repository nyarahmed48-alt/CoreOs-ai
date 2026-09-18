"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Check, ShieldCheck, UserX } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { apiRequest } from "@/lib/client-api";

export type MemberDTO = {
  id: string;
  email: string;
  role: "admin" | "member";
  status: "pending" | "approved" | "denied";
  createdAt: string;
};

type PendingAction =
  | { kind: "approve" | "deny" | "revoke"; user: MemberDTO }
  | { kind: "remove"; user: MemberDTO };

const COPY: Record<PendingAction["kind"], { title: string; label: string; tone: "default" | "danger" }> = {
  approve: { title: "Approve access?", label: "Approve", tone: "default" },
  deny: { title: "Decline access?", label: "Decline", tone: "danger" },
  revoke: { title: "Revoke access?", label: "Revoke", tone: "danger" },
  remove: { title: "Remove account?", label: "Remove", tone: "danger" },
};

export function SecurityPanel({
  users,
  currentUserId,
  bootstrapEmail,
}: {
  users: MemberDTO[];
  currentUserId: string;
  bootstrapEmail: string;
}) {
  const router = useRouter();
  const [action, setAction] = useState<PendingAction | null>(null);

  const pending = users.filter((user) => user.status === "pending");
  const approved = users.filter((user) => user.status === "approved");
  const denied = users.filter((user) => user.status === "denied");

  async function commit() {
    if (!action) return;
    const { kind, user } = action;

    if (kind === "remove") {
      await apiRequest(`/api/admin/users/${user.id}`, { method: "DELETE" });
    } else {
      const status =
        kind === "approve" ? "approved" : kind === "deny" ? "denied" : "pending";
      await apiRequest(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    }

    setAction(null);
    router.refresh();
  }

  const protectedUser = (user: MemberDTO) =>
    user.id === currentUserId || user.email === bootstrapEmail;

  return (
    <div className="space-y-6">
      <section className="card space-y-4">
        <div>
          <h2 className="label">Pending access requests</h2>
          <p className="mt-2 text-sm text-muted">
            Anyone who signs up stays locked out until an approved admin accepts
            them here.
          </p>
        </div>

        {pending.length === 0 ? (
          <p className="text-sm text-muted">No pending requests.</p>
        ) : (
          <ul className="divide-y divide-line">
            {pending.map((user) => (
              <li
                key={user.id}
                className="flex flex-wrap items-center justify-between gap-3 py-4"
              >
                <div>
                  <p className="font-medium">{user.email}</p>
                  <p className="text-xs text-muted">
                    requested {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-primary px-3 py-2"
                    onClick={() => setAction({ kind: "approve", user })}
                  >
                    <Check className="h-4 w-4" aria-hidden />
                    Approve
                  </button>
                  <button
                    type="button"
                    className="btn-danger px-3 py-2"
                    onClick={() => setAction({ kind: "deny", user })}
                  >
                    <Ban className="h-4 w-4" aria-hidden />
                    Deny
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card space-y-4">
        <h2 className="label">Approved members</h2>
        <ul className="divide-y divide-line">
          {approved.map((user) => (
            <li
              key={user.id}
              className="flex flex-wrap items-center justify-between gap-3 py-4"
            >
              <div>
                <p className="flex items-center gap-2 font-medium">
                  {user.email}
                  {user.role === "admin" ? (
                    <span className="chip">
                      <ShieldCheck className="mr-1 h-3 w-3" aria-hidden />
                      admin
                    </span>
                  ) : null}
                  {user.id === currentUserId ? (
                    <span className="text-xs text-muted">(you)</span>
                  ) : null}
                </p>
                <p className="text-xs text-muted">
                  since {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>

              {protectedUser(user) ? (
                <span className="text-xs text-muted">protected account</span>
              ) : (
                <button
                  type="button"
                  className="btn-danger px-3 py-2"
                  onClick={() => setAction({ kind: "revoke", user })}
                >
                  <Ban className="h-4 w-4" aria-hidden />
                  Revoke
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      {denied.length > 0 ? (
        <section className="card space-y-4">
          <h2 className="label">Declined</h2>
          <ul className="divide-y divide-line">
            {denied.map((user) => (
              <li
                key={user.id}
                className="flex flex-wrap items-center justify-between gap-3 py-4"
              >
                <p className="font-medium text-muted">{user.email}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-ghost px-3 py-2"
                    onClick={() => setAction({ kind: "approve", user })}
                  >
                    <Check className="h-4 w-4" aria-hidden />
                    Approve
                  </button>
                  <button
                    type="button"
                    className="btn-danger px-3 py-2"
                    onClick={() => setAction({ kind: "remove", user })}
                  >
                    <UserX className="h-4 w-4" aria-hidden />
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {action ? (
        <ConfirmDialog
          title={COPY[action.kind].title}
          confirmLabel={COPY[action.kind].label}
          tone={COPY[action.kind].tone}
          message={
            <>
              <strong className="text-ink">{action.user.email}</strong>{" "}
              {action.kind === "approve"
                ? "will get full access to entries, stats and receipts."
                : action.kind === "deny"
                  ? "will be declined and kept locked out."
                  : action.kind === "revoke"
                    ? "will lose access immediately and return to the pending list."
                    : "will be deleted permanently."}
            </>
          }
          onConfirm={commit}
          onCancel={() => setAction(null)}
        />
      ) : null}
    </div>
  );
}
