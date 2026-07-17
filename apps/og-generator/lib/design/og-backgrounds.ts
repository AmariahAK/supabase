/**
 * Background texture options selectable per-template (starting with
 * Headline + icon) — client-safe (types/labels only). The actual PNGs live
 * in public/backgrounds/ and are read server-side by
 * lib/design/og-backgrounds.server.ts, which app/page.tsx (a Client
 * Component) can't import directly.
 */

export type BackgroundId = 'none' | 'grid-background' | 'graph-paper' | 'concentric-circles'

export const BACKGROUND_OPTIONS: { id: BackgroundId; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'grid-background', label: 'Grid' },
  { id: 'graph-paper', label: 'Graph paper' },
  { id: 'concentric-circles', label: 'Circles' },
]

export const DEFAULT_BACKGROUND_ID: BackgroundId = 'grid-background'
