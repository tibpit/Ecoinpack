import type { Metadata } from "next";
import Link from "next/link";
import { Archivo, IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  weight: ["500", "600", "700", "800", "900"],
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex-mono",
  weight: ["400", "500", "600"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "RedPen Profile — Brutally honest LinkedIn profile audit & rewrite",
  description:
    "Upload your LinkedIn PDF, get a free score and headline rewrite. Unlock the full AI rewrite — About, every experience, quick wins — for $19. No login, no scraping.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${archivo.variable} ${plexMono.variable} ${inter.variable} min-h-screen flex flex-col antialiased`}
      >
        <header className="border-b-2 border-ink">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
            <Link href="/" className="font-display text-xl font-black tracking-tight">
              Red<span className="text-red">Pen</span> Profile
            </Link>
            <nav className="flex items-center gap-5">
              <Link href="/audit" className="font-mono text-sm hover:text-red">
                Free audit
              </Link>
              <Link
                href="/audit"
                className="bg-ink px-4 py-2 font-mono text-sm font-semibold text-paper hover:bg-red"
              >
                Get my rewrite →
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t-2 border-ink">
          <div className="mx-auto flex max-w-5xl flex-col gap-2 px-5 py-6 font-mono text-xs text-ink/70 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} RedPen Profile. All rights reserved.</p>
            <p>
              Not affiliated with LinkedIn Corporation. We never connect to your account —
              you upload, we edit.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
