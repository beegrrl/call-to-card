#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Command } from 'commander'
import { config } from 'dotenv'
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
  .option('--no-telemetry', "don't send objection events to PostHog")
  .parse()

type CliOptions = RunOptions & { prompt?: string }
const opts = program.opts<CliOptions>()

function fail(message: string): never {
  console.error(message)
  process.exit(1)
}

const sources = [opts.file, opts.api, opts.call].filter(Boolean)
if (sources.length !== 1) fail('Pick one source: --file, --api or --call')

const apiKey = process.env.ANTHROPIC_API_KEY
if (!apiKey) fail('Set ANTHROPIC_API_KEY in .env')

const postHogKey = process.env.POSTHOG_API_KEY
if (opts.telemetry && !postHogKey) console.log('PostHog key not set, skipping events')

async function getTranscript(o: RunOptions): Promise<Transcript> {
  if (o.file) return readFileTranscript(o.file)
  if (o.api) {
    const key = process.env.GRANOLA_API_KEY
    if (!key) fail('Set GRANOLA_API_KEY in .env to use --api')
    return fetchGranolaApiTranscript(o.api, key)
  }
  return fetchGranolaMcpTranscript(o.call as string)
}

const promptPath = opts.prompt ?? new URL('../prompts/battlecard.md', import.meta.url)
const promptText = await readFile(promptPath, 'utf8')

try {
  await run(opts, {
    getTranscript,
    client: anthropicClient(apiKey, process.env.CALL_TO_CARD_MODEL || 'claude-sonnet-5-5'),
    promptText,
    sink: postHogKey ? posthogSink(postHogKey, process.env.POSTHOG_HOST || undefined) : null,
    log: (line) => console.log(line),
  })
} catch (err) {
  if (err instanceof ExtractError) {
    await mkdir('.debug', { recursive: true })
    const path = join('.debug', `${Date.now()}.txt`)
    await writeFile(path, err.responses.join('\n\n----- retry -----\n\n'))
    fail(`Model output didn't fit the format twice. Raw output saved to ${path}`)
  }
  fail((err as Error).message)
}
