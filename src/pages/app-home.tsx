import * as React from "react"
import { Link, useNavigate } from "react-router"

import { Composer } from "@/components/composer"
import { FiberField, useFiberProgress } from "@/components/fx/fiber-field"
import { VideoCard } from "@/components/video-card"
import { gsap } from "@/lib/gsap"
import { useLibrary } from "@/lib/library"
import { parseYouTubeId } from "@/lib/youtube"

export default function AppHome() {
  const { items, submit, state } = useLibrary()
  const navigate = useNavigate()
  const [busy, setBusy] = React.useState(false)
  const progress = useFiberProgress(0)

  const tension = (v: string) =>
    gsap.to(progress, { current: parseYouTubeId(v) ? 0.3 : 0, duration: 0.8, ease: "power3.out" })

  const onSubmit = async (url: string) => {
    setBusy(true)
    try {
      const id = await submit(url)
      await gsap.to(progress, { current: 1, duration: 0.8, ease: "power3.inOut" })
      navigate(`/app/resumen/${id}`)
    } finally {
      setBusy(false)
    }
  }

  const recent = items.slice(0, 3)

  return (
    <div className="flex flex-col">
      <section className="relative isolate flex min-h-[62dvh] flex-col justify-end overflow-hidden px-4 pt-10 pb-10 md:min-h-[68dvh] md:px-12">
        <FiberField progress={progress} anchor={0.4} className="absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,#000_55%,transparent)]" />
        <div className="flex max-w-3xl flex-col gap-6">
          <h1 className="text-[2.6rem] leading-[0.98] font-semibold md:text-7xl">
            ¿Qué video quieres entender hoy?
          </h1>
          <Composer
            onSubmit={onSubmit}
            busy={busy}
            autoFocus={false}
            onValueChange={tension}
          />
        </div>
      </section>

      <section className="flex flex-col gap-5 px-4 py-8 md:px-12">
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-semibold">Recientes</h2>
          {items.length > 3 && (
            <Link to="/app/biblioteca" className="text-sm text-signal-ink hover:underline">
              Ver toda la biblioteca
            </Link>
          )}
        </div>
        {state === "loading" ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton aspect-[4/3] rounded-xl" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <p className="max-w-[50ch] text-muted-foreground">
            Aún no has resumido nada. Pega un enlace arriba y tu primer resumen aparecerá aquí.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {recent.map((it) => (
              <VideoCard key={it.id} item={it} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
