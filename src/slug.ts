// "Google Analytics" becomes "google-analytics", so the same competitor
// always lands in the same file.
const MAX = 50

export function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (!slug) return 'unknown' // never write a hidden ".md" file
  if (slug.length <= MAX) return slug
  // Long topics make unreadable file names. Cut at the last whole word.
  const cut = slug.slice(0, MAX)
  return cut.includes('-') ? cut.slice(0, cut.lastIndexOf('-')) : cut
}
