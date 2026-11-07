import { describe, expect, test } from 'vitest'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { slugify } from '../src/slug.js'
import { appendBattlecardCall, renderBattlecard } from '../src/write/battlecard.js'
import { appendTalkTrackCall, renderTalkTrack } from '../src/write/talktrack.js'
import { writeOrAppend } from '../src/write/files.js'
import { callFindings } from './helpers.js'

describe('slugify', () => {
  test('lowercases and hyphenates', () => expect(slugify('Google Analytics')).toBe('google-analytics'))
  test('a name with no usable letters becomes "unknown"', () => expect(slugify('日本')).toBe('unknown'))
  test('collapses and trims odd characters', () => expect(slugify('  Amplitude (Growth) ')).toBe('amplitude-growth'))
})

describe('battlecard', () => {
  test('renders the competitor and the call count', () => {
    const md = renderBattlecard(callFindings())
    expect(md).toContain('# Mixpanel')
    expect(md).toContain('Heard in 1 call, last on 2026-11-07')
  })
  test('the same call is never appended twice, even without the objection log', () => {
    const f = callFindings()
    const once = appendBattlecardCall(renderBattlecard(f), f)
    expect(appendBattlecardCall(once, f)).toBe(once)
    expect(appendTalkTrackCall(appendTalkTrackCall('# T\n', f), f)).toBe(appendTalkTrackCall('# T\n', f))
  })
  test('appending leaves hand-edited text exactly as it was', () => {
    const existing = '# Mixpanel\n\nMy own notes — with a dash I chose to keep.\n'
    const md = appendBattlecardCall(existing, callFindings({ call: { date: '2026-11-09', source: 'file', meetingId: null, title: 'second' } }))
    expect(md.startsWith(existing)).toBe(true)
    expect(md).toContain('## From the 2026-11-09 call')
  })
})

describe('talk track', () => {
  test('renders opener and questions', () => {
    const md = renderTalkTrack(callFindings())
    expect(md).toContain('# Switching from Mixpanel')
    expect(md).toContain('Which Mixpanel reports does your team open every week?')
  })
  test('appending keeps existing text', () => {
    const existing = '# Switching from Mixpanel\n\nedited\n'
    expect(appendTalkTrackCall(existing, callFindings()).startsWith(existing)).toBe(true)
  })
})

describe('writeOrAppend', () => {
  test('creates, then appends, and only scrubs the new text', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ctc-'))
    const path = join(dir, 'cards', 'x.md')
    expect(await writeOrAppend(path, () => 'new — text', (e) => e + '\nmore — text')).toBe('created')
    expect(await readFile(path, 'utf8')).toBe('new, text')
    await writeFile(path, 'mine — kept')
    expect(await writeOrAppend(path, () => '', (e) => e + '\nmore — text')).toBe('appended')
    expect(await readFile(path, 'utf8')).toBe('mine — kept\nmore, text')
  })
  test('rendered battlecard has no em or en dashes', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ctc-'))
    const path = join(dir, 'b.md')
    const f = callFindings()
    f.objections[0].betterAnswer = 'Short answer — import what matters.'
    await writeOrAppend(path, () => renderBattlecard(f), (e) => e)
    expect(await readFile(path, 'utf8')).not.toMatch(/[—–]/)
  })
})
