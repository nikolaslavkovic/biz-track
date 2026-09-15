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
  { to: "/projekti", label: "Projekti", icon: FolderKanban },
  { to: "/troskovi", label: "Troškovi", icon: Wallet },
  { to: "/radnici", label: "Radnici", icon: Users },
];

export function AppNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--ink)] text-[var(--bg)]">
            <ClipboardList className="h-5 w-5" />
          </span>
          <div>
            <div className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight sm:text-xl">
              FirmaRačun
            </div>
            <div className="hidden text-xs text-[var(--muted)] sm:block">
              Offline · podaci na telefonu
            </div>
          </div>
        </div>
        <nav className="flex items-center gap-1 overflow-x-auto">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[var(--ink)] text-[var(--bg)]"
                    : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]",
                )
              }
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
