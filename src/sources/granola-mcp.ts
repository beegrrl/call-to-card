import { spawn } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { UnauthorizedError, type OAuthClientProvider } from '@modelcontextprotocol/sdk/client/auth.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import type { Transcript } from '../types.js'

// Granola's MCP server works on every paid plan, which makes it the default
// way in. The first run opens your browser to sign in to Granola; after that
// the login is remembered in ~/.call-to-card/granola.json.

const MCP_URL = 'https://mcp.granola.ai/mcp'
const PORT = 8765
const REDIRECT_URL = `http://localhost:${PORT}/callback`
const STORE = join(homedir(), '.call-to-card', 'granola.json')

// ---------- Reading what Granola sends back ----------

// search_meetings answers in XML. We only need the first meeting's ID.
export function parseLatestMeeting(xml: string): { id: string } | null {
  const id = xml.match(/<meeting\s+id="([^"]+)"/)?.[1]
  return id ? { id } : null
}

// get_meeting_transcript answers in JSON, one page at a time.
export function parseTranscriptPage(json: string): {
  text: string
  nextOffset: number | null
  title: string | null
  date: string | null
} {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    // Errors like "Meeting not found" come back as plain text.
    throw new Error(`Granola said: ${json.trim().slice(0, 200)}`)
  }
  const page = parsed as {
    transcript?: string | null
    truncated?: boolean
    next_offset?: number
    title?: string
    meeting_at?: string
  }
  return {
    text: page.transcript ?? '',
    nextOffset: page.truncated && typeof page.next_offset === 'number' ? page.next_offset : null,
    title: page.title?.trim() || null,
    date: page.meeting_at ? new Date(page.meeting_at).toLocaleDateString('en-CA') : null,
  }
}

// ---------- Signing in ----------

type Stored = { client?: unknown; tokens?: unknown; verifier?: string }

async function load(): Promise<Stored> {
  return JSON.parse(await readFile(STORE, 'utf8').catch(() => '{}')) as Stored
}

async function save(patch: Stored): Promise<void> {
  await mkdir(join(homedir(), '.call-to-card'), { recursive: true })
  await writeFile(STORE, JSON.stringify({ ...(await load()), ...patch }, null, 2), { mode: 0o600 })
}

function openBrowser(url: string): void {
  const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open'
  const child = spawn(cmd, [url], { stdio: 'ignore', detached: true, shell: process.platform === 'win32' })
  child.on('error', () => {}) // no browser opener: the URL is printed anyway
  child.unref()
}

// Waits for Granola to send the browser back to localhost with a sign-in code.
function waitForCode(): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url ?? '/', REDIRECT_URL)
      if (url.pathname !== '/callback') return void res.writeHead(404).end()
      const code = url.searchParams.get('code')
      res.writeHead(200, { 'content-type': 'text/plain' }).end(code ? 'Signed in. You can close this tab.' : 'No code came back.')
      server.close()
      code ? resolve(code) : reject(new Error('Granola sign-in did not return a code'))
    })
    server.listen(PORT)
  })
}

function authProvider(onRedirect: (url: URL) => void): OAuthClientProvider {
  return {
    get redirectUrl() {
      return REDIRECT_URL
    },
    get clientMetadata() {
      return {
        client_name: 'call-to-card',
        redirect_uris: [REDIRECT_URL],
        grant_types: ['authorization_code', 'refresh_token'],
        response_types: ['code'],
        token_endpoint_auth_method: 'none',
      }
    },
    clientInformation: async () => (await load()).client as never,
    saveClientInformation: (client) => save({ client }),
    tokens: async () => (await load()).tokens as never,
    saveTokens: (tokens) => save({ tokens }),
    saveCodeVerifier: (verifier) => save({ verifier }),
    codeVerifier: async () => (await load()).verifier ?? '',
    redirectToAuthorization: (url) => onRedirect(url),
  }
}

async function connect(): Promise<Client> {
  let code: Promise<string> | null = null
  const provider = authProvider((url) => {
    code = waitForCode()
    console.log('Opening your browser to sign in to Granola...')
    console.log(`If it doesn't open, go to: ${url.toString()}`)
    openBrowser(url.toString())
  })

  const client = new Client({ name: 'call-to-card', version: '0.1.0' })
  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL), { authProvider: provider })
  try {
    await client.connect(transport)
    return client
  } catch (err) {
    if (!(err instanceof UnauthorizedError) || !code) throw err
    await transport.finishAuth(await code)
    const retry = new Client({ name: 'call-to-card', version: '0.1.0' })
    await retry.connect(new StreamableHTTPClientTransport(new URL(MCP_URL), { authProvider: provider }))
    return retry
  }
}

// ---------- Fetching a transcript ----------

function textOf(result: unknown): string {
  const content = (result as { content?: { type: string; text?: string }[] }).content ?? []
  return content.map((c) => (c.type === 'text' ? c.text ?? '' : '')).join('')
}

export async function fetchGranolaMcpTranscript(meetingId: string): Promise<Transcript> {
  const client = await connect()
  try {
    let id = meetingId
    if (meetingId === 'latest') {
      const found = parseLatestMeeting(textOf(await client.callTool({ name: 'search_meetings', arguments: { attended_only: true, limit: 1 } })))
      if (!found) throw new Error('No recent meetings found in Granola')
      id = found.id
    }

    // Long calls come back in pages; keep asking until there's no next page.
    let text = ''
    let offset: number | null = 0
    let meta: { title: string | null; date: string | null } = { title: null, date: null }
    while (offset !== null) {
      const raw = textOf(await client.callTool({ name: 'get_meeting_transcript', arguments: { meeting_id: id, offset, max_chars: 80000 } }))
      const page = parseTranscriptPage(raw)
      if (offset === 0) meta = { title: page.title, date: page.date }
      text += page.text
      offset = page.nextOffset
    }

    return { text, source: 'granola-mcp', meetingId: id, ...meta }
  } finally {
    await client.close()
  }
}
