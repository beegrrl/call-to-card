import type { CallFindings } from '../types.js'
import { bullets, callLabel, objectionLines } from './shared.js'

// A first draft of a battlecard for one competitor. The section names are
// a starting point; whoever owns the card should make them their own.
export function renderBattlecard(f: CallFindings): string {
  const proof = f.talkTrack.proofPoints.length > 0 ? bullets(f.talkTrack.proofPoints) : 'Nothing from this call yet.'

  return `# ${f.competitor}

## What they say

${f.objections.map((o) => `- **${o.theme}**: "${o.quote}"`).join('\n')}

## What we say

${f.objections.map((o) => `- **${o.theme}**: ${o.betterAnswer}`).join('\n')}

## Questions that flip it

${bullets(f.talkTrack.discoveryQuestions)}

## Proof we can point to

${proof}

---

Heard in 1 call, last on ${callLabel(f)}
`
}

// When the card already exists, never rewrite it. Add this call's objections
// at the bottom and let a person fold them in.
export function appendBattlecardCall(existing: string, f: CallFindings): string {
  return `${existing}\n\n## From the ${callLabel(f)} call\n\n${objectionLines(f)}\n`
}
