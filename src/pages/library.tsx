import * as React from "react"
import { Search } from "lucide-react"
import { Link } from "react-router"

import { Button } from "@/components/ui/button"
import { VideoCard } from "@/components/video-card"
import { isActive, useLibrary } from "@/lib/library"
import { cn } from "@/lib/utils"

const FILTERS = [
  { id: "all", label: "Todos" },
  { id: "ready", label: "Listos" },
  { id: "active", label: "En proceso" },
] as const

export default function Library() {
  const { items, state, error, reload } = useLibrary()
  const [q, setQ] = React.useState("")
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]["id"]>("all")

  const shown = items.filter((s) => {
    if (filter === "ready" && s.status !== "ready") return false
    if (filter === "active" && !isActive(s)) return false
    const needle = q.trim().toLowerCase()
    return !needle || `${s.title} ${s.channel}`.toLowerCase().includes(needle)
  })

  return (
    <div className="flex flex-col gap-8 px-4 py-8 md:px-12 md:py-12">
      <h1 className="text-4xl font-semibold md:text-6xl">Biblioteca</h1>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="thread-ring flex flex-1 items-center gap-2 bg-surface px-4 md:max-w-md">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <label htmlFor="lib-q" className="sr-only">Buscar resúmenes</label>
          <input
            id="lib-q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por título o canal"
            className="h-11 min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground/80"
          />
        </div>
        <div role="radiogroup" aria-label="Filtrar por estado" className="flex gap-1 self-start rounded-full border border-border bg-surface p-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              role="radio"
              aria-checked={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "h-9 rounded-full px-4 text-sm font-medium transition-colors",
                filter === f.id ? "bg-signal text-primary-foreground" : "text-muted-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {state === "loading" && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton aspect-[4/3] rounded-xl" />
          ))}
        </div>
      )}

      {state === "error" && (
        <div className="flex max-w-md flex-col items-start gap-4 rounded-xl border border-border bg-surface p-6">
          <p className="font-display text-xl font-semibold">No pudimos cargar tu biblioteca</p>
          <p className="text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={() => void reload()}>Reintentar</Button>
        </div>
      )}

      {state === "ready" && shown.length === 0 && (
        <div className="flex max-w-md flex-col items-start gap-4 py-8">
          <p className="font-display text-2xl font-semibold">
            {items.length === 0 ? "Tu biblioteca está vacía" : "Nada coincide con tu búsqueda"}
          </p>
          <p className="text-muted-foreground">
            {items.length === 0
              ? "Cada video que resumas se guarda aquí para que puedas volver a él."
              : "Prueba con otro título, otro canal o quita el filtro."}
          </p>
          {items.length === 0 && (
            <Button asChild><Link to="/app">Resumir un video</Link></Button>
          )}
        </div>
      )}

      {state === "ready" && shown.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((s) => (
            <VideoCard key={s.id} item={s} />
          ))}
        </div>
      )}
    </div>
  )
}
