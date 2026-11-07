import { scrub } from '../scrub.js'
import type { CallFindings } from '../types.js'

// objections.md has two parts:
// 1. A counts table at the top, rebuilt from the log every run.
// 2. The log itself: one row per objection, per call, added and never rewritten.
// So a person can fix an answer in the log and it stays fixed.

interface Row {
  date: string
  call: string
  competitor: string
  theme: string
  quote: string
  answer: string
}

const COUNTS_START = '<!-- counts:start -->'
const COUNTS_END = '<!-- counts:end -->'
const LOG_HEADER = '| Date | Call | Competitor | Theme | Quote | Better answer |\n|---|---|---|---|---|---|'

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

function rowLine(r: Row): string {
  return `| ${r.date} | ${r.call} | ${r.competitor} | ${r.theme} | ${r.quote} | ${r.answer} |`
}

// Read the log rows back out of an existing file, keeping each line as written.
function parseLog(existing: string): { rows: Row[]; lines: string[] } {
  const logPart = existing.split('## Log')[1] ?? ''
  const lines = logPart.split('\n').filter((l) => l.trim().startsWith('|')).slice(2)
  const rows = lines.map((line) => {
    const [date, call, competitor, theme, quote, answer] = splitRow(line)
    return { date, call, competitor, theme, quote, answer }
  })
  return { rows, lines }
}

function countsTable(rows: Row[]): string {
  const byTheme = new Map<string, { count: number; last: string; quote: string }>()
  for (const r of rows) {
    const seen = byTheme.get(r.theme)
    if (!seen) byTheme.set(r.theme, { count: 1, last: r.date, quote: r.quote })
    else {
      seen.count += 1
      if (r.date >= seen.last) {
        seen.last = r.date
        seen.quote = r.quote
      }
    }
  }
  const sorted = [...byTheme.entries()].sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]))
  const body = sorted.map(([theme, s]) => `| ${theme} | ${s.count} | ${s.last} | ${s.quote} |`).join('\n')
  return `${COUNTS_START}\n| Theme | Count | Last heard | Example quote |\n|---|---|---|---|\n${body}\n${COUNTS_END}`
}

export function updateObjectionLog(existing: string | null, f: CallFindings): string {
  const { rows, lines } = existing ? parseLog(existing) : { rows: [], lines: [] }

  const callId = cell(f.call.meetingId ?? f.call.title ?? f.call.date ?? 'unknown')
  const date = f.call.date ?? 'unknown'
  const already = new Set(rows.map((r) => `${r.call}::${r.theme}`))

  const newRows: Row[] = []
  for (const o of f.objections) {
    const theme = cell(o.theme.toLowerCase())
    if (already.has(`${callId}::${theme}`)) continue // same call run twice
    already.add(`${callId}::${theme}`)
    newRows.push({
      date,
      call: callId,
      competitor: cell(f.competitor ?? 'none'),
      theme,
      quote: `"${cell(scrub(o.quote))}"`,
      answer: cell(scrub(o.betterAnswer)),
    })
  }

  const allRows = [...rows, ...newRows]
  const allLines = [...lines, ...newRows.map(rowLine)]

  // Keep anything a person wrote above the log; only the counts block is rebuilt.
  const fresh = `# Objection log\n\n${countsTable(allRows)}\n\n`
  const head = existing?.split('## Log')[0]
  const top =
    head && head.includes(COUNTS_START) && head.includes(COUNTS_END)
      ? head.replace(new RegExp(`${COUNTS_START}[\\s\\S]*?${COUNTS_END}`), countsTable(allRows))
      : fresh
  return `${top}## Log\n\n${LOG_HEADER}\n${allLines.join('\n')}\n`
}
