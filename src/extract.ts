import Anthropic from '@anthropic-ai/sdk'
import { ModelFindingsSchema, type ModelFindings, type Transcript } from './types.js'

// Anything that can take a system prompt and a user message and return text.
// The real one talks to the Claude API; tests use a fake.
export interface ModelClient {
  complete(system: string, user: string): Promise<string>
}

// Pull the text out of a Claude reply. If the reply hit the length limit,
// the JSON is incomplete, so say that instead of "didn't fit the format".
export function textFromMessage(message: {
  stop_reason: string | null
  content: { type: string; text?: string }[]
}): string {
  if (message.stop_reason === 'max_tokens') {
    throw new Error("The model's answer was cut off before it finished. Try a shorter call.")
  }
  return message.content.map((block) => (block.type === 'text' ? block.text ?? '' : '')).join('')
}

export function anthropicClient(apiKey: string, model: string): ModelClient {
  const client = new Anthropic({ apiKey })
  return {
    async complete(system, user) {
      const message = await client.messages.create({
        model,
        max_tokens: 8000,
        system,
        messages: [{ role: 'user', content: user }],
      })
      return textFromMessage(message)
    },
  }
}

// Thrown when the model gives us something unusable twice in a row.
// Keeps both raw answers so they can be saved for debugging.
export class ExtractError extends Error {
  constructor(public responses: string[]) {
    super("Model output didn't fit the format twice")
  }
}

// The JSON shape, spelled out for the model.
const SHAPE = `{
  "competitor": string or null,
  "objections": [{ "quote": string, "theme": string, "repSaid": string or null, "betterAnswer": string }],
  "talkTrack": { "topic": string, "opener": string, "discoveryQuestions": [4 to 6 strings], "proofPoints": [strings] }
}`

// Models sometimes wrap JSON in code fences or add a sentence first.
// Take everything from the first { to the last } and check it.
export function parseFindings(raw: string): ModelFindings {
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end <= start) throw new SyntaxError('No JSON object in the response')
  return ModelFindingsSchema.parse(JSON.parse(raw.slice(start, end + 1)))
}

export async function extractFindings(t: Transcript, client: ModelClient, promptText: string): Promise<ModelFindings> {
  const user = `Return JSON in exactly this shape:\n${SHAPE}\n\nTranscript:\n${t.text}`

  const first = await client.complete(promptText, user)
  try {
    return parseFindings(first)
  } catch (err) {
    // One retry, telling the model what went wrong.
    const retry = `${user}\n\nYour last answer did not match the shape. The problem was: ${(err as Error).message}\nReturn only the JSON.`
    const second = await client.complete(promptText, retry)
    try {
      return parseFindings(second)
    } catch {
      throw new ExtractError([first, second])
    }
  }
}
