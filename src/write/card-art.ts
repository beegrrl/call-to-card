import { scrub } from '../scrub.js'
import type { CallFindings } from '../types.js'

// Every battlecard gets a trading card. The competitor is the creature, the
// objections from the call are its moves, and the questions that flip it are
// what it's weak to. Plain SVG, so anyone can open it in a design tool and
// redraw it. The creature in the art slot is drawn from the competitor's name,
// so the same competitor always gets the same creature. Swap the <g id="art">
// group for your own illustration if you have one.

const INK = '#1F2328'
const PAPER = '#FFFDF7'
const MUTED = '#5A5F66'
const FONT = "'Atkinson Hyperlegible', Inter, system-ui, -apple-system, Helvetica, Arial, sans-serif"

// Each palette is a frame color and a lighter wash for the art slot. All of
// the frame colors sit above 4.5:1 on the paper background.
const PALETTES = [
  { name: 'rust', frame: '#9A3B1E', wash: '#F6E3D8' },
  { name: 'moss', frame: '#3F6B2A', wash: '#E2EEDA' },
  { name: 'plum', frame: '#6B2E6E', wash: '#EFDFF0' },
  { name: 'indigo', frame: '#2F3F8F', wash: '#DEE2F5' },
  { name: 'teal', frame: '#1F6B6B', wash: '#D9EDED' },
]

export const W = 360
export const H = 504

function hash(text: string): number {
  let h = 2166136261
  for (const ch of text.toLowerCase()) {
    h ^= ch.charCodeAt(0)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h
}

export function paletteFor(name: string): { name: string; frame: string; wash: string } {
  return PALETTES[hash(name) % PALETTES.length]
}

// Objection count on the call, shown as 1 to 5 filled pips.
export function threatLevel(count: number): number {
  if (count <= 0) return 0
  return Math.min(5, Math.ceil(count / 1.5))
}

function esc(text: string): string {
  return scrub(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Wrap text into lines of about `width` characters, keeping at most `max`
// lines and ending with an ellipsis if there's more.
export function wrap(text: string, width: number, max: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (line && `${line} ${word}`.length > width) {
      lines.push(line)
      line = word
    } else line = line ? `${line} ${word}` : word
  }
  if (line) lines.push(line)
  if (lines.length <= max) return lines
  const kept = lines.slice(0, max)
  kept[max - 1] = `${kept[max - 1].replace(/[.,;:]?$/, '')}…`
  return kept
}

function oneLine(text: string, width: number): string {
  return wrap(text, width, 1)[0] ?? ''
}

function tspans(lines: string[], x: number, lineHeight: number): string {
  return lines
    .map((l, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : lineHeight}">${esc(l)}</tspan>`)
    .join('')
}

// A small original creature built from the competitor's name: a body, a few
// eyes, something on its head, and a few legs. Centered at (cx, cy).
export function renderCreature(name: string, cx: number, cy: number, color: string): string {
  const h = hash(name)
  const pick = (shift: number, n: number) => (h >>> shift) % n
  const bodyW = 58 + pick(0, 4) * 8 // 58 to 82
  const bodyH = 46 + pick(3, 4) * 6 // 46 to 64
  const eyes = 1 + pick(6, 3) // 1 to 3
  const headgear = pick(9, 4) // 0 none, 1 horns, 2 antenna, 3 crest
  const legs = 2 + pick(12, 3) * 2 // 2, 4 or 6
  const tail = pick(15, 2) === 1
  const parts: string[] = []

  // legs first, so the body sits on top of them
  for (let i = 0; i < legs; i++) {
    const t = legs === 1 ? 0.5 : i / (legs - 1)
    const lx = cx - bodyW / 2 + 10 + t * (bodyW - 20)
    parts.push(
      `<line x1="${lx}" y1="${cy + bodyH / 2 - 6}" x2="${lx + (t < 0.5 ? -4 : 4)}" y2="${cy + bodyH / 2 + 16}" stroke="${color}" stroke-width="5" stroke-linecap="round"/>`,
    )
  }
  if (tail) {
    parts.push(
      `<path d="M${cx + bodyW / 2 - 4} ${cy + 4} q 26 -6 22 -28" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round"/>`,
    )
  }
  parts.push(`<ellipse cx="${cx}" cy="${cy}" rx="${bodyW / 2}" ry="${bodyH / 2}" fill="${color}"/>`)
  if (headgear === 1) {
    parts.push(
      `<path d="M${cx - 18} ${cy - bodyH / 2 + 6} l -8 -20 l 16 10 z M${cx + 18} ${cy - bodyH / 2 + 6} l 8 -20 l -16 10 z" fill="${color}"/>`,
    )
  } else if (headgear === 2) {
    parts.push(
      `<line x1="${cx}" y1="${cy - bodyH / 2}" x2="${cx + 6}" y2="${cy - bodyH / 2 - 22}" stroke="${color}" stroke-width="4" stroke-linecap="round"/><circle cx="${cx + 7}" cy="${cy - bodyH / 2 - 25}" r="5" fill="${color}"/>`,
    )
  } else if (headgear === 3) {
    parts.push(
      `<path d="M${cx - 16} ${cy - bodyH / 2 + 4} l 6 -16 l 6 12 l 6 -18 l 6 14 l 6 -12 l -2 22 z" fill="${color}"/>`,
    )
  }
  // eyes: white with a dark pupil, spread across the upper body
  for (let i = 0; i < eyes; i++) {
    const t = eyes === 1 ? 0.5 : i / (eyes - 1)
    const ex = cx - 16 + t * 32
    const ey = cy - bodyH / 6
    const r = eyes === 1 ? 10 : 7
    parts.push(
      `<circle cx="${ex}" cy="${ey}" r="${r}" fill="${PAPER}"/><circle cx="${ex + 2}" cy="${ey + 1}" r="${r / 2.4}" fill="${INK}"/>`,
    )
  }
  // a small mouth
  parts.push(
    `<path d="M${cx - 8} ${cy + bodyH / 5} q 8 6 16 0" fill="none" stroke="${PAPER}" stroke-width="2.5" stroke-linecap="round"/>`,
  )
  return `<g id="art">${parts.join('')}</g>`
}

export function renderCardSvg(f: CallFindings): string {
  const name = f.competitor ?? 'Unknown'
  const palette = paletteFor(name)
  const date = f.call.date ?? 'undated'
  const nameSize = name.length > 16 ? 18 : name.length > 11 ? 22 : 26
  const pips = threatLevel(f.objections.length)
  const pipRow = Array.from({ length: 5 }, (_, i) => {
    const x = 277 + i * 12
    return i < pips
      ? `<circle cx="${x}" cy="46" r="4.5" fill="${palette.frame}"/>`
      : `<circle cx="${x}" cy="46" r="4.5" fill="none" stroke="${palette.frame}" stroke-width="1.5"/>`
  }).join('')

  // Moves: up to 3 objections with different themes, theme in bold and a short piece of the quote.
  const seen = new Set<string>()
  const moves = f.objections
    .filter((o) => {
      const key = o.theme.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 3)
  const moveRows = moves
    .map((o, i) => {
      const y = 294 + i * 34
      return `<text x="30" y="${y}" font-size="12.5" font-weight="700" fill="${INK}">${esc(oneLine(o.theme, 22))}</text>
  <text x="30" y="${y + 15}" font-size="11.5" fill="${MUTED}">"${esc(oneLine(o.quote, 46))}"</text>`
    })
    .join('\n  ')
  const moveFiller =
    moves.length === 0
      ? `<text x="30" y="294" font-size="12" fill="${MUTED}">No objections on this call.</text>`
      : ''

  // Weak to: the first flip question, wrapped to 2 lines.
  const weak = f.flipQuestions[0]
  const weakLines = weak ? wrap(weak, 50, 2) : ['Ask what they measure that this tool cannot.']

  // Flavor text: the top objection in the buyer's words.
  const flavor = f.objections[0] ? wrap(`"${f.objections[0].quote}"`, 52, 2) : []

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" font-family="${FONT}">
  <title>${esc(name)} battlecard</title>
  <desc>${esc(name)}: ${f.objections.length} objections on the ${esc(date)} call. Top objection: ${esc(f.objections[0]?.theme ?? 'none')}.</desc>
  <rect x="3" y="3" width="${W - 6}" height="${H - 6}" rx="20" fill="${palette.frame}"/>
  <rect x="14" y="14" width="${W - 28}" height="${H - 28}" rx="12" fill="${PAPER}"/>
  <!-- header -->
  <text x="30" y="55" font-size="${nameSize}" font-weight="700" fill="${INK}">${esc(oneLine(name, 22))}</text>
  <text x="330" y="31" font-size="8.5" letter-spacing="1.2" text-anchor="end" fill="${MUTED}">THREAT</text>
  ${pipRow}
  <!-- art slot -->
  <rect x="30" y="70" width="300" height="160" rx="8" fill="${palette.wash}" stroke="${palette.frame}" stroke-opacity="0.4"/>
  ${renderCreature(name, 180, 150, palette.frame)}
  <text x="30" y="250" font-size="10" letter-spacing="1" fill="${MUTED}">COMPETITOR · HEARD IN 1 CALL · ${esc(date)}</text>
  <!-- moves -->
  <line x1="30" y1="262" x2="330" y2="262" stroke="${palette.frame}" stroke-opacity="0.5"/>
  <text x="30" y="279" font-size="9" letter-spacing="1.2" font-weight="700" fill="${palette.frame}">MOVES</text>
  ${moveRows}${moveFiller}
  <!-- weak to -->
  <line x1="30" y1="398" x2="330" y2="398" stroke="${palette.frame}" stroke-opacity="0.5"/>
  <text x="30" y="415" font-size="9" letter-spacing="1.2" font-weight="700" fill="${palette.frame}">WEAK TO</text>
  <text x="30" y="431" font-size="11.5" fill="${INK}">${tspans(weakLines, 30, 15)}</text>
  <!-- flavor -->
  <text x="30" y="462" font-size="10.5" font-style="italic" fill="${MUTED}">${tspans(flavor, 30, 14)}</text>
  <text x="330" y="484" font-size="7.5" letter-spacing="1" text-anchor="end" fill="${MUTED}">call-to-card</text>
</svg>
`
}
