import { cn } from "@/lib/utils"

/** Marca: dos fibras que se funden en un hilo recto. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden
      className={cn("size-7", className)}
      fill="none"
      strokeLinecap="round"
    >
      <path
        d="M3 8c7 0 10 3.5 13 8"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-fiber"
      />
      <path
        d="M3 24c7 0 10-3.5 13-8"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-fiber"
      />
      <path d="M16 16h13" stroke="var(--signal-ink)" strokeWidth="3" />
    </svg>
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-display text-[1.15rem] font-semibold tracking-tight",
        className
      )}
    >
      <LogoMark />
      <span>
        Tube<span className="text-signal-ink">Rezume</span>
      </span>
    </span>
  )
}
