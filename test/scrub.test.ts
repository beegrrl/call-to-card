import { describe, expect, test } from 'vitest'
import { scrub } from '../src/scrub.js'
import { ModelFindingsSchema } from '../src/types.js'
import fixture from './fixtures/findings.json'

describe('scrub', () => {
  test('em dash between clauses becomes comma', () => {
    expect(scrub('fast — and cheap')).toBe('fast, and cheap')
  })
  test('en dash in number range becomes "to"', () => {
    expect(scrub('10–15 min')).toBe('10 to 15 min')
  })
  test('bare em dash with no spaces becomes comma', () => {
    expect(scrub('this—that')).toBe('this, that')
  })
  test('leaves hyphens alone', () => {
    expect(scrub('self-serve')).toBe('self-serve')
  })
})

describe('types', () => {
  test('fixture findings parse', () => {
    expect(ModelFindingsSchema.parse(fixture)).toBeTruthy()
  })
})

describe('scrub keeps lines apart', () => {
  test('a dash at the start of a line becomes a bullet instead of joining lines', () => {
    expect(scrub('- one\n— two')).toBe('- one\n- two')
  })
})
