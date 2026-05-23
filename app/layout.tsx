import "./globals.css";
import type { Metadata, Viewport } from "next";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Spideyyy 🕷️ × Muuunn 🌙 — Our Library",
  description: "A small library, just for two.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main className="max-w-3xl mx-auto px-4 sm:px-5 pb-24 sm:pb-12 pt-5">
          {children}
        </main>
      </body>
    </html>
  );
}
