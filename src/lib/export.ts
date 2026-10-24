import type { Summary } from "./types"
import { formatTime } from "./youtube"

export type SummaryTab = "resumen" | "capitulos" | "transcripcion"

export const COPY_LABEL: Record<SummaryTab, string> = {
  resumen: "resumen",
  capitulos: "capítulos",
  transcripcion: "transcripción",
}

/** Texto plano de la pestaña indicada, listo para pegar. */
export function summaryToText(item: Summary, tab: SummaryTab): string {
  const head = `${item.title}\n${item.url}\n\n`
  switch (tab) {
    case "resumen": {
      const sources = item.sources?.length
        ? `\n\nContexto de la web:\n${item.sources.map((s) => `- ${s.title}: ${s.url}`).join("\n")}`
        : ""
      return `${head}${item.tldr}\n\n${item.keyPoints.map((p) => `- ${p}`).join("\n")}${sources}`
    }
    case "capitulos":
      return (
        head +
        item.chapters
          .map((c) => `[${formatTime(c.start)}] ${c.title}\n${c.summary}`)
          .join("\n\n")
      )
    case "transcripcion":
      return head + item.transcript.map((l) => `[${formatTime(l.start)}] ${l.text}`).join("\n")
  }
}
