import type { CallFindings } from '../types.js'

// How we refer to a call in headings: its date if we know it, else its title.
export function callLabel(f: CallFindings): string {
  return f.call.date ?? f.call.title ?? 'latest'
}

export function bullets(items: string[]): string {
  return items.map((item) => `- ${item}`).join('\n')
}

// One line per objection: the theme, the prospect's own words, and what to say back.
export function objectionLines(f: CallFindings): string {
  return f.objections
    .map((o) => `- **${o.theme}**: "${o.quote}"\n  - Say: ${o.betterAnswer}`)
    .join('\n')
}
