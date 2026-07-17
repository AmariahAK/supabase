import { Archive, ArchiveRestore, ChevronLeft, X } from 'lucide-react'
import { Badge, cn } from 'ui'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

import type { AdvisorItem } from './AdvisorPanel.types'
import {
  formatItemDate,
  getAdvisorItemSecondaryText,
  getAdvisorPanelItemDisplayTitle,
  severityBadgeVariants,
  severityLabels,
} from './AdvisorPanel.utils'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import type { Notification } from '@/data/notifications/notifications-v2-query'

interface AdvisorPanelHeaderProps {
  selectedItem: AdvisorItem | undefined
  onBack: () => void
  onClose: () => void
  onArchive?: (item: AdvisorItem) => void
}

export const AdvisorPanelHeader = ({
  selectedItem,
  onBack,
  onClose,
  onArchive,
}: AdvisorPanelHeaderProps) => {
  const displayTitle = selectedItem ? getAdvisorPanelItemDisplayTitle(selectedItem) : undefined
  const secondaryText = selectedItem ? getAdvisorItemSecondaryText(selectedItem) : undefined
  const createdAt = selectedItem?.createdAt

  const notification =
    selectedItem?.source === 'notification' ? (selectedItem.original as Notification) : null
  const canArchive = notification !== null && onArchive !== undefined
  const isArchived = notification?.status === 'archived'
  const archiveLabel = !canArchive
    ? 'This issue cannot be archived and must be addressed'
    : isArchived
      ? 'Unarchive'
      : 'Archive'

  const metadataCapitalize = selectedItem !== undefined && secondaryText === undefined

  return (
    <div className="border-b px-4 py-3 flex items-center gap-3">
      <ButtonTooltip
        variant="text"
        className="w-7 h-7 p-0 flex justify-center items-center"
        icon={<ChevronLeft size={16} strokeWidth={1.5} aria-hidden={true} />}
        onClick={onBack}
        tooltip={{ content: { side: 'bottom', text: 'Back to list' } }}
      />
      <div className="flex items-center gap-2 overflow-hidden flex-1">
        <div className="flex-1 flex flex-col">
          <span className="heading-default">{displayTitle}</span>
          {selectedItem?.source !== 'notification' && secondaryText ? (
            <span
              className={`text-xs text-foreground-light${metadataCapitalize ? ' capitalize-sentence' : ''}`}
            >
              {secondaryText}
            </span>
          ) : createdAt ? (
            <TimestampInfo
              className="w-fit capitalize-sentence"
              utcTimestamp={createdAt}
              label={formatItemDate(createdAt)}
            />
          ) : null}
        </div>
        {selectedItem && (
          <Badge variant={severityBadgeVariants[selectedItem.severity]}>
            {severityLabels[selectedItem.severity]}
          </Badge>
        )}
      </div>
      {selectedItem && (
        <ButtonTooltip
          variant="text"
          disabled={!canArchive}
          aria-label={archiveLabel}
          className={cn('w-7 h-7 p-0', !canArchive && 'opacity-30')}
          icon={
            canArchive && isArchived ? (
              <ArchiveRestore size={16} strokeWidth={1.5} />
            ) : (
              <Archive size={16} strokeWidth={1.5} />
            )
          }
          onClick={canArchive ? () => onArchive?.(selectedItem) : undefined}
          tooltip={{
            content: {
              side: 'bottom',
              className: canArchive ? undefined : 'w-52 text-center',
              text: archiveLabel,
            },
          }}
        />
      )}
      <ButtonTooltip
        variant="text"
        className="w-7 h-7 p-0"
        icon={<X strokeWidth={1.5} />}
        onClick={onClose}
        tooltip={{ content: { side: 'bottom', text: 'Close Advisor Center' } }}
      />
    </div>
  )
}
