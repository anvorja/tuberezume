import * as React from "react"
import { Link } from "react-router"

import { FiberThumb } from "@/components/fiber-thumb"
import { TagButton, TagChips, TagPicker } from "@/components/tags"
import { cn } from "@/lib/utils"
import type { Summary } from "@/lib/types"
import { formatDuration, thumbnailUrl, timeAgo } from "@/lib/youtube"

const STATUS_LABEL: Record<Summary["status"], string> = {
  queued: "En cola",
  transcribing: "Trayendo transcripción",
  summarizing: "Resumiendo",
  ready: "Listo",
  failed: "Falló",
  interrupted: "Interrumpido",
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

/** Rejilla compacta: tarjetas de ancho acotado, así una sola no ocupa toda la pantalla. */
export const GRID_CLASS =
  "grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(14.5rem,16.5rem))] sm:gap-4"

interface CardProps {
  item: Summary
  className?: string
  /** Si se pasan, la tarjeta ofrece etiquetar sin abrir el resumen. */
  knownTags?: string[]
  onTagsChange?: (id: string, tags: string[]) => Promise<void>
  onSelectTag?: (tag: string) => void
}

const isBusy = (s: Summary) => s.status !== "ready" && s.status !== "failed" && s.status !== "interrupted"
const isStuck = (s: Summary) => s.status === "failed" || s.status === "interrupted"

function Tagger({ item, knownTags, onTagsChange, className }: CardProps & { className?: string }) {
  if (!onTagsChange || isBusy(item)) return null
  const tags = item.tags ?? []
  return (
    <TagPicker
      value={tags}
      known={knownTags ?? []}
      onChange={(t) => onTagsChange(item.id, t)}
      trigger={<TagButton count={tags.length} label={`Etiquetas de «${item.title}»`} className={className} />}
    />
  )
}

export function VideoCard({ item, className, knownTags, onTagsChange, onSelectTag }: CardProps) {
  const active = isBusy(item)
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface backdrop-blur-md transition-[transform,border-color] duration-500 ease-out-expo focus-within:border-signal-ink/50 hover:-translate-y-0.5 hover:border-signal-ink/50",
        className
      )}
    >
      <div className="relative aspect-video overflow-hidden bg-surface-raised">
        <div className="size-full transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]">
          <Thumb videoId={item.videoId} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
        {item.durationSec > 0 && (
          <span className="tnum absolute right-1.5 bottom-1.5 rounded-full bg-background/80 px-1.5 py-0.5 font-mono text-[0.65rem] backdrop-blur">
            {formatDuration(item.durationSec)}
          </span>
        )}
        <Tagger
          item={item}
          knownTags={knownTags}
          onTagsChange={onTagsChange}
          className="absolute top-1.5 right-1.5 z-10"
        />
        {active && (
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-foreground/10">
            <div
              className="h-full origin-left bg-signal transition-transform duration-700 ease-out-expo"
              style={{ transform: `scaleX(${Math.max(0.06, item.progress)})` }}
            />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 font-display text-[0.95rem] leading-snug font-semibold tracking-tight">
          {/* Enlace estirado: toda la tarjeta abre el resumen sin anidar botones dentro de un enlace. */}
          <Link to={`/resumen/${item.id}`} className="outline-none after:absolute after:inset-0 after:z-0">
            {item.title || "Video de YouTube"}
          </Link>
        </h3>
        <p className="truncate text-[0.8rem] text-muted-foreground">{item.channel}</p>
        {(item.tags?.length ?? 0) > 0 && (
          <TagChips tags={item.tags!} max={2} onSelect={onSelectTag} className="relative z-10 pt-1" />
        )}
        <p className="mt-auto flex items-center gap-2 pt-1.5 text-xs text-muted-foreground">
          <span className={cn(isStuck(item) && "text-destructive", active && "text-signal-ink")}>
            {STATUS_LABEL[item.status]}
          </span>
          <span aria-hidden>/</span>
          <span>{timeAgo(item.createdAt)}</span>
          {item.demo && <span className="ml-auto rounded-full border border-border px-2 py-0.5">Ejemplo</span>}
        </p>
      </div>
    </article>
  )
}

/** Vista de lista: una fila por video, ideal para recorrer muchos de un vistazo. */
export function VideoRow({ item, className, knownTags, onTagsChange, onSelectTag }: CardProps) {
  const active = isBusy(item)
  return (
    <article
      className={cn(
        "group relative flex items-center gap-3 rounded-xl border border-border bg-surface p-2 pr-3 backdrop-blur-md transition-colors focus-within:border-signal-ink/50 hover:border-signal-ink/50 sm:gap-4",
        className
      )}
    >
      <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-lg bg-surface-raised sm:w-36">
        <Thumb videoId={item.videoId} />
        {item.durationSec > 0 && (
          <span className="tnum absolute right-1 bottom-1 rounded-full bg-background/80 px-1.5 py-0.5 font-mono text-[0.6rem] backdrop-blur">
            {formatDuration(item.durationSec)}
          </span>
        )}
        {active && (
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-foreground/10">
            <div className="h-full origin-left bg-signal" style={{ transform: `scaleX(${Math.max(0.06, item.progress)})` }} />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="line-clamp-2 font-display text-[0.95rem] leading-snug font-semibold tracking-tight sm:line-clamp-1">
          <Link to={`/resumen/${item.id}`} className="outline-none after:absolute after:inset-0 after:z-0">
            {item.title || "Video de YouTube"}
          </Link>
        </h3>
        <p className="flex min-w-0 items-center gap-2 text-[0.8rem] text-muted-foreground">
          <span className="truncate">{item.channel}</span>
          <span aria-hidden>/</span>
          <span className="shrink-0">{timeAgo(item.createdAt)}</span>
          <span aria-hidden>/</span>
          <span className={cn("shrink-0", isStuck(item) && "text-destructive", active && "text-signal-ink")}>
            {STATUS_LABEL[item.status]}
          </span>
        </p>
        {(item.tags?.length ?? 0) > 0 && (
          <TagChips tags={item.tags!} max={4} onSelect={onSelectTag} className="relative z-10" />
        )}
      </div>
      <Tagger item={item} knownTags={knownTags} onTagsChange={onTagsChange} className="relative z-10 shrink-0" />
    </article>
  )
}
