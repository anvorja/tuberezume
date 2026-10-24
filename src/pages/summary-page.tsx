import * as React from "react"
import { Check, ExternalLink, Copy, Trash2 } from "lucide-react"
import { Link, useNavigate, useParams } from "react-router"
import { toast } from "sonner"

import { Processing } from "@/components/processing"
import { SummaryBody } from "@/components/summary-body"
import { Thumb } from "@/components/video-card"
import { Button } from "@/components/ui/button"
import { COPY_LABEL, summaryToText, type SummaryTab } from "@/lib/export"
import { isActive, useLibrary } from "@/lib/library"
import { formatDuration, timeAgo, watchUrl } from "@/lib/youtube"

export default function SummaryPage() {
  const { id } = useParams()
  const { items, state, remove, submit } = useLibrary()
  const navigate = useNavigate()
  const [confirm, setConfirm] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [tab, setTab] = React.useState<SummaryTab>("resumen")
  const item = items.find((s) => s.id === id)

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
    return (
      <div className="flex max-w-md flex-col items-start gap-4 px-4 py-16 md:px-12">
        <h1 className="text-3xl font-semibold">No encontramos este resumen</h1>
        <p className="text-muted-foreground">Puede que se haya eliminado. Revisa tu biblioteca.</p>
        <Button asChild><Link to="/app/biblioteca">Ir a la biblioteca</Link></Button>
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

  if (item.status === "failed") {
    return (
      <div className="flex max-w-lg flex-col items-start gap-4 px-4 py-16 md:px-12">
        <h1 className="text-3xl font-semibold">No pudimos resumir este video</h1>
        <p className="text-muted-foreground">
          {item.error ?? "Puede que no tenga subtítulos ni audio disponible."} Intenta de nuevo o prueba con otro video.
        </p>
        <div className="flex gap-2">
          <Button onClick={async () => navigate(`/app/resumen/${await submit(item.url)}`)}>Reintentar</Button>
          <Button variant="outline" onClick={async () => { await remove(item.id); navigate("/app/biblioteca") }}>Eliminar</Button>
        </div>
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

  const del = async () => {
    if (!confirm) {
      setConfirm(true)
      setTimeout(() => setConfirm(false), 3500)
      return
    }
    await remove(item.id)
    toast.success("Resumen eliminado")
    navigate("/app/biblioteca")
  }

  return (
    <article className="grid gap-8 px-4 py-6 md:px-12 md:py-12 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-14">
      <header className="flex flex-col gap-5 lg:sticky lg:top-8 lg:self-start">
        <div className="aspect-video overflow-hidden rounded-xl border border-border">
          <Thumb videoId={item.videoId} />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl leading-[1.05] font-semibold md:text-4xl">{item.title}</h1>
          <p className="text-muted-foreground">
            {item.channel}
            {item.durationSec > 0 && <span className="tnum"> / {formatDuration(item.durationSec)}</span>}
            <span> / {timeAgo(item.createdAt)}</span>
          </p>
          {item.demo && (
            <p className="text-sm text-muted-foreground">Resumen de ejemplo, escrito a mano para mostrar el formato.</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={copy} variant="outline" size="sm">
            {copied ? <Check /> : <Copy />}
            {copied ? "Copiado" : `Copiar ${COPY_LABEL[tab]}`}
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={watchUrl(item.videoId)} target="_blank" rel="noreferrer">
              <ExternalLink /> Ver en YouTube
            </a>
          </Button>
          <Button onClick={del} variant={confirm ? "destructive" : "ghost"} size="sm">
            <Trash2 /> {confirm ? "Confirmar" : "Eliminar"}
          </Button>
        </div>
      </header>
      <SummaryBody item={item} tab={tab} onTabChange={setTab} />
    </article>
  )
}
