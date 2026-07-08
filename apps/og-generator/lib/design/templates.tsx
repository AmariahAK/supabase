import type { CSSProperties, ReactElement, ReactNode } from 'react'

import type { Format } from '@/lib/design/formats'
import { fullHeadlineBoxWidth } from '@/lib/design/formats'

/**
 * Multi-template registry (brief §5.6). Each template is a guardrailed layout
 * that already satisfies the safe area + alignment rules — the user picks one
 * and customizes copy/icon within it, rather than building from a blank canvas.
 *
 * Templates are data: id, the headline text-box width the auto-fit measures
 * against, intrinsic text alignment, and a `build` that arranges the
 * pre-rendered pieces into the satori root. This shape maps onto the future
 * `templates` table's og_schema_json (§8).
 */

export interface TemplateParts {
  W: number
  H: number
  padX: number
  padY: number
  bg: string
  scaleFactor: number
  textBlock: ReactNode
  iconEl: ReactNode | null
  hasIcon: boolean
  /** Fallback art (data URI) for icon-less compositions — full-bleed, behind everything else. */
  bgImage?: string | null
}

export interface Template {
  id: string
  label: string
  /** Headline text-box width (1x px) the auto-fit measures against, for a given format. */
  headlineBox: (format: Format) => number
  textAlign: 'left' | 'center'
  /** Where the content sits (§4). */
  anchorX: 'left' | 'center'
  anchorY: 'top' | 'center' | 'bottom'
  build: (p: TemplateParts) => ReactElement
}

// Gap (1x px) between the headline and the icon column in split-right.
const SPLIT_RIGHT_GAP = 56

function rootBase(p: TemplateParts): CSSProperties {
  return {
    position: 'relative',
    width: p.W,
    height: p.H,
    display: 'flex',
    padding: `${p.padY}px ${p.padX}px`,
    backgroundColor: p.bg,
    ...(p.bgImage
      ? { backgroundImage: `url(${p.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : {}),
    fontFamily: 'Manrope',
  }
}

export const TEMPLATES: Template[] = [
  {
    id: 'bottom-left',
    label: 'Headline bottom-left',
    headlineBox: fullHeadlineBoxWidth,
    textAlign: 'left',
    anchorX: 'left',
    anchorY: 'bottom',
    build: (p) => (
      <div
        style={{
          ...rootBase(p),
          flexDirection: 'column',
          justifyContent: p.hasIcon ? 'space-between' : 'flex-end',
          alignItems: 'flex-start',
        }}
      >
        {p.hasIcon ? (
          <div style={{ display: 'flex', width: p.W - p.padX * 2, justifyContent: 'flex-end' }}>
            {p.iconEl}
          </div>
        ) : null}
        {p.textBlock}
      </div>
    ),
  },
  {
    id: 'split-right',
    label: 'Headline left, icon right',
    // Leaves room for the icon column (764 at the OG/Twitter format's 1200 width).
    headlineBox: (format) => fullHeadlineBoxWidth(format) - format.iconSize - SPLIT_RIGHT_GAP,
    textAlign: 'left',
    anchorX: 'left',
    anchorY: 'center',
    build: (p) => (
      <div
        style={{
          ...rootBase(p),
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 56 * p.scaleFactor,
        }}
      >
        {p.textBlock}
        {p.iconEl}
      </div>
    ),
  },
  {
    id: 'centered',
    label: 'Centered',
    // 75% of the format width (900 at the OG/Twitter format's 1200 width) —
    // deliberately narrower than the full inset box for shorter, balanced lines.
    headlineBox: (format) => Math.round(format.width * 0.75),
    textAlign: 'center',
    anchorX: 'center',
    anchorY: 'center',
    build: (p) => (
      <div
        style={{
          ...rootBase(p),
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {p.hasIcon ? (
          <div style={{ display: 'flex', marginBottom: 36 * p.scaleFactor }}>{p.iconEl}</div>
        ) : null}
        {p.textBlock}
      </div>
    ),
  },
  {
    id: 'stacked',
    label: 'Headline top, icon bottom',
    headlineBox: fullHeadlineBoxWidth,
    textAlign: 'left',
    anchorX: 'left',
    anchorY: 'top',
    build: (p) => (
      <div
        style={{
          ...rootBase(p),
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        {p.textBlock}
        {p.iconEl}
      </div>
    ),
  },
]

export const TEMPLATE_MAP: Record<string, Template> = Object.fromEntries(
  TEMPLATES.map((t) => [t.id, t])
)

export const DEFAULT_TEMPLATE_ID = 'bottom-left'
