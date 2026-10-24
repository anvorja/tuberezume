import * as React from "react"
import { Tabs } from "radix-ui"
import { Search } from "lucide-react"

import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap"
import { cn } from "@/lib/utils"
import type { Summary } from "@/lib/types"
import { formatTime, watchUrl } from "@/lib/youtube"

const TABS = [
  { id: "resumen", label: "Resumen" },
  { id: "capitulos", label: "Capítulos" },
  { id: "transcripcion", label: "Transcripción" },
] as const

/** Lista con hilo vertical: cada entrada cuelga de la misma línea. */
function Thread({ children }: { children: React.ReactNode }) {
  return (
    <ol className="relative flex flex-col gap-6 pl-7 before:absolute before:top-2 before:bottom-2 before:left-[5px] before:w-px before:bg-gradient-to-b before:from-signal-ink before:via-border before:to-transparent">
      {children}
    </ol>
  )
}

function Tick() {
  return (
    <span
      aria-hidden
      className="absolute top-[0.55em] -left-7 block h-[2px] w-[11px] rounded-full bg-signal-ink"
    />
  )
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>
  const i = text.toLowerCase().indexOf(query.toLowerCase())
  if (i < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded bg-signal px-0.5 text-primary-foreground">
        {text.slice(i, i + query.length)}
      </mark>
      {text.slice(i + query.length)}
    </>
  )
}

export function SummaryBody({ item, className }: { item: Summary; className?: string }) {
  const [tab, setTab] = React.useState<(typeof TABS)[number]["id"]>("resumen")
  const [query, setQuery] = React.useState("")
  const panel = React.useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion() || !panel.current) return
      gsap.from(panel.current.querySelectorAll("[data-in]"), {
        y: 14,
        opacity: 0,
        duration: 0.6,
        ease: "expo.out",
        stagger: 0.05,
      })
    },
    { scope: panel, dependencies: [tab] }
  )

  const lines = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? item.transcript.filter((l) => l.text.toLowerCase().includes(q)) : item.transcript
  }, [item.transcript, query])

  return (
    <Tabs.Root
      value={tab}
      onValueChange={(v) => setTab(v as typeof tab)}
      className={cn("flex flex-col gap-6", className)}
    >
      <Tabs.List
        aria-label="Secciones del resumen"
        className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-full border border-border bg-surface p-1"
      >
        {TABS.map((t) => (
          <Tabs.Trigger
            key={t.id}
            value={t.id}
            className="h-9 shrink-0 rounded-full px-4 text-sm font-medium text-muted-foreground transition-colors data-[state=active]:bg-signal data-[state=active]:text-primary-foreground"
          >
            {t.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      <div ref={panel}>
        <Tabs.Content value="resumen" className="flex flex-col gap-8 outline-none">
          <p data-in className="max-w-[60ch] font-display text-[1.35rem] leading-snug tracking-tight md:text-[1.6rem]">
            {item.tldr}
          </p>
          <Thread>
            {item.keyPoints.map((p, i) => (
              <li key={i} data-in className="relative max-w-[62ch] leading-relaxed text-foreground/90">
                <Tick />
                {p}
              </li>
            ))}
          </Thread>
          {item.sources && item.sources.length > 0 && (
            <div data-in className="flex flex-col gap-2 text-sm">
              <p className="font-medium">Contexto de la web</p>
              <ul className="flex flex-col gap-1">
                {item.sources.map((s) => (
                  <li key={s.url}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Tabs.Content>

        <Tabs.Content value="capitulos" className="outline-none">
          <Thread>
            {item.chapters.map((c) => (
              <li key={c.start} data-in className="relative">
                <Tick />
                <a
                  href={watchUrl(item.videoId, c.start)}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex flex-col gap-1"
                >
                  <span className="tnum font-mono text-xs text-signal-ink">
                    {formatTime(c.start)}
                  </span>
                  <span className="font-display text-lg font-semibold tracking-tight group-hover:underline group-hover:decoration-signal-ink group-hover:underline-offset-4">
                    {c.title}
                  </span>
                  <span className="max-w-[58ch] text-sm text-muted-foreground">{c.summary}</span>
                </a>
              </li>
            ))}
          </Thread>
        </Tabs.Content>

        <Tabs.Content value="transcripcion" className="flex flex-col gap-5 outline-none">
          <div className="thread-ring flex items-center gap-2 bg-surface px-4">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <label htmlFor={`q-${item.id}`} className="sr-only">
              Buscar en la transcripción
            </label>
            <input
              id={`q-${item.id}`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar en la transcripción"
              className="h-11 min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground/80"
            />
          </div>
          {lines.length === 0 ? (
            <p className="py-8 text-muted-foreground">
              Ninguna línea contiene “{query}”. Prueba con otra palabra.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {lines.map((l) => (
                <li key={l.start} className="grid grid-cols-[4.5rem_1fr] gap-3 py-3">
                  <a
                    href={watchUrl(item.videoId, l.start)}
                    target="_blank"
                    rel="noreferrer"
                    className="tnum font-mono text-xs leading-6 text-signal-ink hover:underline"
                  >
                    {formatTime(l.start)}
                  </a>
                  <span className="max-w-[64ch] leading-relaxed text-foreground/90">
                    <Highlight text={l.text} query={query.trim()} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Tabs.Content>
      </div>
    </Tabs.Root>
  )
}
