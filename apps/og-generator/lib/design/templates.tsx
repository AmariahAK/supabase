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
  /** Which element-arrangement variant to render (0-based) — see `Template.arrangementCount`. */
  arrangement?: number
  /** Single icon/logo pre-sized to 50% of `thumbBox` — Announcement's OG logo. */
  halfThumbLogoEl?: ReactNode | null
  /** Resolved line count of the fitted headline — Announcement positions differently at 1 vs. 2 lines. */
  headlineLineCount?: number
  /** Single icon pre-sized to `ICON_TILE_ICON_SIZE_1X` — icon-layout's icon inside its chip bounding box. */
  boxedIconEl?: ReactNode | null
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
  /** Headline text-box width (1x px) the auto-fit measures against, for a given format + arrangement. */
  headlineBox: (format: Format, arrangement?: number) => number
  textAlign: 'left' | 'center' | 'right'
  /** Overrides `textAlign` per arrangement variant — only needed by grouped templates whose sub-layouts don't share one alignment (e.g. icon-layout's centered variant). */
  textAlignForArrangement?: (arrangement: number) => 'left' | 'center' | 'right'
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
  /** Per-arrangement override of `noEyebrow` — for grouped templates where only some sub-layouts have no room for an eyebrow. */
  noEyebrowForArrangement?: (arrangement: number) => boolean
  /** Number of alternate element-arrangement variants (default 1 = none) — drives the "Alternate layouts" pager. */
  arrangementCount?: number
  /** Overrides the default square Thumb box (1x px) — e.g. Announcement's 375×200 logo-only thumb. */
  thumbBox?: { width: number; height: number }
  /** Caps headline line count below the default 3 (e.g. Announcement's 2-line max). */
  maxHeadlineLines?: number
  /** Pins the auto-fit font-size range instead of the default hasIcon-based tier (e.g. Announcement's fixed 72px-at-one-line). */
  headlineSizeTier?: { minSize: number; maxSize: number }
}

// Shared icon "chip" bounding box (Partner logos' tile look, reused by
// icon-layout) — fixed 160px dark rounded box, sized to hold a 64px icon.
export const ICON_TILE_SIZE_1X = 160
export const ICON_TILE_ICON_SIZE_1X = 64
const ICON_TILE_RADIUS_1X = 16
const ICON_TILE_BORDER_WIDTH_1X = 1.5
const ICON_TILE_BG = '#171717'
const ICON_TILE_BORDER_COLOR = '#2E2E2E'

/** Wraps `content` (expected to be `ICON_TILE_ICON_SIZE_1X`-sized) in the shared dark chip box. */
function iconTile(p: TemplateParts, content: ReactNode): ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: ICON_TILE_SIZE_1X * p.scaleFactor,
        height: ICON_TILE_SIZE_1X * p.scaleFactor,
        borderRadius: ICON_TILE_RADIUS_1X * p.scaleFactor,
        backgroundColor: ICON_TILE_BG,
        border: `${ICON_TILE_BORDER_WIDTH_1X * p.scaleFactor}px solid ${ICON_TILE_BORDER_COLOR}`,
      }}
    >
      {content}
    </div>
  )
}

// Gap (1x px) between the headline and the icon column in split-right.
const SPLIT_RIGHT_GAP = 56

// How far (1x px) logo-center-left's logo sits above dead-center vertically.
const LOGO_CENTER_LIFT_1X = 40

// Announcement: distance (1x px) from the canvas bottom edge to the *bottom*
// of the centered logo — a fixed brand guideline, not tied to headlineInset.
const ANNOUNCEMENT_LOGO_BOTTOM_1X = 80

// Announcement headline: fixed max box width (brand guideline) and its
// absolute top offset from the canvas top (both 1x design px) — offset
// differs between a 1-line and a 2-line headline (both fixed guideline
// values, not derived from one another).
const ANNOUNCEMENT_HEADLINE_MAX_WIDTH_1X = 704
const ANNOUNCEMENT_HEADLINE_TOP_1X = 242
const ANNOUNCEMENT_HEADLINE_TOP_2LINE_1X = 176

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
    id: 'icon-layout',
    label: 'Headline + icon',
    category: 'Icon layouts',
    // arrangement 0: bottom-left · 1: split-right · 2: centered · 3: stacked
    // (formerly 4 separate template ids — grouped behind one carousel entry
    // + the "Alternate layouts" pager so it doesn't crowd the picker).
    headlineBox: (format, arrangement = 0) =>
      arrangement === 1
        ? fullHeadlineBoxWidth(format) - format.iconSize - SPLIT_RIGHT_GAP
        : arrangement === 2
          ? Math.round(format.width * 0.75)
          : fullHeadlineBoxWidth(format),
    textAlign: 'left',
    textAlignForArrangement: (arrangement) => (arrangement === 2 ? 'center' : 'left'),
    anchorX: 'left',
    anchorY: 'bottom',
    arrangementCount: 4,
    // Matches Partner logos' headline size (the default tier) rather than
    // the usual hasIcon-driven compact tier — the boxed icon here doesn't
    // need the extra headline room the compact tier exists for.
    headlineSizeTier: { minSize: 48, maxSize: 64 },
    // Centered (3/4) has no room for an eyebrow above the headline.
    noEyebrowForArrangement: (arrangement) => arrangement === 2,
    build: (p) => {
      const arrangement = p.arrangement ?? 0
      // Icon renders inside the same dark chip bounding box Partner logos
      // uses, not bare — consistent icon treatment across both templates.
      const icon = p.hasIcon ? iconTile(p, p.boxedIconEl) : null
      if (arrangement === 1) {
        // Headline left, icon right.
        return (
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
            {icon}
          </div>
        )
      }
      if (arrangement === 2) {
        // Centered.
        return (
          <div
            style={{
              ...rootBase(p),
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            {icon ? <div style={{ display: 'flex', marginBottom: 36 * p.scaleFactor }}>{icon}</div> : null}
            {p.textBlock}
          </div>
        )
      }
      if (arrangement === 3) {
        // Headline top, icon bottom.
        return (
          <div
            style={{
              ...rootBase(p),
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            {p.textBlock}
            {icon}
          </div>
        )
      }
      // arrangement 0 (default): headline bottom-left, icon top-right.
      return (
        <div
          style={{
            ...rootBase(p),
            flexDirection: 'column',
            justifyContent: p.hasIcon ? 'space-between' : 'flex-end',
            alignItems: 'flex-start',
          }}
        >
          {icon ? (
            <div style={{ display: 'flex', width: p.W - p.padX * 2, justifyContent: 'flex-end' }}>{icon}</div>
          ) : null}
          {p.textBlock}
        </div>
      )
    },
  },
  {
    id: 'logo-layout',
    label: 'Headline + logo',
    category: 'Logo layouts',
    // arrangement 0: logo top-left · 1: logo left, text right · 2: logo center-left
    // (formerly 3 separate template ids — grouped the same way as icon-layout).
    headlineBox: (format, arrangement = 0) =>
      arrangement === 1 ? Math.min(580, fullHeadlineBoxWidth(format) - format.width * 0.28) : fullHeadlineBoxWidth(format),
    textAlign: 'left',
    anchorX: 'left',
    anchorY: 'bottom',
    noIcon: true,
    arrangementCount: 3,
    // Logo center, text bottom (3/3) has no room for an eyebrow.
    noEyebrowForArrangement: (arrangement) => arrangement === 2,
    build: (p) => {
      const arrangement = p.arrangement ?? 0
      if (arrangement === 1) {
        // Logo left, text right.
        return (
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
        )
      }
      if (arrangement === 2) {
        // Logo center, text bottom.
        return (
          <div style={{ ...rootBase(p), position: 'relative' }}>
            <div
              style={{
                display: 'flex',
                position: 'absolute',
                left: p.padX,
                top: '50%',
                // Sit a bit above dead-center — nudges the logo up off the
                // true vertical midpoint so it doesn't read as mechanically
                // centered against the bottom-anchored text.
                marginTop: -(p.logoHeight / 2) - LOGO_CENTER_LIFT_1X * p.scaleFactor,
              }}
            >
              {p.logoEl}
            </div>
            <div style={{ display: 'flex', position: 'absolute', left: p.padX, bottom: p.padY }}>
              {p.textBlock}
            </div>
          </div>
        )
      }
      // arrangement 0 (default): logo top-left, text bottom-left.
      return (
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
      )
    },
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
    arrangementCount: 2,
    build: (p) => {
      const tiles = p.logoTiles ?? []
      const tileGap = 20 * p.scaleFactor
      const sepFontSize = 32 * p.scaleFactor
      const rowChildren: ReactNode[] = []
      tiles.forEach((tile, i) => {
        rowChildren.push(
          <div key={`tile-${i}`} style={{ display: 'flex' }}>
            {iconTile(p, tile)}
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
      const tilesRow =
        tiles.length > 0 ? (
          <div
            key="tiles"
            style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: tileGap }}
          >
            {rowChildren}
          </div>
        ) : null

      // Arrangement cycles which row sits top vs. bottom within the
      // space-between column below — the wordmark signature stays fixed in
      // the bottom-right corner regardless. Tile count is untouched by this;
      // that's the sidebar's "Logo tiles" stepper's job, not this pager's.
      const stackedChildren = p.arrangement === 1 ? [p.textBlock, tilesRow] : [tilesRow, p.textBlock]

      return (
        <div
          style={{
            ...rootBase(p),
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          {stackedChildren}
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
  {
    id: 'announcement',
    label: 'Announcement',
    category: 'Announcement layouts',
    // Fixed 704px box (brand guideline) rather than a fraction of the format
    // width — pairs with the 72px-at-one-line size tier below.
    headlineBox: () => ANNOUNCEMENT_HEADLINE_MAX_WIDTH_1X,
    textAlign: 'center',
    anchorX: 'center',
    anchorY: 'top',
    // Brand guideline caps this composition at 2 lines (vs. the usual 3),
    // pins the font size (72px at one line, shrinking only if a 2nd line is
    // needed) instead of the default hasIcon-based tier, and its Thumb
    // companion is a fixed 375×200 logo box instead of the default square
    // icon crop — the OG logo below is 50% of that box.
    maxHeadlineLines: 2,
    headlineSizeTier: { minSize: 40, maxSize: 72 },
    thumbBox: { width: 375, height: 200 },
    build: (p) => (
      <div style={{ ...rootBase(p), position: 'relative' }}>
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            left: 0,
            right: 0,
            justifyContent: 'center',
            // 2-line headlines sit higher (176px) than 1-line ones (242px) —
            // both fixed brand guideline offsets, not derived from each other.
            top:
              (p.headlineLineCount && p.headlineLineCount >= 2
                ? ANNOUNCEMENT_HEADLINE_TOP_2LINE_1X
                : ANNOUNCEMENT_HEADLINE_TOP_1X) * p.scaleFactor,
          }}
        >
          {p.textBlock}
        </div>
        {p.halfThumbLogoEl && (
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              left: p.padX,
              right: p.padX,
              bottom: ANNOUNCEMENT_LOGO_BOTTOM_1X * p.scaleFactor,
              justifyContent: 'center',
            }}
          >
            {p.halfThumbLogoEl}
          </div>
        )}
      </div>
    ),
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

export const DEFAULT_TEMPLATE_ID = 'icon-layout'
export const DEFAULT_NEWSLETTER_TEMPLATE_ID = 'newsletter-cover'
export const DEFAULT_SOCIAL_TEMPLATE_ID = 'social-twitter'
