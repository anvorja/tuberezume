import * as React from "react"
import { Check, Plus, Tag as TagIcon } from "lucide-react"
import { Popover } from "radix-ui"

import { cleanTag, MAX_TAGS, tagColor } from "@/lib/tags"
import { cn } from "@/lib/utils"

export function TagDot({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("size-2 shrink-0 rounded-full", className)}
      style={{ background: tagColor(name) }}
    />
  )
}

/** Etiquetas en línea. Con `onSelect` cada una es un botón (p. ej. para filtrar la biblioteca). */
export function TagChips({
  tags,
  onSelect,
  max,
  className,
}: {
  tags: string[]
  onSelect?: (tag: string) => void
  max?: number
  className?: string
}) {
  if (!tags.length) return null
  const shown = max ? tags.slice(0, max) : tags
  const rest = tags.length - shown.length
  const chip =
    "inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-background/40 px-2 py-0.5 text-xs text-muted-foreground"
  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)} aria-label="Etiquetas">
      {shown.map((t) => (
        <li key={t} className="max-w-full">
          {onSelect ? (
            <button
              type="button"
              onClick={() => onSelect(t)}
              className={cn(chip, "transition-colors hover:border-signal-ink/60 hover:text-foreground")}
            >
              <TagDot name={t} />
              <span className="truncate">{t}</span>
            </button>
          ) : (
            <span className={chip}>
              <TagDot name={t} />
              <span className="truncate">{t}</span>
            </span>
          )}
        </li>
      ))}
      {rest > 0 && (
        <li className={chip} title={tags.slice(max).join(", ")}>
          +{rest}
        </li>
      )}
    </ul>
  )
}

/**
 * Ventana para elegir o crear etiquetas de un video. Escribe y pulsa Enter para crear;
 * pulsa una existente para ponerla o quitarla. Reutiliza la grafía de las que ya existen.
 */
export function TagPicker({
  value,
  known,
  onChange,
  trigger,
  align = "end",
}: {
  value: string[]
  /** todas las etiquetas ya usadas en la biblioteca */
  known: string[]
  onChange: (tags: string[]) => Promise<void>
  trigger: React.ReactNode
  align?: "start" | "center" | "end"
}) {
  const [text, setText] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  const has = (t: string) => value.some((v) => v.toLocaleLowerCase() === t.toLocaleLowerCase())
  const options = React.useMemo(() => {
    const all = [...known]
    for (const v of value) if (!all.some((k) => k.toLocaleLowerCase() === v.toLocaleLowerCase())) all.push(v)
    const q = text.trim().toLocaleLowerCase()
    return q ? all.filter((t) => t.toLocaleLowerCase().includes(q)) : all
  }, [known, value, text])

  const apply = async (next: string[]) => {
    setBusy(true)
    setError(null)
    try {
      await onChange(next)
      setText("")
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos guardar las etiquetas.")
    } finally {
      setBusy(false)
    }
  }

  const toggle = (t: string) =>
    apply(has(t) ? value.filter((v) => v.toLocaleLowerCase() !== t.toLocaleLowerCase()) : [...value, t])

  const create = () => {
    const t = cleanTag(text)
    if (!t) {
      setError(text.trim() ? "Usa hasta 24 letras, números, espacios o . + # & -" : null)
      return
    }
    // Si ya existe con otra grafía (java / Java), se reutiliza la existente.
    const existing = known.find((k) => k.toLocaleLowerCase() === t.toLocaleLowerCase()) ?? t
    if (has(existing)) {
      setText("")
      return
    }
    if (value.length >= MAX_TAGS) {
      setError(`Máximo ${MAX_TAGS} etiquetas por video.`)
      return
    }
    void apply([...value, existing])
  }

  const typed = cleanTag(text)
  const canCreate = !!typed && !known.some((k) => k.toLocaleLowerCase() === typed.toLocaleLowerCase())

  return (
    <Popover.Root onOpenChange={(o) => !o && (setText(""), setError(null))}>
      <Popover.Trigger asChild>{trigger}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align={align}
          sideOffset={6}
          collisionPadding={12}
          className="dialog-content z-50 flex w-[min(86vw,17rem)] flex-col gap-3 rounded-xl border border-border bg-surface-raised p-3 shadow-2xl outline-none"
        >
          <label className="sr-only" htmlFor="tag-input">
            Nueva etiqueta
          </label>
          <input
            id="tag-input"
            value={text}
            maxLength={24}
            disabled={busy}
            onChange={(e) => {
              setText(e.target.value)
              setError(null)
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault()
                create()
              }
            }}
            placeholder="Buscar o crear etiqueta…"
            autoComplete="off"
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-signal"
          />
          <ul className="flex max-h-48 flex-col gap-0.5 overflow-y-auto" aria-label="Etiquetas disponibles">
            {options.map((t) => (
              <li key={t}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={has(t)}
                  disabled={busy}
                  onClick={() => void toggle(t)}
                  className="flex h-9 w-full items-center gap-2 rounded-lg px-2 text-left text-sm transition-colors hover:bg-background/60"
                >
                  <TagDot name={t} />
                  <span className="min-w-0 flex-1 truncate">{t}</span>
                  {has(t) && <Check className="size-4 text-signal-ink" />}
                </button>
              </li>
            ))}
            {canCreate && (
              <li>
                <button
                  type="button"
                  disabled={busy}
                  onClick={create}
                  className="flex h-9 w-full items-center gap-2 rounded-lg px-2 text-left text-sm text-signal-ink transition-colors hover:bg-background/60"
                >
                  <Plus className="size-4" />
                  <span className="truncate">Crear «{typed}»</span>
                </button>
              </li>
            )}
            {options.length === 0 && !canCreate && (
              <li className="px-2 py-2 text-sm text-muted-foreground">
                Escribe un nombre y pulsa Enter para crear tu primera etiqueta.
              </li>
            )}
          </ul>
          <p role="alert" className={cn("min-h-4 text-xs text-destructive", !error && "hidden")}>
            {error}
          </p>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

/** Botón estándar que abre el selector. */
export const TagButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { label?: string; count?: number }
>(function TagButton({ label, count = 0, className, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label ?? "Editar etiquetas"}
      title={label ?? "Editar etiquetas"}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-full border border-border bg-background/60 text-muted-foreground backdrop-blur transition-colors hover:border-signal-ink/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-signal focus-visible:outline-none",
        count > 0 && "text-foreground",
        className
      )}
      {...props}
    >
      <TagIcon className="size-4" />
    </button>
  )
})
