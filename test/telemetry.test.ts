import { describe, expect, test } from 'vitest'
import { sendObjections, type EventSink } from '../src/telemetry.js'
import { callFindings } from './helpers.js'

function fakeSink() {
  const events: Parameters<EventSink['capture']>[0][] = []
  let shutdowns = 0
  const sink: EventSink = {
    capture: (e) => void events.push(e),
    shutdown: async () => void shutdowns++,
  }
  return { sink, events, shutdowns: () => shutdowns }
}

describe('sendObjections', () => {
  test('sends one objection_heard event per objection', async () => {
    const { sink, events } = fakeSink()
    const sent = await sendObjections(callFindings(), sink)
    expect(sent).toBe(3)
    expect(events.map((e) => e.event)).toEqual(['objection_heard', 'objection_heard', 'objection_heard'])
    expect(events[0].properties).toMatchObject({ theme: 'migration cost', competitor: 'mixpanel', call_date: '2026-11-07', source: 'file' })
  })
  test("never sends the prospect's words", async () => {
    const { sink, events } = fakeSink()
    const f = callFindings()
    await sendObjections(f, sink)
    const values = events.flatMap((e) => Object.values(e.properties))
    for (const o of f.objections) expect(values).not.toContain(o.quote)
    expect(JSON.stringify(events)).not.toContain('three years of events')
  })
  test('sends only the objections it is given', async () => {
    const { sink, events } = fakeSink()
    const f = callFindings()
    expect(await sendObjections(f, sink, f.objections.slice(0, 1))).toBe(1)
    expect(events).toHaveLength(1)
  })
  test('uses the competitor slug, the call date as the timestamp, and no call title', async () => {
    const { sink, events } = fakeSink()
    const f = callFindings({ competitor: 'Google Analytics' })
    await sendObjections(f, sink)
    expect(events[0].properties.competitor).toBe('google-analytics')
    expect(events[0].properties).not.toHaveProperty('call_title')
    expect(events[0].timestamp?.toISOString().slice(0, 10)).toBe('2026-11-07')
  })
  test('flushes once at the end', async () => {
    const { sink, shutdowns } = fakeSink()
    await sendObjections(callFindings(), sink)
    expect(shutdowns()).toBe(1)
  })
})
