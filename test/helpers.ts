import type { CallFindings } from '../src/types.js'
import fixture from './fixtures/findings.json'

export function callFindings(overrides: Partial<CallFindings> = {}): CallFindings {
  return {
    ...(structuredClone(fixture) as Omit<CallFindings, 'call'>),
    call: { id: 'file-abc123', date: '2026-11-07', source: 'file', meetingId: null, title: '2026-11-07-mixpanel' },
    ...overrides,
  }
}
