import type { Metadata } from "next";
import "./globals.css";
import { PreferencesProvider } from "@/components/PreferencesProvider";

export const metadata: Metadata = {
  title: "CoreOs Track",
  description:
    "Business operations tracking — entries, statistics, receipts and access control.",
};

/**
 * Applied before paint so a light-theme user never sees a dark flash.
 * Mirrors the keys written by PreferencesProvider.
 */
const themeBootstrap = `
try {
  var t = localStorage.getItem("coreos.theme");
  if (t === "light" || t === "dark") document.documentElement.dataset.theme = t;
} catch (e) {}
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-canvas text-ink antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        <PreferencesProvider>{children}</PreferencesProvider>
      </body>
    </html>
  );
}
