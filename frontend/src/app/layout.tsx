import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Supanova Inbox — Search Across the Ledger",
  description:
    "Visual control plane and universal search across the internal signal ledger for meetings, transcripts, and operational records.",
  authors: [{ name: "Palash" }],
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="antialiased bg-[#fbfbfd] text-zinc-950 selection:bg-emerald-500/20 selection:text-emerald-900"
      >
        {children}
      </body>
    </html>
  );
}
