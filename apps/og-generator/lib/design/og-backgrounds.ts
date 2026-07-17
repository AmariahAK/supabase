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

/**
 * Flower-of-life style overlapping-circle cluster — equal-radius circles on
 * a triangular lattice (each circle's edge passes near its neighbors'
 * centers). A single bounded motif (not tiled across the whole canvas):
 * sized to fit the canvas height, flush against the right edge, extending
 * left only as far as the motif box — same footprint as the other two
 * backgrounds, just filled with circles instead of a grid.
 */
function concentricCirclesSvg(o: BackgroundRenderOptions): string {
  const rows = 5
  const r = o.height / (rows + 1)
  const colGap = r
  const motifW = MOTIF_W_1X * o.scaleFactor
  const cols = Math.ceil(motifW / colGap) + 1
  const circles: string[] = []
  for (let row = 0; row < rows; row++) {
    const cy = r + row * colGap
    const xOffset = row % 2 === 1 ? colGap / 2 : 0
    for (let col = 0; col < cols; col++) {
      // Anchor the rightmost column to the canvas's right edge, then step
      // leftward, bleeding off the right edge and stopping at the motif's
      // left bound instead of continuing across the whole canvas.
      const cx = o.width - xOffset - col * colGap
      circles.push(`<circle cx="${cx}" cy="${cy}" r="${r}" stroke="${STROKE}" stroke-width="1" fill="none"/>`)
    }
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${o.width}" height="${o.height}" viewBox="0 0 ${o.width} ${o.height}">` +
    `<clipPath id="c"><rect x="${o.width - motifW}" y="0" width="${motifW}" height="${o.height}"/></clipPath>` +
    `<g clip-path="url(#c)">${circles.join('')}</g>` +
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
