# Google Analytics

![Google Analytics card](google-analytics.svg)

## What they say

- **too many products**: "there are like 10 products on your site. Do I need all of this? I just want to know if people finish onboarding."
- **pricing**: "How do I know I won't get a surprise bill? We're launching on Product Hunt next month and if traffic spikes, I can't have a giant invoice."
- **pricing**: "That's exactly what scares me. Scales with me means it scales up when I least expect it."
- **setup time**: "we're 2 engineers, it has to take an afternoon, not a sprint."
- **free alternative**: "why not just use the free version of something simpler? Google Analytics is free."

## What we say

- **too many products**: No, and most teams don't. You want one thing, a funnel on your onboarding steps, so ignore the rest of the site until you have a question that funnel can't answer.
- **pricing**: Fair worry, and you can control it. You can set a billing limit on each product so you never pay past the number you pick. The tradeoff is that capture stops if you hit the cap, so let's estimate your Product Hunt traffic now and set it before launch.
- **pricing**: You're right, 'scales with you' is not an answer. Let's put a number on it: roughly how many users and events do you expect on launch day? I'll show you the bill at that volume and how to cap it, so you can see the worst case today.
- **setup time**: Plan on an afternoon. Add the snippet, send 3 or 4 onboarding events, and build the funnel in the UI with no extra engineering. If events aren't showing up by the end of the day, tell me and we'll fix it together.
- **free alternative**: Keep Google Analytics for marketing traffic, it's good at that. It's weak at following a signed-in user through onboarding steps, which is your question. PostHog also has a free monthly allowance, and 3 or 4 tracked steps will likely sit inside it, so we can check that math together.

## Questions that flip it

- When someone signs up from a marketing page, can you see in Google Analytics what that same person did in your onboarding, step by step?
- If a user drops off at step 3, can you see which users they were and what they did before that?
- How would you answer 'what percent of signups finish onboarding' with Google Analytics today, and how long would that take?
- When you want to fix the drop-off, would it help to watch a session recording of someone getting stuck, in the same tool as the funnel?

---

Heard in 1 call, last on 2026-11-06
<!-- call:b9f61712-8abf-48c5-8b53-abf81deb4a8d -->
