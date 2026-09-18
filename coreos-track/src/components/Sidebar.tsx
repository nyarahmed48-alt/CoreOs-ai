"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Download,
  LayoutGrid,
  Plus,
  Receipt,
  Settings,
  Shield,
  TrendingUp,
} from "lucide-react";

const NAV = [
  { href: "/entries", label: "Entries", icon: LayoutGrid },
  { href: "/stats", label: "Stats", icon: TrendingUp },
  { href: "/receipt", label: "Receipt", icon: Receipt },
  { href: "/export", label: "Export", icon: Download },
  { href: "/security", label: "Security", icon: Shield, adminOnly: true },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar({
  email,
  isAdmin,
}: {
  email: string;
  isAdmin: boolean;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-line bg-surface/60 px-4 py-6 max-lg:hidden">
      <Link
        href="/entries"
        className="px-3 text-lg font-bold tracking-[0.35em]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        TRACKER
      </Link>

      <nav className="mt-10 flex flex-1 flex-col gap-1">
        {NAV.filter((item) => !("adminOnly" in item && item.adminOnly) || isAdmin).map(
          ({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  active
                    ? "bg-accent-soft text-ink"
                    : "text-muted hover:bg-surface-2 hover:text-ink"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </Link>
            );
          },
        )}
      </nav>

      <div className="space-y-3 border-t border-line pt-4">
        <p className="truncate px-1 text-[11px] text-muted" title={email}>
          {email}
        </p>
        <Link href="/entries?new=1" className="btn-primary w-full">
          <Plus className="h-4 w-4" aria-hidden />
          Manual entry
        </Link>
      </div>
    </aside>
  );
}

/** Compact nav for narrow screens — the sidebar collapses below `lg`. */
export function MobileNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto border-b border-line bg-surface/60 px-4 py-3 lg:hidden">
      {NAV.filter((item) => !("adminOnly" in item && item.adminOnly) || isAdmin).map(
        ({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs transition ${
                active ? "bg-accent-soft text-ink" : "text-muted hover:text-ink"
              }`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {label}
            </Link>
          );
        },
      )}
    </nav>
  );
}
