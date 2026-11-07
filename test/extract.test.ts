import { describe, expect, test } from 'vitest'
import { readFileSync } from 'node:fs'
import { ExtractError, extractFindings, parseFindings, type ModelClient } from '../src/extract.js'
import type { Transcript } from '../src/types.js'
import fixture from './fixtures/findings.json'

const fenced = readFileSync(new URL('./fixtures/model-response.txt', import.meta.url), 'utf8')
const transcript: Transcript = { text: 'Rep: hi\nProspect: hello', source: 'file', meetingId: null, date: null, title: 'test' }

function fakeClient(responses: string[]): ModelClient & { calls: string[] } {
  const calls: string[] = []
  return {
    calls,
    async complete(_system, user) {
      calls.push(user)
      return responses[calls.length - 1] ?? ''
    },
  }
}

describe('parseFindings', () => {
  test('finds the JSON inside code fences and a sentence of preamble', () => {
    expect(parseFindings(fenced)).toEqual(fixture)
  })
  test('rejects text with no JSON in it', () => {
    expect(() => parseFindings('sorry, no')).toThrow()
  })
})

describe('extractFindings', () => {
  test('retries once when the first answer is not valid', async () => {
    const client = fakeClient(['oops', fenced])
    const result = await extractFindings(transcript, client, 'prompt')
    expect(result.competitor).toBe('Mixpanel')
    expect(client.calls).toHaveLength(2)
    expect(client.calls[1]).toContain('did not match')
  })
  test('gives up after the second bad answer', async () => {
    const client = fakeClient(['oops', 'still oops'])
    const err = await extractFindings(transcript, client, 'prompt').catch((e) => e)
    expect(err).toBeInstanceOf(ExtractError)
    expect(err.responses).toEqual(['oops', 'still oops'])
  })
})
