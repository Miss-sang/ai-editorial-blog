export function createSlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/['"`]/g, '')
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

export function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

export function estimateReadingTime(markdown: string) {
  const plainText = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/[#>*_[\]()!-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const wordCount = plainText ? plainText.split(' ').length : 0
  return Math.max(1, Math.ceil(wordCount / 220))
}
