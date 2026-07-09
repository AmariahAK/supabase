import { Hotkey } from '@tanstack/react-hotkeys'
import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { AlignLeft, ChevronDown, MoreVertical } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  KeyboardShortcut,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'ui'
import { useSnapshot } from 'valtio'

import {
  getSqlEditorSourceSummary,
  SqlEditorSourceSelector,
  useSqlEditorSource,
} from './SqlEditorSourceSelector'
import { sqlEditorWarehouseDemoStore } from './SqlEditorWarehouseDemo'
import { AutosaveStatus } from './UtilityPanel/AutosaveStatus'
import { SqlRunButton } from './UtilityPanel/RunButton'
import { SqlSaveButton } from './UtilityPanel/SaveButton'
import SavingIndicator from './UtilityPanel/SavingIndicator'
import { SqlEditorLimitSelector } from './UtilityPanel/SqlEditorLimitSelector'
import { useIsSqlEditorManualSaveEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { RoleImpersonationPopover } from '@/components/interfaces/RoleImpersonationSelector/RoleImpersonationPopover'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { IS_PLATFORM } from '@/lib/constants'
import { useRoleImpersonationStateSnapshot } from '@/state/role-impersonation-state'
import { hotkeyToKeys } from '@/state/shortcuts/formatShortcut'
import { SHORTCUT_DEFINITIONS, SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useSqlEditorSessionSnapshot } from '@/state/sql-editor/sql-editor-session-state'
import { useSqlEditorV2StateSnapshot } from '@/state/sql-editor/sql-editor-state'

export type SqlEditorQueryBarProps = {
  id: string
  isExecuting?: boolean
  isDisabled?: boolean
  hasSelection?: boolean
  prettifyQuery: () => void
  executeQuery: () => void
}

const SEPARATE_QUERY_CONTROLS_INLINE_MIN_WIDTH = 896

export function SqlEditorQueryBar({
  id,
  isExecuting = false,
  isDisabled = false,
  hasSelection = false,
  prettifyQuery,
  executeQuery,
}: SqlEditorQueryBarProps) {
  const { ref } = useParams()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const sessionSnap = useSqlEditorSessionSnapshot()
  const isManualSaveEnabled = useIsSqlEditorManualSaveEnabled()
  const roleImpersonationState = useRoleImpersonationStateSnapshot()
  const warehouseDemoSnap = useSnapshot(sqlEditorWarehouseDemoStore)
  const { isWarehouse, sourceId } = useSqlEditorSource()
  const queryBarRef = useRef<HTMLDivElement>(null)
  const [areSeparateQueryControlsCollapsed, setAreSeparateQueryControlsCollapsed] = useState(false)

  const [intelliSenseEnabled, setIntellisenseEnabled] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.SQL_EDITOR_INTELLISENSE,
    true
  )
  const [lastSelectedSource, setLastSelectedSource] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.SQL_EDITOR_LAST_SELECTED_DB(ref as string),
    ''
  )

  const snippet = snapV2.snippets[id]
  const isFavorite = snippet !== undefined ? snippet.snippet.favorite : false
  const currentRole = roleImpersonationState.role?.role ?? 'postgres'

  const hotkeySequnece: Hotkey | undefined =
    SHORTCUT_DEFINITIONS[SHORTCUT_IDS.SQL_EDITOR_FORMAT].sequence[0]
  const formatKeys = hotkeySequnece ? hotkeyToKeys(hotkeySequnece) : undefined

  const handleIntelliSenseChange = (checked: boolean) => {
    setIntellisenseEnabled(checked)
    toast.success(
      `Successfully ${checked ? 'enabled' : 'disabled'} IntelliSense. ${checked ? '' : 'Please refresh your browser for changes to take place.'}`
    )
  }

  const toggleFavorite = () => {
    if (isFavorite) {
      snapV2.removeFavorite(id)
      toast.success('Removed from favourites')
    } else {
      snapV2.addFavorite(id)
      toast.success('Added to favourites')
    }
  }

  const onSelectSource = (sourceId: string) => {
    sessionSnap.resetResults(id)
    setLastSelectedSource(sourceId)
  }

  useEffect(() => {
    const queryBar = queryBarRef.current
    if (!queryBar) return

    const updateQueryControlsVisibility = (width: number) => {
      const shouldCollapse = width < SEPARATE_QUERY_CONTROLS_INLINE_MIN_WIDTH
      setAreSeparateQueryControlsCollapsed((current) =>
        current === shouldCollapse ? current : shouldCollapse
      )
    }

    updateQueryControlsVisibility(queryBar.getBoundingClientRect().width)

    const observer = new ResizeObserver(([entry]) => {
      updateQueryControlsVisibility(entry.contentRect.width)
    })
    observer.observe(queryBar)

    return () => observer.disconnect()
  }, [])

  const isSeparateQueryControlMode = warehouseDemoSnap.queryControlMode === 'separate'
  const shouldShowCollapsedQueryControls =
    isSeparateQueryControlMode && areSeparateQueryControlsCollapsed
  const selectedSourceId = lastSelectedSource || sourceId

  return (
    <div
      ref={queryBarRef}
      className="flex h-10 shrink-0 items-center justify-between border-b bg-dash-sidebar px-2 dark:bg-surface-100 @container"
    >
      <div className="flex min-w-0 items-center gap-x-2">
        {IS_PLATFORM && <AutosaveStatus />}
        {IS_PLATFORM && !isManualSaveEnabled && <SavingIndicator id={id} />}
      </div>

      <div className="flex items-center gap-x-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              data-testid="sql-editor-utility-actions"
              variant="default"
              icon={<MoreVertical />}
              className="h-[26px] w-[26px]"
              aria-label="Query options"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            {shouldShowCollapsedQueryControls && (
              <>
                <div className="space-y-1 px-1 py-1.5">
                  <p className="px-2 py-1 text-xs text-foreground-lighter">Query context</p>
                  <SeparateQueryControls
                    isWarehouse={isWarehouse}
                    onSelectSource={onSelectSource}
                    selectedSourceId={selectedSourceId}
                    fullWidth
                  />
                </div>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuLabel className="text-xs font-normal text-foreground-lighter">
              Actions
            </DropdownMenuLabel>
            <DropdownMenuItem className="justify-between" onClick={prettifyQuery}>
              <span className="flex items-center gap-x-2">
                <AlignLeft size={14} strokeWidth={2} className="text-foreground-light" />
                Prettify SQL
              </span>
              {formatKeys && <KeyboardShortcut keys={formatKeys} />}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs font-normal text-foreground-lighter">
              Preferences
            </DropdownMenuLabel>
            {IS_PLATFORM && (
              <DropdownMenuCheckboxItem checked={isFavorite} onCheckedChange={toggleFavorite}>
                Favourite query
              </DropdownMenuCheckboxItem>
            )}
            <DropdownMenuCheckboxItem
              checked={intelliSenseEnabled}
              onCheckedChange={handleIntelliSenseChange}
            >
              IntelliSense
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {isSeparateQueryControlMode ? (
          <div className="hidden items-center gap-x-2 @4xl:flex">
            <SeparateQueryControls
              isWarehouse={isWarehouse}
              onSelectSource={onSelectSource}
              selectedSourceId={selectedSourceId}
            />
          </div>
        ) : (
          <QueryContextDropdown
            currentRole={currentRole}
            isWarehouse={isWarehouse}
            onSelectSource={onSelectSource}
            selectedSourceId={selectedSourceId}
          />
        )}
        <SqlEditorLimitSelector />
        {isManualSaveEnabled && <SqlSaveButton id={id} />}
        <SqlRunButton
          hasSelection={hasSelection}
          isDisabled={isDisabled || isExecuting}
          isExecuting={isExecuting}
          onClick={executeQuery}
        />
      </div>
    </div>
  )
}

type QueryContextDropdownProps = {
  currentRole: string
  isWarehouse: boolean
  onSelectSource: (sourceId: string) => void
  selectedSourceId: string
}

type SeparateQueryControlsProps = {
  fullWidth?: boolean
  isWarehouse: boolean
  onSelectSource: (sourceId: string) => void
  selectedSourceId: string
}

function SeparateQueryControls({
  fullWidth = false,
  isWarehouse,
  onSelectSource,
  selectedSourceId,
}: SeparateQueryControlsProps) {
  return (
    <>
      <SqlEditorSourceSelector
        fullWidth={fullWidth}
        onSelectSource={onSelectSource}
        selectedSourceId={selectedSourceId}
      />
      {!isWarehouse && (
        <RoleImpersonationPopover
          serviceRoleLabel="postgres"
          header="Run SQL query as a role"
          align="end"
          className={fullWidth ? 'w-full justify-start [&>span]:w-full' : undefined}
        />
      )}
    </>
  )
}

function QueryContextDropdown({
  currentRole,
  isWarehouse,
  onSelectSource,
  selectedSourceId,
}: QueryContextDropdownProps) {
  const { ref } = useParams()
  const sourceSummary = getSqlEditorSourceSummary({
    projectRef: ref,
    sourceId: selectedSourceId,
    isWarehouse,
  })
  const activeContextLabels = [
    sourceSummary,
    !isWarehouse && currentRole !== 'postgres' ? currentRole : undefined,
  ].filter((label): label is string => label !== undefined)
  const contextSummary =
    activeContextLabels.length === 0
      ? undefined
      : activeContextLabels.length === 1
        ? activeContextLabels[0]
        : `${activeContextLabels.length} changes`

  return (
    <Popover modal={false}>
      <PopoverTrigger asChild>
        <Button type="button" size="tiny" variant="default" className="h-[26px] justify-start pr-3">
          <div className="flex min-w-0 items-center gap-1">
            <span className="text-foreground-muted">Query</span>
            {contextSummary !== undefined && (
              <span className="hidden max-w-40 truncate text-foreground @2xl:inline">
                {contextSummary}
              </span>
            )}
            <ChevronDown className="shrink-0 text-muted" strokeWidth={1} size={12} />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" side="bottom">
        <div className="border-b px-4 py-3">
          <p className="text-sm text-foreground">Query context</p>
          <p className="text-xs leading-snug text-foreground-light">
            Choose where this query runs. Role impersonation applies to Postgres only.
          </p>
        </div>
        <div className="space-y-1 p-2">
          <SqlEditorSourceSelector
            className="w-full [&>span]:w-full"
            align="end"
            onSelectSource={onSelectSource}
            selectedSourceId={selectedSourceId}
          />
          {!isWarehouse && (
            <RoleImpersonationPopover
              serviceRoleLabel="postgres"
              header="Run SQL query as a role"
              align="end"
              className="w-full justify-start [&>span]:w-full"
            />
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
