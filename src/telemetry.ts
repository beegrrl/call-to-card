import { PostHog } from 'posthog-node'
import { slugify } from './slug.js'
import type { CallFindings, ModelFindings } from './types.js'

type Objection = ModelFindings['objections'][number]

// Anywhere events can go. The real one is PostHog; tests use a fake.
export interface EventSink {
  capture(e: { distinctId: string; event: string; properties: Record<string, unknown>; timestamp?: Date }): void
  shutdown(): Promise<void>
}

export function posthogSink(apiKey: string, host = 'https://us.i.posthog.com'): EventSink {
  const client = new PostHog(apiKey, { host })
  return {
    capture: (e) => client.capture(e),
    shutdown: () => client.shutdown(),
  }
}

// One event per objection, so PostHog can chart which objections keep coming
// up and against which competitor. What gets sent: the theme, the competitor,
// the call date and where it came from. What never gets sent: anything the
// prospect said, or the meeting title (titles often carry names).
export async function sendObjections(
  f: CallFindings,
  sink: EventSink,
  objections: Objection[] = f.objections,
): Promise<number> {
  for (const o of objections) {
    sink.capture({
      distinctId: 'call-to-card',
      event: 'objection_heard',
      properties: {
        theme: o.theme.toLowerCase(),
        competitor: f.competitor ? slugify(f.competitor) : 'none',
        call_date: f.call.date,
        source: f.call.source,
      },
      // Date the event by the call, so "over time" means when calls happened.
      timestamp: f.call.date ? new Date(`${f.call.date}T12:00:00Z`) : undefined,
    })
  }
  await sink.shutdown()
  return objections.length
}
