import * as React from "react"
import { ArrowRight, ClipboardPaste } from "lucide-react"

import { Button } from "@/components/ui/button"
import { parseYouTubeId } from "@/lib/youtube"
import { cn } from "@/lib/utils"

interface ComposerProps {
  onSubmit: (url: string) => Promise<void> | void
  busy?: boolean
  id?: string
  className?: string
  autoFocus?: boolean
  onValueChange?: (value: string) => void
}

/** Campo para pegar el enlace: anillo-hilo en foco y mientras procesa. */
export function Composer({ onSubmit, busy, id, className, autoFocus, onValueChange }: ComposerProps) {
  const [value, setValue] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const inputId = React.useId()
  const errId = `${inputId}-err`

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (busy) return
    if (!value.trim()) {
      setError("Pega un enlace de YouTube para empezar.")
      return
    }
    if (!parseYouTubeId(value)) {
      setError("Ese enlace no parece de YouTube. Prueba con youtube.com/watch?v=… o youtu.be/…")
      return
    }
    setError(null)
    try {
      await onSubmit(value.trim())
      setValue("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos procesar el enlace.")
    }
  }

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        setValue(text)
        onValueChange?.(text)
        setError(null)
      }
    } catch {
      /* permiso denegado: el usuario pega a mano */
    }
  }

  return (
    <form onSubmit={submit} className={cn("w-full", className)} noValidate>
      <label htmlFor={id ?? inputId} className="sr-only">
        Enlace del video de YouTube
      </label>
      <div
        data-busy={busy ? "true" : "false"}
        className="thread-ring flex items-center gap-1 bg-surface p-1.5 pl-5 backdrop-blur-xl"
      >
        <input
          id={id ?? inputId}
          type="url"
          inputMode="url"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          autoFocus={autoFocus}
          value={value}
          disabled={busy}
          onChange={(e) => {
            setValue(e.target.value)
            onValueChange?.(e.target.value)
            if (error) setError(null)
          }}
          aria-invalid={!!error}
          aria-describedby={error ? errId : undefined}
          placeholder="youtube.com/watch?v=…"
          className="h-11 min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground/80 disabled:opacity-60"
        />
        {!value && !busy && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={paste}
            aria-label="Pegar desde el portapapeles"
            className="shrink-0"
          >
            <ClipboardPaste />
          </Button>
        )}
        <Button type="submit" size="lg" disabled={busy} className="shrink-0 pr-5 pl-6">
          {busy ? "Procesando" : "Resumir"}
          <ArrowRight className="transition-transform duration-300 ease-out-expo group-hover/button:translate-x-0.5" />
        </Button>
      </div>
      <p
        id={errId}
        role="alert"
        className={cn(
          "min-h-5 px-5 pt-2 text-sm text-destructive transition-opacity",
          error ? "opacity-100" : "opacity-0"
        )}
      >
        {error}
      </p>
    </form>
  )
}
