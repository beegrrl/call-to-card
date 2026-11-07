import { describe, expect, test } from 'vitest'
import { renderCardSvg, suitFor } from '../src/write/card-art.js'
import { callFindings } from './helpers.js'

describe('playing card art', () => {
  test('is an accessible svg with the competitor, the suit and the answer', () => {
    const svg = renderCardSvg(callFindings())
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg).toContain('<title>Mixpanel battlecard</title>')
    expect(svg).toContain('Mixpanel')
    expect(svg).toContain('migration cost')
    expect(svg).toContain('Ask what they actually query')
  })
  test('the same theme always gets the same suit', () => {
    expect(suitFor('pricing')).toBe(suitFor('pricing'))
    expect(['♠', '♥', '♦', '♣']).toContain(suitFor('pricing').symbol)
  })
  test('escapes text so a quote or ampersand cannot break the file', () => {
    const f = callFindings()
    f.objections[0].betterAnswer = 'Use <flags> & "experiments" together.'
    const svg = renderCardSvg(f)
    expect(svg).toContain('&lt;flags&gt; &amp; &quot;experiments&quot;')
  })
  test('wraps a long answer onto several lines and stops before overflowing', () => {
    const f = callFindings()
    f.objections[0].betterAnswer = Array.from({ length: 80 }, () => 'word').join(' ')
    const lines = renderCardSvg(f).match(/<tspan/g) ?? []
    expect(lines.length).toBeGreaterThan(2)
    expect(lines.length).toBeLessThanOrEqual(7)
  })
  test('has no em or en dashes', () => {
    const f = callFindings()
    f.objections[0].betterAnswer = 'Short answer — import what matters.'
    expect(renderCardSvg(f)).not.toMatch(/[—–]/)
  })
})
