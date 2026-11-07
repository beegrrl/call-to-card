# Sentry

![Sentry card](sentry.svg)

## What they say

- **status quo**: "Sentry works, nobody on my team complains about it."
- **replay overlap**: "But Sentry already shows me a replay attached to the error, so what's actually different?"
- **ai fixes**: "Sentry's AI already proposes fixes and opens pull requests for us, why would I move?"
- **profiling**: "We also lean on Sentry's profiling a lot, do you have that?"
- **pricing**: "so I'd still be paying Sentry, am I saving any money here, or paying for both for 6 months?"
- **flutter support**: "our mobile app is in Flutter, I'm not sure you even support it."
- **data warehouse**: "Our data team is also going to ask whether all of this ends up in Snowflake."

## What we say

- **status quo**: Agreed, and I'm not asking you to replace it. The question is whether Sentry tells you which errors cost you signups, and from what you said, it tells you which ones are loudest.
- **replay overlap**: Yes, Sentry has replay, and it does it well. Since you already use PostHog for analytics, let's test whether seeing errors next to your signup funnel makes it easier to decide what to fix first. If it doesn't, you keep Sentry and we've both learned something.
- **ai fixes**: That's a real strength, so keep it. Use PostHog to decide which errors are worth sending to it.
- **profiling**: No, we don't do code profiling, and Sentry is the right tool for that. So the real question is whether you need Sentry for profiling only, or for error triage too.
- **pricing**: You'll likely pay for both for a while, so I won't promise savings up front. Give me your monthly error volume and I'll send you a real cost estimate in writing today, so you have a number for finance before the trial starts.
- **flutter support**: I'll confirm in writing today exactly what works for Flutter, including error tracking, so you aren't relying on my memory. If error tracking isn't there yet, we run the trial on your web signup flow.
- **data warehouse**: PostHog can export product data to Snowflake. I'll confirm today whether error events are included and send that with the Flutter answer, so your data team has it up front.

## Questions that flip it

- When Sentry flags an error, how do you find out how many signups or paying users it actually hit?
- Who lines up Sentry exports with your funnels today, and how long does that take?
- Of the errors you fixed last quarter, how many moved a conversion or retention number?
- If an error never spikes in Sentry but quietly blocks signups, how would you catch it today?

---

Heard in 1 call, last on 2026-11-06
<!-- call:7955511b-3f84-4641-8eaf-1fcb7528c4ab -->
