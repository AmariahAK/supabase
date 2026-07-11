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
  /** Fixed Supabase wordmark, pre-sized to `logoHeight` — for `noIcon` templates. */
  logoEl: ReactNode
  logoHeight: number
  /** Resolved partner logo/icon tiles (1-4), for logo-grid. */
  logoTiles?: ReactNode[]
}

export interface Template {
  id: string
  label: string
  /**
   * Groups templates into labeled sections in the Layout picker (§ editor
   * UI) — a flat grid stops scaling once a format has more than a
   * handful of layouts.
   */
  category: string
  /** Headline text-box width (1x px) the auto-fit measures against, for a given format. */
  headlineBox: (format: Format) => number
  textAlign: 'left' | 'center' | 'right'
  /** Where the content sits (§4). */
  anchorX: 'left' | 'center' | 'right'
  anchorY: 'top' | 'center' | 'bottom'
  build: (p: TemplateParts) => ReactElement
  /**
   * Renders the fixed Supabase wordmark instead of the user-selectable
   * icon/logo system — hides the Icon control in the sidebar since there's
   * nothing for it to affect.
   */
  noIcon?: boolean
  /** Hides the Eyebrow control and omits the eyebrow pill from the render. */
  noEyebrow?: boolean
}

// Gap (1x px) between the headline and the icon column in split-right.
const SPLIT_RIGHT_GAP = 56

// How far (1x px) logo-center-left's logo sits above dead-center vertically.
const LOGO_CENTER_LIFT_1X = 40

function rootBase(p: TemplateParts): CSSProperties {
  return {
    position: 'relative',
    width: p.W,
    height: p.H,
    display: 'flex',
    padding: `${p.padY}px ${p.padX}px`,
    backgroundColor: p.bg,
    fontFamily: 'Manrope',
  }
}

export const TEMPLATES: Template[] = [
  {
    id: 'bottom-left',
    label: 'Headline bottom-left',
    category: 'Icon layouts',
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
    category: 'Icon layouts',
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
    category: 'Icon layouts',
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
    category: 'Icon layouts',
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
  {
    id: 'logo-top-left',
    label: 'Logo top-left',
    category: 'Logo layouts',
    headlineBox: fullHeadlineBoxWidth,
    textAlign: 'left',
    anchorX: 'left',
    anchorY: 'bottom',
    noIcon: true,
    build: (p) => (
      <div
        style={{
          ...rootBase(p),
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div style={{ display: 'flex' }}>{p.logoEl}</div>
        {p.textBlock}
      </div>
    ),
  },
  {
    id: 'logo-left-text-right',
    label: 'Logo left, text right',
    category: 'Logo layouts',
    // Narrower fixed box (rather than a fraction of the format width) so the
    // headline reads as a tidy right-hand column regardless of format width.
    headlineBox: (format) => Math.min(580, fullHeadlineBoxWidth(format) - format.width * 0.28),
    // The text block itself is left-aligned (ragged-right per line) — it's
    // the block's bounding box, sized to the widest line, that's pinned to
    // the column's right edge via the row's `justifyContent: flex-end`.
    textAlign: 'left',
    anchorX: 'right',
    anchorY: 'center',
    noIcon: true,
    build: (p) => (
      <div style={{ ...rootBase(p), flexDirection: 'row', alignItems: 'stretch' }}>
        <div
          style={{
            display: 'flex',
            flex: '0 0 28%',
            alignItems: 'center',
            justifyContent: 'flex-start',
          }}
        >
          {p.logoEl}
        </div>
        <div
          style={{
            display: 'flex',
            flex: '1 1 auto',
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}
        >
          <div style={{ display: 'flex', maxWidth: 580 * p.scaleFactor }}>{p.textBlock}</div>
        </div>
      </div>
    ),
  },
  {
    id: 'logo-center-left',
    label: 'Logo center, text bottom',
    category: 'Logo layouts',
    headlineBox: fullHeadlineBoxWidth,
    textAlign: 'left',
    anchorX: 'left',
    anchorY: 'bottom',
    noIcon: true,
    noEyebrow: true,
    build: (p) => (
      <div style={{ ...rootBase(p), position: 'relative' }}>
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            left: p.padX,
            top: '50%',
            // Sit a bit above dead-center — nudges the logo up off the true
            // vertical midpoint (1x design px, scaled) so it doesn't read as
            // mechanically centered against the bottom-anchored text.
            marginTop: -(p.logoHeight / 2) - LOGO_CENTER_LIFT_1X * p.scaleFactor,
          }}
        >
          {p.logoEl}
        </div>
        <div style={{ display: 'flex', position: 'absolute', left: p.padX, bottom: p.padY }}>
          {p.textBlock}
        </div>
      </div>
    ),
  },
  {
    id: 'logo-grid',
    label: 'Partner logos',
    category: 'Announcement layouts',
    headlineBox: fullHeadlineBoxWidth,
    textAlign: 'left',
    anchorX: 'left',
    anchorY: 'bottom',
    // Uses its own multi-tile icon picker (1-4 logos) instead of the
    // single-icon control — hides that control the same way the fixed-logo
    // wordmark templates do.
    noIcon: true,
    build: (p) => {
      const tiles = p.logoTiles ?? []
      const tileSize = 160 * p.scaleFactor
      const tileGap = 20 * p.scaleFactor
      const sepFontSize = 32 * p.scaleFactor
      const rowChildren: ReactNode[] = []
      tiles.forEach((tile, i) => {
        rowChildren.push(
          <div
            key={`tile-${i}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: tileSize,
              height: tileSize,
              borderRadius: 16 * p.scaleFactor,
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {tile}
          </div>
        )
        // "x" separator is only used for the 2-logo case (matches reference).
        if (tiles.length === 2 && i === 0) {
          rowChildren.push(
            <span
              key="sep"
              style={{
                display: 'flex',
                color: 'rgba(255,255,255,0.35)',
                fontSize: sepFontSize,
                fontWeight: 500,
              }}
            >
              x
            </span>
          )
        }
      })
      return (
        <div
          style={{
            ...rootBase(p),
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          {tiles.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: tileGap }}>
              {rowChildren}
            </div>
          )}
          {p.textBlock}
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              right: p.padX,
              bottom: p.padY,
              alignItems: 'center',
            }}
          >
            {p.logoEl}
          </div>
        </div>
      )
    },
  },
]

/**
 * Newsletter-only layouts (brief follow-up) — a full hero banner for the
 * top of an email, and a compact divider-style header used to break up
 * sections further down. Kept out of TEMPLATES so the standard 4 layouts
 * stay format-agnostic; the editor swaps in this set only when the
 * Newsletter format is selected.
 */
export const NEWSLETTER_TEMPLATES: Template[] = [
  {
    id: 'newsletter-cover',
    label: 'Newsletter cover',
    category: 'Newsletter layouts',
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
    id: 'newsletter-section',
    label: 'Section header',
    category: 'Newsletter layouts',
    // A compact divider row, not a full banner — narrower box for a short,
    // single-line section title rather than a full headline.
    headlineBox: (format) => Math.round(fullHeadlineBoxWidth(format) * 0.6),
    textAlign: 'left',
    anchorX: 'left',
    anchorY: 'center',
    build: (p) => (
      <div
        style={{
          ...rootBase(p),
          flexDirection: 'row',
          justifyContent: 'flex-start',
          alignItems: 'center',
          gap: 32 * p.scaleFactor,
        }}
      >
        {p.iconEl}
        {p.textBlock}
      </div>
    ),
  },
]

/**
 * Social-only layouts (brief follow-up) — a centered composition suited to
 * Instagram's square-crop feeds, and the classic bottom-left card layout
 * that's how X/Twitter link previews are actually presented. Kept out of
 * TEMPLATES for the same reason as the Newsletter set; swapped in only when
 * the Social format is selected.
 */
export const SOCIAL_TEMPLATES: Template[] = [
  {
    id: 'social-instagram',
    label: 'Instagram',
    category: 'Social layouts',
    // Narrower box for the tighter, more square-cropped feed presentation.
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
    id: 'social-twitter',
    label: 'Twitter / X',
    category: 'Social layouts',
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
]

export const TEMPLATE_MAP: Record<string, Template> = Object.fromEntries(
  [...TEMPLATES, ...NEWSLETTER_TEMPLATES, ...SOCIAL_TEMPLATES].map((t) => [t.id, t])
)

export const DEFAULT_TEMPLATE_ID = 'bottom-left'
export const DEFAULT_NEWSLETTER_TEMPLATE_ID = 'newsletter-cover'
export const DEFAULT_SOCIAL_TEMPLATE_ID = 'social-twitter'
