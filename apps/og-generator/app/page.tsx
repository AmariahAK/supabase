'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { ICON_LIBRARY } from '@/lib/assets/icon-library'
import { type SeedIcon } from '@/lib/assets/seed-icons'
import { BRAND_OPTIONS, DEFAULT_BRAND_ID, type BrandId } from '@/lib/design/brands'
import { DEFAULT_FORMAT_ID, FORMAT_OPTIONS, getFormat, type FormatId } from '@/lib/design/formats'
import {
  DEFAULT_NEWSLETTER_TEMPLATE_ID,
  DEFAULT_SOCIAL_TEMPLATE_ID,
  DEFAULT_TEMPLATE_ID,
  NEWSLETTER_TEMPLATES,
  SOCIAL_TEMPLATES,
  TEMPLATE_MAP,
  TEMPLATES,
} from '@/lib/design/templates'
import { IN_CONTEXT_OPTS, InContextPreview, type InContextMode } from './InContextPreview'

/**
 * Editor. State maps 1:1 to /api/og query params (the stateless recipe, §6.9).
 * "Both" renders the OG and Thumb together from two independent renders.
 */

const SOFT_LIMIT = 40
const HARD_LIMIT = 50
const EYEBROW_LIMIT = 20

/** Truncate to a max grapheme count — matches the `[...s].length` counters below. */
function clampChars(value: string, limit: number) {
  const chars = [...value]
  return chars.length > limit ? chars.slice(0, limit).join('') : value
}

/** Picks a random icon/logo name for a freshly-added logo-grid tile, so the
 * render updates immediately instead of sitting on an empty "Pick" slot. */
function randomIconName(icons: SeedIcon[]): string | null {
  if (!icons.length) return null
  return icons[Math.floor(Math.random() * icons.length)].name
}

/** Matches a search query against an icon's name, label, and tags. */
function matchesIconQuery(ic: SeedIcon, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    ic.name.toLowerCase().includes(q) ||
    ic.label.toLowerCase().includes(q) ||
    ic.tags.some((t) => t.toLowerCase().includes(q))
  )
}

type View = 'og' | 'thumb' | 'both'

interface FitInfo {
  fontSize: number
  lineCount: number
  fits: boolean
  overflow: boolean
  mode: string
  widest: number
}

function Hint({ text }: { text: string }) {
  // Custom hover tooltip instead of the native `title` attribute — browser
  // tooltips have an inconsistent show delay (and don't reliably appear at
  // all in some setups), so this guarantees the hint is actually visible.
  return (
    <span className="group relative ml-1 inline-flex align-middle">
      <span className="flex h-3.5 w-3.5 cursor-help items-center justify-center rounded-full border border-default text-[9px] leading-none text-foreground-lighter">
        ?
      </span>
      <span className="pointer-events-none absolute bottom-full left-0 z-30 mb-1.5 w-max max-w-[200px] rounded-md border border-default bg-background px-2 py-1.5 text-[11px] font-normal normal-case leading-snug text-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        {text}
      </span>
    </span>
  )
}

// Section header — uppercase with a divider for structure, but intentionally
// faint (not aiming for AA contrast) so it recedes behind the option labels
// within each section rather than competing with them.
function Group({
  title,
  children,
  noDivider,
}: {
  title: string
  children: React.ReactNode
  noDivider?: boolean
}) {
  return (
    <section
      className={`flex flex-col gap-3 pt-5 first:pt-0 ${
        noDivider ? '' : 'border-t border-default first:border-t-0'
      }`}
    >
      <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground-lighter">{title}</h2>
      {children}
    </section>
  )
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="inline-flex rounded-md border border-default bg-surface-100 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded px-2.5 py-1 text-xs ${
            value === o.value
              ? 'bg-surface-300 text-foreground'
              : 'text-foreground-light hover:text-foreground'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Small illustrative diagram of where the headline/icon sit for a template. */
function LayoutThumb({ id }: { id: string }) {
  const iconBox = <div className="absolute h-3 w-3 rounded-sm bg-surface-300" />
  // Not `absolute` — it's always nested inside an already-positioned wrapper,
  // and stacking two position:absolute boxes with no offsets on this one left
  // its width ambiguous, overflowing the card for the items-end case.
  const bars = (align: 'items-start' | 'items-center' | 'items-end') => (
    <div className={`flex flex-col gap-0.5 ${align}`}>
      <div className="h-1 w-6 rounded-full bg-foreground-lighter" />
      <div className="h-1 w-4 rounded-full bg-foreground-lighter" />
    </div>
  )
  switch (id) {
    case 'social-instagram':
      return (
        <div className="relative h-full w-full">
          <div className="absolute left-1/2 top-1.5 -translate-x-1/2">{iconBox}</div>
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2">{bars('items-center')}</div>
        </div>
      )
    case 'newsletter-section':
      return (
        <div className="relative h-full w-full">
          <div className="absolute left-1.5 top-1/2 -translate-y-1/2">{iconBox}</div>
          <div className="absolute left-6 top-1/2 h-1 w-6 -translate-y-1/2 rounded-full bg-foreground-lighter" />
        </div>
      )
    case 'logo-layout':
      return (
        <div className="relative h-full w-full">
          <div className="absolute left-1.5 top-1.5 h-1.5 w-4 rounded-sm bg-surface-300" />
          <div className="absolute bottom-1.5 left-1.5">{bars('items-start')}</div>
        </div>
      )
    case 'logo-grid':
      return (
        <div className="relative h-full w-full">
          <div className="absolute left-1.5 top-1.5 flex gap-0.5">
            <div className="h-2 w-2 rounded-[2px] bg-surface-300" />
            <div className="h-2 w-2 rounded-[2px] bg-surface-300" />
          </div>
          <div className="absolute bottom-1.5 left-1.5">{bars('items-start')}</div>
        </div>
      )
    case 'announcement':
      return (
        <div className="relative h-full w-full">
          <div className="absolute left-1.5 top-1.5">{bars('items-start')}</div>
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2">{iconBox}</div>
        </div>
      )
    case 'newsletter-cover':
    case 'social-twitter':
    case 'icon-layout':
    default:
      return (
        <div className="relative h-full w-full">
          <div className="absolute right-1.5 top-1.5">{iconBox}</div>
          <div className="absolute bottom-1.5 left-1.5">{bars('items-start')}</div>
        </div>
      )
  }
}

// Demo params for carousel tiles that get a REAL rendered preview instead of
// the abstract LayoutThumb diagram — grouped templates especially benefit
// since one carousel entry now stands in for several merged sub-layouts.
const CAROUSEL_DEMO_PARAMS: Record<string, Record<string, string>> = {
  'icon-layout': { headline: 'Now an official "partner"', icon: 'database' },
  'logo-layout': { headline: 'Acme joins Supabase' },
  'logo-grid': { headline: 'Now an official "partner"', icons: 'database' },
  announcement: { headline: 'Acme joins Supabase', icon: 'database' },
}

/** Real rendered preview for carousel tiles listed in `CAROUSEL_DEMO_PARAMS`, instead of an abstract diagram. */
function TemplateCarouselThumb({ id, formatId }: { id: string; formatId: FormatId }) {
  const demo = CAROUSEL_DEMO_PARAMS[id]
  const endpoint = useMemo(() => {
    const p = new URLSearchParams()
    if (formatId !== DEFAULT_FORMAT_ID) p.set('format', formatId)
    p.set('template', id)
    Object.entries(demo ?? {}).forEach(([k, v]) => p.set(k, v))
    return `/api/og?${p.toString()}`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, formatId])
  const { url } = useRenderedImage(endpoint, !!demo)
  if (!demo || !url) return <LayoutThumb id={id} />
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" />
}

/** Debounced fetch of a render endpoint → object URL + fit metadata from headers. */
function useRenderedImage(endpoint: string, enabled: boolean) {
  const [url, setUrl] = useState<string | null>(null)
  const [fit, setFit] = useState<FitInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const prevUrl = useRef<string | null>(null)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    const id = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(endpoint, { cache: 'no-store' })
        if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`)
        const blob = await res.blob()
        if (cancelled) return
        const u = URL.createObjectURL(blob)
        if (prevUrl.current) URL.revokeObjectURL(prevUrl.current)
        prevUrl.current = u
        setUrl(u)
        setFit({
          fontSize: Number(res.headers.get('x-og-font-size')),
          lineCount: Number(res.headers.get('x-og-line-count')),
          fits: res.headers.get('x-og-fits') === 'true',
          overflow: res.headers.get('x-og-overflow') === 'true',
          mode: res.headers.get('x-og-mode') ?? 'auto',
          widest: Number(res.headers.get('x-og-widest-line-px')),
        })
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to render')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(id)
    }
  }, [endpoint, enabled])

  useEffect(() => () => { if (prevUrl.current) URL.revokeObjectURL(prevUrl.current) }, [])

  return { url, fit, loading, error }
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="9" y="9" width="12" height="12" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 3v12m0 0l-4-4m4 4l4-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 17v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ExportRow({
  label,
  endpoint,
  imgUrl,
  downloadName,
  copied,
  onCopy,
  onDownload,
}: {
  label: string
  endpoint: string
  imgUrl: string | null
  downloadName: string
  copied: boolean
  onCopy: () => void
  onDownload: () => void
}) {
  const abs = typeof window !== 'undefined' ? window.location.origin + endpoint : endpoint
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-foreground-light">{label}</span>
      <div className="flex gap-2">
        <input
          readOnly
          value={abs}
          onFocus={(e) => e.target.select()}
          className="min-w-0 flex-1 truncate rounded-md border border-default bg-surface-100 px-3 py-2 text-xs text-foreground-light outline-none focus:border-strong"
        />
        <button
          onClick={onCopy}
          title="Copy URL"
          className="flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-default bg-surface-100 px-2.5 py-1 text-xs text-foreground hover:border-strong"
        >
          <CopyIcon />
          {copied ? 'Copied!' : ''}
        </button>
        <button
          onClick={onDownload}
          disabled={!imgUrl}
          title="Download"
          className="flex shrink-0 items-center justify-center rounded-md bg-brand px-2.5 py-1 text-xs font-medium text-background hover:bg-brand/90 disabled:opacity-50"
        >
          <DownloadIcon />
        </button>
      </div>
    </div>
  )
}

function ExportModal({
  onClose,
  scale,
  setScale,
  rows,
}: {
  onClose: () => void
  scale: 1 | 2
  setScale: (s: 1 | 2) => void
  rows: {
    label: string
    endpoint: string
    imgUrl: string | null
    downloadName: string
    copied: boolean
    onCopy: () => void
    onDownload: () => void
  }[]
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="flex w-[440px] flex-col gap-4 rounded-xl border border-default bg-background p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Export images</span>
          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded text-foreground-light hover:text-foreground"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <label className="flex items-center gap-2 text-sm text-foreground-light">
          <input
            type="checkbox"
            checked={scale === 2}
            onChange={(e) => setScale(e.target.checked ? 2 : 1)}
          />
          Export @2x
        </label>

        <div className="flex flex-col gap-4 border-t border-default pt-4">
          {rows.map((r) => (
            <ExportRow key={r.label} {...r} />
          ))}
        </div>
      </div>
    </div>
  )
}

function PreviewCard({
  label,
  width,
  height,
  imgUrl,
  loading,
  error,
  alt,
  children,
}: {
  label: string
  width: number
  height: number
  imgUrl: string | null
  loading: boolean
  error: string | null
  alt: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <span className="text-xs font-medium text-foreground-light">
        {label}
        <span className="ml-2 font-normal text-foreground-lighter">
          {width} × {height}
          {loading ? ' · rendering…' : ''}
        </span>
      </span>

      <div
        className="relative w-full overflow-hidden rounded-lg border border-default bg-surface-100"
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        {imgUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imgUrl} alt={alt} className="h-full w-full" />
        )}
      </div>

      {children}

      {error && (
        <pre className="overflow-x-auto rounded-md border border-destructive-400 bg-destructive-200 p-3 text-xs text-destructive-600">
          {error}
        </pre>
      )}
    </div>
  )
}

export default function Page() {
  const [brandId, setBrandId] = useState<BrandId>(DEFAULT_BRAND_ID)
  const [formatId, setFormatId] = useState<FormatId>(DEFAULT_FORMAT_ID)
  const format = useMemo(() => getFormat(formatId), [formatId])
  const hasThumb = !!format.thumb
  const hasSecondary = !!format.secondary
  // Second preview slot exists either as a classic icon-only Thumb, or as a
  // format's second full composition (e.g. Social's Instagram variant).
  const hasSecondSlot = hasThumb || hasSecondary
  const primarySlotLabel = format.primaryLabel ?? format.label
  const secondSlotLabel = format.secondary?.label ?? 'Thumb'
  const secondSlotWidth = format.secondary?.width ?? format.width
  const secondSlotHeight = format.secondary?.height ?? format.height
  const viewOptions = useMemo(
    () => [
      { value: 'og' as const, label: primarySlotLabel },
      ...(hasSecondSlot
        ? [
            { value: 'thumb' as const, label: secondSlotLabel },
            { value: 'both' as const, label: 'Both' },
          ]
        : []),
    ],
    [primarySlotLabel, secondSlotLabel, hasSecondSlot]
  )
  // Newsletter and Social each have their own two-tile layout set instead
  // of the standard 4 templates.
  const activeTemplates =
    formatId === 'newsletter' ? NEWSLETTER_TEMPLATES : formatId === 'twitter' ? SOCIAL_TEMPLATES : TEMPLATES

  const [view, setView] = useState<View>('og')
  const [headline, setHeadline] = useState('Postgres full text search just got faster')
  const [eyebrow, setEyebrow] = useState('Engineering')
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE_ID)
  const [icon, setIcon] = useState<string | null>(null)
  const [iconPickerOpen, setIconPickerOpen] = useState(false)
  // Separates the picker grid (and its upload button) into line-art icons
  // vs. full-color logos — the two are rendered completely differently
  // (stroke-only vs. as-is) so browsing them mixed together was noisy.
  const [iconPickerTab, setIconPickerTab] = useState<'icon' | 'logo'>('icon')
  // Matches against name/label/tags — tags are the closest thing to a
  // "description" seed/Lucide icons carry today, so this is effectively a
  // light contextual search already, not just an exact-name lookup.
  const [iconPickerQuery, setIconPickerQuery] = useState('')
  const iconPickerRef = useRef<HTMLDivElement>(null)
  // logo-grid: 1-4 partner logo tiles, adjusted via a count stepper — each
  // slot holds its own icon/logo name (or null while unpicked).
  const [logoTileIcons, setLogoTileIcons] = useState<(string | null)[]>(['database'])
  const [logoTilePickerOpen, setLogoTilePickerOpen] = useState<number | null>(null)
  const logoTilePickerRef = useRef<HTMLDivElement>(null)
  // Which element-arrangement variant is active for the current template —
  // grouped templates (icon-layout, logo-layout, logo-grid) each merge
  // several sub-layouts behind one carousel entry; this cycles between them
  // via the "Alternate layouts" pager under the canvas. Reset to 0 whenever
  // the template changes so switching layouts doesn't carry over an
  // out-of-range arrangement index.
  const [arrangement, setArrangement] = useState(0)
  const arrangementCount = TEMPLATE_MAP[template]?.arrangementCount ?? 1
  useEffect(() => {
    setArrangement(0)
  }, [template])
  const [uploadedIcons, setUploadedIcons] = useState<SeedIcon[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const allIcons = useMemo(() => [...ICON_LIBRARY, ...uploadedIcons], [uploadedIcons])
  const selectedTemplateObj = useMemo(
    () => activeTemplates.find((t) => t.id === template) ?? activeTemplates[0],
    [activeTemplates, template]
  )
  // Fixed-logo templates render the Supabase wordmark directly — there's no
  // user-selectable icon for them to affect, so hide the control entirely.
  const showIconControl = !selectedTemplateObj?.noIcon
  const showEyebrowControl = !selectedTemplateObj?.noEyebrow
  const selectedIcon = useMemo(() => allIcons.find((i) => i.name === icon) ?? null, [allIcons, icon])

  // icon-layout defaults to showing an icon (rather than the usual "None")
  // since the layout is designed around one — auto-pick the first time the
  // user lands on it with nothing selected yet.
  useEffect(() => {
    if (template === 'icon-layout' && !icon) setIcon('database')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template])

  // Load the shared asset library (uploaded icons) for the active brand; empty
  // when Supabase is off.
  useEffect(() => {
    fetch(`/api/assets?brand=${brandId}`)
      .then((r) => r.json())
      .then((d) => setUploadedIcons(d.assets ?? []))
      .catch(() => {})
  }, [brandId])

  // Newsletter/Social swap in their own layout sets — reset to a valid
  // default when the active template isn't in the set the current format offers.
  useEffect(() => {
    if (!activeTemplates.some((t) => t.id === template)) {
      setTemplate(
        formatId === 'newsletter'
          ? DEFAULT_NEWSLETTER_TEMPLATE_ID
          : formatId === 'twitter'
            ? DEFAULT_SOCIAL_TEMPLATE_ID
            : DEFAULT_TEMPLATE_ID
      )
    }
  }, [formatId, activeTemplates, template])

  // Format may drop the second preview slot (e.g. Newsletter/Luma have
  // neither a Thumb nor a secondary composition) — fall back to OG.
  useEffect(() => {
    if (!hasSecondSlot && view !== 'og') setView('og')
  }, [hasSecondSlot, view])

  // Close the icon dropdown on an outside click, like a real dropdown.
  useEffect(() => {
    if (!iconPickerOpen) return
    const onPointerDown = (e: PointerEvent) => {
      if (iconPickerRef.current && !iconPickerRef.current.contains(e.target as Node)) {
        setIconPickerOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [iconPickerOpen])

  // Same for the logo-grid per-tile pickers — one shared ref covers the
  // whole tile grid since only one tile's popover is open at a time.
  useEffect(() => {
    if (logoTilePickerOpen === null) return
    const onPointerDown = (e: PointerEvent) => {
      if (logoTilePickerRef.current && !logoTilePickerRef.current.contains(e.target as Node)) {
        setLogoTilePickerOpen(null)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [logoTilePickerOpen])

  // "Z" toggles the zoom tool; Escape cancels it; Alt (while active) flips
  // the cursor/click direction from zoom-in to zoom-out, matching
  // Illustrator/Photoshop. Ignored while typing in a text field.
  useEffect(() => {
    const isTyping = (target: EventTarget | null) => {
      const el = target as HTMLElement | null
      return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        setAltHeld(true)
        return
      }
      if (isTyping(e.target)) return
      if (e.key === 'Escape') {
        setZoomToolActive(false)
      } else if ((e.key === 'z' || e.key === 'Z') && !e.metaKey && !e.ctrlKey) {
        setZoomToolActive((v) => !v)
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') setAltHeld(false)
    }
    // Alt can be released outside the window (e.g. after alt-tabbing) —
    // clear the stuck state once focus returns.
    const onBlur = () => setAltHeld(false)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [])

  const handleCanvasZoomClick = (e: React.MouseEvent) => {
    if (!zoomToolActive) return
    if (e.altKey) {
      setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP))
    } else {
      setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP))
    }
  }

  const uploadSvg = async (file: File) => {
    setUploading(true)
    setUploadError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('brand', brandId)
      const res = await fetch('/api/assets', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setUploadError(data.error ?? 'Upload failed')
        return
      }
      setUploadedIcons((prev) => [data.asset as SeedIcon, ...prev])
      setIcon((data.asset as SeedIcon).name)
    } catch {
      setUploadError('Upload failed — please try again.')
    } finally {
      setUploading(false)
    }
  }

  // Custom color logos (partnerships, acquisitions, co-marketing) — rendered
  // full-color, no stroke normalization. The browser measures natural pixel
  // size before upload so /api/og can fit it without distortion.
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoError, setLogoError] = useState<string | null>(null)
  const uploadLogo = async (file: File) => {
    setUploadingLogo(true)
    setLogoError(null)
    try {
      const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        const url = URL.createObjectURL(file)
        const img = new Image()
        img.onload = () => {
          resolve({ width: img.naturalWidth, height: img.naturalHeight })
          URL.revokeObjectURL(url)
        }
        img.onerror = () => {
          URL.revokeObjectURL(url)
          reject(new Error('Could not read the image — is it a valid SVG/PNG/JPEG/WebP?'))
        }
        img.src = url
      })
      const fd = new FormData()
      fd.append('file', file)
      fd.append('kind', 'logo')
      fd.append('brand', brandId)
      fd.append('width', String(width))
      fd.append('height', String(height))
      const res = await fetch('/api/assets', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setLogoError(data.error ?? 'Upload failed')
        return
      }
      setUploadedIcons((prev) => [data.asset as SeedIcon, ...prev])
      setIcon((data.asset as SeedIcon).name)
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : 'Upload failed — please try again.')
    } finally {
      setUploadingLogo(false)
    }
  }
  const [scale, setScale] = useState<1 | 2>(1)
  const [inContext, setInContext] = useState<InContextMode>('none')
  const [exportOpen, setExportOpen] = useState(false)
  // Canvas zoom (brief follow-up) — scales the rendered image cards
  // themselves, not the surrounding UI/controls. 100% renders a card at its
  // actual pixel dimensions, which on a retina display is 2x the physical
  // pixels a normal screen shows — defaulting to 50% approximates native
  // resolution on typical (non-retina-aware-CSS) screens instead of a
  // 1200px-wide OG card dwarfing the canvas on load.
  const [zoom, setZoom] = useState(50)
  const ZOOM_MIN = 25
  const ZOOM_MAX = 200
  const ZOOM_STEP = 25
  // "Z" zoom tool (brief follow-up, Illustrator/Photoshop-style): toggles a
  // zoom cursor over the canvas; click to zoom in, Alt+click to zoom out.
  const [zoomToolActive, setZoomToolActive] = useState(false)
  const [altHeld, setAltHeld] = useState(false)

  const [copied, setCopied] = useState<View | null>(null)

  const showOg = view !== 'thumb'
  const showThumb = view !== 'og' && hasSecondSlot
  // The Blog-post in-context mockup mirrors the real page's hero, which
  // prefers the Thumb image — fetch it even if the OG/Thumb toggle itself
  // isn't showing Thumb right now.
  const wantsThumbForBlogPost = inContext === 'blog-post' && hasSecondSlot
  // Content controls (Layout/Eyebrow/Headline) stay visible whenever a full
  // composition is on screen — that includes viewing just the second slot
  // when it's a full composition too (e.g. Social's Instagram), unlike the
  // classic icon-only Thumb which has no headline to edit.
  const showContentControls = showOg || (view === 'thumb' && hasSecondary)

  const ogEndpoint = useMemo(() => {
    const p = new URLSearchParams()
    if (brandId !== DEFAULT_BRAND_ID) p.set('brand', brandId)
    if (formatId !== DEFAULT_FORMAT_ID) p.set('format', formatId)
    p.set('headline', headline)
    if (eyebrow.trim()) {
      p.set('eyebrow', eyebrow.trim())
      p.set('eyebrowStyle', 'pill')
    }
    p.set('template', template)
    if (template === 'logo-grid') {
      const names = logoTileIcons.filter((n): n is string => !!n)
      if (names.length) p.set('icons', names.join(','))
    } else if (icon) {
      p.set('icon', icon)
    }
    if (arrangement) p.set('arrangement', String(arrangement))
    if (scale === 2) p.set('scale', '2')
    return `/api/og?${p.toString()}`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId, formatId, headline, eyebrow, template, icon, logoTileIcons, arrangement, scale])

  const thumbEndpoint = useMemo(() => {
    const p = new URLSearchParams()
    if (brandId !== DEFAULT_BRAND_ID) p.set('brand', brandId)
    if (formatId !== DEFAULT_FORMAT_ID) p.set('format', formatId)
    if (hasSecondary) {
      // Full second composition (e.g. Instagram) — same recipe as the
      // primary render, just a different canvas via `variant`.
      p.set('headline', headline)
      if (eyebrow.trim()) {
        p.set('eyebrow', eyebrow.trim())
        p.set('eyebrowStyle', 'pill')
      }
      p.set('template', template)
      if (template === 'logo-grid') {
        const names = logoTileIcons.filter((n): n is string => !!n)
        if (names.length) p.set('icons', names.join(','))
      } else if (icon) {
        p.set('icon', icon)
      }
      if (arrangement) p.set('arrangement', String(arrangement))
      p.set('variant', 'secondary')
    } else {
      // The classic icon-only Thumb still needs `template` — some templates
      // (e.g. Announcement) override the default square icon crop via
      // `thumbBox`, which the render route looks up by template id.
      p.set('type', 'thumb')
      p.set('template', template)
      if (icon) p.set('icon', icon)
    }
    if (scale === 2) p.set('scale', '2')
    return `/api/og?${p.toString()}`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId, formatId, hasSecondary, headline, eyebrow, template, icon, logoTileIcons, arrangement, scale])

  const og = useRenderedImage(ogEndpoint, showOg)
  const thumb = useRenderedImage(thumbEndpoint, showThumb || wantsThumbForBlogPost)

  const count = [...headline].length
  const counterColor =
    count > HARD_LIMIT
      ? 'text-destructive-600'
      : count >= SOFT_LIMIT
        ? 'text-warning-600'
        : 'text-foreground-lighter'

  const copyUrl = async (endpoint: string, key: View) => {
    const abs = typeof window !== 'undefined' ? window.location.origin + endpoint : endpoint
    await navigator.clipboard.writeText(abs)
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  const download = (url: string | null, name: string) => {
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
  }

  const suffix = scale === 2 ? '@2x' : ''

  return (
    <div className="relative h-full overflow-hidden bg-background text-foreground">
      {/* Canvas — one continuous full-bleed dot-grid surface; the tool panel
          floats on top of it (absolutely positioned), not beside it. Scrolls
          independently of the two floating toolbars below, which are their
          own siblings so they stay anchored regardless of scroll position. */}
      <main
        className="@container absolute inset-0 flex flex-col items-center overflow-auto p-8 pt-24 pb-24 pr-[380px]"
        onClick={handleCanvasZoomClick}
        style={{
          backgroundColor: '#f4f4f5',
          backgroundImage: 'radial-gradient(rgba(0,0,0,0.06) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
          cursor: zoomToolActive ? (altHeld ? 'zoom-out' : 'zoom-in') : undefined,
        }}
      >
        {inContext === 'none' ? (
          /* Fills the remaining canvas height; on wide/side-by-side screens
              the row centers within it. (flex-1 items don't shrink below
              their content, so this can't clip an overflowing row — it just
              grows.) */
          <div className="flex w-full flex-1 flex-col">
            {/* `mx-auto` centers the row horizontally while it fits, and
                automatically collapses to 0 (i.e. start-aligned) once it
                overflows — so zooming in never clips the leading edge.
                Top-aligned (not vertically centered) so the Alternate
                layouts pagination below always sits directly under the
                card instead of floating mid-canvas. Each card gets an
                explicit px width (format px × zoom) instead of stretching
                to fill — so 100% zoom renders the image at its actual
                pixel dimensions, not an arbitrary fraction of the canvas. */}
            <div className="mx-auto flex flex-col gap-6 @4xl:flex-row @4xl:items-start">
              {showOg && (
                <div className="min-w-0" style={{ width: `${Math.round(format.width * (zoom / 100))}px` }}>
                  <PreviewCard
                    label={primarySlotLabel}
                    width={format.width}
                    height={format.height}
                    imgUrl={og.url}
                    loading={og.loading}
                    error={og.error}
                    alt={headline}
                  />
                </div>
              )}

              {showThumb && (
                <div
                  className="min-w-0"
                  style={{ width: `${Math.round(secondSlotWidth * (zoom / 100))}px` }}
                >
                  <PreviewCard
                    label={secondSlotLabel}
                    width={secondSlotWidth}
                    height={secondSlotHeight}
                    imgUrl={thumb.url}
                    loading={thumb.loading}
                    error={thumb.error}
                    alt="Thumbnail preview"
                  />
                </div>
              )}
            </div>

            {/* Alternate layouts — cycles how a grouped template arranges
                its elements (icon-layout, logo-layout, logo-grid each merge
                several sub-layouts behind one carousel entry). Never
                changes content itself (e.g. logo-grid's tile count is the
                sidebar's "Logo tiles" stepper's job, not this pager's). */}
            {arrangementCount > 1 && showOg && (
              <div className="mx-auto mt-4 flex items-center gap-3 rounded-md border border-default bg-background px-4 py-2.5 shadow-lg">
                <span className="text-xs font-medium text-foreground-light">Alternate layouts</span>
                <button
                  type="button"
                  onClick={() => setArrangement((a) => (a - 1 + arrangementCount) % arrangementCount)}
                  title="Previous layout"
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-default bg-surface-100 text-foreground-light hover:border-strong"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <span className="w-10 text-center text-xs text-foreground-lighter">
                  {arrangement + 1} / {arrangementCount}
                </span>
                <button
                  type="button"
                  onClick={() => setArrangement((a) => (a + 1) % arrangementCount)}
                  title="Next layout"
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-default bg-surface-100 text-foreground-light hover:border-strong"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* In-context preview takes over the full canvas — the OG/Thumb
              rectangles aren't the point here, seeing it "in the wild" is. */
          <div className="flex w-full flex-1 flex-col items-center justify-center">
            <div
              className={`flex w-full flex-col gap-2 ${
                inContext === 'blog-post' || inContext === 'blog' ? 'max-w-5xl' : 'max-w-2xl'
              }`}
            >
              <span className="text-xs font-medium text-foreground-light">
                {IN_CONTEXT_OPTS.find((o) => o.value === inContext)?.label}
              </span>
              <InContextPreview
                mode={inContext}
                imgUrl={og.url}
                thumbImgUrl={thumb.url}
                headline={headline}
                eyebrow={eyebrow.trim() || null}
                aspect={`${format.width} / ${format.height}`}
              />
            </div>
          </div>
        )}
      </main>

      {/* View toggle — anchored to the top of the canvas, independent of
          main's scroll (a sibling, not a child of the scroll container).
          Hidden entirely when a format only has one view (e.g. Newsletter,
          Luma) — nothing to toggle between. */}
      {viewOptions.length > 1 && (
        <div className="pointer-events-none absolute left-8 right-[380px] top-6 z-10 flex justify-center">
          <div className="pointer-events-auto flex items-center gap-3 rounded-md border border-default bg-background px-3 py-2 shadow-lg">
            <Segmented value={view} onChange={setView} options={viewOptions} />
          </div>
        </div>
      )}

      {/* Floating guides / view-in-context / zoom toolbar — bottom-aligned,
          centered on the same content box as the View toggle above, and
          likewise anchored outside main's scroll container. Stacked in a
          column with the Layout carousel (when applicable) so the canvas
          only ever has controls floating on the bottom edge, not scattered
          across corners. */}
      <div className="pointer-events-none absolute bottom-6 left-8 right-[380px] z-10 flex flex-col items-center gap-3">
        {showContentControls && inContext === 'none' && (
          <div className="pointer-events-auto flex max-w-full items-center gap-2 overflow-x-auto rounded-md border border-default bg-background p-2 shadow-lg">
            {activeTemplates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTemplate(t.id)}
                title={t.label}
                className="group flex w-28 shrink-0 flex-col gap-1"
              >
                <span
                  className={`truncate text-left text-[10px] ${
                    template === t.id ? 'text-brand' : 'text-foreground-lighter'
                  }`}
                >
                  {t.label}
                </span>
                <div
                  data-theme="dark"
                  className={`relative w-full overflow-hidden rounded-md border bg-background ${
                    template === t.id ? 'border-brand' : 'border-default hover:border-strong'
                  }`}
                  style={{ aspectRatio: `${format.width} / ${format.height}` }}
                >
                  {CAROUSEL_DEMO_PARAMS[t.id] ? (
                    <TemplateCarouselThumb id={t.id} formatId={formatId} />
                  ) : (
                    <LayoutThumb id={t.id} />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
        <div className="pointer-events-auto flex items-center gap-3 rounded-md border border-default bg-background px-3 py-2 shadow-lg">
          {showOg && (
            <>
              <span className="text-xs font-medium text-foreground-light">Preview</span>
              <Segmented value={inContext} onChange={setInContext} options={IN_CONTEXT_OPTS} />
            </>
          )}
          {inContext === 'none' && (
            <>
              <div className="h-5 border-l border-default" />
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => setZoomToolActive((v) => !v)}
                  title="Zoom tool (Z) — click to zoom in, Alt+click to zoom out"
                  className={`flex h-6 w-6 items-center justify-center rounded ${
                    zoomToolActive ? 'bg-brand/20 text-brand' : 'text-foreground-light hover:text-foreground'
                  }`}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="11" cy="11" r="7" />
                    <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                    <path d="M8 11h6" strokeLinecap="round" />
                    {!altHeld && <path d="M11 8v6" strokeLinecap="round" />}
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP))}
                  disabled={zoom <= ZOOM_MIN}
                  title="Zoom out"
                  className="flex h-6 w-6 items-center justify-center rounded text-foreground-light hover:text-foreground disabled:opacity-30"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M5 12h14" strokeLinecap="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(100)}
                  title="Reset zoom"
                  className="w-9 text-center text-xs tabular-nums text-foreground-light hover:text-foreground"
                >
                  {zoom}%
                </button>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP))}
                  disabled={zoom >= ZOOM_MAX}
                  title="Zoom in"
                  className="flex h-6 w-6 items-center justify-center rounded text-foreground-light hover:text-foreground disabled:opacity-30"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Floating tool panel — packaged top bar + all controls, docked right.
          Absolutely positioned (not a flex sibling) so the canvas behind it
          is one continuous surface, not two boxes split by a shared edge. */}
      <aside className="absolute right-4 top-4 bottom-4 z-10 flex w-[340px] flex-col overflow-hidden rounded-xl border border-default bg-background shadow-lg">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-default px-5">
          <span className="text-sm font-medium text-foreground">Supaimage</span>
          <button
            type="button"
            onClick={() => setExportOpen(true)}
            className="rounded-md bg-brand px-2.5 py-1 text-xs font-medium text-background hover:bg-brand/90"
          >
            Export
          </button>
        </div>
        <div className="flex flex-col overflow-y-auto overflow-x-hidden p-5">
          <Group title="Brand & format">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-foreground-light">Brand</span>
              <Segmented
                value={brandId}
                onChange={setBrandId}
                options={BRAND_OPTIONS.map((b) => ({ value: b.id, label: b.label }))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-foreground-light">Format</span>
              <div className="flex flex-col gap-1.5">
                {FORMAT_OPTIONS.map((f) => {
                  const fmt = getFormat(f.id)
                  const active = formatId === f.id
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFormatId(f.id)}
                      className={`flex w-full flex-col rounded-md border px-3 py-2.5 text-left transition ${
                        active ? 'border-brand bg-brand/10' : 'border-default bg-surface-100 hover:border-strong'
                      }`}
                    >
                      <span className={`text-sm font-medium ${active ? 'text-brand' : 'text-foreground'}`}>
                        {f.label}
                      </span>
                      <span className="text-xs text-foreground-lighter">{fmt.blurb}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </Group>

          <Group title="Content" noDivider>
            {showContentControls && showEyebrowControl && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="eyebrow" className="text-sm font-medium text-foreground-light">
                    Eyebrow <span className="text-foreground-lighter">(optional)</span>
                  </label>
                  <span className="text-xs tabular-nums text-foreground-lighter">
                    {[...eyebrow].length} / {EYEBROW_LIMIT}
                  </span>
                </div>
                <input
                  id="eyebrow"
                  value={eyebrow}
                  onChange={(e) => setEyebrow(clampChars(e.target.value, EYEBROW_LIMIT))}
                  maxLength={EYEBROW_LIMIT}
                  className="rounded-md border border-default bg-surface-100 px-3 py-2 text-sm text-foreground outline-none focus:border-strong"
                  placeholder="e.g. Launch Week, Engineering"
                />
              </div>
            )}

            {showContentControls && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="headline" className="text-sm font-medium text-foreground-light">
                    Headline
                    <Hint text="Sentence case is applied to headlines. See the instructions below for overrides." />
                  </label>
                  <span className={`text-xs tabular-nums ${counterColor}`}>
                    {count} / {HARD_LIMIT}
                  </span>
                </div>
                <textarea
                  id="headline"
                  value={headline}
                  onChange={(e) => setHeadline(clampChars(e.target.value, HARD_LIMIT))}
                  maxLength={HARD_LIMIT}
                  rows={3}
                  className="resize-none rounded-md border border-default bg-surface-100 px-3 py-2 text-sm text-foreground outline-none focus:border-strong"
                  placeholder="Type a blog headline…"
                />
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-medium text-foreground-lighter">Text overrides</span>
                  <p className="flex items-center justify-between gap-1.5 text-xs text-foreground-lighter">
                    <span>Manual line break</span>
                    <span className="flex shrink-0 items-center gap-1">
                      <kbd className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-default bg-surface-100 font-mono text-[10px] leading-none text-foreground-light">
                        ↵
                      </kbd>
                      ENTER
                    </span>
                  </p>
                  <p className="flex items-center justify-between gap-1.5 text-xs text-foreground-lighter">
                    <span>Capitalize letter e.g. [p]ostgre[sql] → PostgreSQL</span>
                    <span className="flex shrink-0 items-center gap-1">
                      <kbd className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-default bg-surface-100 font-mono text-[10px] leading-none text-foreground-light">
                        []
                      </kbd>
                      BRACKETS
                    </span>
                  </p>
                  <p className="flex items-center justify-between gap-1.5 text-xs text-foreground-lighter">
                    <span>Green highlight</span>
                    <span className="flex shrink-0 items-center gap-1">
                      <kbd className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-default bg-surface-100 font-mono text-[10px] leading-none text-foreground-light">
                        &quot;
                      </kbd>
                      QUOTATION
                    </span>
                  </p>
                </div>
              </div>
            )}

            {showIconControl && (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-foreground-light">
                Icon
                <Hint text="Line-art icons only, stroke locked to the illustration weight (§4). Logos (SVG, PNG, JPEG, WebP) keep their original colors, for partnerships/acquisitions. The icon is shared between the OG and Thumb. Both are stored in Supabase and need the secret key configured." />
              </span>
              <div className="relative" ref={iconPickerRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIconPickerOpen((o) => !o)
                    setIconPickerQuery('')
                  }}
                  className="flex w-full items-center gap-2 rounded-md border border-default bg-surface-100 px-3 py-2 text-sm text-foreground outline-none hover:border-strong focus:border-strong"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-default bg-background text-foreground-light">
                    {selectedIcon ? (
                      selectedIcon.kind === 'logo' && selectedIcon.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={selectedIcon.url}
                          alt=""
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <svg
                          width={14}
                          height={14}
                          viewBox={selectedIcon.viewBox}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          dangerouslySetInnerHTML={{ __html: selectedIcon.body }}
                        />
                      )
                    ) : (
                      <span className="text-[9px] text-foreground-lighter">—</span>
                    )}
                  </span>
                  <span className="flex-1 truncate text-left">
                    {selectedIcon ? selectedIcon.label : 'None'}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {iconPickerOpen && (
                  <div className="absolute bottom-full z-20 mb-1 w-full rounded-md border border-default bg-background p-2 shadow-lg">
                    <div className="mb-2 flex items-center gap-2">
                      <Segmented
                        value={iconPickerTab}
                        onChange={setIconPickerTab}
                        options={[
                          { value: 'icon', label: 'Icons' },
                          { value: 'logo', label: 'Logos' },
                        ]}
                      />
                      <input
                        type="text"
                        value={iconPickerQuery}
                        onChange={(e) => setIconPickerQuery(e.target.value)}
                        placeholder="Search…"
                        className="min-w-0 flex-1 rounded-md border border-default bg-surface-100 px-2 py-1 text-xs text-foreground outline-none focus:border-strong"
                      />
                    </div>
                    <div className="grid max-h-56 grid-cols-4 gap-2 overflow-y-auto">
                      {!iconPickerQuery.trim() && (
                        <button
                          type="button"
                          onClick={() => {
                            setIcon(null)
                            setIconPickerOpen(false)
                          }}
                          title="No icon"
                          className={`flex h-14 items-center justify-center rounded-md border text-xs ${
                            icon === null
                              ? 'border-brand bg-brand/10 text-brand'
                              : 'border-default bg-surface-100 text-foreground-lighter hover:border-strong'
                          }`}
                        >
                          None
                        </button>
                      )}
                      {allIcons
                        .filter((ic) => (iconPickerTab === 'logo' ? ic.kind === 'logo' : ic.kind !== 'logo'))
                        .filter((ic) => matchesIconQuery(ic, iconPickerQuery))
                        .map((ic) => (
                          <button
                            key={ic.name}
                            type="button"
                            onClick={() => {
                              setIcon(ic.name)
                              setIconPickerOpen(false)
                            }}
                            title={ic.kind === 'logo' ? `${ic.label} (color logo)` : ic.label}
                            className={`flex h-14 items-center justify-center rounded-md border p-1.5 ${
                              icon === ic.name
                                ? 'border-brand bg-brand/10 text-brand'
                                : 'border-default bg-surface-100 text-foreground-light hover:border-strong'
                            }`}
                          >
                            {ic.kind === 'logo' && ic.url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={ic.url} alt={ic.label} className="max-h-full max-w-full object-contain" />
                            ) : (
                              <svg
                                width={22}
                                height={22}
                                viewBox={ic.viewBox}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                dangerouslySetInnerHTML={{ __html: ic.body }}
                              />
                            )}
                          </button>
                        ))}
                    </div>
                    <div className="mt-2">
                      {iconPickerTab === 'icon' ? (
                        <label
                          className={`block rounded-md border border-dashed border-default px-3 py-2 text-center text-xs text-foreground-light hover:border-strong ${
                            uploading ? 'cursor-wait opacity-70' : 'cursor-pointer'
                          }`}
                        >
                          {uploading ? 'Uploading…' : '+ Upload SVG icon'}
                          <input
                            type="file"
                            accept=".svg,image/svg+xml"
                            className="hidden"
                            disabled={uploading}
                            onChange={(e) => {
                              const f = e.target.files?.[0]
                              if (f) uploadSvg(f)
                              e.target.value = ''
                            }}
                          />
                        </label>
                      ) : (
                        <label
                          className={`block rounded-md border border-dashed border-default px-3 py-2 text-center text-xs text-foreground-light hover:border-strong ${
                            uploadingLogo ? 'cursor-wait opacity-70' : 'cursor-pointer'
                          }`}
                        >
                          {uploadingLogo ? 'Uploading…' : '+ Upload logo (color)'}
                          <input
                            type="file"
                            accept=".svg,.png,.jpg,.jpeg,.webp,image/svg+xml,image/png,image/jpeg,image/webp"
                            className="hidden"
                            disabled={uploadingLogo}
                            onChange={(e) => {
                              const f = e.target.files?.[0]
                              if (f) uploadLogo(f)
                              e.target.value = ''
                            }}
                          />
                        </label>
                      )}
                    </div>
                    {uploadError && <p className="mt-2 text-xs text-warning-600">{uploadError}</p>}
                    {logoError && <p className="mt-2 text-xs text-warning-600">{logoError}</p>}
                  </div>
                )}
              </div>
            </div>
            )}

            {template === 'logo-grid' && (
              <div className="flex flex-col gap-2">
                <span className="flex items-center justify-between text-sm font-medium text-foreground-light">
                  <span>
                    Logo tiles
                    <Hint text="Cycle through 1-4 partner-logo tiles. Each tile picks from the same icon/logo library as the single-icon control." />
                  </span>
                  <span className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setLogoTileIcons((tiles) => (tiles.length > 1 ? tiles.slice(0, -1) : tiles))
                      }
                      disabled={logoTileIcons.length <= 1}
                      title="Fewer tiles"
                      className="flex h-6 w-6 items-center justify-center rounded border border-default bg-surface-100 text-foreground-light hover:border-strong disabled:opacity-40"
                    >
                      −
                    </button>
                    <span className="w-10 text-center text-xs text-foreground-lighter">
                      {logoTileIcons.length} / 4
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setLogoTileIcons((tiles) => (tiles.length < 4 ? [...tiles, randomIconName(allIcons)] : tiles))
                      }
                      disabled={logoTileIcons.length >= 4}
                      title="More tiles"
                      className="flex h-6 w-6 items-center justify-center rounded border border-default bg-surface-100 text-foreground-light hover:border-strong disabled:opacity-40"
                    >
                      +
                    </button>
                  </span>
                </span>
                <div className="grid grid-cols-4 gap-2" ref={logoTilePickerRef}>
                  {logoTileIcons.map((tileIcon, tileIdx) => {
                    const tileSelected = allIcons.find((i) => i.name === tileIcon) ?? null
                    return (
                      <div key={tileIdx} className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setLogoTilePickerOpen((open) => (open === tileIdx ? null : tileIdx))
                          }
                          title={tileSelected ? tileSelected.label : `Tile ${tileIdx + 1}`}
                          className="flex h-14 w-full items-center justify-center rounded-md border border-default bg-surface-100 p-1.5 text-foreground-light hover:border-strong"
                        >
                          {tileSelected ? (
                            tileSelected.kind === 'logo' && tileSelected.url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={tileSelected.url}
                                alt={tileSelected.label}
                                className="max-h-full max-w-full object-contain"
                              />
                            ) : (
                              <svg
                                width={22}
                                height={22}
                                viewBox={tileSelected.viewBox}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                dangerouslySetInnerHTML={{ __html: tileSelected.body }}
                              />
                            )
                          ) : (
                            <span className="text-[10px] text-foreground-lighter">Pick</span>
                          )}
                        </button>

                        {logoTilePickerOpen === tileIdx && (
                          <div className="absolute bottom-full z-20 mb-1 w-56 rounded-md border border-default bg-background p-2 shadow-lg">
                            <div className="grid max-h-56 grid-cols-4 gap-2 overflow-y-auto">
                              {allIcons.map((ic) => (
                                <button
                                  key={ic.name}
                                  type="button"
                                  onClick={() => {
                                    setLogoTileIcons((tiles) =>
                                      tiles.map((t, i) => (i === tileIdx ? ic.name : t))
                                    )
                                    setLogoTilePickerOpen(null)
                                  }}
                                  title={ic.kind === 'logo' ? `${ic.label} (color logo)` : ic.label}
                                  className={`flex h-12 items-center justify-center rounded-md border p-1 ${
                                    tileIcon === ic.name
                                      ? 'border-brand bg-brand/10 text-brand'
                                      : 'border-default bg-surface-100 text-foreground-light hover:border-strong'
                                  }`}
                                >
                                  {ic.kind === 'logo' && ic.url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={ic.url}
                                      alt={ic.label}
                                      className="max-h-full max-w-full object-contain"
                                    />
                                  ) : (
                                    <svg
                                      width={18}
                                      height={18}
                                      viewBox={ic.viewBox}
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth={2}
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      dangerouslySetInnerHTML={{ __html: ic.body }}
                                    />
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </Group>
        </div>
      </aside>

      {exportOpen && (
        <ExportModal
          onClose={() => setExportOpen(false)}
          scale={scale}
          setScale={setScale}
          rows={[
            {
              label: primarySlotLabel,
              endpoint: ogEndpoint,
              imgUrl: og.url,
              downloadName: `og${suffix}.png`,
              copied: copied === 'og',
              onCopy: () => copyUrl(ogEndpoint, 'og'),
              onDownload: () => download(og.url, `og${suffix}.png`),
            },
            ...(hasSecondSlot
              ? [
                  {
                    label: secondSlotLabel,
                    endpoint: thumbEndpoint,
                    imgUrl: thumb.url,
                    downloadName: `${secondSlotLabel.toLowerCase()}${suffix}.png`,
                    copied: copied === 'thumb',
                    onCopy: () => copyUrl(thumbEndpoint, 'thumb'),
                    onDownload: () => download(thumb.url, `${secondSlotLabel.toLowerCase()}${suffix}.png`),
                  },
                ]
              : []),
          ]}
        />
      )}
    </div>
  )
}
