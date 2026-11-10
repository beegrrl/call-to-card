# The Battlecard Was in the Call the Whole Time

A rep finishes a 40 minute evaluation call. The prospect runs Mixpanel, has 3 years of event history, and asked 4 times what migration would cost. The rep writes "migration concerns" in the CRM and moves on.

The next rep hears the same 4 questions on Thursday.

Nobody wrote the answer down because writing it down is a Friday afternoon job, and Friday afternoon already belongs to something else. The call is fictional. The pattern is not.

## What this is

A command line tool that turns one recorded call into enablement someone can use the same day: a competitor battlecard, a talk track, and a running log of the objections that came up. Everything is plain markdown in the format PostHog uses for its handbook, so it can go straight into a pull request.

The person who runs it has a different title at every company. At one it is the product marketer. At another it is the CSM who owns the biggest accounts, the support engineer who hears the same complaint 5 times a week, the founder still doing her own demos, or the sales lead who wants Thursday's rep to know what Tuesday's rep learned. The tool does not care about the title. It cares that a call happened and nobody has 3 hours to write it up.

## How a run works

You point it at a call. By default it pulls the transcript from Granola over MCP. It also takes a Granola API note ID for Business and Enterprise workspaces, or a plain text transcript for anyone without Granola.

It reads the transcript against a prompt that lives in the repo as an ordinary markdown file. The prompt is the part worth reading. It looks for objections, names the competitor if one came up, keeps the prospect's own phrasing, and writes the way PostHog's handbook already reads, which is to say it has opinions and skips the throat clearing.

It writes 3 files: `battlecards/<competitor>.md`, `talk-tracks/<topic>.md`, and `objections.md`, which grows across calls so a repeated objection shows up as a count of mentions and of calls, not a hunch. Each objection also goes to PostHog as an event, so the log doubles as a chart of what keeps coming up and against whom.

Where the words go: the transcript is sent to the Claude API to write the drafts. The PostHog events carry the theme, the competitor, the call date and the source, and never the transcript, the buyer's quotes or the meeting title.

A person opens the markdown, fixes what the model got wrong, and ships it. On the 4 example calls the fixes took me a few minutes each, and the model took 30 to 40 seconds per call to write the first draft. Both figures are from my own runs, not a benchmark.

## What is in the repo

- The tool (TypeScript, 1 command)
- The prompt file, with notes on why each instruction exists, and the 2 revisions I made after reading what the first version produced
- 4 example outputs from role-played evaluation calls, including PostHog against Mixpanel and against Sentry
- Illustrated cards for each competitor, drawn from the call, next to the full answers in markdown
- A [2 minute recording](https://youtu.be/0nPxr9ubKjQ) of a run, start to finish

## What it does not do

It does not replace the person deciding what the company wants to say, whoever that person is. It does not touch the CRM and it does not score reps. It will never make a deck. If the call never mentions a competitor, you get a talk track and an objection log and no battlecard, which is the correct answer.

## What I would build next

A Granola webhook so the first draft is in Slack before the rep is off the call. A step that reads the live handbook so new output never contradicts what is already published. After that, a weekly digest that ranks objections by count, and a way for a rep to flag "this answer did not work" so the battlecard learns from losses and not only from calls.

The one I would move up the list came from asking someone on the customer side what reps run out of time for. Buyers keep asking what the best practice is and what companies like theirs track, and a call with a set agenda rarely has room for the answer. So the tool would tag each call with the buyer's industry and stage, then write a short "what teams like yours ask about" section from the calls already in the log. The rep gets something to send before the call. Marketing gets a list of the questions worth answering in public.

## Why it exists

I built this to get an interview. PostHog's application asks for a recent AI project that supported a sales team, and I would rather answer that with a repo than a paragraph.

I built it with Claude as a pair programmer and kept the scope to one useful loop: a call, a draft, a review, and something the next rep can use. The commits show where the first output failed and what I changed. Every decision about what a battlecard should contain, what the voice should sound like, and what to cut is mine. I gave myself 2 days and used about 4 hours, in one evening. The list above of what I would build next is the rest. It goes a lot faster with real call recordings and a handbook I am allowed to edit.

## One thing I would change

I'd keep PostHog's context-layer positioning, but make the competitive pitch more specific. The [observability selling guide](https://posthog.com/handbook/growth/use-case-selling/observability) still leans on replay as a distinction from Sentry and leaves its Sentry/Datadog battlecard "To be added", although [PostHog's own comparison](https://posthog.com/compare/posthog-vs-sentry) acknowledges that Sentry has replay. For a team already on PostHog, I'd lead with whether connecting errors to the product behavior they already measure helps them decide what to fix. Then I'd show the workflow, the extra cost, and the cases where keeping Sentry is the better decision. The [Sentry card](examples/battlecards/sentry.md) is my first pass at that conversation, using a role-played call to test the draft.

## Who made it

Melissa Thorne. 20+ years in technology, 15+ in developer and product marketing, at Electronic Arts, Oracle, Zulily, Chainlink Labs and Sui Foundation. I write about marketing technical products and keeping developer communities around at [Herding Nerds](https://westofobvious.substack.com/s/herding-nerds), part of West of Obvious. Code and examples: [github.com/beegrrl/call-to-card](https://github.com/beegrrl/call-to-card). beegrrl@gmail.com, [linkedin.com/in/beegirl](https://linkedin.com/in/beegirl).
