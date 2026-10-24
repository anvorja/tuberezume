import * as React from "react"

import { api } from "./api"
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

  const reload = React.useCallback(async () => {
    try {
      const list = await api.list()
      setItems(list)
      setError(null)
      setState("ready")
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos cargar tu biblioteca.")
      setState("error")
    }
  }, [])

  React.useEffect(() => {
    let alive = true
    api
      .list()
      .then((list) => {
        if (!alive) return
        setItems(list)
        setState("ready")
      })
      .catch((e) => {
        if (!alive) return
        setError(e instanceof Error ? e.message : "No pudimos cargar tu biblioteca.")
        setState("error")
      })
    return () => {
      alive = false
    }
  }, [])

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

  const value = React.useMemo(
    () => ({ items, state, error, reload, submit, remove }),
    [items, state, error, reload, submit, remove]
  )
  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}

export function useLibrary() {
  const ctx = React.useContext(LibraryContext)
  if (!ctx) throw new Error("useLibrary debe usarse dentro de LibraryProvider")
  return ctx
}

export { isActive }
