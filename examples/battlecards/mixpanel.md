# Mixpanel

![Mixpanel card](mixpanel.svg)

## What they say

- **history migration**: "we have 3 years of event history in Mixpanel. What happens to that? Do we lose it?"
- **history migration**: "Straightforward how? 3 years is a lot of data and I don't want to find out halfway through that half of it didn't come over."
- **event cleanup**: "our event names are a mess. 5 people named things 5 different ways over 3 years. Do we have to clean all that up before we move?"
- **team ramp**: "My team also knows Mixpanel really well. How long until they are as fast in a new tool? I can't have the Monday dashboards break."
- **team ramp**: "Everyone says that."
- **pricing**: "I can't tell what I'd pay once we turn on replay and flags on top of analytics."
- **pricing**: "Usage-based means I don't know the number. I need a number before I take this to my CFO."
- **engineering time**: "I don't have an engineer to spare for a month."

## What we say

- **history migration**: You don't lose it, because Mixpanel stays live while we run side by side, so nothing disappears on day one. I'll get you in writing exactly what history we can import, and we'll check monthly event counts against Mixpanel so you know it all came over.
- **history migration**: That's the right worry, so here's how we avoid it: import the history, then compare event counts by month against Mixpanel before you switch anything off. I'll send the exact steps and what can't be imported, so there are no surprises halfway through.
- **event cleanup**: No, you don't have to clean it up first, but the mess comes with you. I'd pick the 10 or so events behind your Monday dashboards, name those properly going forward, and leave the rest alone.
- **team ramp**: Your team will be slower for the first couple of weeks, that's normal with any new tool. That's why we run both side by side: your Monday dashboards keep running in Mixpanel until the PostHog versions match.
- **team ramp**: You're right, so don't take my word for it. Have your team rebuild one Monday dashboard in PostHog during the overlap, and you'll know within a week whether it works for them.
- **pricing**: Let's put a number on it. Give me your monthly events and the sessions you'd record, and I'll send an estimate for analytics, replay and flags separately, so you can compare it with what you pay for those three tools today.
- **pricing**: You'll have a number before you talk to your CFO, and you can set a billing limit on each product so the bill can't go past what you've approved. I'll send the estimate with a low case and a high case.
- **engineering time**: You won't need a month of engineering. Sending events alongside Mixpanel is a small install, and your product team can rebuild the dashboards themselves. I'll give you an hours estimate for the engineering part before you commit.

## Questions that flip it

- When a funnel drops, how do you get from the chart to the replays of the users who dropped off today, and how long does it take?
- When you ship something behind a flag, how do you measure what it did, and is that in the same tool as the flag?
- What do you pay today for analytics, replay and flags combined, and how much of the renewal increase is Mixpanel alone?
- How much time does your team spend matching the same user across three separate tools?

---

Heard in 1 call, last on 2026-11-06
<!-- call:b2a6c3e3-94a7-4107-967f-69a977a5000f -->
