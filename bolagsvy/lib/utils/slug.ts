export function toSlug(name: string, orgNumber: string): string {
  const cleanOrg = orgNumber.replace(/-/g, '')
  const cleanName = name
    .toLowerCase()
    .replace(/[åä]/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
  return `${cleanName}-${cleanOrg}`
}

export function orgNumberFromSlug(slug: string): string {
  return slug.split('-').at(-1) ?? ''
}
