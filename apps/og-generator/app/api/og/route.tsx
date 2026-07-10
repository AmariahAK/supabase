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
import { fitHeadline } from '@/lib/text/fit-headline'
import { toSentenceCase } from '@/lib/text/sentence-case'

// Node runtime so we can read the self-hosted Manrope files from disk and parse
// them with fontkit for measurement (brief §2 — no Google Fonts at request time).
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DEFAULT_HEADLINE = 'Postgres full text search just got faster'

const HEADLINE = typography.roles.headline
const EYEBROW = typography.roles.eyebrow
// One step below EYEBROW's own weight — the pill reads better slightly lighter
// than the headline at this size.
const EYEBROW_PILL_WEIGHT = 400
// Wordmark display height (1x design px) for the fixed-logo templates.
const WORDMARK_HEIGHT_1X = 36

/** Scale (naturalW, naturalH) to fit within a boxSize square, preserving aspect ratio. */
function fitBox(naturalW: number, naturalH: number, boxSize: number): { width: number; height: number } {
  const ratio = naturalW / naturalH || 1
  return ratio >= 1 ? { width: boxSize, height: boxSize / ratio } : { width: boxSize * ratio, height: boxSize }
}

const CORS_AND_CACHE = {
  'access-control-allow-origin': '*',
  'cache-control': 'no-store, max-age=0',
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

    // ---- Thumb variant: same canvas + icon system, no text layer (brief §3) -
    if (type === 'thumb') {
      const thumb = format.thumb ?? { default: 380, min: 160, max: 480 }
      const thumbNum = Number(searchParams.get('thumbSize'))
      const thumbSize = Number.isFinite(thumbNum)
        ? Math.min(thumb.max, Math.max(thumb.min, Math.round(thumbNum)))
        : thumb.default
      const thumbBgImage = iconObj ? null : randomBackgroundDataUri()

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
            <img
              {...fitBox(iconObj.width ?? 1, iconObj.height ?? 1, thumbSize * s)}
              src={iconObj.url}
            />
          ) : iconObj ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              width={thumbSize * s}
              height={thumbSize * s}
              src={iconDataUri(iconObj, {
                sizePx: thumbSize * s,
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
    const template = TEMPLATE_MAP[searchParams.get('template') ?? ''] ?? TEMPLATE_MAP[DEFAULT_TEMPLATE_ID]

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

    const textCrossAlign =
      template.textAlign === 'center' ? 'center' : template.textAlign === 'right' ? 'flex-end' : 'flex-start'
    const headline = sentenceCase ? toSentenceCase(rawHeadline) : rawHeadline

    const headlineFont = await measurementFont(HEADLINE.weight)
    // Compact tier (40-56) whenever an icon is showing; default tier (48-64)
    // otherwise. Either way, a headline that still needs a 3rd line always
    // drops to the compact tier — checked after the first fit since line
    // count isn't known up front.
    const initialTier = hasIcon ? HEADLINE.sizeTiers.compact : HEADLINE.sizeTiers.default
    const fitAt = (tier: { minSize: number; maxSize: number }) =>
      fitHeadline(headline, headlineFont, {
        boxWidth: template.headlineBox(format),
        minSize: manualSize ?? tier.minSize,
        maxSize: manualSize ?? tier.maxSize,
        step: 2,
        maxLines: 3,
        letterSpacingEm: HEADLINE.letterSpacing,
        manualBreaks,
      })
    let fit = fitAt(initialTier)
    if (!manualSize && initialTier === HEADLINE.sizeTiers.default && fit.lineCount === 3) {
      fit = fitAt(HEADLINE.sizeTiers.compact)
    }

    const headlineSize = fit.fontSize * s
    const headlineLineHeight = Math.round(headlineSize * HEADLINE.lineHeight)
    const headlineLetterSpacing = HEADLINE.letterSpacing * headlineSize
    const eyebrowSize = EYEBROW.size * s
    const eyebrowLetterSpacing = EYEBROW.letterSpacing * eyebrowSize
    const eyebrowGap = 16 * s

    const fonts = await satoriFonts([...new Set([HEADLINE.weight])])

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
          {fit.lines.map((line, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                whiteSpace: 'nowrap', // render exactly the line we computed
                color: color('text.primary', brand),
                fontSize: headlineSize,
                fontWeight: HEADLINE.weight,
                lineHeight: `${headlineLineHeight}px`,
                letterSpacing: headlineLetterSpacing,
              }}
            >
              {line || ' '}
            </div>
          ))}
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
