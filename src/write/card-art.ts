import { scrub } from '../scrub.js'
import type { CallFindings } from '../types.js'

// Every battlecard gets a playing card. The competitor is the card, the top
// objection from the call is the suit, and the answer to it is the face.
// Plain SVG, so anyone can open it in a design tool and redraw it.

const INK = '#1F2328'
const RED = '#B3261E' // 6:1 contrast on the card's cream background
const PAPER = '#FFFDF7'
const FONT = "'Atkinson Hyperlegible', Inter, system-ui, -apple-system, Helvetica, Arial, sans-serif"

const SUITS = [
  { symbol: '♠', color: INK },
  { symbol: '♥', color: RED },
  { symbol: '♦', color: RED },
  { symbol: '♣', color: INK },
]

// The same objection theme always lands on the same suit.
export function suitFor(theme: string): { symbol: string; color: string } {
  const sum = [...theme].reduce((n, ch) => n + ch.charCodeAt(0), 0)
  return SUITS[sum % SUITS.length]
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
function wrap(text: string, width = 26, max = 4): string[] {
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

export function renderCardSvg(f: CallFindings): string {
  const name = f.competitor ?? 'Unknown'
  const top = f.objections[0]
  const theme = top?.theme.toLowerCase() ?? 'no objections yet'
  const suit = suitFor(theme)
  const initial = esc(name.trim().charAt(0).toUpperCase())
  const nameSize = name.length > 14 ? 20 : 26
  const face = wrap(top?.betterAnswer ?? 'Nothing from this call yet.')
    .map((l, i) => `<tspan x="150" dy="${i === 0 ? 0 : 20}">${esc(l)}</tspan>`)
    .join('')
  const corner = `<text x="34" y="60" font-size="34" font-weight="700" fill="${suit.color}">${initial}</text><text x="35" y="90" font-size="26" fill="${suit.color}">${suit.symbol}</text>`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="420" viewBox="0 0 300 420" role="img" font-family="${FONT}">
  <title>${esc(name)} battlecard</title>
  <desc>Top objection: ${esc(theme)}. Answer: ${esc(top?.betterAnswer ?? 'none yet')}</desc>
  <rect x="4" y="4" width="292" height="412" rx="18" fill="${PAPER}" stroke="${INK}" stroke-width="3"/>
  <rect x="22" y="22" width="256" height="376" rx="10" fill="none" stroke="${suit.color}" stroke-opacity="0.35" stroke-width="1.5"/>
  ${corner}
  <g transform="rotate(180 150 210)">${corner}</g>
  <text x="150" y="152" font-size="72" text-anchor="middle" fill="${suit.color}">${suit.symbol}</text>
  <text x="150" y="200" font-size="${nameSize}" font-weight="700" text-anchor="middle" fill="${INK}">${esc(name)}</text>
  <text x="150" y="224" font-size="11" letter-spacing="1" text-anchor="middle" fill="${INK}">TOP OBJECTION: ${esc(theme.toUpperCase())}</text>
  <line x1="70" y1="240" x2="230" y2="240" stroke="${suit.color}" stroke-opacity="0.5"/>
  <text x="150" y="264" font-size="14" text-anchor="middle" fill="${INK}">${face}</text>
</svg>
`
}
