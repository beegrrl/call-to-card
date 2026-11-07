import { APIConnectionError, AuthenticationError, NotFoundError, RateLimitError } from '@anthropic-ai/sdk'

// Turn the errors people actually hit into one plain sentence each.

export function friendlyModelError(err: unknown, model: string): string {
  if (err instanceof AuthenticationError) return 'Your ANTHROPIC_API_KEY was rejected. Check the key in your .env file.'
  if (err instanceof NotFoundError) return `Model "${model}" was not found. Check CALL_TO_CARD_MODEL in your .env file.`
  if (err instanceof RateLimitError) return 'Hit the Claude API rate limit. Wait a minute and run it again.'
  if (err instanceof APIConnectionError) return "Couldn't reach the Claude API. Check your internet connection."
  return (err as Error).message
}

export function sourceError(err: unknown, source: 'granola' | 'file', path?: string): Error {
  const e = err as NodeJS.ErrnoException
  if (source === 'file') return new Error(e.code === 'ENOENT' ? `Can't find ${path}` : e.message)
  // Our own Granola messages already say what to do next.
  if (/^(Granola|That meeting|The transcript|Sign-in|Port \d+|No recent meetings)/.test(e.message)) return e
  return new Error(`Couldn't get the call from Granola (${e.message}). Export the transcript and use --file instead.`)
}
