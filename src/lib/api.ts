import { SEED } from "./seed"
import type { Role, SessionInfo, Summary, SummaryStatus, User } from "./types"
import { parseYouTubeId } from "./youtube"

/**
 * Capa de acceso al backend.
 *
 * Con una conexión (guardada en Ajustes o VITE_API_URL) se usa el backend HTTP:
 *   POST   /summaries        { url }  -> Summary (status "queued")
 *   GET    /summaries                 -> Summary[]
 *   GET    /summaries/:id             -> Summary
 *   DELETE /summaries/:id
 *   PATCH  /summaries/:id/notes { notes }
 *   PATCH  /summaries/:id/tags  { tags }
 * Todas exigen sesión (POST /auth/login). El administrador solo usa /admin/users.
 * Sin conexión se usa `mockApi`, que persiste en localStorage y simula
 * las etapas de procesamiento por tiempo transcurrido.
 */
export interface Api {
  list(): Promise<Summary[]>
  get(id: string): Promise<Summary>
  create(url: string): Promise<Summary>
  remove(id: string): Promise<void>
  saveNotes(id: string, notes: string): Promise<Summary>
  saveTags(id: string, tags: string[]): Promise<Summary>
}

const ENV_BASE = import.meta.env.VITE_API_URL as string | undefined

/**
 * Conexión elegida en Ajustes. Vive en localStorage (no en el bundle), así un
 * frontend desplegado puede apuntar a un backend cuya URL cambia (p. ej. un túnel).
 */
export interface Connection {
  url: string
  token: string
}

const CONN_KEY = "tr:connection"
const SEARCH_KEY = "tr:websearch"

export function normalizeUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, "")
}

export function getConnection(): Connection | null {
  try {
    const raw = localStorage.getItem(CONN_KEY)
    if (raw) {
      const c = JSON.parse(raw) as Partial<Connection>
      if (c.url) return { url: normalizeUrl(c.url), token: c.token ?? "" }
    }
  } catch {
    /* almacenamiento bloqueado o dato corrupto */
  }
  return ENV_BASE ? { url: normalizeUrl(ENV_BASE), token: "" } : null
}

export function saveConnection(c: Connection | null) {
  try {
    if (c && c.url.trim()) {
      localStorage.setItem(
        CONN_KEY,
        JSON.stringify({ url: normalizeUrl(c.url), token: c.token.trim() })
      )
    } else {
      localStorage.removeItem(CONN_KEY)
    }
  } catch {
    /* sin persistencia local */
  }
}

/** Preferencia de Ajustes: pedir al backend que complete el resumen con una búsqueda web. */
export function getWebSearch(): boolean {
  try {
    return localStorage.getItem(SEARCH_KEY) === "on"
  } catch {
    return false
  }
}

export function setWebSearch(on: boolean) {
  try {
    localStorage.setItem(SEARCH_KEY, on ? "on" : "off")
  } catch {
    /* sin persistencia local */
  }
}

async function http<T>(conn: Connection, path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    // El plan gratuito de ngrok responde con una página de aviso HTML si falta esta cabecera.
    "ngrok-skip-browser-warning": "1",
  }
  if (conn.token) headers.Authorization = `Bearer ${conn.token}`
  let res: Response
  try {
    res = await fetch(`${conn.url}${path}`, { ...init, headers })
  } catch {
    throw new Error(
      "No pudimos conectar con el servidor. Revisa que esté encendido y que la dirección en Ajustes sea correcta."
    )
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    if (res.status === 401 && conn.token && path !== "/auth/login") {
      // Sesión caducada o desactivada: se descarta y se vuelve a pedir el acceso.
      saveConnection({ url: conn.url, token: "" })
      clearUser()
      location.assign("/entrar")
    }
    // "Not Found" / "Method Not Allowed" genéricos = la ruta no existe: el servidor es una versión anterior.
    // (Los 404 propios del backend, como «Resumen no encontrado», traen su mensaje y se muestran tal cual.)
    if ((res.status === 404 || res.status === 405) && /^(Not Found|Method Not Allowed)$/i.test(body?.message ?? "")) {
      throw new Error(
        "Este servidor aún no tiene esta función. Reinícialo (o espera a que se actualice) e inténtalo de nuevo."
      )
    }
    throw new Error(body?.message ?? `Error ${res.status}`)
  }
  return res.status === 204 ? (undefined as T) : res.json()
}

function makeHttpApi(conn: Connection): Api {
  return {
    list: () => http(conn, "/summaries"),
    get: (id) => http(conn, `/summaries/${id}`),
    create: (url) =>
      http(conn, "/summaries", {
        method: "POST",
        body: JSON.stringify({ url, webSearch: getWebSearch() }),
      }),
    remove: (id) => http(conn, `/summaries/${id}`, { method: "DELETE" }),
    saveNotes: (id, notes) =>
      http(conn, `/summaries/${id}/notes`, { method: "PATCH", body: JSON.stringify({ notes }) }),
    saveTags: (id, tags) =>
      http(conn, `/summaries/${id}/tags`, { method: "PATCH", body: JSON.stringify({ tags }) }),
  }
}

/* ---------- Sesión y administración ---------- */

const USER_KEY = "tr:user"

export function getCachedUser(): { username: string; role: Role } | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function cacheUser(u: { username: string; role: Role }) {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify({ username: u.username, role: u.role }))
  } catch {
    /* sin persistencia local */
  }
}

function clearUser() {
  try {
    localStorage.removeItem(USER_KEY)
  } catch {
    /* sin persistencia local */
  }
}

export const hasSession = () => !!getConnection()?.token

/** Inicia sesión en el servidor indicado y guarda dirección + sesión en este navegador. */
export async function login(url: string, username: string, password: string): Promise<SessionInfo> {
  const base = normalizeUrl(url)
  const s = await http<SessionInfo>({ url: base, token: "" }, "/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  })
  saveConnection({ url: base, token: s.token })
  cacheUser(s.user)
  return s
}

export function logout() {
  const c = getConnection()
  saveConnection(c ? { url: c.url, token: "" } : null)
  clearUser()
}

/** Valida la sesión guardada y devuelve el usuario y si este servidor puede procesar videos. */
export async function fetchMe(): Promise<SessionInfo> {
  const conn = getConnection()
  if (!conn?.token) throw new Error("Sin sesión")
  const s = await http<SessionInfo>(conn, "/auth/me")
  cacheUser(s.user)
  return s
}

function adminConn(): Connection {
  const c = getConnection()
  if (!c?.token) throw new Error("Inicia sesión para continuar.")
  return c
}

export const adminApi = {
  list: () => http<User[]>(adminConn(), "/admin/users"),
  create: (username: string, password: string, role: Role) =>
    http<User>(adminConn(), "/admin/users", {
      method: "POST",
      body: JSON.stringify({ username, password, role }),
    }),
  patch: (id: string, body: { password?: string; active?: boolean }) =>
    http<User>(adminConn(), `/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  remove: (id: string) => http<void>(adminConn(), `/admin/users/${id}`, { method: "DELETE" }),
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
      "Respuesta simulada: no hay un servidor conectado. Ve a Ajustes, escribe la dirección de tu servidor y la clave de acceso para recibir aquí el resumen real de este video.",
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
  async saveNotes(id, notes) {
    const items = load()
    const found = items.find((s) => s.id === id)
    if (!found) throw new Error("No encontramos este resumen.")
    found.notes = notes
    save(items)
    return found
  },
  async saveTags(id, tags) {
    const items = load()
    const found = items.find((s) => s.id === id)
    if (!found) throw new Error("No encontramos este resumen.")
    found.tags = tags
    save(items)
    return found
  },
}

/** Elige backend real o simulador en cada llamada, según la conexión guardada. */
function current(): Api {
  const conn = getConnection()
  return conn?.token ? makeHttpApi(conn) : mockApi
}

export const api: Api = {
  list: () => current().list(),
  get: (id) => current().get(id),
  create: (url) => current().create(url),
  remove: (id) => current().remove(id),
  saveNotes: (id, notes) => current().saveNotes(id, notes),
  saveTags: (id, tags) => current().saveTags(id, tags),
}

/** Modo demostración: sin servidor o sin sesión iniciada. */
export const isMock = () => !hasSession()
