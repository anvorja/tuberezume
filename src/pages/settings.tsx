import { useTheme } from "@/components/theme-provider"
import { isMock } from "@/lib/api"
import { cn } from "@/lib/utils"
import * as React from "react"

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
              "h-10 shrink-0 rounded-full px-5 text-sm font-medium transition-colors",
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
      <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-5">
        <p className="font-medium">Conexión con el backend</p>
        <p className="text-sm text-muted-foreground">
          {isMock
            ? "Modo demostración: los resúmenes se simulan y se guardan en este navegador. Define VITE_API_URL para conectar tu servidor."
            : "Conectado a tu servidor a través de VITE_API_URL."}
        </p>
      </div>
    </div>
  )
}
