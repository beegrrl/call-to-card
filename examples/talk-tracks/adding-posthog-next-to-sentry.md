# Adding PostHog next to Sentry

## Open with

I'm not here to replace Sentry. You already have errors and product data in two places, and I want to see whether putting them together changes which bugs you fix first.

## Ask

- How do you decide which errors to fix first today?
- Have you ever tied an error to a drop in signups or retention? What did that take?
- Which Sentry features does your team use every week, such as profiling, AI fixes, or alerts?
- What would finance need to see to approve running two tools for a few months?
- What platforms do you ship on (web, Flutter mobile), and where do the signup errors happen?
- What does your data team need to see in Snowflake, and does that include error data?

## What they told us

- Dana has about 15 minutes for the call.
- Her team already uses PostHog for analytics and replay, and Sentry for errors.
- Sentry works and nobody on her team complains about it.
- They fix whatever is loudest: if an error spikes in Sentry they look at it, otherwise it sits.
- They have never connected an error to a drop in signups, because it would mean exporting from Sentry and lining it up with PostHog funnels by hand.
- They use Sentry's AI, which proposes fixes and opens pull requests.
- They rely heavily on Sentry's profiling.
- Their mobile app is in Flutter.
- Her data team will ask whether this ends up in Snowflake.
- She needs real cost numbers she can take to her finance person, and worries about paying for both tools for 6 months.
- A 2-week trial is fine with her.
- She wants the Flutter answer and real cost numbers before she takes it to her team.

---

From the 2026-11-06 call
<!-- call:7955511b-3f84-4641-8eaf-1fcb7528c4ab -->
