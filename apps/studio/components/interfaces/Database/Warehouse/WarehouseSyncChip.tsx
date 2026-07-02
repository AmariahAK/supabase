import { Check, Loader2, X } from 'lucide-react'
import type { ComponentType } from 'react'
import { Badge, cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import type { CopyStatus } from './warehouseDemoStore'
import { DotPing } from '@/components/ui/DotPing'

const COPY_STATUS_LABELS: Record<CopyStatus, string> = {
  backfilling: 'Backfilling',
  live: 'Live',
  error: 'Error',
}

const COPY_STATUS_TOOLTIPS: Record<CopyStatus, string> = {
  backfilling:
    'Initial Warehouse link in progress. Postgres remains the source of truth for writes.',
  live: 'Linked Warehouse table is caught up with the project replication stream.',
  error: 'Warehouse link failed to sync. Check replication logs for details.',
}

type CopyStatusBadgeVariant = 'success' | 'default' | 'destructive'

const COPY_STATUS_BADGE_VARIANT: Record<CopyStatus, CopyStatusBadgeVariant> = {
  backfilling: 'default',
  live: 'success',
  error: 'destructive',
}

const COPY_STATUS_ICONS: Record<
  Exclude<CopyStatus, 'backfilling'>,
  ComponentType<{ className?: string }>
> = {
  live: Check,
  error: X,
}

const badgeHoverClassNames: Record<CopyStatusBadgeVariant, string> = {
  success: 'hover:bg-brand/15',
  destructive: 'hover:bg-destructive/15',
  default: 'hover:bg-surface-100',
}

export function getCopyStatusTooltip(copyStatus: CopyStatus): string {
  return COPY_STATUS_TOOLTIPS[copyStatus]
}

export type WarehouseCopyStatusAppearance = 'badge' | 'inline'

interface WarehouseCopyStatusProps {
  copyStatus: CopyStatus
  appearance?: WarehouseCopyStatusAppearance
  className?: string
  dotSize?: 'default' | 'lg'
  tooltip?: string
}

function CopyStatusLeadingIndicator({
  copyStatus,
  mode,
  dotSize = 'default',
}: {
  copyStatus: CopyStatus
  mode: WarehouseCopyStatusAppearance
  dotSize?: 'default' | 'lg'
}) {
  if (copyStatus === 'backfilling') {
    return (
      <Loader2
        className={cn(
          'size-3 shrink-0 animate-spin',
          mode === 'inline' ? 'text-foreground-muted' : undefined
        )}
      />
    )
  }

  if (mode === 'inline') {
    if (copyStatus === 'live') {
      return <DotPing animate variant="primary" size={dotSize} />
    }

    return (
      <span
        aria-hidden="true"
        className={cn(
          'shrink-0 rounded-full bg-destructive',
          dotSize === 'lg' ? 'size-2.5' : 'size-1.5'
        )}
      />
    )
  }

  const Icon = COPY_STATUS_ICONS[copyStatus]
  return <Icon className="size-3 shrink-0" aria-hidden="true" />
}

export function WarehouseCopyStatus({
  copyStatus,
  appearance = 'badge',
  className,
  dotSize = 'default',
  tooltip,
}: WarehouseCopyStatusProps) {
  const label = COPY_STATUS_LABELS[copyStatus]
  const statusTooltip = tooltip ?? COPY_STATUS_TOOLTIPS[copyStatus]
  const badgeVariant = COPY_STATUS_BADGE_VARIANT[copyStatus]

  if (appearance === 'inline') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'group inline-flex cursor-default items-center gap-1 text-sm text-foreground-light transition-colors hover:text-foreground',
              className
            )}
            data-copy-status={copyStatus}
            aria-label={`Warehouse link sync status: ${label}`}
          >
            <CopyStatusLeadingIndicator copyStatus={copyStatus} mode="inline" dotSize={dotSize} />
            <span className="border-b border-dotted border-current/40 transition-colors group-hover:border-current/70">
              {label}
            </span>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-72">
          {statusTooltip}
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant={badgeVariant}
          className={cn(
            'cursor-default transition-colors',
            badgeHoverClassNames[badgeVariant],
            className
          )}
          data-copy-status={copyStatus}
          aria-label={`Warehouse link sync status: ${label}`}
        >
          <CopyStatusLeadingIndicator copyStatus={copyStatus} mode="badge" />
          {label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-72">
        {statusTooltip}
      </TooltipContent>
    </Tooltip>
  )
}

type WarehouseStatusTextTone = 'default' | 'warning' | 'destructive'

const statusTextToneClassNames: Record<WarehouseStatusTextTone, string> = {
  default: 'text-foreground-light hover:text-foreground',
  warning: 'text-warning hover:text-warning-600',
  destructive: 'text-destructive hover:text-destructive-600',
}

/** Dotted-underline status text for secondary Warehouse states (e.g. project replication lag). */
export function WarehouseStatusText({
  text,
  tooltip,
  tone = 'default',
  className,
}: {
  text: string
  tooltip: string
  tone?: WarehouseStatusTextTone
  className?: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'group inline-flex cursor-default text-sm transition-colors',
            statusTextToneClassNames[tone],
            className
          )}
        >
          <span className="border-b border-dotted border-current/40 transition-colors group-hover:border-current/70">
            {text}
          </span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-72">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  )
}

/** @deprecated Use WarehouseCopyStatus */
export const WarehouseSyncChip = WarehouseCopyStatus
