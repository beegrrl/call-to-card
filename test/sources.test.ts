import { describe, expect, test } from 'vitest'
import { fileURLToPath } from 'node:url'
import { readFileTranscript } from '../src/sources/file.js'
import { fetchGranolaApiTranscript } from '../src/sources/granola-api.js'

const fixture = fileURLToPath(new URL('./fixtures/2026-11-07-mixpanel.txt', import.meta.url))

function stubFetch(status: number, body: unknown): typeof fetch {
  return (async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    })) as typeof fetch
}

describe('file source', () => {
  test('reads the text and marks the source', async () => {
    const t = await readFileTranscript(fixture)
    expect(t.source).toBe('file')
    expect(t.text).toContain('Three years of events')
  })
  test('takes the date from the filename', async () => {
    const t = await readFileTranscript(fixture)
    expect(t.date).toBe('2026-11-07')
    expect(t.title).toBe('2026-11-07-mixpanel')
  })
})

describe('granola api source', () => {
  test('joins transcript segments as speaker lines', async () => {
    const t = await fetchGranolaApiTranscript('not_123', 'key', stubFetch(200, [{ speaker: 'Prospect', text: 'hi' }]))
    expect(t.text).toBe('Prospect: hi')
    expect(t.source).toBe('granola-api')
    expect(t.meetingId).toBe('not_123')
  })
  test('throws on a bad status', async () => {
    await expect(fetchGranolaApiTranscript('not_123', 'key', stubFetch(401, {}))).rejects.toThrow('Granola API returned 401')
  })
})
