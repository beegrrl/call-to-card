import type { Transcript } from '../types.js'

// Granola's API is for Business and Enterprise workspaces. It takes a note ID
// (like not_1d3tmYTlCICgjy) and returns the transcript a page at a time.
// Docs: https://docs.granola.ai/api-reference/get-transcript

const BASE_URL = 'https://public-api.granola.ai/v1'

interface Segment {
  speaker: { source: string; attribution?: 'me' | 'them'; name?: string }
  text: string
}

interface TranscriptPage {
  transcript: Segment[]
  hasMore: boolean
  cursor: string | null
}

interface Note {
  title: string | null
  created_at?: string
  calendar_event?: { scheduled_start_time?: string | null } | null
}

// "me" is the person who owns the note (the rep). Everyone else gets their
// name if Granola knows it.
function label(s: Segment): string {
  if (s.speaker.attribution === 'me') return 'Rep'
  return s.speaker.name ?? 'Prospect'
}

async function get<T>(url: string, apiKey: string, fetchImpl: typeof fetch): Promise<T> {
  const res = await fetchImpl(url, { headers: { Authorization: `Bearer ${apiKey}` } })
  if (res.status === 401) throw new Error('Granola rejected the API key (401)')
  if (res.status === 404) throw new Error("Granola couldn't find that note (404)")
  if (!res.ok) throw new Error(`Granola API returned ${res.status}`)
  return (await res.json()) as T
}

export async function fetchGranolaApiTranscript(
  noteId: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<Transcript> {
  const id = encodeURIComponent(noteId)

  // Long calls come back in pages; follow the cursor to the end.
  const lines: string[] = []
  let cursor: string | null = null
  do {
    const query: string = cursor ? `page_size=100&cursor=${encodeURIComponent(cursor)}` : 'page_size=100'
    const page: TranscriptPage = await get(`${BASE_URL}/notes/${id}/transcript?${query}`, apiKey, fetchImpl)
    lines.push(...page.transcript.filter((s) => s.text).map((s) => `${label(s)}: ${s.text}`))
    cursor = page.hasMore ? page.cursor : null
  } while (cursor)

  // The note itself has the title and the scheduled time of the meeting.
  const note: Note = await get(`${BASE_URL}/notes/${id}`, apiKey, fetchImpl)
  const when = note.calendar_event?.scheduled_start_time ?? note.created_at
  return {
    text: lines.join('\n'),
    source: 'granola-api',
    meetingId: noteId,
    date: when ? new Date(when).toLocaleDateString('en-CA') : null,
    title: note.title?.trim() || null,
  }
}
