export type SummaryStatus =
  | "queued"
  | "transcribing"
  | "summarizing"
  | "ready"
  | "failed"

export interface Chapter {
  start: number
  title: string
  summary: string
}

export interface TranscriptLine {
  start: number
  text: string
}

export interface Summary {
  id: string
  url: string
  videoId: string
  title: string
  channel: string
  durationSec: number
  createdAt: string
  status: SummaryStatus
  /** 0..1, avance global del procesamiento */
  progress: number
  error?: string
  tldr: string
  keyPoints: string[]
  chapters: Chapter[]
  transcript: TranscriptLine[]
  /** fuentes web que el backend usó para completar el resumen */
  sources?: { title: string; url: string }[]
  /** apuntes del usuario sobre el video */
  notes?: string
  /** etiquetas para organizar la biblioteca (carpetas) */
  tags?: string[]
  /** datos de ejemplo del frontend, no vienen del backend */
  demo?: boolean
}

export type Role = "admin" | "user"

export interface User {
  id: string
  username: string
  role: Role
  active: boolean
  createdAt: string
}

export interface SessionInfo {
  token: string
  user: User
  /** false en el servidor de consulta (nube): no procesa videos */
  canProcess: boolean
}
