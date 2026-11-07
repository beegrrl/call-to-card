# PostHog alongside Snowflake and dbt

## Open with

Your PMs wait days for simple cuts, and you've spent two years making your dbt definitions trustworthy. I'm not here to replace that. I want to see if PMs can self-serve against the numbers you already trust, without raising your Snowflake bill.

## Ask

- Walk me through the last product question a PM brought you. How long from ask to answer?
- What share of those requests are simple cuts of a metric you already define, versus new analysis?
- Which dbt models or metrics would a PM need to touch most often?
- What would a second number that disagrees with dbt cost you, in trust and in your team's time?
- What is driving your Snowflake bill today, and what would finance need to see before agreeing to more query load?
- Who would need to sign off on a trial that reads from Snowflake, and what would they check first?

## What they told us

- Leads analytics engineering.
- All of their data lives in Snowflake and dbt.
- Product managers constantly ask for product answers, and it takes days.
- The team builds a Looker dashboard for each request, and a slightly different cut means another dashboard.
- They spent 2 years getting their metric definitions right.
- Their team owns the metric definitions and does not want a second source of truth.
- They do not want another copy of everything.
- Their Snowflake bill is already a sore spot with finance.
- A trial succeeds only if PMs stop filing tickets for simple cuts and the numbers match dbt. They want both.
- They agreed to test one weekly PM question in PostHog against their Snowflake data and check it against the dbt number.
- They asked for the answer on who pays for compute to be sent first.

---

From the 2026-11-06 call
<!-- call:ad1ccf6a-556d-4c6d-98f0-5aa312b58e86 -->
