import type { CallFindings } from '../types.js'
import { bullets, callLabel, callMarker } from './shared.js'

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function renderTalkTrack(f: CallFindings): string {
  const t = f.talkTrack
  const proof = t.proofPoints.length > 0 ? bullets(t.proofPoints) : 'Nothing from this call yet.'

  return `# ${capitalize(t.topic)}

## Open with

${t.opener}

## Ask

${bullets(t.discoveryQuestions)}

## Back it up

${proof}

---

From the ${callLabel(f)} call
${callMarker(f)}
`
}

// Same rule as battlecards: existing text is never touched.
export function appendTalkTrackCall(existing: string, f: CallFindings): string {
  if (existing.includes(callMarker(f))) return existing
  const t = f.talkTrack
  return `${existing}\n\n## From the ${callLabel(f)} call\n${callMarker(f)}\n\n${t.opener}\n\n${bullets(t.discoveryQuestions)}\n`
}
