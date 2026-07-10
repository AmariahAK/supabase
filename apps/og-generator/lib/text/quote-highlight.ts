/**
 * "Quotation" headline override (brief follow-up): wrapping a run in "double
 * quotes" highlights it in the brand accent color instead of the default
 * text color, mirroring the [bracket] casing override's "type a marker,
 * it's removed from the rendered text" pattern.
 */

/** Remove "quote" delimiters, keeping everything else (spacing, line breaks) intact. */
export function stripQuoteMarks(text: string): string {
  return text.replace(/"([^"]*)"/g, '$1')
}

/**
 * Flat, in-order highlight flag per word in `text` (whitespace-delimited,
 * quotes stripped) — recombine with the auto-fit's wrapped lines by walking
 * both in lockstep, since wrapping only regroups words into lines, it never
 * reorders or duplicates them.
 */
export function headlineWordHighlights(text: string): boolean[] {
  const flags: boolean[] = []
  const re = /"([^"]*)"|(\S+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    if (m[1] !== undefined) {
      const words = m[1].trim().split(/\s+/).filter(Boolean)
      for (const _w of words) flags.push(true)
    } else if (m[2] !== undefined) {
      flags.push(false)
    }
  }
  return flags
}
