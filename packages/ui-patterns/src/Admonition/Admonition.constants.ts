import type { AdmonitionLayout, AdmonitionType } from './Admonition.types'

export const TYPE_TO_VARIANT: Record<AdmonitionType, 'default' | 'warning' | 'destructive'> = {
  note: 'default',
  tip: 'default',
  caution: 'warning',
  danger: 'destructive',
  deprecation: 'warning',
  default: 'default',
  warning: 'warning',
  destructive: 'destructive',
  success: 'default',
}

export const TYPE_LABEL: Record<AdmonitionType, string> = {
  note: 'Note',
  tip: 'Tip',
  caution: 'Caution',
  danger: 'Danger',
  deprecation: 'Deprecated',
  default: 'Note',
  warning: 'Warning',
  destructive: 'Danger',
  success: 'Success',
}

export const LAYOUT_CLASS: Record<AdmonitionLayout, string> = {
  vertical: 'flex flex-col',
  horizontal: 'flex flex-row items-center justify-between gap-x-6 lg:gap-x-8',
  responsive:
    'flex flex-col @md:flex-row @md:items-center @md:justify-between @md:gap-x-6 @lg:gap-x-8',
}

export const CONTENT_CLASS =
  'text-sm text-foreground-light [&_p]:!mt-0 [&_p]:!mb-1.5 [&_p:last-child]:!mb-0 [&_p:only-child]:!mb-0 [&_ul]:!my-1.5 [&_ol]:!my-1.5 [&_li]:!my-0.5'

export const INLINE_FIRST_P = '[&>p:first-of-type]:inline'

export const TITLE_CLASS = 'mb-0.5 text-sm font-medium text-foreground'

const SUCCESS_SURFACE = 'bg-brand-400/15 dark:bg-brand/10 border-brand-400 dark:border-brand-500'

export function getSurfaceClass(type: AdmonitionType) {
  return type === 'success' ? SUCCESS_SURFACE : ''
}
