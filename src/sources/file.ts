import { readFile } from 'node:fs/promises'
import { basename, extname } from 'node:path'
import type { Transcript } from '../types.js'

// Reads a plain text or markdown transcript. Works for anyone, with or
// without Granola: export the call, save it, point the tool at it.
export async function readFileTranscript(path: string): Promise<Transcript> {
  const text = await readFile(path, 'utf8')
  const title = basename(path, extname(path))
  const date = title.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? null
  return { text, source: 'file', meetingId: null, date, title }
}
