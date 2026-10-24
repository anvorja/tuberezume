import { cn } from "@/lib/utils"

/** Miniatura de respaldo: fibras determinadas por el id del video. */
export function FiberThumb({ seed, className }: { seed: string; className?: string }) {
  let h = 0
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const lines = Array.from({ length: 9 }, (_, i) => {
    const a = ((h >> i) & 7) / 7
    const y = 8 + i * 5.5
    const amp = 4 + a * 9
    return `M0 ${y} C 25 ${y - amp}, 55 ${y + amp}, 80 ${y - amp / 2} S 100 ${y} 100 ${y}`
  })
  return (
    <svg
      viewBox="0 0 100 56"
      preserveAspectRatio="none"
      aria-hidden
      className={cn("size-full bg-surface-raised", className)}
    >
      {lines.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="var(--fiber)"
          strokeWidth="0.35"
          opacity={0.35 + (i % 3) * 0.2}
        />
      ))}
      <path d="M0 28 H100" stroke="var(--signal-ink)" strokeWidth="0.9" />
    </svg>
  )
}
