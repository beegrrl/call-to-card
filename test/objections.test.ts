import { describe, expect, test } from 'vitest'
import { updateObjectionLog } from '../src/write/objections.js'
import { callFindings } from './helpers.js'

function logRows(md: string): string[] {
  return md.split('## Log')[1].split('\n').filter((l) => l.startsWith('|')).slice(2)
}

function countFor(md: string, theme: string): string | undefined {
  const counts = md.split('<!-- counts:start -->')[1].split('<!-- counts:end -->')[0]
  const row = counts.split('\n').find((l) => l.startsWith(`| ${theme} |`))
  return row?.split('|')[2].trim()
}

const secondCall = callFindings({
  call: { date: '2026-11-09', source: 'granola-mcp', meetingId: 'm-2', title: 'Acme eval' },
  objections: [{ quote: 'What does this cost at our volume?', theme: 'pricing', repSaid: null, betterAnswer: 'Run the calculator with them.' }],
})

describe('objection log', () => {
  test('first run creates the file with one row per objection', () => {
    const md = updateObjectionLog(null, callFindings())
    expect(md.startsWith('# Objection log')).toBe(true)
    expect(logRows(md)).toHaveLength(3)
    expect(countFor(md, 'pricing')).toBe('1')
  })
  test('a second call with the same theme raises its count', () => {
    const md = updateObjectionLog(updateObjectionLog(null, callFindings()), secondCall)
    expect(logRows(md)).toHaveLength(4)
    expect(countFor(md, 'pricing')).toBe('2')
    expect(countFor(md, 'migration cost')).toBe('1')
  })
  test('running the same call twice does not double count', () => {
    const once = updateObjectionLog(null, callFindings())
    const twice = updateObjectionLog(once, callFindings())
    expect(logRows(twice)).toHaveLength(3)
    expect(countFor(twice, 'pricing')).toBe('1')
  })
  test('a hand-edited answer survives the next update', () => {
    const once = updateObjectionLog(null, callFindings())
    const edited = once.replace('Open the pricing calculator', 'MY EDIT: open the calculator')
    const md = updateObjectionLog(edited, secondCall)
    expect(md).toContain('MY EDIT: open the calculator')
  })
  test('notes written above the log survive the next update', () => {
    const once = updateObjectionLog(null, callFindings())
    const noted = once.replace('# Objection log\n', '# Objection log\n\nReviewed with sales every Friday.\n')
    const md = updateObjectionLog(noted, secondCall)
    expect(md).toContain('Reviewed with sales every Friday.')
    expect(countFor(md, 'pricing')).toBe('2')
  })
  test('pipes in a quote do not break the table', () => {
    const f = callFindings()
    f.objections = [{ quote: 'Is it this | or that?', theme: 'scope', repSaid: null, betterAnswer: 'Both.' }]
    const md = updateObjectionLog(null, f)
    expect(logRows(md)[0]).toContain('this \\| or that')
    expect(countFor(md, 'scope')).toBe('1')
  })
})
