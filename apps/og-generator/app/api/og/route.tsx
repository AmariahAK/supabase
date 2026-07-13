import { ImageResponse } from 'next/og'

import { resolveIcon } from '@/lib/supabase/assets'
import { randomBackgroundDataUri } from '@/lib/design/backgrounds'
import { getBrand, color } from '@/lib/design/brands'
import { satoriFonts, measurementFont } from '@/lib/design/fonts'
import { getFormat } from '@/lib/design/formats'
import { iconDataUri } from '@/lib/design/icons'
import { SUPABASE_WORDMARK_ASPECT, SUPABASE_WORDMARK_DATA_URI } from '@/lib/design/logo'
import { DEFAULT_TEMPLATE_ID, TEMPLATE_MAP } from '@/lib/design/templates'
import { typography } from '@/lib/design/tokens'
import { fitHeadline, measureLineWidth } from '@/lib/text/fit-headline'
import { headlineWordHighlights, stripQuoteMarks } from '@/lib/text/quote-highlight'
import { toSentenceCase } from '@/lib/text/sentence-case'

// Node runtime so we can read the self-hosted Manrope files from disk and parse
// them with fontkit for measurement (brief §2 — no Google Fonts at request time).
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DEFAULT_HEADLINE = 'Postgres full text search just got faster'

const HEADLINE = typography.roles.headline
const EYEBROW = typography.roles.eyebrow
// Matches EYEBROW's own weight — reads best at the current 20px pill size.
const EYEBROW_PILL_WEIGHT = 500 as const
// Wordmark display height (1x design px) for the fixed-logo templates.
const WORDMARK_HEIGHT_1X = 43
// Per-tile icon size for logo-grid's row of partner-logo tiles (1x design px).
const LOGO_TILE_ICON_SIZE_1X = 56

/** Scale (naturalW, naturalH) to fit within a boxSize square, preserving aspect ratio. */
function fitBox(naturalW: number, naturalH: number, boxSize: number): { width: number; height: number } {
  const ratio = naturalW / naturalH || 1
  return ratio >= 1 ? { width: boxSize, height: boxSize / ratio } : { width: boxSize * ratio, height: boxSize }
}

/** Scale (naturalW, naturalH) to fit within a boxW × boxH rect, preserving aspect ratio. */
function fitRect(
  naturalW: number,
  naturalH: number,
  boxW: number,
  boxH: number
): { width: number; height: number } {
  const ratio = naturalW / naturalH || 1
  const boxRatio = boxW / boxH
  return ratio >= boxRatio ? { width: boxW, height: boxW / ratio } : { width: boxH * ratio, height: boxH }
}

const CORS_AND_CACHE = {
  'access-control-allow-origin': '*',
  'cache-control': 'no-store, max-age=0',
}

/**
 * Resolve + render one icon/logo by name at a given display size — the same
 * logic the single-icon slot uses, factored out so logo-grid's multiple
 * tiles can reuse it per-tile instead of duplicating the kind==='logo' branch.
 */
async function renderIconByName(
  name: string,
  brandId: string,
  sizePx: number,
  strokePx: number,
  strokeColor: string
) {
  const obj = await resolveIcon(name, brandId)
  if (!obj) return null
  if (obj.kind === 'logo' && obj.url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...fitBox(obj.width ?? 1, obj.height ?? 1, sizePx)} src={obj.url} />
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img width={sizePx} height={sizePx} src={iconDataUri(obj, { sizePx, strokePx, color: strokeColor })} />
  )
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)

    const brand = getBrand(searchParams.get('brand'))
    const baseFormat = getFormat(searchParams.get('format'))
    // `variant=secondary` swaps in a format's second full-composition size
    // (e.g. Social's Instagram alongside its primary Twitter/X/LinkedIn size)
    // — same recipe, different canvas dimensions.
    const format =
      searchParams.get('variant') === 'secondary' && baseFormat.secondary
        ? { ...baseFormat, width: baseFormat.secondary.width, height: baseFormat.secondary.height }
        : baseFormat
    const ICON_STROKE = brand.illustration.defaultStrokePx

    const scale = searchParams.get('scale') === '2' ? 2 : 1
    const s = scale
    const W = format.width * s
    const H = format.height * s
    const padX = format.headlineInset.x * s
    const padY = format.headlineInset.y * s
    const bg = color('bg.primary', brand)

    const iconName = searchParams.get('icon')
    // Seed icons first, then uploaded assets from Supabase (brief §6).
    const iconObj = iconName ? await resolveIcon(iconName, brand.id) : null
    const type = searchParams.get('type') === 'thumb' ? 'thumb' : 'og'
    // Resolved above the Thumb branch too — some templates (Announcement)
    // override the Thumb's default square icon crop via `thumbBox`.
    const template = TEMPLATE_MAP[searchParams.get('template') ?? ''] ?? TEMPLATE_MAP[DEFAULT_TEMPLATE_ID]

    // ---- Thumb variant: same canvas + icon system, no text layer (brief §3) -
    if (type === 'thumb') {
      const thumb = format.thumb ?? { default: 380, min: 160, max: 480 }
      const thumbNum = Number(searchParams.get('thumbSize'))
      const thumbSize = Number.isFinite(thumbNum)
        ? Math.min(thumb.max, Math.max(thumb.min, Math.round(thumbNum)))
        : thumb.default
      const thumbBgImage = iconObj ? null : randomBackgroundDataUri()
      // A template can override the Thumb's default square crop with a fixed
      // (possibly non-square) box — e.g. Announcement's 375×200 logo box.
      const thumbBoxW = (template.thumbBox?.width ?? thumbSize) * s
      const thumbBoxH = (template.thumbBox?.height ?? thumbSize) * s

      const thumbRoot = (
        <div
          style={{
            position: 'relative',
            width: W,
            height: H,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: bg,
            ...(thumbBgImage
              ? { backgroundImage: `url(${thumbBgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : {}),
          }}
        >
          {iconObj && iconObj.kind === 'logo' && iconObj.url ? (
            // Custom color logo — rendered as-is (no stroke normalization),
            // fit to its natural aspect ratio (brief follow-up: partnerships).
            // eslint-disable-next-line @next/next/no-img-element
            <img {...fitRect(iconObj.width ?? 1, iconObj.height ?? 1, thumbBoxW, thumbBoxH)} src={iconObj.url} />
          ) : iconObj ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              width={Math.min(thumbBoxW, thumbBoxH)}
              height={Math.min(thumbBoxW, thumbBoxH)}
              src={iconDataUri(iconObj, {
                sizePx: Math.min(thumbBoxW, thumbBoxH),
                strokePx: ICON_STROKE * s,
                color: color('illustration.stroke', brand),
              })}
            />
          ) : null}
        </div>
      )

      return new ImageResponse(thumbRoot, {
        width: W,
        height: H,
        headers: {
          ...CORS_AND_CACHE,
          'x-og-template': 'thumb',
          'x-og-has-icon': String(!!iconObj),
        },
      })
    }

    // ---- OG image (template-driven) -----------------------------------------
    // Which element-arrangement variant to render (grouped templates only,
    // e.g. icon-layout/logo-layout/logo-grid) — never changes tile count or
    // any other content, just which sub-layout the template's `build` picks.
    const arrangement = Number(searchParams.get('arrangement') ?? 0) || 0

    const rawHeadline = (searchParams.get('headline') ?? DEFAULT_HEADLINE).slice(0, 200)
    const eyebrow = template.noEyebrow ? null : searchParams.get('eyebrow')?.trim().slice(0, 20) || null
    const sentenceCase = searchParams.get('sentenceCase') !== '0'
    const manualBreaks = searchParams.get('manual') === '1' || /\n/.test(rawHeadline)

    const hasIcon = !!iconObj

    // Manual font-size override (brief §3 power-user mode). Guard the absent case
    // — Number(null) === 0 would wrongly pin every auto-fit render to the min.
    // Clamped to the full range across both tiers (40-64) — a manual override
    // is a deliberate escape hatch, not subject to the auto-fit tier rules.
    const fontSizeParam = searchParams.get('fontSize')
    const manualSizeNum = fontSizeParam ? Number(fontSizeParam) : NaN
    const manualSize = Number.isFinite(manualSizeNum)
      ? Math.min(HEADLINE.sizeTiers.default.maxSize, Math.max(HEADLINE.sizeTiers.compact.minSize, Math.round(manualSizeNum)))
      : null

    const effectiveTextAlign = template.textAlignForArrangement
      ? template.textAlignForArrangement(arrangement)
      : template.textAlign
    const textCrossAlign =
      effectiveTextAlign === 'center' ? 'center' : effectiveTextAlign === 'right' ? 'flex-end' : 'flex-start'
    const headline = sentenceCase ? toSentenceCase(rawHeadline) : rawHeadline
    // "Quotation" override: wrap a run in "double quotes" to highlight it in
    // the brand accent color. Quotes are stripped before layout/measurement
    // (like [bracket] casing markers) — highlightedWords tracks which words
    // in the cleaned, wrapped text should render in the accent color.
    const highlightedWords = headlineWordHighlights(headline)
    const cleanedHeadline = stripQuoteMarks(headline)

    const headlineFont = await measurementFont(HEADLINE.weight)
    // Compact tier (40-56) whenever an icon is showing; default tier (48-64)
    // otherwise. Either way, a headline that still needs a 3rd line always
    // drops to the compact tier — checked after the first fit since line
    // count isn't known up front.
    const initialTier = hasIcon ? HEADLINE.sizeTiers.compact : HEADLINE.sizeTiers.default
    const fitAt = (tier: { minSize: number; maxSize: number }) =>
      fitHeadline(cleanedHeadline, headlineFont, {
        boxWidth: template.headlineBox(format, arrangement),
        minSize: manualSize ?? tier.minSize,
        maxSize: manualSize ?? tier.maxSize,
        step: 2,
        maxLines: template.maxHeadlineLines ?? 3,
        letterSpacingEm: HEADLINE.letterSpacing,
        manualBreaks,
      })
    let fit = fitAt(initialTier)
    if (!manualSize && initialTier === HEADLINE.sizeTiers.default && fit.lineCount === 3) {
      fit = fitAt(HEADLINE.sizeTiers.compact)
    }

    const headlineSize = fit.fontSize * s
    const headlineLineHeight = Math.round(headlineSize * HEADLINE.lineHeight)
    // Gap between highlight runs on a line — a real space glyph's advance
    // width at the rendered size, applied as marginLeft (see textBlock below).
    const spaceWidthPx = measureLineWidth(headlineFont, ' ', headlineSize, HEADLINE.letterSpacing)
    const headlineLetterSpacing = HEADLINE.letterSpacing * headlineSize
    const eyebrowSize = EYEBROW.size * s
    const eyebrowLetterSpacing = EYEBROW.letterSpacing * eyebrowSize
    const eyebrowGap = 16 * s

    const fonts = await satoriFonts([...new Set([HEADLINE.weight, EYEBROW_PILL_WEIGHT])])

    // Consumed word-by-word (not per-render-safe, but this is a one-shot
    // server render) as lines are built below, walking highlightedWords in
    // lockstep with fit.lines' word order.
    let wordCursor = 0

    const textBlock = (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: textCrossAlign,
        }}
      >
        {eyebrow ? (
          <div
            style={{
              display: 'flex',
              marginBottom: eyebrowGap,
              color: '#000000',
              fontFamily: 'IBM Plex Mono',
              fontSize: eyebrowSize,
              fontWeight: EYEBROW_PILL_WEIGHT,
              letterSpacing: eyebrowLetterSpacing,
              textTransform: 'uppercase',
              backgroundColor: '#FFFFFF',
              borderRadius: 999,
              padding: `${8 * s}px ${18 * s}px`,
            }}
          >
            {eyebrow}
          </div>
        ) : null}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: textCrossAlign,
          }}
        >
          {fit.lines.map((line, i) => {
            const lineStyle = {
              display: 'flex' as const,
              whiteSpace: 'nowrap' as const, // render exactly the line we computed
              color: color('text.primary', brand),
              fontSize: headlineSize,
              fontWeight: HEADLINE.weight,
              lineHeight: `${headlineLineHeight}px`,
              letterSpacing: headlineLetterSpacing,
            }
            if (!line) return (
              <div key={i} style={lineStyle}>
                {' '}
              </div>
            )
            const words = line.split(' ')
            // Consecutive words sharing the same highlight state are merged
            // into one run (a single plain-text node, or a single colored
            // <span>). The gap between runs is a CSS marginLeft, not an
            // embedded space character — satori collapses a space living in
            // its own text content right at a text/element boundary
            // (tried both leading-on-span and trailing-on-text; both got
            // eaten), but a margin is layout, not text, so it isn't subject
            // to that trimming.
            const runs: { text: string; highlighted: boolean }[] = []
            words.forEach((word, wi) => {
              const highlighted = highlightedWords[wordCursor] ?? false
              wordCursor++
              const last = runs[runs.length - 1]
              if (wi > 0 && last && last.highlighted === highlighted) last.text += ` ${word}`
              else runs.push({ text: word, highlighted })
            })
            return (
              <div key={i} style={lineStyle}>
                {runs.map((run, ri) => (
                  <span
                    key={ri}
                    style={{
                      marginLeft: ri > 0 ? spaceWidthPx : 0,
                      color: run.highlighted ? color('brand.default', brand) : undefined,
                    }}
                  >
                    {run.text}
                  </span>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    )

    const iconEl =
      iconObj && iconObj.kind === 'logo' && iconObj.url ? (
        // Custom color logo — rendered as-is, fit to its natural aspect ratio.
        // eslint-disable-next-line @next/next/no-img-element
        <img {...fitBox(iconObj.width ?? 1, iconObj.height ?? 1, format.iconSize * s)} src={iconObj.url} />
      ) : iconObj ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          width={format.iconSize * s}
          height={format.iconSize * s}
          src={iconDataUri(iconObj, {
            sizePx: format.iconSize * s,
            strokePx: ICON_STROKE * s,
            color: color('illustration.stroke', brand),
          })}
        />
      ) : null

    const logoHeight = WORDMARK_HEIGHT_1X * s
    const logoEl = (
      // eslint-disable-next-line @next/next/no-img-element
      <img width={logoHeight * SUPABASE_WORDMARK_ASPECT} height={logoHeight} src={SUPABASE_WORDMARK_DATA_URI} />
    )

    // logo-grid: up to 4 icons/logos in `icons` (comma-separated names),
    // each rendered through the same resolution path as the single-icon slot.
    const iconsParam = searchParams.get('icons')
    const tileNames = iconsParam
      ? iconsParam
          .split(',')
          .map((n) => n.trim())
          .filter(Boolean)
          .slice(0, 4)
      : []
    const logoTiles = (
      await Promise.all(
        tileNames.map((name) =>
          renderIconByName(name, brand.id, LOGO_TILE_ICON_SIZE_1X * s, ICON_STROKE * s, color('illustration.stroke', brand))
        )
      )
    ).filter((el): el is NonNullable<typeof el> => el !== null)

    // Announcement: single icon/logo pre-sized to 50% of the template's
    // Thumb box (e.g. 375×200 → 187.5×100), for the OG's bottom-anchored logo.
    const halfThumbLogoEl =
      template.thumbBox && iconObj
        ? (() => {
            const boxW = (template.thumbBox!.width / 2) * s
            const boxH = (template.thumbBox!.height / 2) * s
            return iconObj.kind === 'logo' && iconObj.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img {...fitRect(iconObj.width ?? 1, iconObj.height ?? 1, boxW, boxH)} src={iconObj.url} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                width={Math.min(boxW, boxH)}
                height={Math.min(boxW, boxH)}
                src={iconDataUri(iconObj, {
                  sizePx: Math.min(boxW, boxH),
                  strokePx: ICON_STROKE * s,
                  color: color('illustration.stroke', brand),
                })}
              />
            )
          })()
        : null

    const root = template.build({
      W,
      H,
      padX,
      padY,
      bg,
      scaleFactor: s,
      textBlock,
      logoEl,
      logoHeight,
      logoTiles,
      arrangement,
      halfThumbLogoEl,
      iconEl,
      hasIcon,
    })

    return new ImageResponse(root, {
      width: W,
      height: H,
      fonts,
      headers: {
        ...CORS_AND_CACHE,
        'x-og-font-size': String(fit.fontSize),
        'x-og-line-count': String(fit.lineCount),
        'x-og-fits': String(fit.fits),
        'x-og-overflow': String(fit.overflow),
        'x-og-mode': fit.mode,
        'x-og-widest-line-px': String(fit.widestLinePx),
        'x-og-template': template.id,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(`OG render failed: ${message}`, {
      status: 500,
      headers: { 'content-type': 'text/plain' },
    })
  }
}
