const BLOCK_TAGS = /<\/?(?:p|div|h[1-6]|li|blockquote|pre|tr)\b[^>]*>/gi
const LINE_BREAK_TAGS = /<br\s*\/?>/gi
const HTML_TAGS = /<[^>]*>/g

const ENTITIES: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: '"',
}

function decodeHtmlEntities(value: string): string {
  return value.replace(/&(?:#(\d+)|#x([\da-f]+)|([a-z]+));/gi, (entity, decimal, hexadecimal, named) => {
    const codePoint = decimal
      ? Number(decimal)
      : hexadecimal
        ? Number.parseInt(hexadecimal, 16)
        : null

    if (codePoint !== null) {
      const isValid = Number.isInteger(codePoint)
        && codePoint >= 0
        && codePoint <= 0x10ffff
        && !(codePoint >= 0xd800 && codePoint <= 0xdfff)
      return isValid ? String.fromCodePoint(codePoint) : entity
    }

    return ENTITIES[String(named).toLowerCase()] ?? entity
  })
}

/** Converts untrusted rich text to displayable plain text. React escapes the result. */
export function richTextToPlainText(value: string | null | undefined): string {
  if (!value) return ""

  return decodeHtmlEntities(
    value
      .replace(LINE_BREAK_TAGS, "\n")
      .replace(BLOCK_TAGS, "\n")
      .replace(HTML_TAGS, "")
  )
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}
