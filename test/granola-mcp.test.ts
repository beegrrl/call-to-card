import { describe, expect, test } from 'vitest'
import { parseLatestMeeting, parseTranscriptPage } from '../src/sources/granola-mcp.js'

const searchResult = `<meetings_data count="1">
<meeting id="11111111-2222-4333-8444-555555555555" title=" Acme &amp; PostHog | Eval call" date="Nov 2, 2026 3:00 PM PST" meeting_at="2026-11-02T15:00:00.000-08:00" url="https://notes.granola.ai/d/x">
</meeting>
</meetings_data>`

const page = JSON.stringify({
  id: '11111111-2222-4333-8444-555555555555',
  title: ' Acme & PostHog | Eval call',
  meeting_at: '2026-11-02T23:00:00.000Z',
  truncated: true,
  next_offset: 805,
  transcript: 'Microphone: Hi.\n\nSystem audio (Dana): Hello.',
})

describe('granola mcp parsing', () => {
  test('finds the most recent meeting in search results', () => {
    expect(parseLatestMeeting(searchResult)).toEqual({ id: '11111111-2222-4333-8444-555555555555' })
  })
  test('returns null when search finds nothing', () => {
    expect(parseLatestMeeting('<meetings_data count="0"></meetings_data>')).toBeNull()
  })
  test('reads one page of a transcript', () => {
    expect(parseTranscriptPage(page)).toEqual({
      text: 'Microphone: Hi.\n\nSystem audio (Dana): Hello.',
      nextOffset: 805,
      title: 'Acme & PostHog | Eval call',
      date: '2026-11-02',
    })
  })
  test('passes along a plain-text error from Granola', () => {
    expect(() => parseTranscriptPage('Meeting not found')).toThrow('Granola said: Meeting not found')
  })
  test('last page has no next offset', () => {
    const last = JSON.stringify({ transcript: 'end', truncated: false })
    expect(parseTranscriptPage(last).nextOffset).toBeNull()
  })
})

import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { authProvider, waitForCode } from '../src/sources/granola-mcp.js'

describe('missing transcripts', () => {
  test('a call still processing says so in plain words', () => {
    const pending = JSON.stringify({ transcript: null, transcript_unavailable: 'transcript_pending' })
    expect(() => parseTranscriptPage(pending)).toThrow('Granola is still processing that call. Try again in a few minutes.')
  })
  test('a meeting that has not happened says so', () => {
    const future = JSON.stringify({ transcript: null, transcript_unavailable: 'not_happened_yet' })
    expect(() => parseTranscriptPage(future)).toThrow("That meeting hasn't happened yet.")
  })
})

describe('saved sign-in', () => {
  async function store() {
    const dir = await mkdtemp(join(tmpdir(), 'ctc-auth-'))
    return join(dir, 'granola.json')
  }
  test('forgets expired tokens so the next run signs in again', async () => {
    const path = await store()
    const p = authProvider(() => {}, path)
    await p.saveClientInformation?.({ client_id: 'c1' } as never)
    await p.saveTokens({ access_token: 'a', token_type: 'bearer' })
    await p.invalidateCredentials?.('tokens')
    expect(await p.tokens()).toBeUndefined()
    expect(await p.clientInformation()).toEqual({ client_id: 'c1' })
    await p.invalidateCredentials?.('all')
    expect(await p.clientInformation()).toBeUndefined()
  })
  test('a damaged sign-in file is treated as signed out', async () => {
    const path = await store()
    await writeFile(path, '{not json')
    expect(await authProvider(() => {}, path).tokens()).toBeUndefined()
    expect(await readFile(path, 'utf8')).toBe('{not json')
  })
})

describe('sign-in callback', () => {
  test('a busy port gives a plain message instead of a crash', async () => {
    const blocker = createServer().listen(18765, '127.0.0.1')
    await new Promise((r) => blocker.once('listening', r))
    await expect(waitForCode(18765, 1000)).rejects.toThrow('Port 18765 is busy')
    blocker.close()
  })
  test('gives up after the timeout', async () => {
    await expect(waitForCode(18766, 50)).rejects.toThrow('Sign-in timed out')
  })
})
