import * as React from "react"
import { Link, useLocation } from "react-router"

import { Wordmark } from "@/components/brand/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { hasSession } from "@/lib/api"
import { useSession } from "@/lib/session"

/** Página para rutas que no existen. Se queda fuera del índice de los buscadores. */
export default function NotFound() {
  const { pathname } = useLocation()
  const { role } = useSession()

  React.useEffect(() => {
    const previous = document.title
    document.title = "Página no encontrada · TubeRezume"
    const meta = document.createElement("meta")
    meta.name = "robots"
    meta.content = "noindex"
    document.head.appendChild(meta)
    return () => {
      document.title = previous
      meta.remove()
    }
  }, [])

  const home = role === "admin" ? "/admin/usuarios" : "/"
  const homeLabel = role === "admin" ? "Ir a Usuarios" : "Ir al inicio"

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="safe-t flex min-h-16 items-center justify-between px-4 md:px-12">
        <Link to="/" aria-label="TubeRezume, inicio">
          <Wordmark />
        </Link>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 flex-col justify-center gap-6 px-4 pb-24 md:px-12">
        <p aria-hidden className="font-display text-[clamp(6rem,28vw,14rem)] leading-[0.85] font-semibold tracking-tighter text-signal-ink">
          404
        </p>
        <div className="flex max-w-xl flex-col gap-3">
          <h1 className="text-3xl font-semibold md:text-5xl">Esta página no existe</h1>
          <p className="text-muted-foreground">
            No encontramos <span className="font-mono text-sm break-all text-foreground">{pathname}</span>. Puede que el
            enlace esté mal escrito o que el resumen ya no esté disponible.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild size="lg">
            <Link to={home}>{homeLabel}</Link>
          </Button>
          {hasSession() && role !== "admin" && (
            <Button asChild size="lg" variant="outline">
              <Link to="/biblioteca">Mi biblioteca</Link>
            </Button>
          )}
        </div>
      </main>
    </div>
  )
}
