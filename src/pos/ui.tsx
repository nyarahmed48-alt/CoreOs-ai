/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The handful of primitives every till screen is built from.
 *
 * Sizes are set for a finger on a cheap touchscreen, not a mouse: nothing
 * interactive is under 40px tall, and the destructive actions are visually
 * quieter than the ones a cashier presses hundreds of times a day.
 */

import {
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { X } from "lucide-react";

type Variant = "primary" | "ghost" | "quiet" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-[#6c7bf0] text-[#05060a] hover:bg-[#8390f4] disabled:bg-[#2b3350] disabled:text-[#6b7490]",
  ghost:
    "border border-[#232b40] bg-[#0d1220] text-[#c3c9dd] hover:border-[#3a4460] hover:text-white",
  quiet: "text-[#98a0bb] hover:bg-[#141b2d] hover:text-white",
  danger:
    "border border-[#3d2230] bg-[#180f16] text-[#f0879d] hover:border-[#5d3346] hover:text-[#ffb0c0]",
};

export function Button({
  variant = "ghost",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl px-4 text-[14px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${className}`}
    />
  );
}

export function Field({
  label,
  hint,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.08em] text-[#7e87a5]">
        {label}
      </span>
      <input
        {...props}
        className={`h-[42px] w-full rounded-xl border border-[#232b40] bg-[#0a0f1c] px-3 text-[15px] text-[#e7eaf6] outline-none placeholder:text-[#5b6480] focus:border-[#6c7bf0] ${className}`}
      />
      {hint ? <span className="mt-1 block text-[12px] text-[#7e87a5]">{hint}</span> : null}
    </label>
  );
}

export function Select({
  label,
  children,
  value,
  onChange,
}: {
  label: string;
  children: ReactNode;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.08em] text-[#7e87a5]">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-[42px] w-full rounded-xl border border-[#232b40] bg-[#0a0f1c] px-3 text-[15px] text-[#e7eaf6] outline-none focus:border-[#6c7bf0]"
      >
        {children}
      </select>
    </label>
  );
}

/**
 * A modal that traps nothing and does very little on purpose: at a till the
 * only two exits that matter are Escape and the big button, and anything
 * cleverer gets in the way of a queue.
 */
export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#05060a]/80 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (!panel.current?.contains(event.target as Node)) onClose();
      }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-[#232b40] bg-[#0b1120] shadow-2xl sm:rounded-2xl ${wide ? "sm:max-w-3xl" : "sm:max-w-md"}`}
      >
        <div className="flex items-center justify-between border-b border-[#1b2337] px-5 py-3.5">
          <h2 className="font-display text-[16px] font-semibold text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-[#7e87a5] hover:bg-[#141b2d] hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="px-4 py-12 text-center text-[14px] text-[#6b7490]">{children}</p>
  );
}
