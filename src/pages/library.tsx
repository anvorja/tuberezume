import * as React from "react"
import { Folder, LayoutGrid, List, Search, X } from "lucide-react"
import { Link, useSearchParams } from "react-router"
import { toast } from "sonner"

import { TagDot } from "@/components/tags"
import { Button } from "@/components/ui/button"
import { GRID_CLASS, VideoCard, VideoRow } from "@/components/video-card"
import { isActive, useLibrary } from "@/lib/library"
import { collectTags, hasTag } from "@/lib/tags"
import { cn } from "@/lib/utils"

const FILTERS = [
  { id: "all", label: "Todos" },
  { id: "ready", label: "Listos" },
  { id: "active", label: "En proceso" },
] as const

type View = "grid" | "list"
const VIEW_KEY = "tr:view"
/** Valor especial del filtro: videos que aún no tienen ninguna etiqueta. */
const UNTAGGED = "__sin_etiqueta__"

function useView() {
  const [view, setView] = React.useState<View>(() => {
    try {
      return localStorage.getItem(VIEW_KEY) === "list" ? "list" : "grid"
    } catch {
      return "grid"
    }
  })
  const set = (v: View) => {
    setView(v)
    try {
      localStorage.setItem(VIEW_KEY, v)
    } catch {
      /* sin persistencia local */
    }
  }
  return [view, set] as const
}

const pill =
  "inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-3.5 md:h-9 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-signal focus-visible:outline-none"

export default function Library() {
  const { items, state, error, reload, setTags } = useLibrary()
  const [params, setParams] = useSearchParams()
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]["id"]>("all")
  const [view, setView] = useView()

  const tags = React.useMemo(() => collectTags(items), [items])
  const known = React.useMemo(() => tags.map((t) => t.name), [tags])
  const untagged = items.filter((s) => !(s.tags?.length)).length

  // La etiqueta activa vive en la URL (?etiqueta=Java): se puede compartir y funciona el botón Atrás.
  const wanted = params.get("etiqueta")
  const tag =
    wanted === UNTAGGED
      ? UNTAGGED
      : wanted && tags.some((t) => t.name.toLocaleLowerCase() === wanted.toLocaleLowerCase())
        ? wanted
        : null
  // La búsqueda también vive en la URL: al volver desde un resumen con Atrás, el filtro sigue ahí.
  const q = params.get("q") ?? ""
  const setQ = (v: string) => {
    const next = new URLSearchParams(params)
    if (v) next.set("q", v)
    else next.delete("q")
    setParams(next, { replace: true })
  }
  const pickTag = (t: string | null) => {
    const next = new URLSearchParams(params)
    if (t) next.set("etiqueta", t)
    else next.delete("etiqueta")
    setParams(next, { replace: true })
  }

  const needle = q.trim().toLowerCase()
  const shown = items.filter((s) => {
    if (filter === "ready" && s.status !== "ready") return false
    if (filter === "active" && !isActive(s)) return false
    if (tag === UNTAGGED ? (s.tags?.length ?? 0) > 0 : tag && !hasTag(s, tag)) return false
    return !needle || `${s.title} ${s.channel} ${(s.tags ?? []).join(" ")}`.toLowerCase().includes(needle)
  })

  const onTagsChange = async (id: string, next: string[]) => {
    try {
      await setTags(id, next)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No pudimos guardar las etiquetas.")
      throw e
    }
  }

  const cardProps = { knownTags: known, onTagsChange, onSelectTag: (t: string) => pickTag(t) }
  const title = tag === UNTAGGED ? "Sin etiqueta" : (tag ?? "Biblioteca")

  return (
    <div className="flex flex-col gap-5 px-4 py-6 md:gap-6 md:px-12 md:py-12">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="min-w-0 truncate text-3xl font-semibold sm:text-4xl md:text-6xl">{title}</h1>
        {state === "ready" && (
          <p className="shrink-0 text-sm text-muted-foreground tnum">
            {shown.length} {shown.length === 1 ? "video" : "videos"}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="thread-ring flex flex-1 items-center gap-2 bg-surface px-4 md:max-w-md">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <label htmlFor="lib-q" className="sr-only">Buscar resúmenes</label>
          <input
            id="lib-q"
            value={q}
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por título, canal o etiqueta"
            className="h-11 min-w-0 flex-1 appearance-none bg-transparent outline-none placeholder:text-muted-foreground/80 [&::-webkit-search-cancel-button]:hidden"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Borrar búsqueda"
              className="-mr-2 grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 sm:flex-wrap sm:gap-3">
          <div role="radiogroup" aria-label="Filtrar por estado" className="flex min-w-0 flex-1 gap-1 rounded-full border border-border bg-surface p-1 sm:flex-none">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                role="radio"
                aria-checked={filter === f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "h-10 flex-1 rounded-full px-3 text-sm font-medium whitespace-nowrap transition-colors sm:flex-none sm:px-4 md:h-9",
                  filter === f.id ? "bg-signal text-primary-foreground" : "text-muted-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div role="radiogroup" aria-label="Tipo de vista" className="flex shrink-0 gap-1 rounded-full border border-border bg-surface p-1 sm:ml-auto md:ml-0">
            {(
              [
                { id: "grid", label: "Miniaturas", icon: LayoutGrid },
                { id: "list", label: "Lista", icon: List },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                role="radio"
                aria-checked={view === id}
                aria-label={label}
                title={label}
                onClick={() => setView(id)}
                className={cn(
                  "grid size-10 place-items-center rounded-full transition-colors md:size-9",
                  view === id ? "bg-signal text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {state === "ready" && tags.length > 0 && (
        <div
          role="radiogroup"
          aria-label="Filtrar por etiqueta"
          className="rail -mx-4 flex gap-2 px-4 md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
        >
          <button
            role="radio"
            aria-checked={!tag}
            onClick={() => pickTag(null)}
            className={cn(pill, !tag ? "border-signal bg-signal text-primary-foreground" : "border-border bg-surface text-muted-foreground hover:text-foreground")}
          >
            <Folder className="size-4" />
            Todas
            <span className="tnum opacity-70">{items.length}</span>
          </button>
          {tags.map((t) => {
            const on = tag?.toLocaleLowerCase() === t.name.toLocaleLowerCase()
            return (
              <button
                key={t.name}
                role="radio"
                aria-checked={on}
                onClick={() => pickTag(on ? null : t.name)}
                className={cn(pill, on ? "border-signal-ink bg-surface-raised text-foreground" : "border-border bg-surface text-muted-foreground hover:text-foreground")}
              >
                <TagDot name={t.name} />
                {t.name}
                <span className="tnum opacity-70">{t.count}</span>
              </button>
            )
          })}
          {untagged > 0 && untagged < items.length && (
            <button
              role="radio"
              aria-checked={tag === UNTAGGED}
              onClick={() => pickTag(tag === UNTAGGED ? null : UNTAGGED)}
              className={cn(pill, "border-dashed", tag === UNTAGGED ? "border-signal-ink bg-surface-raised text-foreground" : "border-border text-muted-foreground hover:text-foreground")}
            >
              Sin etiqueta
              <span className="tnum opacity-70">{untagged}</span>
            </button>
          )}
        </div>
      )}

      {state === "loading" &&
        (view === "grid" ? (
          <div className={GRID_CLASS}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton aspect-[4/3] rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-[4.5rem] rounded-xl sm:h-[5.5rem]" />
            ))}
          </div>
        ))}

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
              : "Prueba con otro título, quita el filtro o cambia de etiqueta."}
          </p>
          {items.length === 0 ? (
            <Button asChild><Link to="/app">Resumir un video</Link></Button>
          ) : (
            (tag || q || filter !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setFilter("all")
                  setParams({}, { replace: true })
                }}
              >
                Quitar filtros
              </Button>
            )
          )}
        </div>
      )}

      {state === "ready" && shown.length > 0 && items.length > 0 && !tags.length && (
        <p className="-mt-2 text-sm text-muted-foreground">
          Consejo: pulsa el icono de etiqueta en un video para crear tu primera carpeta, por ejemplo «Java».
        </p>
      )}

      {state === "ready" && shown.length > 0 &&
        (view === "grid" ? (
          <div className={GRID_CLASS}>
            {shown.map((s) => (
              <VideoCard key={s.id} item={s} {...cardProps} />
            ))}
          </div>
        ) : (
          <div className="flex max-w-4xl flex-col gap-2">
            {shown.map((s) => (
              <VideoRow key={s.id} item={s} {...cardProps} />
            ))}
          </div>
        ))}
    </div>
  )
}
