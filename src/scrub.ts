// Em and en dashes read as machine-written to a lot of people, so nothing
// this tool writes contains one. Hyphens are left alone.
export function scrub(text: string): string {
  return text
    .replace(/(\d)\s*–\s*(\d)/g, '$1 to $2') // 10–15 becomes 10 to 15
    .replace(/\s+[—–]\s+/g, ', ') // "fast — and cheap"
    .replace(/[—–]/g, ', ') // "this—that" and anything left over
}
