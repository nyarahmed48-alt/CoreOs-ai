/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The Book River mark, redrawn as vector art: a fan of leaves rising from an
 * open book — the tree-over-a-book of their Instagram avatar, simplified so it
 * still reads at 20px in the chat launcher.
 */

const LEAVES = [-70, -47, -23, 0, 23, 47, 70];

export function RiverMark({ className = "", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" fill="none">
      {/* Leaves, fanned around the top of the trunk. */}
      {LEAVES.map((deg, i) => (
        <ellipse
          key={deg}
          cx="32"
          cy={i % 2 ? 18 : 14}
          rx="4.2"
          ry="7.5"
          transform={`rotate(${deg} 32 38)`}
          fill={color}
          opacity={i % 2 ? 0.75 : 1}
        />
      ))}
      <path d="M32 38V27" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
      {/* Open book. */}
      <path
        d="M8 44c8-3 16-3 24 2 8-5 16-5 24-2v8c-8-3-16-3-24 2-8-5-16-5-24-2z"
        fill={color}
      />
    </svg>
  );
}
