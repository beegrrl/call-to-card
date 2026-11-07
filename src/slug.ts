// "Google Analytics" becomes "google-analytics", so the same competitor
// always lands in the same file.
export function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'unknown' // never write a hidden ".md" file
}
