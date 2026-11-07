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

describe('file source without a date in the name', () => {
  test("uses the file's modified date", async () => {
    const { mkdtemp, writeFile, utimes } = await import('node:fs/promises')
    const { tmpdir } = await import('node:os')
    const { join } = await import('node:path')
    const dir = await mkdtemp(join(tmpdir(), 'ctc-file-'))
    const path = join(dir, 'acme-call.txt')
    await writeFile(path, 'hi')
    const when = new Date('2026-10-30T18:00:00Z')
    await utimes(path, when, when)
    expect((await readFileTranscript(path)).date).toBe(when.toLocaleDateString('en-CA'))
  })
})

describe('granola api source', () => {
  // Answers each URL from a small table, so pagination and the note lookup can be tested.
  function routes(table: Record<string, [number, unknown]>): typeof fetch & { urls: string[] } {
    const urls: string[] = []
    const f = (async (input: string | URL) => {
      const url = String(input)
      urls.push(url)
      const key = Object.keys(table).find((k) => url.includes(k)) ?? ''
      const [status, body] = table[key] ?? [404, {}]
      return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
    }) as typeof fetch & { urls: string[] }
    f.urls = urls
    return f
  }
  const seg = (attribution: string | undefined, text: string, name?: string) => ({
    speaker: { source: attribution === 'me' ? 'microphone' : 'speaker', attribution, name },
    text,
    start_time: '2026-11-07T18:00:00Z',
    end_time: '2026-11-07T18:00:05Z',
  })

  test('labels the note owner as Rep and everyone else by name or as Prospect', async () => {
    const f = routes({
      'transcript?page_size=100': [200, { transcript: [seg('me', 'Hi'), seg('them', 'Hello', 'Dana'), seg('them', 'Hey')], hasMore: false, cursor: null }],
      '/notes/not_123': [200, { title: 'Acme eval', calendar_event: { scheduled_start_time: '2026-11-07T18:00:00Z' } }],
    })
    const t = await fetchGranolaApiTranscript('not_123', 'key', f)
    expect(t.text).toBe('Rep: Hi\nDana: Hello\nProspect: Hey')
    expect(t.source).toBe('granola-api')
    expect(t.meetingId).toBe('not_123')
    expect(t.title).toBe('Acme eval')
    expect(t.date).toBe(new Date('2026-11-07T18:00:00Z').toLocaleDateString('en-CA'))
  })
  test('follows the cursor until the last page', async () => {
    const f = routes({
      'cursor=abc': [200, { transcript: [seg('them', 'page two')], hasMore: false, cursor: null }],
      'transcript?page_size=100': [200, { transcript: [seg('me', 'page one')], hasMore: true, cursor: 'abc' }],
      '/notes/not_123': [200, { title: null, calendar_event: null, created_at: '2026-11-07T18:00:00Z' }],
    })
    const t = await fetchGranolaApiTranscript('not_123', 'key', f)
    expect(t.text).toBe('Rep: page one\nProspect: page two')
  })
  test('explains a rejected key in plain words', async () => {
    const f = routes({ transcript: [401, {}] })
    await expect(fetchGranolaApiTranscript('not_123', 'key', f)).rejects.toThrow('Granola rejected the API key (401)')
  })
})
