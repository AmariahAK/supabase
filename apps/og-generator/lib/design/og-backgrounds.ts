/**
 * Full-canvas background textures selectable per-template (starting with
 * Headline + icon) — distinct from lib/design/patterns.ts's grid/dots/hlines
 * axis system, which stayed unwired. These are three fixed, named looks
 * rendered as a single tileable/positioned SVG behind the headline/icon.
 */

export type BackgroundId = 'none' | 'grid-background' | 'graph-paper' | 'concentric-circles'

export const BACKGROUND_OPTIONS: { id: BackgroundId; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'grid-background', label: 'Grid' },
  { id: 'graph-paper', label: 'Graph paper' },
  { id: 'concentric-circles', label: 'Circles' },
]

export const DEFAULT_BACKGROUND_ID: BackgroundId = 'grid-background'

interface BackgroundRenderOptions {
  width: number
  height: number
  /** 1 or 2 — scales every dimension with the export. */
  scaleFactor: number
}

// Faint, low-contrast strokes — texture, not foreground (matches the
// opacity philosophy in patterns.ts).
const STROKE = 'rgba(255,255,255,0.08)'
const STROKE_STRONG = 'rgba(255,255,255,0.14)'
const DOT = 'rgba(255,255,255,0.18)'

/** Diagonal square grid: one corner-to-corner line per cell, dot at each vertex. */
function gridBackgroundSvg(o: BackgroundRenderOptions): string {
  const g = 120 * o.scaleFactor
  const dotR = 1.5 * o.scaleFactor
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${o.width}" height="${o.height}" viewBox="0 0 ${o.width} ${o.height}">` +
    `<defs><pattern id="p" width="${g}" height="${g}" patternUnits="userSpaceOnUse">` +
    `<path d="M0 0 H${g} M0 0 V${g} M0 0 L${g} ${g}" stroke="${STROKE}" stroke-width="1" fill="none"/>` +
    `<circle cx="0" cy="0" r="${dotR}" fill="${DOT}"/>` +
    `</pattern></defs>` +
    `<rect width="100%" height="100%" fill="url(#p)"/>` +
    `</svg>`
  )
}

/** Fine graph-paper grid: dense minor lines, stronger major lines every 5 cells with a small crosshair. */
function graphPaperSvg(o: BackgroundRenderOptions): string {
  const minor = 12 * o.scaleFactor
  const major = minor * 5
  const tick = 4 * o.scaleFactor
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${o.width}" height="${o.height}" viewBox="0 0 ${o.width} ${o.height}">` +
    `<defs>` +
    `<pattern id="minor" width="${minor}" height="${minor}" patternUnits="userSpaceOnUse">` +
    `<path d="M${minor} 0 H0 V${minor}" stroke="${STROKE}" stroke-width="0.5" fill="none"/>` +
    `</pattern>` +
    `<pattern id="major" width="${major}" height="${major}" patternUnits="userSpaceOnUse">` +
    `<rect width="${major}" height="${major}" fill="url(#minor)"/>` +
    `<path d="M${major} 0 H0 V${major}" stroke="${STROKE_STRONG}" stroke-width="1" fill="none"/>` +
    `<path d="M0 0 h${tick} M0 ${-tick / 2} v${tick}" stroke="${STROKE_STRONG}" stroke-width="1"/>` +
    `</pattern>` +
    `</defs>` +
    `<rect width="100%" height="100%" fill="url(#major)"/>` +
    `</svg>`
  )
}

/** Overlapping concentric circles motif, anchored bottom-left of the canvas. */
function concentricCirclesSvg(o: BackgroundRenderOptions): string {
  const cx = o.width * 0.18
  const cy = o.height * 1.05
  const radii = [1, 1.6, 2.2, 2.8, 3.4, 4.0, 4.6].map((m) => m * 140 * o.scaleFactor)
  const circles = radii
    .map((r) => `<circle cx="${cx}" cy="${cy}" r="${r}" stroke="${STROKE}" stroke-width="1" fill="none"/>`)
    .join('')
  // A second cluster offset to the right so the circles interleave, matching
  // the reference's overlapping-petal look.
  const cx2 = o.width * 0.42
  const cy2 = o.height * 0.55
  const circles2 = radii
    .slice(0, 5)
    .map((r) => `<circle cx="${cx2}" cy="${cy2}" r="${r * 0.6}" stroke="${STROKE}" stroke-width="1" fill="none"/>`)
    .join('')
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${o.width}" height="${o.height}" viewBox="0 0 ${o.width} ${o.height}">` +
    circles +
    circles2 +
    `</svg>`
  )
}

export function backgroundSvg(id: BackgroundId, o: BackgroundRenderOptions): string | null {
  switch (id) {
    case 'none':
      return null
    case 'grid-background':
      return gridBackgroundSvg(o)
    case 'graph-paper':
      return graphPaperSvg(o)
    case 'concentric-circles':
      return concentricCirclesSvg(o)
  }
}

export function backgroundDataUri(id: BackgroundId, o: BackgroundRenderOptions): string | null {
  const svg = backgroundSvg(id, o)
  if (!svg) return null
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}
