import * as React from "react"
import { Link, useNavigate } from "react-router"

import { Wordmark } from "@/components/brand/logo"
import { Composer } from "@/components/composer"
import { FiberField, useFiberProgress, type FiberProgress } from "@/components/fx/fiber-field"
import { Reveal } from "@/components/reveal"
import { SummaryBody } from "@/components/summary-body"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Thumb, VideoCard } from "@/components/video-card"
import { gsap, prefersReducedMotion, ScrollTrigger, useGSAP } from "@/lib/gsap"
import { useLibrary } from "@/lib/library"
import { SEED } from "@/lib/seed"
import { formatDuration, formatTime, parseYouTubeId } from "@/lib/youtube"

const SAMPLE = SEED[0]

function useSubmitFlow(progress: FiberProgress) {
  const { submit } = useLibrary()
  const navigate = useNavigate()
  const [busy, setBusy] = React.useState(false)
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
  const tension = (v: string) =>
    gsap.to(progress, { current: parseYouTubeId(v) ? 0.3 : 0, duration: 0.8, ease: "power3.out" })
  return { busy, onSubmit, tension }
}

function Header() {
  return (
    <header className="absolute inset-x-0 top-0 z-20 mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 md:px-12">
      <Link to="/" aria-label="TubeRezume, inicio">
        <Wordmark />
      </Link>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <Button asChild variant="outline" size="sm">
          <Link to="/app/biblioteca">Mi biblioteca</Link>
        </Button>
      </div>
    </header>
  )
}

function Hero() {
  const progress = useFiberProgress(0)
  const { busy, onSubmit, tension } = useSubmitFlow(progress)
  const root = React.useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap
        .timeline({ defaults: { ease: "expo.out", duration: 1.1 } })
        .from("[data-h]", { yPercent: 40, opacity: 0, stagger: 0.09 })
        .from("[data-sub]", { y: 18, opacity: 0 }, "-=0.7")
        .from("[data-cta]", { y: 18, opacity: 0 }, "-=0.8")
    },
    { scope: root }
  )

  return (
    <section ref={root} className="relative isolate flex min-h-[100dvh] flex-col justify-end overflow-hidden">
      <FiberField progress={progress} anchor={0.36} intensity={1.4} className="absolute inset-0 -z-10" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,var(--background)_12%,transparent_60%)]" />
      <div className="mx-auto w-full max-w-[1400px] px-4 pb-14 md:px-12 md:pb-20">
        <div className="flex max-w-6xl flex-col gap-6">
          <h1 className="text-[clamp(2.5rem,7.6vw,5.4rem)] leading-[0.96] font-semibold">
            <span className="block overflow-hidden pb-[0.08em]"><span data-h className="block">Pega el enlace.</span></span>
            <span className="block overflow-hidden pb-[0.08em]"><span data-h className="block">Quédate con lo esencial.</span></span>
          </h1>
          <p data-sub className="max-w-[44ch] text-lg text-muted-foreground md:text-xl">
            Transcribimos el video, lo resumimos y lo guardamos en tu biblioteca. Con capítulos que saltan al minuto exacto.
          </p>
          <div data-cta className="max-w-2xl">
            <Composer onSubmit={onSubmit} busy={busy} onValueChange={tension} />
          </div>
        </div>
      </div>
    </section>
  )
}

const STEPS = [
  {
    title: "Pegas el enlace",
    body: "Sirve youtube.com, youtu.be y Shorts. Lo validamos antes de enviar nada.",
    extra: (
      <div className="flex items-center gap-3">
        <div className="aspect-video w-28 shrink-0 overflow-hidden rounded-lg"><Thumb videoId={SAMPLE.videoId} /></div>
        <p className="tnum min-w-0 truncate font-mono text-xs text-muted-foreground">youtu.be/{SAMPLE.videoId}</p>
      </div>
    ),
  },
  {
    title: "Traemos cada palabra",
    body: "La transcripción completa llega con su minuto. Después se busca y se salta a cualquier punto.",
    extra: (
      <ul className="flex flex-col gap-2 font-mono text-xs text-muted-foreground">
        {SAMPLE.transcript.slice(2, 5).map((l) => (
          <li key={l.start} className="grid grid-cols-[3.5rem_1fr] gap-2">
            <span className="tnum text-signal-ink">{formatTime(l.start)}</span>
            <span className="line-clamp-1">{l.text}</span>
          </li>
        ))}
      </ul>
    ),
  },
  {
    title: "Queda un solo hilo",
    body: "Un resumen, los puntos clave y los capítulos. Todo guardado para volver cuando quieras.",
    extra: <p className="line-clamp-3 font-display text-lg leading-snug">{SAMPLE.tldr}</p>,
  },
]

function HowItWorks() {
  const root = React.useRef<HTMLElement>(null)
  const progress = useFiberProgress(0)

  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        gsap.set(progress, { current: 1 })
        return
      }
      // El scroll recoge las fibras: tres pasos, un hilo.
      ScrollTrigger.create({
        trigger: root.current,
        start: "top 70%",
        end: "bottom 85%",
        scrub: 0.6,
        onUpdate: (self) => {
          gsap.set(progress, { current: Math.min(1, self.progress * 1.15) })
        },
      })
    },
    { scope: root }
  )

  return (
    <section ref={root} aria-labelledby="como" className="relative">
      <div className="sticky top-0 -z-0 h-dvh overflow-hidden">
        <FiberField progress={progress} anchor={0.5} density={0.9} className="absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,#000_18%,#000_82%,transparent)]" />
      </div>
      <div className="relative z-10 mx-auto -mt-[100dvh] max-w-[1400px] px-4 md:px-12">
        <div className="flex min-h-[60dvh] items-end pb-8">
          <h2 id="como" className="max-w-2xl text-[clamp(2.2rem,6vw,4.6rem)] leading-[0.98] font-semibold">
            Una hora de video entra. Una pantalla de lectura sale.
          </h2>
        </div>
        {STEPS.map((s) => (
          <div key={s.title} className="flex min-h-[85dvh] items-end pb-10 md:items-center md:justify-end md:pb-0">
            <Reveal className="flex w-full max-w-md flex-col gap-4 rounded-xl border border-border bg-surface p-6 backdrop-blur-xl">
              <h3 className="text-2xl font-semibold">{s.title}</h3>
              <p className="text-muted-foreground">{s.body}</p>
              {s.extra}
            </Reveal>
          </div>
        ))}
      </div>
    </section>
  )
}

function Example() {
  return (
    <section aria-labelledby="ejemplo" className="mx-auto max-w-[1400px] px-4 py-24 md:px-12 md:py-36">
      <Reveal className="flex flex-col gap-14">
        <div className="flex max-w-4xl flex-col gap-4">
          <h2 id="ejemplo" className="text-[clamp(2.2rem,5vw,4rem)] leading-[1] font-semibold">
            Casi dos horas de código, en lo que cabe en un trayecto.
          </h2>
          <p className="max-w-[52ch] text-lg text-muted-foreground">
            Así se ve un resumen terminado. Está escrito a mano como ejemplo del formato.
          </p>
        </div>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-16">
          <div className="flex flex-col gap-4 lg:sticky lg:top-10 lg:self-start">
            <div className="aspect-video overflow-hidden rounded-xl border border-border"><Thumb videoId={SAMPLE.videoId} /></div>
            <h3 className="text-2xl leading-tight font-semibold">{SAMPLE.title}</h3>
            <p className="text-muted-foreground">
              {SAMPLE.channel} / <span className="tnum">{formatDuration(SAMPLE.durationSec)}</span>
            </p>
          </div>
          <SummaryBody item={SAMPLE} />
        </div>
      </Reveal>
    </section>
  )
}

function Shelf() {
  const cols = ["md:col-span-5", "md:col-span-4 md:mt-20", "md:col-span-3 md:mt-8"]
  return (
    <section aria-labelledby="biblioteca" className="mx-auto max-w-[1400px] px-4 pb-24 md:px-12 md:pb-36">
      <Reveal className="flex flex-col gap-12">
        <div className="flex max-w-4xl flex-col gap-4">
          <h2 id="biblioteca" className="text-[clamp(2.2rem,5vw,4rem)] leading-[1] font-semibold">
            Lo que resumes se queda.
          </h2>
          <p className="max-w-[52ch] text-lg text-muted-foreground">
            Cada resumen se guarda en tu biblioteca para buscarlo, releerlo o saltar al minuto que necesitabas.
          </p>
        </div>
        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-12 md:items-start md:gap-6 md:overflow-visible md:px-0">
          {SEED.map((it, i) => (
            <VideoCard key={it.id} item={it} className={`w-[78vw] shrink-0 snap-center md:w-auto ${cols[i]}`} />
          ))}
        </div>
      </Reveal>
    </section>
  )
}

function Closing() {
  const progress = useFiberProgress(1)
  const { busy, onSubmit } = useSubmitFlow(progress)
  return (
    <section aria-labelledby="cierre" className="relative isolate overflow-hidden border-t border-border">
      <FiberField progress={progress} anchor={0.24} interactive={false} intensity={0.7} className="absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,#000,transparent_85%)]" />
      <div className="mx-auto flex max-w-[1400px] flex-col gap-8 px-4 pt-56 pb-16 md:px-12 md:pt-72">
        <h2 id="cierre" className="max-w-5xl text-[clamp(2.4rem,6.4vw,5rem)] leading-[0.96] font-semibold">
          El siguiente video ya no te quita la tarde.
        </h2>
        <div className="max-w-2xl">
          <Composer onSubmit={onSubmit} busy={busy} />
        </div>
        <footer className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6 text-sm text-muted-foreground">
          <Wordmark className="text-base" />
          <p>TubeRezume no está afiliado a YouTube.</p>
        </footer>
      </div>
    </section>
  )
}

export default function Landing() {
  return (
    <div className="relative">
      <Header />
      <Hero />
      <HowItWorks />
      <Example />
      <Shelf />
      <Closing />
    </div>
  )
}
