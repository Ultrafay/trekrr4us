import "./globals.css";
import type { Metadata } from "next";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Spideyyy 🕷️ × Muuunn 🌙 — Our Library",
  description: "A small library, just for two.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main className="max-w-3xl mx-auto px-5 pb-20 pt-6">{children}</main>
      </body>
    </html>
  );
}
