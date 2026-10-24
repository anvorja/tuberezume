import * as React from "react"
import { AlertDialog } from "radix-ui"
import { Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * Confirmación de borrado. El foco inicial cae en "Cancelar", Esc cierra, un clic fuera
 * no borra, y mientras se borra el diálogo queda abierto y bloqueado: si falla, el
 * usuario sigue viendo el resumen y puede reintentar.
 */
export function ConfirmDelete({
  open,
  onOpenChange,
  title,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  /** Debe lanzar si el borrado falla; el diálogo se queda abierto con el aviso. */
  onConfirm: () => Promise<void>
}) {
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const confirm = async () => {
    setPending(true)
    setError(null)
    try {
      await onConfirm()
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos eliminarlo. Intenta de nuevo.")
    } finally {
      setPending(false)
    }
  }

  return (
    <AlertDialog.Root open={open} onOpenChange={(o) => {
        if (pending) return
        if (!o) setError(null)
        onOpenChange(o)
      }}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="dialog-overlay fixed inset-0 z-50 bg-background/70 backdrop-blur-sm" />
        <AlertDialog.Content className="dialog-content fixed top-1/2 left-1/2 z-50 flex w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-5 rounded-2xl border border-border bg-surface-raised p-6 shadow-2xl outline-none">
          <div className="flex flex-col gap-3">
            <AlertDialog.Title className="font-display text-2xl leading-tight font-semibold tracking-tight">
              ¿Eliminar este resumen?
            </AlertDialog.Title>
            <p className="line-clamp-3 rounded-lg border border-border bg-background/40 px-3 py-2 text-sm font-medium">
              {title}
            </p>
            <AlertDialog.Description className="text-sm text-muted-foreground">
              Se borrarán el resumen, los capítulos y la transcripción guardados. Esta acción no se puede deshacer.
            </AlertDialog.Description>
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Cancel asChild>
              <Button variant="outline" disabled={pending}>
                Cancelar
              </Button>
            </AlertDialog.Cancel>
            {/* Sin AlertDialog.Action: así el diálogo no se cierra antes de saber si el borrado funcionó. */}
            <Button
              variant="destructive"
              onClick={confirm}
              disabled={pending}
              className="bg-destructive text-background hover:bg-destructive hover:brightness-110"
            >
              <Trash2 />
              {pending ? "Eliminando…" : error ? "Reintentar" : "Eliminar"}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
