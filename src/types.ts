import { z } from 'zod'

// Where a transcript came from.
export type SourceKind = 'granola-mcp' | 'granola-api' | 'file'

// A call transcript, plus whatever we know about the call.
export interface Transcript {
  text: string
  source: SourceKind
  meetingId: string | null
  date: string | null
  title: string | null
}

// The shape we ask the model to return. If the model sends back anything
// else, we reject it instead of writing half-broken markdown.
export const ModelFindingsSchema = z.object({
  competitor: z.string().min(1).nullable(),
  objections: z.array(
    z.object({
      quote: z.string().min(1),
      theme: z.string().min(1),
      repSaid: z.string().nullable(),
      betterAnswer: z.string().min(1),
    }),
  ),
  talkTrack: z.object({
    topic: z.string().min(1),
    opener: z.string().min(1),
    discoveryQuestions: z.array(z.string().min(1)).min(4).max(6),
    proofPoints: z.array(z.string()),
  }),
})

export type ModelFindings = z.infer<typeof ModelFindingsSchema>

// What the model found, plus the facts about the call we already knew.
export type CallFindings = ModelFindings & {
  call: {
    date: string | null
    source: SourceKind
    meetingId: string | null
    title: string | null
  }
}
