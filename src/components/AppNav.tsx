import { NavLink } from "react-router-dom";
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
      {/* Top brand bar — safe from status bar */}
      <header
        className="sticky top-0 z-40 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--bg)_94%,transparent)] backdrop-blur-md"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--ink)] text-[var(--bg)]">
            <ClipboardList className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="truncate font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
              FirmaRačun
            </div>
            <div className="truncate text-xs text-[var(--muted)]">
              Offline · podaci na telefonu
            </div>
          </div>

          {/* Desktop top nav */}
          <nav className="ml-auto hidden items-center gap-1 md:flex">
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex min-h-11 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[var(--ink)] text-[var(--bg)]"
                      : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]",
                  )
                }
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* Mobile bottom tabs — large touch targets */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--line)] bg-[var(--surface)] md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto grid max-w-6xl grid-cols-4">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] font-semibold",
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
