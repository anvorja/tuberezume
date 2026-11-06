import * as React from "react"
import { Check, ExternalLink, Copy, Link2, Trash2 } from "lucide-react"
import { Link, useNavigate, useParams } from "react-router"
import { toast } from "sonner"

import { ConfirmDelete } from "@/components/confirm-delete"
import { Processing } from "@/components/processing"
import { TagButton, TagChips, TagPicker } from "@/components/tags"
import { SummaryBody } from "@/components/summary-body"
import { Thumb } from "@/components/video-card"
import { Button } from "@/components/ui/button"
import { COPY_LABEL, summaryToText, type SummaryTab } from "@/lib/export"
import { isActive, useLibrary } from "@/lib/library"
import { collectTags } from "@/lib/tags"
import { useSession } from "@/lib/session"
import { formatDuration, timeAgo, watchUrl } from "@/lib/youtube"

export default function SummaryPage() {
  const { id } = useParams()
  const { items, state, remove, resume, submit, saveNotes, setTags } = useLibrary()
  const { canProcess } = useSession()
  const navigate = useNavigate()
  const [askDelete, setAskDelete] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [resuming, setResuming] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [urlCopied, setUrlCopied] = React.useState(false)
  const [tab, setTab] = React.useState<SummaryTab>("resumen")
  const item = items.find((s) => s.id === id)

  const doDelete = async () => {
    if (!item) return
    setDeleting(true)
    try {
      await remove(item.id)
    } catch (e) {
      setDeleting(false)
      throw e
    }
    toast.success("Resumen eliminado")
    navigate("/biblioteca")
  }

  if (state === "loading" && !item) {
    return (
      <div className="flex flex-col gap-6 px-4 py-8 md:px-12">
        <div className="skeleton aspect-video max-w-2xl rounded-xl" />
        <div className="skeleton h-10 max-w-xl rounded-full" />
        <div className="skeleton h-40 max-w-3xl rounded-xl" />
      </div>
    )
  }

  if (!item) {
    // Tras borrar, la biblioteca ya no tiene el resumen: no mostrar "no encontrado" mientras se navega.
    if (deleting) return null
    return (
      <div className="flex max-w-md flex-col items-start gap-4 px-4 py-16 md:px-12">
        <h1 className="text-3xl font-semibold">No encontramos este resumen</h1>
        <p className="text-muted-foreground">Puede que se haya eliminado. Revisa tu biblioteca.</p>
        <Button asChild><Link to="/biblioteca">Ir a la biblioteca</Link></Button>
      </div>
    )
  }

  if (isActive(item)) {
    return (
      <div className="px-4 py-4 md:p-8">
        <Processing item={item} />
      </div>
    )
  }

  if (item.status === "interrupted") {
    const doResume = async () => {
      setResuming(true)
      try {
        await resume(item.id)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No pudimos reanudar el resumen.")
      } finally {
        setResuming(false)
      }
    }
    return (
      <div className="flex max-w-lg flex-col items-start gap-4 px-4 py-16 md:px-12">
        <h1 className="text-3xl font-semibold">Este resumen quedó a medias</h1>
        <p className="text-muted-foreground">
          {item.error ?? "El servidor se reinició antes de terminar."}
          {!canProcess && " Este servidor es solo de consulta: reanúdalo desde el equipo que procesa los videos."}
        </p>
        <div className="flex gap-2">
          {canProcess && (
            <Button onClick={doResume} disabled={resuming}>{resuming ? "Reanudando…" : "Reanudar"}</Button>
          )}
          <Button variant="outline" onClick={() => setAskDelete(true)}>Descartar</Button>
        </div>
        <ConfirmDelete open={askDelete} onOpenChange={setAskDelete} title={item.title || item.url} onConfirm={doDelete} />
      </div>
    )
  }

  if (item.status === "failed") {
    return (
      <div className="flex max-w-lg flex-col items-start gap-4 px-4 py-16 md:px-12">
        <h1 className="text-3xl font-semibold">No pudimos resumir este video</h1>
        <p className="text-muted-foreground">
          {item.error ?? "Puede que no tenga subtítulos ni audio disponible."} Intenta de nuevo o prueba con otro video.
        </p>
        <div className="flex gap-2">
          {canProcess && (
            <Button onClick={async () => navigate(`/resumen/${await submit(item.url)}`)}>Reintentar</Button>
          )}
          <Button variant="outline" onClick={() => setAskDelete(true)}>Eliminar</Button>
        </div>
        <ConfirmDelete open={askDelete} onOpenChange={setAskDelete} title={item.title || item.url} onConfirm={doDelete} />
      </div>
    )
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summaryToText(item, tab))
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error("No pudimos copiar. Selecciona el texto a mano.")
    }
  }

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(watchUrl(item.videoId))
      setUrlCopied(true)
      setTimeout(() => setUrlCopied(false), 1800)
    } catch {
      toast.error("No pudimos copiar. Selecciona el texto a mano.")
    }
  }

  return (
    <article className="grid grid-cols-[minmax(0,1fr)] gap-8 px-4 py-6 md:px-12 md:py-12 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] lg:gap-12">
      <header className="flex flex-col gap-5 lg:sticky lg:top-8 lg:self-start">
        <div className="aspect-video max-w-sm overflow-hidden rounded-xl border border-border lg:max-w-none">
          <Thumb videoId={item.videoId} />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl leading-[1.05] font-semibold md:text-4xl">{item.title}</h1>
          <p className="text-muted-foreground">
            {item.channel}
            {item.durationSec > 0 && <span className="tnum"> / {formatDuration(item.durationSec)}</span>}
            <span> / {timeAgo(item.createdAt)}</span>
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <TagChips
              tags={item.tags ?? []}
              onSelect={(t) => navigate(`/biblioteca?etiqueta=${encodeURIComponent(t)}`)}
            />
            <TagPicker
              value={item.tags ?? []}
              known={collectTags(items).map((t) => t.name)}
              onChange={async (t) => {
                try {
                  await setTags(item.id, t)
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "No pudimos guardar las etiquetas.")
                  throw e
                }
              }}
              align="start"
              trigger={<TagButton count={item.tags?.length ?? 0} label="Editar etiquetas" />}
            />
          </div>
          {item.demo && (
            <p className="text-sm text-muted-foreground">Resumen de ejemplo, escrito a mano para mostrar el formato.</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={copy} variant="outline" size="sm">
            {copied ? <Check /> : <Copy />}
            {copied ? "Copiado" : `Copiar ${COPY_LABEL[tab]}`}
          </Button>
          <Button onClick={copyUrl} variant="outline" size="sm">
            {urlCopied ? <Check /> : <Link2 />}
            {urlCopied ? "Copiado" : "Copiar URL"}
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={watchUrl(item.videoId)} target="_blank" rel="noreferrer">
              <ExternalLink /> Ver en YouTube
            </a>
          </Button>
          <Button onClick={() => setAskDelete(true)} variant="ghost" size="sm">
            <Trash2 /> Eliminar
          </Button>
        </div>
      </header>
      <SummaryBody
        item={item}
        tab={tab}
        onTabChange={setTab}
        onSaveNotes={(n) => saveNotes(item.id, n)}
      />
      <ConfirmDelete open={askDelete} onOpenChange={setAskDelete} title={item.title || item.url} onConfirm={doDelete} />
    </article>
  )
}
