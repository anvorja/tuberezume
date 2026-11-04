import * as React from "react"
import { Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { Summary } from "@/lib/types"

const MAX = 20000
type Save = "saved" | "dirty" | "saving" | "error"

/** Apuntes del usuario sobre el video. Se guardan solos al dejar de escribir o con el botón. */
export function Notes({ item, onSave }: { item: Summary; onSave: (notes: string) => Promise<void> }) {
  const [text, setText] = React.useState(item.notes ?? "")
  const [state, setState] = React.useState<Save>("saved")
  const [error, setError] = React.useState<string | null>(null)
  const latest = React.useRef(text)
  const savedText = React.useRef(item.notes ?? "")
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const save = React.useCallback(
    async (value: string) => {
      clearTimeout(timer.current)
      if (value === savedText.current) {
        setState("saved")
        return
      }
      setState("saving")
      try {
        await onSave(value)
        savedText.current = value
        setError(null)
        setState(latest.current === value ? "saved" : "dirty")
      } catch (e) {
        setError(e instanceof Error ? e.message : "No pudimos guardar las notas.")
        setState("error")
      }
    },
    [onSave]
  )

  // Al salir de la pestaña o de la página se guarda lo pendiente.
  React.useEffect(
    () => () => {
      clearTimeout(timer.current)
      if (latest.current !== savedText.current) void onSave(latest.current).catch(() => {})
    },
    [onSave]
  )

  const change = (v: string) => {
    setText(v)
    latest.current = v
    setState("dirty")
    clearTimeout(timer.current)
    timer.current = setTimeout(() => void save(v), 1500)
  }

  const status =
    state === "saving"
      ? "Guardando…"
      : state === "dirty"
        ? "Cambios sin guardar"
        : state === "error"
          ? (error ?? "No se pudo guardar")
          : "Guardado"

  return (
    <div className="flex max-w-[62ch] flex-col gap-3">
      <label htmlFor="notes" className="sr-only">
        Mis notas sobre este video
      </label>
      <textarea
        id="notes"
        value={text}
        maxLength={MAX}
        onChange={(e) => change(e.target.value)}
        onBlur={() => void save(text)}
        placeholder="Escribe aquí tus apuntes, ideas o dudas sobre este video…"
        className="min-h-64 w-full resize-y rounded-xl border border-border bg-surface p-4 leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-signal"
      />
      <div className="flex items-center justify-between gap-3">
        <p
          role="status"
          className={state === "error" ? "text-sm text-destructive" : "text-sm text-muted-foreground"}
        >
          {state === "saved" && <Check className="mr-1 inline size-3.5" />}
          {status}
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => void save(text)}
          disabled={state === "saving" || state === "saved"}
        >
          Guardar notas
        </Button>
      </div>
    </div>
  )
}
