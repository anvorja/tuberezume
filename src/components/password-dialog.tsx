import * as React from "react"
import { Dialog } from "radix-ui"
import { KeyRound } from "lucide-react"

import { Button } from "@/components/ui/button"

const MIN = 8

/**
 * Cambio de contraseña de otro usuario (administrador). Sustituye a window.prompt:
 * campo enmascarado, validación en línea y el diálogo sigue abierto si el servidor falla.
 */
export function PasswordDialog({
  username,
  open,
  onOpenChange,
  onConfirm,
}: {
  username: string
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Debe lanzar si falla; el diálogo queda abierto con el aviso. */
  onConfirm: (password: string) => Promise<void>
}) {
  const [pw, setPw] = React.useState("")
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const reset = () => {
    setPw("")
    setError(null)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pw.length < MIN) {
      setError(`La contraseña debe tener al menos ${MIN} caracteres.`)
      return
    }
    setPending(true)
    setError(null)
    try {
      await onConfirm(pw)
      reset()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos cambiar la contraseña.")
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        if (pending) return
        if (!o) reset()
        onOpenChange(o)
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay fixed inset-0 z-50 bg-background/70 backdrop-blur-sm" />
        <Dialog.Content className="dialog-content fixed top-[max(1rem,10dvh)] left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[min(92vw,26rem)] -translate-x-1/2 overflow-y-auto rounded-2xl border border-border bg-surface-raised p-6 shadow-2xl outline-none md:top-1/2 md:-translate-y-1/2">
          <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
            <div className="flex flex-col gap-2">
              <Dialog.Title className="font-display text-2xl leading-tight font-semibold tracking-tight">
                Cambiar contraseña
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                Nueva contraseña para «{username}». Mínimo {MIN} caracteres.
              </Dialog.Description>
            </div>
            <label className="flex flex-col gap-1 text-sm">
              Nueva contraseña
              <input
                type="password"
                value={pw}
                autoFocus
                disabled={pending}
                autoComplete="new-password"
                enterKeyHint="done"
                aria-invalid={!!error}
                onChange={(e) => {
                  setPw(e.target.value)
                  setError(null)
                }}
                className="h-11 rounded-lg border border-border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-signal"
              />
            </label>
            <p role="alert" className={error ? "text-sm text-destructive" : "hidden"}>
              {error}
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Dialog.Close asChild>
                <Button type="button" variant="outline" disabled={pending}>
                  Cancelar
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={pending || pw.length < MIN}>
                <KeyRound />
                {pending ? "Guardando…" : "Cambiar contraseña"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
