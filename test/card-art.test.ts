import { describe, expect, test } from 'vitest'
import { paletteFor, renderCardSvg, renderCreature, threatLevel, wrap } from '../src/write/card-art.js'
import { callFindings } from './helpers.js'

describe('trading card art', () => {
  test('is an accessible svg with the competitor, its moves and what it is weak to', () => {
    const f = callFindings()
    const svg = renderCardSvg(f)
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg).toContain('<title>Mixpanel battlecard</title>')
    expect(svg).toContain('MOVES')
    expect(svg).toContain('WEAK TO')
    expect(svg).toContain(f.objections[0].theme)
    expect(svg).toContain('<g id="art">')
  })
  test('the same competitor always gets the same creature and colors', () => {
    expect(renderCreature('Sentry', 0, 0, '#000')).toBe(renderCreature('sentry', 0, 0, '#000'))
    expect(paletteFor('Sentry')).toEqual(paletteFor('Sentry'))
    expect(renderCreature('Sentry', 0, 0, '#000')).not.toBe(renderCreature('Mixpanel', 0, 0, '#000'))
  })
  test('threat pips grow with the number of objections and stop at 5', () => {
    expect(threatLevel(0)).toBe(0)
    expect(threatLevel(1)).toBe(1)
    expect(threatLevel(3)).toBe(2)
    expect(threatLevel(7)).toBe(5)
    expect(threatLevel(40)).toBe(5)
  })
  test('shows at most three moves and never the same theme twice', () => {
    const f = callFindings()
    const mk = (theme: string) => ({ quote: 'Another worry.', theme, repSaid: null, betterAnswer: 'Fine.' })
    f.objections = [mk('pricing'), mk('Pricing'), mk('setup'), mk('pricing'), mk('ramp'), mk('trust')]
    const svg = renderCardSvg(f)
    const moves = svg.match(/font-weight="700" fill="#1F2328">([^<]+)</g) ?? []
    expect(moves.length).toBe(4) // name + 3 moves
    expect(svg.match(/>pricing</g)?.length ?? 0).toBe(1)
    expect(svg).not.toContain('>trust<')
  })
  test('still renders when a call had no objections and no flip questions', () => {
    const f = callFindings({ objections: [], flipQuestions: [] })
    const svg = renderCardSvg(f)
    expect(svg).toContain('No objections on this call.')
    expect(svg).toContain('WEAK TO')
  })
  test('escapes text so a quote or ampersand cannot break the file', () => {
    const f = callFindings()
    f.objections[0].quote = 'Use <flags> & "experiments" together.'
    const svg = renderCardSvg(f)
    expect(svg).toContain('&lt;flags&gt; &amp; &quot;experiments&quot;')
  })
  test('wraps long text and stops with an ellipsis', () => {
    const lines = wrap(Array.from({ length: 80 }, () => 'word').join(' '), 20, 2)
    expect(lines.length).toBe(2)
    expect(lines[1].endsWith('…')).toBe(true)
  })
  test('has no em or en dashes', () => {
    const f = callFindings()
    f.objections[0].quote = 'Short answer — import what matters.'
    f.flipQuestions = ['Why — really?']
    expect(renderCardSvg(f)).not.toMatch(/[—–]/)
  })
})

describe('trading card margins', () => {
  test('keeps every x coordinate inside the 30 to 330 content margins', () => {
    const f = callFindings()
    f.competitor = 'A Very Long Competitor Name Incorporated Worldwide'
    const svg = renderCardSvg(f)
    const xs = [...svg.matchAll(/<(?:text|circle)[^>]*\bc?x="([\d.]+)"/g)].map((m) => Number(m[1]))
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(30)
    expect(Math.max(...xs)).toBeLessThanOrEqual(330)
    expect(svg).toContain('A Very Long Competitor…')
  })
})
