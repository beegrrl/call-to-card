import { slugify } from '../slug.js'
import type { CallFindings } from '../types.js'
import { bullets, callLabel, callMarker, objectionLines } from './shared.js'

// A first draft of a battlecard for one competitor. The section names are
// a starting point; whoever owns the card should make them their own.
export function renderBattlecard(f: CallFindings): string {
  // A call can tell you what buyers say. It can't prove anything about the
  // product, so there's no proof section here; that comes from a person.
  const flip =
    f.flipQuestions.length > 0 ? `## Questions that flip it\n\n${bullets(f.flipQuestions)}\n\n` : ''

  return `# ${f.competitor}

![${f.competitor} card](${slugify(f.competitor ?? 'unknown')}.svg)

## What they say

${f.objections.map((o) => `- **${o.theme}**: "${o.quote}"`).join('\n')}

## What we say

${f.objections.map((o) => `- **${o.theme}**: ${o.betterAnswer}`).join('\n')}

${flip}---

Heard in 1 call, last on ${callLabel(f)}
${callMarker(f)}
`
}

// When the card already exists, never rewrite it. Add this call's objections
// at the bottom and let a person fold them in.
export function appendBattlecardCall(existing: string, f: CallFindings): string {
  if (existing.includes(callMarker(f))) return existing
  return `${existing}\n\n## From the ${callLabel(f)} call\n${callMarker(f)}\n\n${objectionLines(f)}\n`
}
