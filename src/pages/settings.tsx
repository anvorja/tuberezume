import { useTheme } from "@/components/theme-provider"
import {
  getConnection,
  getWebSearch,
  isMock,
  normalizeUrl,
  saveConnection,
  setWebSearch,
} from "@/lib/api"
import { useSession } from "@/lib/session"
import { cn } from "@/lib/utils"
import * as React from "react"
import { Link } from "react-router"
import { toast } from "sonner"

function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: T
  onChange: (v: T) => void
  options: { id: T; label: string }[]
}) {
  return (
    <div className="flex flex-col gap-3">
      <p id={`seg-${label}`} className="font-medium">{label}</p>
      <div role="radiogroup" aria-labelledby={`seg-${label}`} className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-full border border-border bg-surface p-1">
        {options.map((o) => (
          <button
            key={o.id}
            role="radio"
            aria-checked={value === o.id}
            onClick={() => onChange(o.id)}
            className={cn(
              "h-11 shrink-0 rounded-full px-5 text-sm font-medium transition-colors",
              value === o.id ? "bg-signal text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function usePref<T extends string>(key: string, initial: T) {
  const [v, setV] = React.useState<T>(() => {
    try { return (localStorage.getItem(key) as T) ?? initial } catch { return initial }
  })
  const set = (n: T) => {
    setV(n)
    try { localStorage.setItem(key, n) } catch { /* sin almacenamiento */ }
  }
  return [v, set] as const
}

export default function Settings() {
  const { theme, setTheme } = useTheme()
  const [length, setLength] = usePref<"short" | "medium" | "long">("tr:length", "medium")
  const saved = getConnection()
  const [url, setUrl] = React.useState(saved?.url ?? "")
  const { username, role, canProcess, status, logout } = useSession()
  const [web, setWeb] = React.useState<"on" | "off">(getWebSearch() ? "on" : "off")

  function onSave(e: React.FormEvent) {
    e.preventDefault()
    const clean = normalizeUrl(url)
    if (clean && !/^https?:\/\//i.test(clean)) {
      toast.error("La dirección debe empezar por https:// (o http:// en local).")
      return
    }
    if (
      clean.startsWith("http://") &&
      !/^http:\/\/(localhost|127\.0\.0\.1)/.test(clean) &&
      location.protocol === "https:"
    ) {
      toast.error("Esta página usa https; el servidor también debe usar https.")
      return
    }
    // La sesión se conserva: sirve en cualquier servidor que comparta la base de datos.
    saveConnection(clean ? { url: clean, token: saved?.token ?? "" } : null)
    toast.success("Dirección guardada. Recargando…")
    // Todo el estado de la biblioteca depende de la conexión: lo más simple es recargar.
    setTimeout(() => location.reload(), 600)
  }

  return (
    <div className="flex max-w-2xl flex-col gap-10 px-4 py-8 md:px-12 md:py-12">
      <h1 className="text-4xl font-semibold md:text-6xl">Ajustes</h1>
      <Segmented
        label="Tema"
        value={theme}
        onChange={setTheme}
        options={[
          { id: "dark", label: "Oscuro" },
          { id: "light", label: "Claro" },
          { id: "system", label: "Sistema" },
        ]}
      />
      <Segmented
        label="Longitud del resumen"
        value={length}
        onChange={setLength}
        options={[
          { id: "short", label: "Corto" },
          { id: "medium", label: "Medio" },
          { id: "long", label: "Detallado" },
        ]}
      />
      <Segmented
        label="Búsqueda web en el resumen"
        value={web}
        onChange={(v) => {
          setWeb(v)
          setWebSearch(v === "on")
        }}
        options={[
          { id: "off", label: "No" },
          { id: "on", label: "Sí" },
        ]}
      />
      <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
        <p className="font-medium">Cuenta</p>
        {status === "anon" ? (
          <>
            <p className="text-sm text-muted-foreground">
              No has iniciado sesión. Entra para guardar y consultar tu historial desde cualquier equipo.
            </p>
            <Link to="/app/entrar" className="w-fit text-sm font-medium text-signal-ink hover:underline">
              Iniciar sesión
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Sesión como <span className="font-medium text-foreground">{username}</span>
              {role === "admin" ? " (administrador)" : ""}.{" "}
              {role === "user" &&
                (status === "offline"
                  ? "El servidor no responde."
                  : canProcess
                    ? "Este servidor procesa videos."
                    : "Este servidor es solo de consulta: no procesa videos.")}
            </p>
            <button
              type="button"
              onClick={logout}
              className="h-11 w-fit rounded-full border border-border px-5 text-sm font-medium hover:bg-surface-raised"
            >
              Cerrar sesión
            </button>
          </>
        )}
      </section>
      <form onSubmit={onSave} className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-col gap-1">
          <p className="font-medium">Conexión con el backend</p>
          <p className="text-sm text-muted-foreground">
            {isMock()
              ? "Modo demostración: los resúmenes se simulan y se guardan en este navegador."
              : "Conectado a tu servidor."}
          </p>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          Dirección del servidor
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://tu-tunel.ngrok-free.app"
            type="url"
            inputMode="url"
            enterKeyHint="done"
            autoCapitalize="none"
            spellCheck={false}
            className="h-11 rounded-lg border border-border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-signal"
          />
        </label>
        <p className="text-xs text-muted-foreground">
          Usa la dirección de tu equipo (ngrok) para procesar videos, o la del servidor en la nube solo para
          consultar tu historial. La dirección se guarda solo en este navegador.
        </p>
        <button
          type="submit"
          className="h-11 w-full rounded-full bg-signal px-6 sm:w-fit text-sm font-medium text-primary-foreground"
        >
          Guardar dirección
        </button>
      </form>
    </div>
  )
}
