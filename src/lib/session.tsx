import * as React from "react"

import { fetchMe, getCachedUser, getConnection, hasSession, logout as doLogout } from "./api"
import type { Role } from "./types"

/**
 * anon: sin sesión (modo demostración) · loading: validando la sesión guardada
 * ready: sesión válida · offline: hay sesión pero el servidor no responde
 */
type Status = "anon" | "loading" | "ready" | "offline"

interface SessionValue {
  status: Status
  username: string | null
  role: Role | null
  /** true si el servidor conectado procesa videos (ngrok); false en el servidor de consulta */
  canProcess: boolean
  logout: () => void
}

const SessionContext = React.createContext<SessionValue | null>(null)

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const cached = getCachedUser()
  const [status, setStatus] = React.useState<Status>(hasSession() ? "loading" : "anon")
  const [user, setUser] = React.useState(cached)
  const [canProcess, setCanProcess] = React.useState(false)

  React.useEffect(() => {
    if (!hasSession()) return
    let alive = true
    fetchMe()
      .then((s) => {
        if (!alive) return
        setUser({ username: s.user.username, role: s.user.role })
        setCanProcess(s.canProcess)
        setStatus("ready")
      })
      .catch(() => {
        // Si la sesión era inválida, `http` ya la descartó y redirige; si no, el servidor está apagado.
        if (alive && hasSession()) setStatus("offline")
      })
    return () => {
      alive = false
    }
  }, [])

  const logout = React.useCallback(() => {
    doLogout()
    location.assign("/")
  }, [])

  const value = React.useMemo<SessionValue>(
    () => ({
      status,
      username: status === "anon" ? null : (user?.username ?? null),
      role: status === "anon" ? null : (user?.role ?? null),
      canProcess: status === "ready" ? canProcess : status === "anon",
      logout,
    }),
    [status, user, canProcess, logout]
  )
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const ctx = React.useContext(SessionContext)
  if (!ctx) throw new Error("useSession debe usarse dentro de SessionProvider")
  return ctx
}

export const serverUrl = () => getConnection()?.url ?? ""
