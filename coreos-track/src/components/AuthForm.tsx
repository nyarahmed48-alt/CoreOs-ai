"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LoaderCircle, LockKeyhole } from "lucide-react";

type Mode = "login" | "register";

const COPY = {
  login: {
    title: "Sign in",
    hint: "Approved members only. New accounts wait for an admin.",
    action: "Sign in",
    footer: "Need an account?",
    footerLink: "/register",
    footerLinkText: "Request access",
  },
  register: {
    title: "Request access",
    hint: "Your account stays locked until an approved member accepts it.",
    action: "Create account",
    footer: "Already have an account?",
    footerLink: "/login",
    footerLinkText: "Sign in",
  },
} as const;

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const copy = COPY[mode];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const details = payload.details as Record<string, string> | undefined;
        setError(
          details?.email ?? details?.password ?? payload.error ?? "Something went wrong.",
        );
        return;
      }

      router.replace(payload.next ?? "/entries");
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p
            className="text-2xl font-bold tracking-[0.3em]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            TRACKER
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted">
            CoreOs Track
          </p>
        </div>

        <form onSubmit={onSubmit} className="card space-y-5">
          <div className="flex items-center gap-2">
            <LockKeyhole className="h-4 w-4 text-accent" aria-hidden />
            <h1 className="page-title text-lg">{copy.title}</h1>
          </div>
          <p className="text-xs leading-relaxed text-muted">{copy.hint}</p>

          <div className="space-y-2">
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              className="field"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
            />
          </div>

          <div className="space-y-2">
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={8}
              className="field"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
            />
          </div>

          {error ? (
            <p className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-xs text-danger">
              {error}
            </p>
          ) : null}

          <button type="submit" className="btn-primary w-full" disabled={pending}>
            {pending ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            {copy.action}
          </button>

          <p className="text-center text-xs text-muted">
            {copy.footer}{" "}
            <Link href={copy.footerLink} className="text-accent-ink hover:underline">
              {copy.footerLinkText}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
