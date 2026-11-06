import * as React from "react"
import { toast } from "sonner"

import { api } from "./api"
import { useSession } from "./session"
import type { Summary } from "./types"

type LoadState = "loading" | "ready" | "error"

interface LibraryContextValue {
  items: Summary[]
  state: LoadState
  error: string | null
  reload: () => Promise<void>
  /** Crea el resumen y devuelve su id. Lanza con un mensaje legible. */
  submit: (url: string) => Promise<string>
  remove: (id: string) => Promise<void>
  /** Vuelve a poner en cola un resumen interrumpido por un reinicio del servidor. */
  resume: (id: string) => Promise<void>
  saveNotes: (id: string, notes: string) => Promise<void>
  /** Cambia las etiquetas al instante y deshace el cambio si el servidor lo rechaza. */
  setTags: (id: string, tags: string[]) => Promise<void>
}

const LibraryContext = React.createContext<LibraryContextValue | null>(null)

const isActive = (s: Summary) =>
  s.status === "queued" ||
  s.status === "transcribing" ||
  s.status === "summarizing"

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<Summary[]>([])
  const [state, setState] = React.useState<LoadState>("loading")
  const [error, setError] = React.useState<string | null>(null)

  const { status, role } = useSession()

  const reload = React.useCallback(async () => {
    if (role === "admin") return
    try {
      const list = await api.list()
      setItems(list)
      setError(null)
      setState("ready")
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos cargar tu biblioteca.")
      setState("error")
    }
  }, [role])

  React.useEffect(() => {
    // Espera a validar la sesión; el administrador no tiene resúmenes.
    if (status === "loading") return
    let alive = true
    const first: Promise<Summary[]> = role === "admin" ? Promise.resolve([]) : api.list()
    first
      .then((list) => {
        if (!alive) return
        setItems(list)
        setState("ready")
        const stuck = list.filter((s) => s.status === "interrupted").length
        if (stuck > 0) {
          toast.warning(
            stuck === 1
              ? "Un resumen quedó interrumpido porque el servidor se reinició."
              : `${stuck} resúmenes quedaron interrumpidos porque el servidor se reinició.`,
            { id: "interrupted", description: "Ábrelos en la biblioteca para reanudarlos o descartarlos." }
          )
        }
      })
      .catch((e) => {
        if (!alive) return
        setError(e instanceof Error ? e.message : "No pudimos cargar tu biblioteca.")
        setState("error")
      })
    return () => {
      alive = false
    }
  }, [status, role])

  // Mientras haya trabajos activos, se consulta su avance cada 1,2 s.
  const activeIds = items.filter(isActive).map((s) => s.id).join(",")
  React.useEffect(() => {
    if (!activeIds) return
    const timer = setInterval(async () => {
      try {
        const next = await Promise.all(activeIds.split(",").map((id) => api.get(id)))
        setItems((prev) =>
          prev.map((p) => next.find((n) => n.id === p.id) ?? p)
        )
      } catch {
        /* el próximo ciclo reintenta */
      }
    }, 1200)
    return () => clearInterval(timer)
  }, [activeIds])

  const submit = React.useCallback(async (url: string) => {
    const created = await api.create(url)
    setItems((prev) => [created, ...prev.filter((p) => p.id !== created.id)])
    return created.id
  }, [])

  const remove = React.useCallback(async (id: string) => {
    await api.remove(id)
    setItems((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const resume = React.useCallback(async (id: string) => {
    const updated = await api.resume(id)
    setItems((prev) => prev.map((p) => (p.id === id ? updated : p)))
  }, [])

  const saveNotes = React.useCallback(async (id: string, notes: string) => {
    const updated = await api.saveNotes(id, notes)
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, notes: updated.notes } : p)))
  }, [])

  const setTags = React.useCallback(async (id: string, tags: string[]) => {
    let previous: string[] | undefined
    setItems((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        previous = p.tags
        return { ...p, tags }
      })
    )
    try {
      const saved = await api.saveTags(id, tags)
      // El servidor limpia las etiquetas (espacios, repetidas): se usa su versión.
      setItems((prev) => prev.map((p) => (p.id === id ? { ...p, tags: saved.tags ?? tags } : p)))
    } catch (e) {
      setItems((prev) => prev.map((p) => (p.id === id ? { ...p, tags: previous } : p)))
      throw e
    }
  }, [])

  const value = React.useMemo(
    () => ({ items, state, error, reload, submit, remove, resume, saveNotes, setTags }),
    [items, state, error, reload, submit, remove, resume, saveNotes, setTags]
  )
  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}

export function useLibrary() {
  const ctx = React.useContext(LibraryContext)
  if (!ctx) throw new Error("useLibrary debe usarse dentro de LibraryProvider")
  return ctx
}

export { isActive }
