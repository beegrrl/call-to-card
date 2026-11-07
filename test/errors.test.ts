import { describe, expect, test } from 'vitest'
import { AuthenticationError, NotFoundError, RateLimitError, APIConnectionError } from '@anthropic-ai/sdk'
import { friendlyModelError, sourceError } from '../src/errors.js'

const headers = new Headers()

describe('friendly model errors', () => {
  test('a rejected key', () => {
    expect(friendlyModelError(new AuthenticationError(401, {}, 'raw', headers), 'm')).toBe(
      'Your ANTHROPIC_API_KEY was rejected. Check the key in your .env file.',
    )
  })
  test('a wrong model name', () => {
    expect(friendlyModelError(new NotFoundError(404, {}, 'raw', headers), 'claude-nope')).toBe(
      'Model "claude-nope" was not found. Check CALL_TO_CARD_MODEL in your .env file.',
    )
  })
  test('rate limits and connection problems', () => {
    expect(friendlyModelError(new RateLimitError(429, {}, 'raw', headers), 'm')).toContain('rate limit')
    expect(friendlyModelError(new APIConnectionError({ message: 'x' }), 'm')).toContain("Couldn't reach the Claude API")
  })
  test('anything else passes through', () => {
    expect(friendlyModelError(new Error('boom'), 'm')).toBe('boom')
  })
})

describe('source errors', () => {
  test('granola failures suggest --file', () => {
    expect(sourceError(new Error('fetch failed'), 'granola').message).toBe(
      "Couldn't get the call from Granola (fetch failed). Export the transcript and use --file instead.",
    )
  })
  test('messages that already explain themselves pass through unchanged', () => {
    const pending = new Error('Granola is still processing that call. Try again in a few minutes.')
    expect(sourceError(pending, 'granola').message).toBe(pending.message)
  })
  test('file failures name the file', () => {
    const err = Object.assign(new Error('nope'), { code: 'ENOENT' })
    expect(sourceError(err, 'file', 'calls/x.txt').message).toBe("Can't find calls/x.txt")
  })
})
