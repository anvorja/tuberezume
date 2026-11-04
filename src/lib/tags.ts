import type { Summary } from "./types"

export const MAX_TAGS = 10
const OK = /^[\p{L}\p{N}_ .+#&-]{1,24}$/u

/** Espacios normalizados. Devuelve null si no es una etiqueta válida. */
export function cleanTag(raw: string): string | null {
  const t = raw.split(/\s+/).filter(Boolean).join(" ")
  return OK.test(t) ? t : null
}

export interface TagCount {
  name: string
  count: number
}

/** Todas las etiquetas en uso, de la más usada a la menos (y por nombre al empatar). */
export function collectTags(items: Summary[]): TagCount[] {
  const map = new Map<string, TagCount>()
  for (const s of items) {
    for (const name of s.tags ?? []) {
      const key = name.toLocaleLowerCase()
      const hit = map.get(key)
      if (hit) hit.count++
      else map.set(key, { name, count: 1 })
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "es"))
}

export const hasTag = (s: Summary, tag: string) =>
  (s.tags ?? []).some((t) => t.toLocaleLowerCase() === tag.toLocaleLowerCase())

/** Color estable por etiqueta, para reconocerla de un vistazo. */
export function tagColor(name: string): string {
  let h = 0
  for (const c of name.toLocaleLowerCase()) h = (h * 31 + c.charCodeAt(0)) % 360
  return `oklch(0.72 0.14 ${h})`
}
