import * as React from "react"

import { FiberField, useFiberProgress } from "@/components/fx/fiber-field"
import { gsap } from "@/lib/gsap"
import { cn } from "@/lib/utils"
import type { Summary, SummaryStatus } from "@/lib/types"

const STEPS: { status: SummaryStatus; label: string; hint: string }[] = [
  { status: "queued", label: "Enlazando el video", hint: "Validamos el enlace y reservamos tu lugar." },
  { status: "transcribing", label: "Trayendo la transcripción", hint: "Cada palabra con su minuto exacto." },
  { status: "summarizing", label: "Condensando en un hilo", hint: "Puntos clave y capítulos con enlace." },
]

/** El avance real del backend recoge las fibras hasta dejar un solo hilo. */
export function Processing({ item }: { item: Summary }) {
  const progress = useFiberProgress(0)

  React.useEffect(() => {
    const tween = gsap.to(progress, {
      current: item.status === "ready" ? 1 : Math.max(0.08, item.progress),
      duration: 1.4,
      ease: "power2.out",
    })
    return () => {
      tween.kill()
    }
  }, [item.progress, item.status, progress])

  const index = Math.max(0, STEPS.findIndex((s) => s.status === item.status))

  return (
    <section
      aria-live="polite"
      className="relative isolate flex min-h-[calc(100dvh-8rem)] flex-col justify-end overflow-hidden rounded-3xl border border-border"
    >
      <FiberField progress={progress} anchor={0.42} interactive={false} className="absolute inset-0 -z-10" />
      <div className="flex flex-col gap-8 bg-gradient-to-t from-background via-background/80 to-transparent p-6 pt-24 md:p-10 md:pt-32">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-semibold md:text-5xl">{STEPS[index].label}</h2>
          <p className="max-w-[48ch] text-muted-foreground">{STEPS[index].hint}</p>
        </div>
        <ol className="grid max-w-xl gap-3">
          {STEPS.map((s, i) => {
            const state = i < index ? "done" : i === index ? "active" : "todo"
            return (
              <li key={s.status} className="flex items-center gap-4">
                <span
                  aria-hidden
                  className={cn(
                    "block h-[3px] w-14 origin-left rounded-full",
                    state === "done" && "bg-signal-ink",
                    state === "active" && "animate-[filament_1.6s_ease-in-out_infinite] bg-signal-ink",
                    state === "todo" && "bg-border"
                  )}
                />
                <span
                  className={cn(
                    "text-sm",
                    state === "todo" ? "text-muted-foreground" : "text-foreground"
                  )}
                >
                  {s.label}
                  {state === "done" && <span className="sr-only"> (completado)</span>}
                </span>
              </li>
            )
          })}
        </ol>
        <p className="text-sm text-muted-foreground">
          Puedes salir de esta pantalla: el resumen te espera en tu biblioteca.
        </p>
      </div>
    </section>
  )
}
