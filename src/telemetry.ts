import { PostHog } from 'posthog-node'
import type { CallFindings } from './types.js'

// Anywhere events can go. The real one is PostHog; tests use a fake.
export interface EventSink {
  capture(e: { distinctId: string; event: string; properties: Record<string, unknown> }): void
  shutdown(): Promise<void>
}

export function posthogSink(apiKey: string, host = 'https://us.i.posthog.com'): EventSink {
  const client = new PostHog(apiKey, { host })
  return {
    capture: (e) => client.capture(e),
    shutdown: () => client.shutdown(),
  }
}

// One event per objection, so PostHog can chart which objections keep
// coming up and against which competitor. What gets sent: the theme, the
// competitor, and when and where the call came from. What never gets sent:
// anything the prospect actually said.
export async function sendObjections(f: CallFindings, sink: EventSink): Promise<number> {
  for (const o of f.objections) {
    sink.capture({
      distinctId: 'call-to-card',
      event: 'objection_heard',
      properties: {
        theme: o.theme.toLowerCase(),
        competitor: f.competitor ?? 'none',
        call_date: f.call.date,
        source: f.call.source,
        call_title: f.call.title,
      },
    })
  }
  await sink.shutdown()
  return f.objections.length
}
