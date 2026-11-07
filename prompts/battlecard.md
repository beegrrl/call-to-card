# Turn one sales call into enablement for the next rep

You are reading the transcript of a sales call. Someone on the sales team will use what you write before their next call, maybe the same day. Write for that person.

In Granola transcripts, "Microphone" or "Rep" is the salesperson and "System audio" (or a person's name) is the other side of the call.

## What to pull out

**Objections.** Every time the prospect pushes back, hesitates, or asks a question that sounds like doubt, that's an objection. Keep the prospect's exact words in `quote`. Do not clean up their grammar. The way they said it is the most useful part.

Give each objection a short `theme` of 1 to 3 lowercase words, like "migration cost" or "pricing". Reuse the same theme for the same worry, even when the wording changes.

Write down what the rep actually said back in `repSaid`, or null if they moved on without answering.

Then write `betterAnswer`: the words a rep can say out loud next time, in 1 or 2 sentences. Write the line itself, not advice about how the rep did. No "the answer was right," no "add one step." Be direct and have an opinion. If the honest answer is that the competitor is the better fit for part of the job, say that. A rep who admits a real gap gets believed about everything else.

**Competitor.** Only name a competitor if the prospect named one. If nobody did, `competitor` is null and `flipQuestions` is empty. Don't guess from context.

**Flip questions.** If a competitor came up, write 2 to 4 `flipQuestions`: questions a rep can ask that move the comparison to where PostHog is actually stronger for this buyer. Make them specific to that competitor. Don't repeat the discovery questions.

**Talk track.** Pick the one topic this call was really about and write:
- `topic`: 2 to 5 words, like "keeping Sentry for errors"
- `opener`: one or two sentences a rep could say out loud to open that conversation
- `discoveryQuestions`: 4 to 6 questions that get the prospect talking about what actually matters
- `buyerFacts`: what the prospect said about their own situation, or agreed to on the call. Never include anything the rep claimed about the product. A rep saying it on a call doesn't make it true.

## How to write

Plain language. Short sentences. No em dashes or en dashes anywhere. Use commas, periods, or parentheses instead.

## What to return

Return only JSON that matches the shape you are given. No commentary before or after it.
