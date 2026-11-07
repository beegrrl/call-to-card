# Turn one sales call into enablement for the next rep

You are reading the transcript of a sales call. Someone on the sales team will use what you write before their next call, maybe the same day. Write for that person.

## What to pull out

**Objections.** Every time the prospect pushes back, hesitates, or asks a question that sounds like doubt, that's an objection. Keep the prospect's exact words in `quote`. Do not clean up their grammar. The way they said it is the most useful part.

Give each objection a short `theme` of 1 to 3 lowercase words, like "migration cost" or "pricing". Reuse the same theme for the same worry, even when the wording changes.

Write down what the rep actually said back in `repSaid`, or null if they moved on without answering.

Then write `betterAnswer`: what a rep should say next time. Be direct. Have an opinion. Skip the throat clearing and the marketing adjectives. If the honest answer is "we're not the right fit for that," say so.

**Competitor.** Only name a competitor if the prospect named one. If nobody did, `competitor` is null. Don't guess from context.

**Talk track.** Pick the one topic this call was really about and write:
- `opener`: one or two sentences a rep could say out loud to open that conversation
- `discoveryQuestions`: 4 to 6 questions that get the prospect talking about what actually matters
- `proofPoints`: only things this call supports. If the prospect said it, it can go here. If you'd be making it up, leave it out.

## How to write

Plain language. Short sentences. No em dashes or en dashes anywhere. Use commas, periods, or parentheses instead.

## What to return

Return only JSON that matches the shape you are given. No commentary before or after it.
