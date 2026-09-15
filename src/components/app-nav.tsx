"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  FolderKanban,
  LayoutDashboard,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Pregled", icon: LayoutDashboard },
  { href: "/projekti", label: "Projekti", icon: FolderKanban },
  { href: "/troskovi", label: "Troškovi", icon: Wallet },
  { href: "/radnici", label: "Radnici i sati", icon: Users },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="group flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--ink)] text-[var(--bg)] shadow-sm">
            <ClipboardList className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-[var(--ink)] sm:text-xl">
              FirmaRačun
            </span>
            <span className="hidden text-xs text-[var(--muted)] sm:block">
              Troškovi · sati · zarada
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 overflow-x-auto">
          {links.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-[var(--ink)] text-[var(--bg)]"
                    : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]",
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
