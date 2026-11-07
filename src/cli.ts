#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Command } from 'commander'
import { config } from 'dotenv'
import { friendlyModelError, sourceError } from './errors.js'
import { anthropicClient, ExtractError } from './extract.js'
import { run, type RunOptions } from './run.js'
import { readFileTranscript } from './sources/file.js'
import { fetchGranolaApiTranscript } from './sources/granola-api.js'
import { fetchGranolaMcpTranscript } from './sources/granola-mcp.js'
import { posthogSink } from './telemetry.js'
import type { Transcript } from './types.js'

config({ quiet: true })

const program = new Command()
  .name('call-to-card')
  .description('Turn a recorded sales call into a battlecard, a talk track and a running objection log.')
  .option('--file <path>', 'read a transcript from a text or markdown file')
  .option('--api <noteId>', 'pull a transcript from the Granola API (Business and Enterprise)')
  .option('--call <meetingId>', 'pull a transcript from Granola over MCP ("latest" for your most recent call)')
  .option('--out <dir>', 'where to write the markdown', '.')
  .option('--prompt <path>', 'use a different prompt file')
  .option('--force', 'run a call again even if it was already processed')
  .option('--no-telemetry', "don't send objection events to PostHog")
  .parse()

type CliOptions = RunOptions & { prompt?: string }
const opts = program.opts<CliOptions>()
const model = process.env.CALL_TO_CARD_MODEL || 'claude-sonnet-5-5'

function fail(message: string): never {
  console.error(message)
  process.exit(1)
}

const sources = [opts.file, opts.api, opts.call].filter(Boolean)
if (sources.length !== 1) fail('Pick one source: --file, --api or --call')

const apiKey = process.env.ANTHROPIC_API_KEY
if (!apiKey) fail('Set ANTHROPIC_API_KEY in a .env file in this folder (or in your environment).')

const postHogKey = process.env.POSTHOG_API_KEY
if (opts.telemetry && !postHogKey) console.log('PostHog key not set, skipping events')

async function getTranscript(o: RunOptions): Promise<Transcript> {
  if (o.file) return readFileTranscript(o.file).catch((err) => Promise.reject(sourceError(err, 'file', o.file)))
  try {
    if (o.api) {
      const key = process.env.GRANOLA_API_KEY
      if (!key) fail('Set GRANOLA_API_KEY in your .env file to use --api')
      return await fetchGranolaApiTranscript(o.api, key)
    }
    return await fetchGranolaMcpTranscript(o.call as string)
  } catch (err) {
    throw sourceError(err, 'granola')
  }
}

try {
  const promptPath = opts.prompt ?? new URL('../prompts/battlecard.md', import.meta.url)
  const promptText = await readFile(promptPath, 'utf8').catch(() => fail(`Can't find the prompt file at ${promptPath}`))

  await run(opts, {
    getTranscript,
    client: anthropicClient(apiKey, model),
    promptText,
    sink: postHogKey ? posthogSink(postHogKey, process.env.POSTHOG_HOST || undefined) : null,
    log: (line) => console.log(line),
  })
} catch (err) {
  if (err instanceof ExtractError) {
    const dir = join(opts.out, '.debug')
    await mkdir(dir, { recursive: true })
    const path = join(dir, `${Date.now()}.txt`)
    await writeFile(path, err.responses.join('\n\n----- retry -----\n\n'))
    fail(`Model output didn't fit the format twice. Raw output saved to ${path}`)
  }
  fail(friendlyModelError(err, model))
}
