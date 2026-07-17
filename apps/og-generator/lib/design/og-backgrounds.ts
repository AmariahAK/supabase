/**
 * Full-canvas background textures selectable per-template (starting with
 * Headline + icon) — distinct from lib/design/patterns.ts's grid/dots/hlines
 * axis system, which stayed unwired. These are three fixed, named looks,
 * each a single non-repeating motif anchored to the right edge and
 * vertically centered (not tiled across the whole canvas).
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
const STROKE = 'rgba(255,255,255,0.10)'
const STROKE_STRONG = 'rgba(255,255,255,0.16)'
const DOT = 'rgba(255,255,255,0.2)'

// Shared motif box (1x design px) — right-aligned, vertically centered.
// Fixed size rather than canvas-proportional so the motif reads the same
// regardless of format.
const MOTIF_W_1X = 620
const MOTIF_H_1X = 520

function motifBox(o: BackgroundRenderOptions) {
  const w = MOTIF_W_1X * o.scaleFactor
  const h = MOTIF_H_1X * o.scaleFactor
  const x = o.width - w
  const y = (o.height - h) / 2
  return { x, y, w, h }
}

/** Diagonal square grid: one corner-to-corner line per cell, dot at each vertex — a single non-repeating patch, not tiled past the motif box. */
function gridBackgroundSvg(o: BackgroundRenderOptions): string {
  const g = 120 * o.scaleFactor
  const dotR = 1.5 * o.scaleFactor
  const { x, y, w, h } = motifBox(o)
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${o.width}" height="${o.height}" viewBox="0 0 ${o.width} ${o.height}">` +
    `<defs><pattern id="p" x="${x}" y="${y}" width="${g}" height="${g}" patternUnits="userSpaceOnUse">` +
    `<path d="M0 0 H${g} M0 0 V${g} M0 0 L${g} ${g}" stroke="${STROKE}" stroke-width="1" fill="none"/>` +
    `<circle cx="0" cy="0" r="${dotR}" fill="${DOT}"/>` +
    `</pattern></defs>` +
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#p)"/>` +
    `</svg>`
  )
}

/** Fine graph-paper grid: dense minor lines, stronger major lines every 5 cells with a small crosshair — confined to the motif box, not tiled across the canvas. */
function graphPaperSvg(o: BackgroundRenderOptions): string {
  const minor = 12 * o.scaleFactor
  const major = minor * 5
  const tick = 4 * o.scaleFactor
  const { x, y, w, h } = motifBox(o)
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${o.width}" height="${o.height}" viewBox="0 0 ${o.width} ${o.height}">` +
    `<defs>` +
    `<pattern id="minor" x="${x}" y="${y}" width="${minor}" height="${minor}" patternUnits="userSpaceOnUse">` +
    `<path d="M${minor} 0 H0 V${minor}" stroke="${STROKE}" stroke-width="0.5" fill="none"/>` +
    `</pattern>` +
    `<pattern id="major" x="${x}" y="${y}" width="${major}" height="${major}" patternUnits="userSpaceOnUse">` +
    `<rect width="${major}" height="${major}" fill="url(#minor)"/>` +
    `<path d="M${major} 0 H0 V${major}" stroke="${STROKE_STRONG}" stroke-width="1" fill="none"/>` +
    `<path d="M0 0 h${tick} M0 ${-tick / 2} v${tick}" stroke="${STROKE_STRONG}" stroke-width="1"/>` +
    `</pattern>` +
    `</defs>` +
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#major)"/>` +
    `</svg>`
  )
}

/** Overlapping concentric circles, centered in the motif box (right-aligned, vertically centered) — a single motif, not repeated. */
function concentricCirclesSvg(o: BackgroundRenderOptions): string {
  const { x, y, w, h } = motifBox(o)
  const cx = x + w / 2
  const cy = y + h / 2
  const radii = [0.5, 0.8, 1.1, 1.4, 1.7, 2.0].map((m) => m * 110 * o.scaleFactor)
  const circles = radii
    .map((r) => `<circle cx="${cx}" cy="${cy}" r="${r}" stroke="${STROKE}" stroke-width="1" fill="none"/>`)
    .join('')
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${o.width}" height="${o.height}" viewBox="0 0 ${o.width} ${o.height}">` +
    circles +
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
