import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { extractFindings, type ModelClient } from './extract.js'
import { slugify } from './slug.js'
import { sendObjections, type EventSink } from './telemetry.js'
import type { CallFindings, Transcript } from './types.js'
import { appendBattlecardCall, renderBattlecard } from './write/battlecard.js'
import { renderCardSvg } from './write/card-art.js'
import { writeOrAppend } from './write/files.js'
import { isProcessed, updateObjectionLog } from './write/objections.js'
import { appendTalkTrackCall, renderTalkTrack } from './write/talktrack.js'

export interface RunOptions {
  file?: string
  api?: string
  call?: string
  out: string
  telemetry: boolean
  force?: boolean
}

// Everything run() needs from the outside world, passed in so it can be tested.
export interface RunDeps {
  getTranscript(o: RunOptions): Promise<Transcript>
  client: ModelClient
  promptText: string
  sink: EventSink | null
  log(line: string): void
}

// Under about 2 minutes of talking isn't a real call.
const MIN_WORDS = 250

// A Granola meeting has an ID. A file doesn't, so use a fingerprint of its
// text: the same file run twice is the same call, a new call saved under
// the same name is not.
function callIdFor(t: Transcript): string {
  return t.meetingId ?? `file-${createHash('sha256').update(t.text).digest('hex').slice(0, 10)}`
}

export async function run(
  o: RunOptions,
  deps: RunDeps,
): Promise<{ written: string[]; events: number; skipped: boolean }> {
  const t = await deps.getTranscript(o)
  const words = t.text.trim().split(/\s+/).filter(Boolean).length
  if (words < MIN_WORDS) throw new Error(`Transcript is too short to be a real call (${words} words)`)

  const id = callIdFor(t)
  const logPath = join(o.out, 'objections.md')
  const existingLog = await readFile(logPath, 'utf8').catch(() => null)
  if (isProcessed(existingLog, id) && !o.force) {
    deps.log('Already processed this call, so nothing changed. Use --force to run it again.')
    return { written: [], events: 0, skipped: true }
  }

  deps.log(`Reading the call (${words} words)...`)
  const model = await extractFindings(t, deps.client, deps.promptText)
  const f: CallFindings = {
    ...model,
    call: { id, date: t.date, source: t.source, meetingId: t.meetingId, title: t.title },
  }

  const written: string[] = []

  // No competitor named means no battlecard. That's the right answer, not a failure.
  if (f.competitor) {
    const path = join(o.out, 'battlecards', `${slugify(f.competitor)}.md`)
    const how = await writeOrAppend(path, () => renderBattlecard(f), (e) => appendBattlecardCall(e, f))
    deps.log(`${how}  ${path}`)
    written.push(path)

    // The card art is drawn once. After that it's yours to redraw.
    const art = join(o.out, 'battlecards', `${slugify(f.competitor)}.svg`)
    if ((await writeOrAppend(art, () => renderCardSvg(f), (e) => e)) === 'created') {
      deps.log(`created  ${art}`)
      written.push(art)
    }
  }

  const trackPath = join(o.out, 'talk-tracks', `${slugify(f.talkTrack.topic)}.md`)
  const trackHow = await writeOrAppend(trackPath, () => renderTalkTrack(f), (e) => appendTalkTrackCall(e, f))
  deps.log(`${trackHow}  ${trackPath}`)
  written.push(trackPath)

  const { text, added } = updateObjectionLog(existingLog, f)
  await writeFile(logPath, text)
  deps.log(`${existingLog === null ? 'created' : 'updated'}  ${logPath} (${added.length} new objections)`)
  written.push(logPath)

  // Only objections that actually landed in the log become events, so the
  // log and the PostHog chart always agree.
  let events = 0
  if (o.telemetry && deps.sink) {
    events = await sendObjections(f, deps.sink, added)
    deps.log(`sent ${events} objection events to PostHog`)
  }

  return { written, events, skipped: false }
}
