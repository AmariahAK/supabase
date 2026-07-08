/**
 * Format abstraction (Supaimage multi-brand/multi-platform phase).
 *
 * A Format is a canvas size + the size-dependent constants that used to be
 * hardcoded assuming a single 1200×630 canvas (icon size, Thumb bounds).
 * Templates already take W/H/padX/padY as render-time parameters (see
 * lib/design/templates.tsx), so adding a format is mostly just declaring its
 * dimensions here — no template-layout code needs to change for a
 * same-width, different-height format like Twitter's.
 */

export type FormatId = 'og' | 'twitter' | 'newsletter' | 'luma'

export interface Format {
  id: FormatId
  /** Display name, shown in the Format selector. */
  label: string
  width: number
  height: number
  outerMargin: number
  headlineInset: { x: number; y: number }
  /** OG icon display size (1x design px). */
  iconSize: number
  /**
   * The icon-only "Thumb" variant's size bounds — undefined for formats that
   * don't have a Thumb concept (e.g. a single social post image like Twitter).
   */
  thumb?: { default: number; min: number; max: number }
}

export const FORMATS: Record<FormatId, Format> = {
  og: {
    id: 'og',
    label: 'Blog',
    width: 1200,
    height: 630, // -> effective safe area 1072 x 502, centered (outerMargin 64)
    outerMargin: 64,
    headlineInset: { x: 80, y: 72 }, // tighter inset -> headline text box is 1040 wide
    iconSize: 220,
    thumb: { default: 380, min: 160, max: 480 },
  },
  twitter: {
    id: 'twitter',
    label: 'Social',
    width: 1200,
    height: 675, // Twitter/X's recommended link-card size — same width as OG,
    // so template headline widths carry over unchanged; only the vertical
    // anchor math (already H-parametric) adapts.
    outerMargin: 64,
    headlineInset: { x: 80, y: 72 },
    iconSize: 220,
    // No Thumb for a single social post image (brief follow-up, this phase).
  },
  newsletter: {
    id: 'newsletter',
    label: 'Newsletter',
    width: 1200,
    height: 600, // common 2:1 email-header banner width, same headline-box math as OG.
    outerMargin: 64,
    headlineInset: { x: 80, y: 72 },
    iconSize: 220,
    // No Thumb — a newsletter banner isn't cropped down to an icon-only variant.
  },
  luma: {
    id: 'luma',
    label: 'Luma',
    width: 1600,
    height: 900, // Luma's standard 16:9 event cover size.
    outerMargin: 86,
    headlineInset: { x: 107, y: 96 }, // same proportions as OG's inset, scaled to 1600 wide
    iconSize: 290,
    // No Thumb — an event cover isn't cropped down to an icon-only variant.
  },
}

export const DEFAULT_FORMAT_ID: FormatId = 'og'

export const FORMAT_OPTIONS: { id: FormatId; label: string }[] = Object.values(FORMATS).map((f) => ({
  id: f.id,
  label: f.label,
}))

/** Resolve a format id (e.g. from a query param) to a Format, defaulting to OG. */
export function getFormat(id: string | null | undefined): Format {
  if (id && id in FORMATS) return FORMATS[id as FormatId]
  return FORMATS[DEFAULT_FORMAT_ID]
}

/** Width (px) of the headline text box for a plain full-width template, given the format's inset. */
export function fullHeadlineBoxWidth(format: Format): number {
  return format.width - format.headlineInset.x * 2
}
