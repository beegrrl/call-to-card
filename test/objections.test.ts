import { describe, expect, test } from 'vitest'
import { isProcessed, updateObjectionLog } from '../src/write/objections.js'
import { callFindings } from './helpers.js'

function logRows(md: string): string[] {
  const lines = md.split('\n')
  const start = lines.findIndex((l) => /^## Log\s*$/.test(l))
  const table: string[] = []
  for (const l of lines.slice(start + 1)) {
    if (l.startsWith('|')) table.push(l)
    else if (table.length > 0) break
  }
  return table.slice(2)
}

function countFor(md: string, theme: string, column: 'mentions' | 'calls' = 'mentions'): string | undefined {
  const counts = md.split('<!-- counts:start -->')[1].split('<!-- counts:end -->')[0]
  const row = counts.split('\n').find((l) => l.startsWith(`| ${theme} |`))
  return row?.split('|')[column === 'mentions' ? 2 : 3].trim()
}

const secondCall = callFindings({
  call: { id: 'm-2', date: '2026-11-09', source: 'granola-mcp', meetingId: 'm-2', title: 'Acme eval' },
  objections: [{ quote: 'What does this cost at our volume?', theme: 'pricing', repSaid: null, betterAnswer: 'Run the calculator with them.' }],
})

describe('objection log', () => {
  test('first run creates the file with one row per objection', () => {
    const { text, added } = updateObjectionLog(null, callFindings())
    expect(text.startsWith('# Objection log')).toBe(true)
    expect(logRows(text)).toHaveLength(3)
    expect(added).toHaveLength(3)
    expect(countFor(text, 'pricing')).toBe('1')
  })
  test('a second call with the same theme raises its count', () => {
    const { text } = updateObjectionLog(updateObjectionLog(null, callFindings()).text, secondCall)
    expect(logRows(text)).toHaveLength(4)
    expect(countFor(text, 'pricing')).toBe('2')
  })
  test('remembers which calls it has processed', () => {
    const { text } = updateObjectionLog(null, callFindings())
    expect(isProcessed(text, 'file-abc123')).toBe(true)
    expect(isProcessed(text, 'm-2')).toBe(false)
    expect(isProcessed(null, 'file-abc123')).toBe(false)
  })
  test('the same theme twice in one call keeps both objections', () => {
    const f = callFindings()
    f.objections.push({ quote: 'And per seat?', theme: 'pricing', repSaid: null, betterAnswer: 'No seats.' })
    const { text, added } = updateObjectionLog(null, f)
    expect(added).toHaveLength(4)
    expect(countFor(text, 'pricing')).toBe('2')
    expect(countFor(text, 'pricing', 'calls')).toBe('1')
  })
  test('counts calls separately from mentions across calls', () => {
    const f = callFindings()
    f.objections.push({ quote: 'And per seat?', theme: 'pricing', repSaid: null, betterAnswer: 'No seats.' })
    const { text } = updateObjectionLog(updateObjectionLog(null, f).text, secondCall)
    expect(countFor(text, 'pricing')).toBe('3')
    expect(countFor(text, 'pricing', 'calls')).toBe('2')
  })
  test('a forced rerun with identical output adds nothing', () => {
    const once = updateObjectionLog(null, callFindings()).text
    const again = updateObjectionLog(once, callFindings())
    expect(again.added).toHaveLength(0)
    expect(logRows(again.text)).toHaveLength(3)
  })
  test('a hand-edited answer survives the next update', () => {
    const once = updateObjectionLog(null, callFindings()).text
    const edited = once.replace('Open the pricing calculator', 'MY EDIT: open the calculator')
    expect(updateObjectionLog(edited, secondCall).text).toContain('MY EDIT: open the calculator')
  })
  test('notes above the log, below the table and in later sections all survive', () => {
    const once = updateObjectionLog(null, callFindings()).text
    const noted = once
      .replace('# Objection log\n', '# Objection log\n\nReviewed with sales every Friday.\n')
      .concat('\nNote under the table.\n\n## Notes\n\nPricing keeps coming up — talk to Joe.\n')
    const { text } = updateObjectionLog(noted, secondCall)
    expect(text).toContain('Reviewed with sales every Friday.')
    expect(text).toContain('Note under the table.')
    expect(text).toContain('## Notes\n\nPricing keeps coming up — talk to Joe.')
    expect(logRows(text)).toHaveLength(4)
    expect(text.indexOf('What does this cost')).toBeLessThan(text.indexOf('Note under the table.'))
  })
  test('deleted count markers get a new counts block instead of wiping the top', () => {
    const once = updateObjectionLog(null, callFindings()).text
    const stripped = once
      .replace(/<!-- counts:start -->[\s\S]*?<!-- counts:end -->/, '')
      .replace('# Objection log\n', '# Objection log\n\nMy intro.\n')
    const { text } = updateObjectionLog(stripped, secondCall)
    expect(text).toContain('My intro.')
    expect(countFor(text, 'pricing')).toBe('2')
  })
  test('a "## Logistics" heading is not mistaken for the log', () => {
    const once = updateObjectionLog(null, callFindings()).text
    const withLogistics = once.replace('# Objection log\n', '# Objection log\n\n## Logistics\n\nFridays.\n')
    const { text } = updateObjectionLog(withLogistics, secondCall)
    expect(text).toContain('## Logistics\n\nFridays.')
    expect(logRows(text)).toHaveLength(4)
  })
  test('$ signs in a quote do not corrupt the counts', () => {
    const f = callFindings()
    f.objections = [{ quote: 'Is it $& per event or $$?', theme: 'pricing', repSaid: null, betterAnswer: 'Per event.' }]
    const twice = updateObjectionLog(updateObjectionLog(null, f).text, secondCall).text
    expect(twice.match(/<!-- counts:start -->/g)).toHaveLength(1)
  })
  test('pipes in a quote do not break the table', () => {
    const f = callFindings()
    f.objections = [{ quote: 'Is it this | or that?', theme: 'scope', repSaid: null, betterAnswer: 'Both.' }]
    const { text } = updateObjectionLog(null, f)
    expect(logRows(text)[0]).toContain('this \\| or that')
    expect(countFor(text, 'scope')).toBe('1')
  })
})
