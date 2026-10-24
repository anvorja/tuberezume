import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * FiberField: haces de fibras que se cruzan como un listón trenzado.
 * Cada fibra es una línea de la transcripción; `progress.current` (0..1)
 * las recoge hasta dejar un único hilo luminoso: el resumen.
 *
 * Estudiado de ghost-fibers / strands / laser-flow (reactbits) y reescrito
 * como canvas 2D propio: la convergencia es el mecanismo del producto.
 */
export interface FiberProgress {
  current: number
}

interface FiberFieldProps {
  className?: string
  /** Mutable: se lee en cada frame, sin re-render de React. */
  progress?: FiberProgress
  /** Altura relativa del hilo final (0 arriba, 1 abajo). */
  anchor?: number
  /** Multiplica la cantidad de fibras. */
  density?: number
  /** Las fibras se curvan hacia el puntero. */
  interactive?: boolean
  /** Opacidad global de las fibras. */
  intensity?: number
}

type RGB = [number, number, number]

const TAU = Math.PI * 2
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const smooth = (v: number) => v * v * (3 - 2 * v)

/** Resuelve cualquier color CSS (oklch incluido) a RGB leyendo un pixel. */
function resolveColor(cssVar: string, fallback: RGB): RGB {
  try {
    const probe = document.createElement("span")
    probe.style.color = `var(${cssVar})`
    probe.style.display = "none"
    document.body.appendChild(probe)
    const css = getComputedStyle(probe).color
    probe.remove()
    const c = document.createElement("canvas")
    c.width = c.height = 1
    const ctx = c.getContext("2d", { willReadFrequently: true })
    if (!ctx) return fallback
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = css
    ctx.fillRect(0, 0, 1, 1)
    const d = ctx.getImageData(0, 0, 1, 1).data
    if (d[3] === 0) return fallback
    return [d[0], d[1], d[2]]
  } catch {
    return fallback
  }
}

interface Fiber {
  u: number
  a1: number
  f1: number
  p1: number
  s1: number
  a2: number
  f2: number
  p2: number
  s2: number
  alpha: number
}

function makeFibers(n: number): Fiber[] {
  // Generador determinista: el campo se ve igual en cada carga.
  let seed = 1337
  const rnd = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
  return Array.from({ length: n }, (_, i) => ({
    u: n === 1 ? 0.5 : i / (n - 1),
    a1: 0.015 + rnd() * 0.05,
    f1: 1.4 + rnd() * 2.4,
    p1: rnd() * TAU,
    s1: 0.18 + rnd() * 0.3,
    a2: 0.006 + rnd() * 0.02,
    f2: 4 + rnd() * 5,
    p2: rnd() * TAU,
    s2: 0.3 + rnd() * 0.5,
    alpha: 0.35 + rnd() * 0.65,
  }))
}

export function FiberField({
  className,
  progress,
  anchor = 0.55,
  density = 1,
  interactive = true,
  intensity = 1,
}: FiberFieldProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let w = 0
    let h = 0
    let dpr = 1
    let fibers: Fiber[] = []
    let segs = 56
    let fiberRGB: RGB = [110, 170, 180]
    let signalRGB: RGB = [198, 244, 50]
    let inkRGB: RGB = [198, 244, 50]
    let dark = true
    let visible = true
    let dirty = true
    let lastC = -1
    let raf = 0
    const t0 = performance.now()

    // puntero suavizado
    let tx = 0
    let ty = 0
    let px = 0
    let py = 0
    let pw = 0
    let pTarget = 0

    const readTheme = () => {
      dark = !document.documentElement.classList.contains("light")
      fiberRGB = resolveColor("--fiber", fiberRGB)
      signalRGB = resolveColor("--signal", signalRGB)
      inkRGB = resolveColor("--signal-ink", inkRGB)
      dirty = true
    }

    const resize = () => {
      const r = canvas.getBoundingClientRect()
      w = Math.max(1, r.width)
      h = Math.max(1, r.height)
      dpr = Math.min(window.devicePixelRatio || 1, 1.75)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const base = w < 640 ? 30 : w < 1100 ? 46 : 62
      fibers = makeFibers(Math.round(base * density))
      segs = w < 640 ? 40 : 60
      dirty = true
    }

    const threadY = (x: number, t: number) =>
      h * anchor +
      Math.sin(x * TAU * 0.9 + 0.7 + t * 0.12) * h * 0.045 -
      (x - 0.5) * h * 0.1

    const render = (now: number) => {
      raf = requestAnimationFrame(render)
      if (!visible || document.hidden) return

      const c = clamp01(progress?.current ?? 0)
      // el puntero se suaviza siempre; si no se mueve, no hay trabajo extra
      pw += (pTarget - pw) * 0.08
      px += (tx - px) * 0.14
      py += (ty - py) * 0.14
      if (reduce && !dirty && c === lastC) return
      dirty = false
      lastC = c

      const t = reduce ? 0 : (now - t0) / 1000
      ctx.clearRect(0, 0, w, h)
      ctx.globalCompositeOperation = dark ? "lighter" : "source-over"
      ctx.lineJoin = "round"
      ctx.lineCap = "round"

      const spread = h * 0.74
      const radius = Math.min(w, h) * 0.32
      const n = fibers.length
      const fAlpha = (dark ? 0.2 : 0.3) * intensity

      for (let i = 0; i < n; i++) {
        const f = fibers[i]
        // las fibras centrales se recogen primero, las externas después
        const lead = Math.abs(f.u - 0.5) * 2
        const ci = smooth(clamp01(c * 1.45 - lead * 0.45))
        const waveScale = 1 - ci

        ctx.beginPath()
        for (let s = 0; s <= segs; s++) {
          const x01 = s / segs
          const x = (x01 * 1.1 - 0.05) * w
          const twist = Math.cos(x01 * 4.1 + 0.5 + t * 0.07)
          let y =
            h * 0.5 +
            (f.u - 0.5) * spread * twist * (0.55 + 0.45 * Math.sin(x01 * 2.2 + 1)) +
            Math.sin(x01 * TAU * f.f1 * 0.5 + t * f.s1 + f.p1) * f.a1 * h * 1.6 +
            Math.sin(x01 * TAU * f.f2 * 0.5 - t * f.s2 + f.p2) * f.a2 * h
          y = y * waveScale + threadY(x01, t) * ci
          if (interactive && pw > 0.01) {
            const dx = x - px
            const dy = y - py
            const d2 = (dx * dx + dy * dy) / (radius * radius)
            if (d2 < 4) y += (py - y) * Math.exp(-d2 * 1.4) * 0.35 * pw * waveScale
          }
          if (s === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        const a = fAlpha * f.alpha * (1 - ci * 0.55)
        ctx.strokeStyle = `rgba(${fiberRGB[0]},${fiberRGB[1]},${fiberRGB[2]},${a})`
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // El hilo: tres pasadas (halo, cuerpo, núcleo) y un pulso viajero.
      if (c > 0.02) {
        const glow = smooth(clamp01((c - 0.1) / 0.8))
        const pts: [number, number][] = []
        for (let s = 0; s <= segs; s++) {
          const x01 = s / segs
          pts.push([(x01 * 1.1 - 0.05) * w, threadY(x01, t)])
        }
        const trace = () => {
          ctx.beginPath()
          pts.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
        }
        const [sr, sg, sb] = signalRGB
        const [ir, ig, ib] = dark ? signalRGB : inkRGB
        trace()
        ctx.lineWidth = 16
        ctx.strokeStyle = `rgba(${sr},${sg},${sb},${0.05 * glow})`
        ctx.stroke()
        trace()
        ctx.lineWidth = 5
        ctx.strokeStyle = `rgba(${sr},${sg},${sb},${0.14 * glow})`
        ctx.stroke()
        trace()
        ctx.lineWidth = 1.6
        ctx.strokeStyle = `rgba(${ir},${ig},${ib},${0.95 * glow})`
        ctx.stroke()

        if (c > 0.8 && !reduce) {
          const head = ((t * 0.28) % 1.5) - 0.25
          const from = Math.max(0, Math.floor((head - 0.14) * segs))
          const to = Math.min(segs, Math.ceil(head * segs))
          if (to > from) {
            ctx.beginPath()
            for (let s = from; s <= to; s++) {
              const [x, y] = pts[s]
              if (s === from) ctx.moveTo(x, y)
              else ctx.lineTo(x, y)
            }
            ctx.lineWidth = 3.4
            ctx.strokeStyle = dark ? "rgba(255,255,240,0.95)" : `rgba(${ir},${ig},${ib},1)`
            ctx.stroke()
          }
        }
      }
    }

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      tx = e.clientX - r.left
      ty = e.clientY - r.top
      if (pTarget === 0) {
        px = tx
        py = ty
      }
      pTarget = 1
    }
    const onLeave = () => {
      pTarget = 0
    }

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      dirty = true
    })
    io.observe(canvas)
    const mo = new MutationObserver(readTheme)
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    readTheme()
    resize()
    if (interactive && !reduce) {
      window.addEventListener("pointermove", onMove, { passive: true })
      document.addEventListener("pointerleave", onLeave)
    }
    raf = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      mo.disconnect()
      window.removeEventListener("pointermove", onMove)
      document.removeEventListener("pointerleave", onLeave)
    }
  }, [progress, anchor, density, interactive, intensity])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn("pointer-events-none block h-full w-full", className)}
    />
  )
}

/** Objeto mutable estable; se tween-ea con GSAP sin re-renders. */
export function useFiberProgress(initial = 0): FiberProgress {
  const [p] = React.useState<FiberProgress>(() => ({ current: initial }))
  return p
}
