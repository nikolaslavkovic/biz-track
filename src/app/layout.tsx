import type { Metadata } from "next";
import { Manrope, Syne } from "next/font/google";
import { AppNav } from "@/components/app-nav";
import { seedIfEmpty } from "@/db/seed";
import "./globals.css";

const display = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "FirmaRačun — praćenje troškova i zarade",
  description:
    "Web aplikacija za unos troškova, radnih sati, materijala i projekata firme, sa grafikonom zarade kroz vreme.",
};

export default async function RootLayout({
  children,
}: LayoutProps<"/">) {
  await seedIfEmpty();

  return (
    <html lang="sr" className={`${display.variable} ${body.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <AppNav />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
        <footer className="border-t border-[var(--line)] py-4 text-center text-xs text-[var(--muted)]">
          FirmaRačun · lokalna SQLite baza · podaci ostaju na disku
        </footer>
      </body>
    </html>
  );
}
