// Em and en dashes read as machine-written to a lot of people, so nothing
// this tool writes contains one. Hyphens are left alone, and line breaks
// are never touched.
export function scrub(text: string): string {
  return text
    .replace(/(\d)[ \t]*–[ \t]*(\d)/g, '$1 to $2') // 10–15 becomes 10 to 15
    .replace(/^([ \t]*)[—–][ \t]*/gm, '$1- ') // a dash starting a line becomes a bullet
    .replace(/[ \t]+[—–][ \t]+/g, ', ') // "fast — and cheap"
    .replace(/[—–]/g, ', ') // "this—that" and anything left over
}
