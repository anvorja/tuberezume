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
  /** datos de ejemplo del frontend, no vienen del backend */
  demo?: boolean
}
