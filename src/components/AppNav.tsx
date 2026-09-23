import { Link, NavLink } from "react-router-dom";
import {
  ClipboardList,
  FolderKanban,
  LayoutDashboard,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "../lib/utils";

const links = [
  { to: "/", label: "Pregled", icon: LayoutDashboard, end: true },
  { to: "/projekti", label: "Hale", icon: FolderKanban },
  { to: "/troskovi", label: "Troškovi", icon: Wallet },
  { to: "/radnici", label: "Radnici", icon: Users },
];

export function AppNav() {
  return (
    <>
      {/* Samo brend gore — tabovi su uvek dole */}
      <header
        className="sticky top-0 z-40 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--bg)_94%,transparent)] backdrop-blur-md"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto flex max-w-6xl items-center px-4 py-2.5 sm:px-6">
          <Link
            to="/"
            aria-label="FirmaRačun — početna"
            className="flex min-w-0 items-center gap-3 rounded-lg active:opacity-70"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--ink)] text-[var(--bg)]">
              <ClipboardList className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="truncate font-[family-name:var(--font-display)] text-base font-semibold tracking-tight sm:text-lg">
                FirmaRačun
              </div>
              <div className="truncate text-[11px] text-[var(--muted)] sm:text-xs">
                Podaci u browseru
              </div>
            </div>
          </Link>
        </div>
      </header>

      {/* Donji tabovi — telefon i desktop */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--line)] bg-[var(--surface)] shadow-[0_-4px_20px_rgba(20,32,43,0.06)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto grid max-w-lg grid-cols-4">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex min-h-[3.5rem] flex-col items-center justify-center gap-0.5 px-1 pt-1.5 pb-1 text-[11px] font-semibold",
                  isActive ? "text-[var(--accent)]" : "text-[var(--muted)]",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg",
                      isActive ? "bg-teal-50" : "",
                    )}
                  >
                    <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                  </span>
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
