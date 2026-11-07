import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { extractFindings, type ModelClient } from './extract.js'
import { slugify } from './slug.js'
import { sendObjections, type EventSink } from './telemetry.js'
import type { CallFindings, Transcript } from './types.js'
import { appendBattlecardCall, renderBattlecard } from './write/battlecard.js'
import { writeOrAppend } from './write/files.js'
import { updateObjectionLog } from './write/objections.js'
import { appendTalkTrackCall, renderTalkTrack } from './write/talktrack.js'

export interface RunOptions {
  file?: string
  api?: string
  call?: string
  out: string
  telemetry: boolean
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

export async function run(o: RunOptions, deps: RunDeps): Promise<{ written: string[]; events: number }> {
  const t = await deps.getTranscript(o)
  const words = t.text.trim().split(/\s+/).filter(Boolean).length
  if (words < MIN_WORDS) throw new Error(`Transcript is too short to be a real call (${words} words)`)

  deps.log(`Reading the call (${words} words)...`)
  const model = await extractFindings(t, deps.client, deps.promptText)
  const f: CallFindings = {
    ...model,
    call: { date: t.date, source: t.source, meetingId: t.meetingId, title: t.title },
  }

  const written: string[] = []

  // No competitor named means no battlecard. That's the right answer, not a failure.
  if (f.competitor) {
    const path = join(o.out, 'battlecards', `${slugify(f.competitor)}.md`)
    const how = await writeOrAppend(path, () => renderBattlecard(f), (e) => appendBattlecardCall(e, f))
    deps.log(`${how}  ${path}`)
    written.push(path)
  }

  const trackPath = join(o.out, 'talk-tracks', `${slugify(f.talkTrack.topic)}.md`)
  const trackHow = await writeOrAppend(trackPath, () => renderTalkTrack(f), (e) => appendTalkTrackCall(e, f))
  deps.log(`${trackHow}  ${trackPath}`)
  written.push(trackPath)

  const logPath = join(o.out, 'objections.md')
  const existingLog = await readFile(logPath, 'utf8').catch(() => null)
  await writeFile(logPath, updateObjectionLog(existingLog, f))
  deps.log(`${existingLog === null ? 'created' : 'updated'}  ${logPath}`)
  written.push(logPath)

  let events = 0
  if (o.telemetry && deps.sink) {
    events = await sendObjections(f, deps.sink)
    deps.log(`sent ${events} objection events to PostHog`)
  }

  return { written, events }
}
