import { describe, expect, test } from 'vitest'
import { mkdtemp, readFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { run, type RunDeps } from '../src/run.js'
import type { EventSink } from '../src/telemetry.js'
import type { Transcript } from '../src/types.js'
import fixture from './fixtures/findings.json'

const longText = Array.from({ length: 300 }, (_, i) => `word${i}`).join(' ')
const transcript: Transcript = { text: longText, source: 'file', meetingId: null, date: '2026-11-07', title: '2026-11-07-mixpanel' }

function deps(findings: object = fixture, text = longText): RunDeps & { captured: number } {
  const d = {
    captured: 0,
    getTranscript: async () => ({ ...transcript, text }),
    client: { complete: async () => JSON.stringify(findings) },
    promptText: 'prompt',
    sink: null as EventSink | null,
    log: () => {},
  }
  d.sink = { capture: () => void d.captured++, shutdown: async () => {} }
  return d
}

async function tempOut() {
  return mkdtemp(join(tmpdir(), 'ctc-run-'))
}

describe('run', () => {
  test('writes a battlecard, a talk track and the objection log', async () => {
    const out = await tempOut()
    const d = deps()
    const result = await run({ file: 'x.txt', out, telemetry: true }, d)
    expect(existsSync(join(out, 'battlecards', 'mixpanel.md'))).toBe(true)
    expect(existsSync(join(out, 'talk-tracks', 'switching-from-mixpanel.md'))).toBe(true)
    expect(await readFile(join(out, 'objections.md'), 'utf8')).toContain('migration cost')
    expect(result.written).toHaveLength(3)
    expect(result.events).toBe(3)
    expect(d.captured).toBe(3)
  })
  test('with no competitor, skips the battlecard and writes the other two', async () => {
    const out = await tempOut()
    const result = await run({ file: 'x.txt', out, telemetry: true }, deps({ ...fixture, competitor: null }))
    expect(existsSync(join(out, 'battlecards'))).toBe(false)
    expect(result.written).toHaveLength(2)
  })
  test('stops on a transcript too short to be a call', async () => {
    const out = await tempOut()
    const short = Array.from({ length: 100 }, () => 'hi').join(' ')
    await expect(run({ file: 'x.txt', out, telemetry: true }, deps(fixture, short))).rejects.toThrow(
      'Transcript is too short to be a real call (100 words)',
    )
    expect(await readdir(out)).toHaveLength(0)
  })
  test('running the same call again skips everything, including the model', async () => {
    const out = await tempOut()
    await run({ file: 'x.txt', out, telemetry: true }, deps())
    const d = deps()
    let modelCalls = 0
    d.client = { complete: async () => { modelCalls++; return JSON.stringify(fixture) } }
    const second = await run({ file: 'x.txt', out, telemetry: true }, d)
    expect(second.skipped).toBe(true)
    expect(modelCalls).toBe(0)
    expect(d.captured).toBe(0)
    const card = await readFile(join(out, 'battlecards', 'mixpanel.md'), 'utf8')
    expect(card).not.toContain('## From the')
  })
  test('--force reruns, but only new objections become events', async () => {
    const out = await tempOut()
    await run({ file: 'x.txt', out, telemetry: true }, deps())
    const changed = structuredClone(fixture)
    changed.objections[2].theme = 'price'
    const d = deps(changed)
    const second = await run({ file: 'x.txt', out, telemetry: true, force: true }, d)
    expect(second.events).toBe(1)
    expect(d.captured).toBe(1)
  })
  test('different text in a file with the same name counts as a different call', async () => {
    const out = await tempOut()
    await run({ file: 'call.txt', out, telemetry: true }, deps())
    const second = await run({ file: 'call.txt', out, telemetry: true }, deps(fixture, longText + ' extra words here'))
    expect(second.skipped).toBe(false)
  })
  test('telemetry off sends nothing', async () => {
    const out = await tempOut()
    const d = deps()
    const result = await run({ file: 'x.txt', out, telemetry: false }, d)
    expect(result.events).toBe(0)
    expect(d.captured).toBe(0)
  })
})
