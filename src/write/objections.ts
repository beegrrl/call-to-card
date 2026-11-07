import { scrub } from '../scrub.js'
import type { CallFindings, ModelFindings } from '../types.js'

// objections.md has two parts:
// 1. A counts block at the top, between two markers, rebuilt every run.
// 2. The log: a table with one row per objection. New rows are added to the
//    end of the table. Nothing else in the file is ever rewritten, so a person
//    can fix an answer, add notes or add whole sections and they stay put.

type Objection = ModelFindings['objections'][number]

interface Row {
  date: string
  call: string
  theme: string
  quote: string
}

const COUNTS_START = '<!-- counts:start -->'
const COUNTS_END = '<!-- counts:end -->'
const LOG_HEADING = /^## Log\s*$/
const TABLE_HEADER = ['| Date | Call | Competitor | Theme | Quote | Better answer |', '|---|---|---|---|---|---|']

// A pipe inside a cell would split the table, so escape it. Newlines too.
function cell(text: string): string {
  return text.replace(/\r?\n/g, ' ').replace(/\|/g, '\\|').trim()
}

// Split a table line on pipes that aren't escaped.
function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\||\|$/g, '')
    .split(/(?<!\\)\|/)
    .map((c) => c.trim())
}

// Which calls have already been run, so the same call is never counted twice.
function processedIds(text: string | null): string[] {
  const line = text?.match(/<!-- processed: ([^>]*) -->/)?.[1] ?? ''
  return line.split(',').map((s) => s.trim()).filter(Boolean)
}

export function isProcessed(existing: string | null, callId: string): boolean {
  return processedIds(existing).includes(callId)
}

// Find the log table: the run of lines starting with "|" after "## Log".
function findTable(lines: string[]): { heading: number; start: number; end: number } | null {
  const heading = lines.findIndex((l) => LOG_HEADING.test(l))
  if (heading === -1) return null
  let start = -1
  let end = -1
  for (let i = heading + 1; i < lines.length; i++) {
    if (lines[i].startsWith('|')) {
      if (start === -1) start = i
      end = i
    } else if (start !== -1 || lines[i].startsWith('#')) break
  }
  return { heading, start, end }
}

function readRows(lines: string[], table: { start: number; end: number } | null): Row[] {
  if (!table || table.start === -1) return []
  return lines.slice(table.start + 2, table.end + 1).map((line) => {
    const [date, call, , theme, quote] = splitRow(line)
    return { date: date ?? '', call: call ?? '', theme: theme ?? '', quote: quote ?? '' }
  })
}

// "unknown" dates sort as the oldest, so they never win "last heard".
function later(a: string, b: string): boolean {
  if (a === 'unknown') return false
  if (b === 'unknown') return true
  return a >= b
}

function countsBlock(rows: Row[], processed: string[]): string {
  const byTheme = new Map<string, { count: number; last: string; quote: string }>()
  for (const r of rows) {
    const seen = byTheme.get(r.theme)
    if (!seen) byTheme.set(r.theme, { count: 1, last: r.date, quote: r.quote })
    else {
      seen.count += 1
      if (later(r.date, seen.last)) {
        seen.last = r.date
        seen.quote = r.quote
      }
    }
  }
  const sorted = [...byTheme.entries()].sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]))
  const body = sorted.map(([theme, s]) => `| ${theme} | ${s.count} | ${s.last} | ${scrub(s.quote)} |`).join('\n')
  return [
    COUNTS_START,
    '| Theme | Count | Last heard | Example quote |',
    '|---|---|---|---|',
    body,
    `<!-- processed: ${processed.join(', ')} -->`,
    COUNTS_END,
  ].join('\n')
}

export function updateObjectionLog(
  existing: string | null,
  f: CallFindings,
): { text: string; added: Objection[] } {
  const lines = existing === null ? ['# Objection log', ''] : existing.split('\n')
  let table = findTable(lines)
  const rows = readRows(lines, table)

  const date = f.call.date ?? 'unknown'
  const callLabel = cell(scrub(f.call.title ?? f.call.date ?? f.call.id))
  const seen = new Set(rows.map((r) => `${r.call}::${r.theme}::${r.quote}`))

  // Every objection gets its own row, even two on the same theme from one call.
  // Only an identical row (same call, theme and words) is skipped.
  const added: Objection[] = []
  const newRows: Row[] = []
  const newLines: string[] = []
  for (const o of f.objections) {
    const row = { date, call: callLabel, theme: cell(scrub(o.theme.toLowerCase())), quote: `"${cell(scrub(o.quote))}"` }
    const key = `${row.call}::${row.theme}::${row.quote}`
    if (seen.has(key)) continue
    seen.add(key)
    added.push(o)
    newRows.push(row)
    newLines.push(
      `| ${row.date} | ${row.call} | ${cell(scrub(f.competitor ?? 'none'))} | ${row.theme} | ${row.quote} | ${cell(scrub(o.betterAnswer))} |`,
    )
  }

  // Add the new rows at the end of the table, creating the table if needed.
  if (!table) {
    lines.push('## Log', '', ...TABLE_HEADER, ...newLines, '')
  } else if (table.start === -1) {
    lines.splice(table.heading + 1, 0, '', ...TABLE_HEADER, ...newLines)
  } else {
    lines.splice(table.end + 1, 0, ...newLines)
  }

  // Rebuild only what sits between the count markers, or add a counts block
  // under the title if someone deleted it.
  table = findTable(lines)
  const processed = [...new Set([...processedIds(existing), f.call.id])]
  const counts = countsBlock([...rows, ...newRows], processed)
  let text = lines.join('\n')
  const markers = new RegExp(`${COUNTS_START}[\\s\\S]*?${COUNTS_END}`)
  if (markers.test(text)) {
    text = text.replace(markers, () => counts)
  } else {
    const titleAt = lines.findIndex((l) => l.startsWith('# '))
    lines.splice(titleAt + 1, 0, '', counts)
    text = lines.join('\n')
  }
  return { text: text.endsWith('\n') ? text : `${text}\n`, added }
}
