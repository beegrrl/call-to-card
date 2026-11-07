import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { scrub } from '../scrub.js'

// Creates the file if it's new. If it exists, adds to the end. Only the text
// this tool adds gets the dash scrub, so a person's own edits are left exactly
// as they wrote them.
export async function writeOrAppend(
  path: string,
  render: () => string,
  append: (existing: string) => string,
): Promise<'created' | 'appended'> {
  await mkdir(dirname(path), { recursive: true })

  let existing: string | null = null
  try {
    existing = await readFile(path, 'utf8')
  } catch {
    existing = null
  }

  if (existing === null) {
    await writeFile(path, scrub(render()))
    return 'created'
  }

  const updated = append(existing)
  if (!updated.startsWith(existing)) throw new Error(`Refusing to rewrite ${path}: append changed existing text`)
  await writeFile(path, existing + scrub(updated.slice(existing.length)))
  return 'appended'
}
