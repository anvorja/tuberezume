import * as React from "react"
import { Navigate } from "react-router"

import { Button } from "@/components/ui/button"
import { getConnection, hasSession, login, normalizeUrl } from "@/lib/api"

const input =
  "h-11 rounded-lg border border-border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-signal"

export default function Login() {
  const saved = getConnection()
  const [url, setUrl] = React.useState(saved?.url ?? "")
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  if (hasSession()) return <Navigate to="/app" replace />

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const clean = normalizeUrl(url)
    if (!/^https?:\/\//i.test(clean)) {
      setError("La dirección debe empezar por https:// (o http:// en local).")
      return
    }
    if (
      clean.startsWith("http://") &&
      !/^http:\/\/(localhost|127\.0\.0\.1)/.test(clean) &&
      location.protocol === "https:"
    ) {
      setError("Esta página usa https; el servidor también debe usar https.")
      return
    }
    setBusy(true)
    setError(null)
    try {
      await login(clean, username.trim(), password)
      // Toda la biblioteca depende de la sesión: se recarga limpio.
      location.assign("/app")
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos iniciar sesión.")
      setBusy(false)
    }
  }

  return (
    <div className="flex max-w-lg flex-col gap-8 px-4 py-10 md:px-12 md:py-16">
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-semibold md:text-6xl">Entrar</h1>
        <p className="text-muted-foreground">
          Inicia sesión para ver tu historial desde cualquier equipo. Sin sesión, la app funciona en modo
          demostración.
        </p>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
        <label className="flex flex-col gap-1 text-sm">
          Dirección del servidor
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://tu-servidor"
            type="url"
            inputMode="url"
            enterKeyHint="next"
            autoCapitalize="none"
            spellCheck={false}
            className={input}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Usuario
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            enterKeyHint="next"
            autoCapitalize="none"
            spellCheck={false}
            className={input}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            enterKeyHint="go"
            className={input}
          />
        </label>
        <p role="alert" className="min-h-5 text-sm text-destructive">
          {error}
        </p>
        <Button type="submit" disabled={busy || !url || !username || !password} className="w-full sm:w-fit">
          {busy ? "Entrando…" : "Entrar"}
        </Button>
      </form>
    </div>
  )
}
