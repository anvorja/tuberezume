import { Library, Plus, Settings } from "lucide-react"
import { Link, NavLink, Outlet } from "react-router"

import { Wordmark } from "@/components/brand/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"

const NAV = [
  { to: "/app", label: "Nuevo", icon: Plus, end: true },
  { to: "/app/biblioteca", label: "Biblioteca", icon: Library, end: false },
  { to: "/app/ajustes", label: "Ajustes", icon: Settings, end: false },
]

/** Móvil: barra inferior. Escritorio: riel izquierdo. */
export function AppShell() {
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[15rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col justify-between border-r border-border p-5 md:flex">
        <div className="flex flex-col gap-10">
          <Link to="/" aria-label="TubeRezume, inicio">
            <Wordmark />
          </Link>
          <nav aria-label="Principal" className="flex flex-col gap-1">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex h-11 items-center gap-3 rounded-full px-4 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-surface-raised text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )
                }
              >
                <Icon className="size-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
        <ThemeToggle className="self-start" />
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-xl md:hidden">
          <Link to="/" aria-label="TubeRezume, inicio">
            <Wordmark />
          </Link>
          <ThemeToggle />
        </header>
        <main className="min-w-0 flex-1 pb-28 md:pb-0">
          <Outlet />
        </main>
      </div>

      <nav
        aria-label="Principal"
        className="safe-b fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/85 px-3 pt-2 pb-2 backdrop-blur-xl md:hidden"
      >
        <ul className="mx-auto grid max-w-md grid-cols-3 gap-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[0.7rem] font-medium transition-colors",
                    isActive ? "bg-surface-raised text-signal-ink" : "text-muted-foreground"
                  )
                }
              >
                <Icon className="size-5" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
