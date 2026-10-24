const ID = /^[\w-]{11}$/

export function parseYouTubeId(input: string): string | null {
  const raw = input.trim()
  if (!raw) return null
  let url: URL
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
  } catch {
    return null
  }
  const host = url.hostname.replace(/^(www|m|music)\./, "")
  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0]
    return ID.test(id) ? id : null
  }
  if (host === "youtube.com") {
    if (url.pathname === "/watch") {
      const v = url.searchParams.get("v")
      return v && ID.test(v) ? v : null
    }
    const m = url.pathname.match(/^\/(?:shorts|embed|live|v)\/([\w-]{11})/)
    return m ? m[1] : null
  }
  return null
}

export const thumbnailUrl = (videoId: string) =>
  `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`

export const watchUrl = (videoId: string, startSec = 0) =>
  `https://www.youtube.com/watch?v=${videoId}${startSec ? `&t=${Math.floor(startSec)}s` : ""}`

/** 3725 -> 1:02:05 */
export function formatTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = s % 60
  const mm = h ? String(m).padStart(2, "0") : String(m)
  return `${h ? `${h}:` : ""}${mm}:${String(r).padStart(2, "0")}`
}

/** 6975 -> 1 h 56 min */
export function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.round((sec % 3600) / 60)
  if (h && m) return `${h} h ${m} min`
  if (h) return `${h} h`
  return `${Math.max(1, m)} min`
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return "ahora"
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.floor(h / 24)
  if (d < 30) return `hace ${d} ${d === 1 ? "día" : "días"}`
  return new Date(iso).toLocaleDateString("es", {
    day: "numeric",
    month: "short",
  })
}
