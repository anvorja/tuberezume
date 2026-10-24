import { SEED } from "./seed"
import type { Summary, SummaryStatus } from "./types"
import { parseYouTubeId } from "./youtube"

/**
 * Capa de acceso al backend.
 *
 * Con VITE_API_URL definido se usa `httpApi` (contrato supuesto, ajustable):
 *   POST   /summaries        { url }  -> Summary (status "queued")
 *   GET    /summaries                 -> Summary[]
 *   GET    /summaries/:id             -> Summary
 *   DELETE /summaries/:id
 * Sin VITE_API_URL se usa `mockApi`, que persiste en localStorage y simula
 * las etapas de procesamiento por tiempo transcurrido.
 */
export interface Api {
  list(): Promise<Summary[]>
  get(id: string): Promise<Summary>
  create(url: string): Promise<Summary>
  remove(id: string): Promise<void>
}

const BASE = import.meta.env.VITE_API_URL as string | undefined

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.message ?? `Error ${res.status}`)
  }
  return res.status === 204 ? (undefined as T) : res.json()
}

const httpApi: Api = {
  list: () => http("/summaries"),
  get: (id) => http(`/summaries/${id}`),
  create: (url) =>
    http("/summaries", { method: "POST", body: JSON.stringify({ url }) }),
  remove: (id) => http(`/summaries/${id}`, { method: "DELETE" }),
}

/* ---------- Mock ---------- */

const KEY = "tuberezume:mock:v1"
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

interface Stored extends Summary {
  startedAt?: number
}

function load(): Stored[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as Stored[]
  } catch {
    /* almacenamiento bloqueado */
  }
  return structuredClone(SEED)
}

function save(items: Stored[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items))
  } catch {
    /* sin persistencia local */
  }
}

/** Etapas simuladas: 1,2 s en cola, 2,8 s transcribiendo, 3,6 s resumiendo. */
const STAGES: [SummaryStatus, number][] = [
  ["queued", 1200],
  ["transcribing", 4000],
  ["summarizing", 7600],
]

function advance(item: Stored): Stored {
  if (!item.startedAt || item.status === "ready" || item.status === "failed")
    return item
  const elapsed = Date.now() - item.startedAt
  const total = STAGES[STAGES.length - 1][1]
  const stage = STAGES.find(([, until]) => elapsed < until)
  if (stage) {
    return {
      ...item,
      status: stage[0],
      progress: Math.min(0.96, elapsed / total),
    }
  }
  return {
    ...item,
    status: "ready",
    progress: 1,
    tldr:
      "Respuesta simulada: el frontend no está conectado a un backend. Define VITE_API_URL para recibir aquí el resumen real de este video.",
    keyPoints: [
      "Este resumen es de demostración y no refleja el contenido del video.",
      "Con el backend conectado verás aquí los puntos clave generados.",
    ],
    chapters: [
      {
        start: 0,
        title: "Inicio del video",
        summary: "Los capítulos reales llegarán desde el backend.",
      },
    ],
    transcript: [
      { start: 0, text: "La transcripción real aparecerá aquí cuando el backend esté conectado." },
    ],
    startedAt: undefined,
  }
}

async function fetchMeta(url: string) {
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 2500)
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
      { signal: ctrl.signal }
    )
    clearTimeout(t)
    if (!res.ok) return null
    const j = (await res.json()) as { title?: string; author_name?: string }
    return { title: j.title, channel: j.author_name }
  } catch {
    return null
  }
}

const mockApi: Api = {
  async list() {
    await sleep(250)
    const items = load().map(advance)
    save(items)
    return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },
  async get(id) {
    await sleep(120)
    const items = load().map(advance)
    save(items)
    const found = items.find((s) => s.id === id)
    if (!found) throw new Error("No encontramos este resumen.")
    return found
  },
  async create(url) {
    const videoId = parseYouTubeId(url)
    if (!videoId) throw new Error("Este enlace no parece ser de YouTube.")
    const items = load()
    const existing = items.find((s) => s.videoId === videoId && s.status === "ready")
    if (existing) return existing
    const meta = await fetchMeta(url)
    const item: Stored = {
      id: crypto.randomUUID(),
      url,
      videoId,
      title: meta?.title ?? "Video de YouTube",
      channel: meta?.channel ?? "YouTube",
      durationSec: 0,
      createdAt: new Date().toISOString(),
      status: "queued",
      progress: 0,
      tldr: "",
      keyPoints: [],
      chapters: [],
      transcript: [],
      startedAt: Date.now(),
    }
    save([item, ...items])
    return item
  },
  async remove(id) {
    await sleep(120)
    save(load().filter((s) => s.id !== id))
  },
}

export const api: Api = BASE ? httpApi : mockApi
export const isMock = !BASE
