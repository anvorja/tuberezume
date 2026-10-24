import * as React from "react"
import { Link } from "react-router"

import { FiberThumb } from "@/components/fiber-thumb"
import { cn } from "@/lib/utils"
import type { Summary } from "@/lib/types"
import { formatDuration, thumbnailUrl, timeAgo } from "@/lib/youtube"

const STATUS_LABEL: Record<Summary["status"], string> = {
  queued: "En cola",
  transcribing: "Trayendo transcripción",
  summarizing: "Resumiendo",
  ready: "Listo",
  failed: "Falló",
}

export function Thumb({ videoId, className }: { videoId: string; className?: string }) {
  const [failed, setFailed] = React.useState(false)
  if (failed) return <FiberThumb seed={videoId} className={className} />
  return (
    <img
      src={thumbnailUrl(videoId)}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={cn("size-full object-cover", className)}
    />
  )
}

export function VideoCard({ item, className }: { item: Summary; className?: string }) {
  const active = item.status !== "ready" && item.status !== "failed"
  return (
    <Link
      to={`/app/resumen/${item.id}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface backdrop-blur-md transition-[transform,border-color] duration-500 ease-out-expo hover:-translate-y-0.5 hover:border-signal-ink/50",
        className
      )}
    >
      <div className="relative aspect-video overflow-hidden bg-surface-raised">
        <div className="size-full transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]">
          <Thumb videoId={item.videoId} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
        {item.durationSec > 0 && (
          <span className="tnum absolute right-2 bottom-2 rounded-full bg-background/80 px-2 py-0.5 font-mono text-[0.7rem] backdrop-blur">
            {formatDuration(item.durationSec)}
          </span>
        )}
        {active && (
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-foreground/10">
            <div
              className="h-full origin-left bg-signal transition-transform duration-700 ease-out-expo"
              style={{ transform: `scaleX(${Math.max(0.06, item.progress)})` }}
            />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="line-clamp-2 font-display text-[1.02rem] leading-snug font-semibold tracking-tight">
          {item.title}
        </h3>
        <p className="truncate text-sm text-muted-foreground">{item.channel}</p>
        <p className="mt-auto flex items-center gap-2 pt-2 text-xs text-muted-foreground">
          <span className={cn(item.status === "failed" && "text-destructive", active && "text-signal-ink")}>
            {STATUS_LABEL[item.status]}
          </span>
          <span aria-hidden>/</span>
          <span>{timeAgo(item.createdAt)}</span>
          {item.demo && (
            <span className="ml-auto rounded-full border border-border px-2 py-0.5">Ejemplo</span>
          )}
        </p>
      </div>
    </Link>
  )
}
