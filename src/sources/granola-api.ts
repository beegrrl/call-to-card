import type { Transcript } from '../types.js'

const BASE_URL = 'https://public-api.granola.ai/v1'

// One piece of a transcript, as the API hands it back.
interface Segment {
  speaker?: string
  source?: string
  text?: string
}

// Granola's API is for Business and Enterprise workspaces. It takes a note
// ID and returns the transcript for that meeting.
export async function fetchGranolaApiTranscript(
  noteId: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<Transcript> {
  const res = await fetchImpl(`${BASE_URL}/notes/${encodeURIComponent(noteId)}/transcript`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  if (!res.ok) throw new Error(`Granola API returned ${res.status}`)

  const body: unknown = await res.json()
  return { text: toText(body), source: 'granola-api', meetingId: noteId, date: null, title: null }
}

// The transcript may come back as plain text, a list of segments, or an
// object wrapping either one. Turn all of them into "Speaker: words" lines.
function toText(body: unknown): string {
  if (typeof body === 'string') return body
  if (Array.isArray(body)) {
    return (body as Segment[])
      .filter((s) => s.text)
      .map((s) => `${s.speaker ?? s.source ?? 'Speaker'}: ${s.text}`)
      .join('\n')
  }
  if (body && typeof body === 'object' && 'transcript' in body) {
    return toText((body as { transcript: unknown }).transcript)
  }
  throw new Error('Granola API returned a transcript in a shape this tool does not know yet')
}
