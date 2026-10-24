import * as React from "react"

import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap"

/** Entrada al scroll, una sola vez: los hijos directos suben en cascada. */
export function Reveal({
  children,
  className,
  stagger = 0.08,
  y = 28,
}: {
  children: React.ReactNode
  className?: string
  stagger?: number
  y?: number
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      if (prefersReducedMotion() || !ref.current) return
      gsap.from(ref.current.children, {
        y,
        opacity: 0,
        duration: 0.9,
        ease: "expo.out",
        stagger,
        scrollTrigger: { trigger: ref.current, start: "top 85%", once: true },
      })
    },
    { scope: ref }
  )
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
