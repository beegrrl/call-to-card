import { describe, expect, test } from 'vitest'
import { parseLatestMeeting, parseTranscriptPage } from '../src/sources/granola-mcp.js'

const searchResult = `<meetings_data count="1">
<meeting id="84323ff6-9daf-42b2-8090-1b72f105b636" title=" Acme &amp; PostHog | Eval call" date="Nov 2, 2026 3:00 PM PST" meeting_at="2026-11-02T15:00:00.000-08:00" url="https://notes.granola.ai/d/x">
</meeting>
</meetings_data>`

const page = JSON.stringify({
  id: '84323ff6-9daf-42b2-8090-1b72f105b636',
  title: ' Acme & PostHog | Eval call',
  meeting_at: '2026-11-02T23:00:00.000Z',
  truncated: true,
  next_offset: 805,
  transcript: 'Microphone: Hi.\n\nSystem audio (Dana): Hello.',
})

describe('granola mcp parsing', () => {
  test('finds the most recent meeting in search results', () => {
    expect(parseLatestMeeting(searchResult)).toEqual({ id: '84323ff6-9daf-42b2-8090-1b72f105b636' })
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
