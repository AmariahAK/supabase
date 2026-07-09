import { proxy, subscribe, useSnapshot } from 'valtio'

import { SUPABASE_MANAGED_WAREHOUSE_RESOURCE_NAME } from './managedWarehouse.resources'
import { getMockWarehouseHost } from './warehouseReplication.utils'
import { INTERNAL_SCHEMAS } from '@/hooks/useProtectedSchemas'

export type ReplicationPhase = 'idle' | 'provisioning' | 'backfilling' | 'streaming' | 'failed'

export type WarehousePipelineStatus = 'running' | 'stopped'

export interface WarehouseProjectState {
  enabled: boolean
  replicationPhase: ReplicationPhase
  pipelineStatus: WarehousePipelineStatus
  lagSeconds: number | null
  includedSchemas: string[]
  pipelineId: string | null
  destinationName: string
  publicationName: string
  warehouseHost: string
  enabledAt: string | null
}

const DEFAULT_STATE: WarehouseProjectState = {
  enabled: false,
  replicationPhase: 'idle',
  pipelineStatus: 'stopped',
  lagSeconds: null,
  includedSchemas: [],
  pipelineId: null,
  destinationName: 'DuckLake',
  publicationName: SUPABASE_MANAGED_WAREHOUSE_RESOURCE_NAME,
  warehouseHost: '',
  enabledAt: null,
}

const STORAGE_KEY = 'supabase-warehouse-wholesale-demo'

export const warehouseDemoStore = proxy<{
  projects: Record<string, WarehouseProjectState>
}>({
  projects: {},
})

function loadFromStorage(): void {
  if (typeof window === 'undefined') return
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as Record<string, WarehouseProjectState>
    warehouseDemoStore.projects = parsed
  } catch {
    // ignore corrupt storage
  }
}

function saveToStorage(): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(warehouseDemoStore.projects))
}

loadFromStorage()
subscribe(warehouseDemoStore, saveToStorage)

const SYSTEM_TABLE_DENYLIST = new Set(['supabase_migrations', 'schema_migrations'])

const NON_REPLICABLE_SCHEMAS = new Set(INTERNAL_SCHEMAS)

export function isReplicableSchema(schema: string): boolean {
  return !NON_REPLICABLE_SCHEMAS.has(schema)
}

export function getDefaultIncludedSchemas(availableSchemas: string[]): string[] {
  return availableSchemas.filter(isReplicableSchema)
}

function getProjectState(projectRef: string): WarehouseProjectState {
  const raw = warehouseDemoStore.projects[projectRef]
  if (!raw) return { ...DEFAULT_STATE }
  return {
    ...DEFAULT_STATE,
    ...raw,
    pipelineStatus:
      raw.pipelineStatus ?? (raw.replicationPhase === 'streaming' ? 'running' : 'stopped'),
  }
}

function setProjectState(projectRef: string, next: WarehouseProjectState): void {
  warehouseDemoStore.projects[projectRef] = next
}

export function useWarehouseProjectState(projectRef: string | undefined) {
  const snap = useSnapshot(warehouseDemoStore)
  if (!projectRef) return { ...DEFAULT_STATE }
  const raw = snap.projects[projectRef]
  if (!raw) return { ...DEFAULT_STATE }
  return {
    ...DEFAULT_STATE,
    ...raw,
    pipelineStatus:
      raw.pipelineStatus ?? (raw.replicationPhase === 'streaming' ? 'running' : 'stopped'),
  }
}

export function isWarehouseProjectEnabled(projectRef: string | undefined): boolean {
  if (!projectRef) return false
  return getProjectState(projectRef).enabled
}

export function isTableReplicated(
  projectRef: string | undefined,
  schema: string,
  table: string
): boolean {
  if (!projectRef) return false
  const state = getProjectState(projectRef)
  if (!state.enabled) return false
  if (!state.includedSchemas.includes(schema)) return false
  if (SYSTEM_TABLE_DENYLIST.has(table)) return false
  return isReplicableSchema(schema)
}

let phaseTimer: ReturnType<typeof setTimeout> | null = null

function clearPhaseTimer(): void {
  if (phaseTimer) {
    clearTimeout(phaseTimer)
    phaseTimer = null
  }
}

function simulatePhaseProgression(projectRef: string): void {
  clearPhaseTimer()

  phaseTimer = setTimeout(() => {
    const current = getProjectState(projectRef)
    if (!current.enabled || current.replicationPhase !== 'provisioning') return
    setProjectState(projectRef, {
      ...current,
      replicationPhase: 'backfilling',
      lagSeconds: 45,
    })

    phaseTimer = setTimeout(() => {
      const backfilling = getProjectState(projectRef)
      if (!backfilling.enabled || backfilling.replicationPhase !== 'backfilling') return
      setProjectState(projectRef, {
        ...backfilling,
        replicationPhase: 'streaming',
        pipelineStatus: 'running',
        lagSeconds: 2,
      })
    }, 6000)
  }, 3000)
}

export function enableWarehouseProject(projectRef: string, includedSchemas: string[]): void {
  const pipelineId = String(7000 + Math.floor(Math.random() * 100))
  setProjectState(projectRef, {
    enabled: true,
    replicationPhase: 'provisioning',
    pipelineStatus: 'running',
    lagSeconds: null,
    includedSchemas,
    pipelineId,
    destinationName: 'DuckLake',
    publicationName: SUPABASE_MANAGED_WAREHOUSE_RESOURCE_NAME,
    warehouseHost: getMockWarehouseHost(projectRef),
    enabledAt: new Date().toISOString(),
  })
  simulatePhaseProgression(projectRef)
}

export function disableWarehouseProject(projectRef: string): void {
  clearPhaseTimer()
  setProjectState(projectRef, { ...DEFAULT_STATE })
}

export function stopWarehousePipeline(projectRef: string): void {
  const current = getProjectState(projectRef)
  if (!current.enabled || current.replicationPhase !== 'streaming') return
  setProjectState(projectRef, { ...current, pipelineStatus: 'stopped' })
}

export function startWarehousePipeline(projectRef: string): void {
  const current = getProjectState(projectRef)
  if (!current.enabled || current.pipelineStatus !== 'stopped') return
  setProjectState(projectRef, {
    ...current,
    pipelineStatus: 'running',
    lagSeconds: current.lagSeconds ?? 2,
  })
}

export function restartWarehousePipeline(projectRef: string): void {
  const current = getProjectState(projectRef)
  if (!current.enabled) return
  clearPhaseTimer()
  setProjectState(projectRef, {
    ...current,
    pipelineStatus: 'running',
    replicationPhase: 'backfilling',
    lagSeconds: 30,
  })

  phaseTimer = setTimeout(() => {
    const state = getProjectState(projectRef)
    if (!state.enabled || state.replicationPhase !== 'backfilling') return
    setProjectState(projectRef, {
      ...state,
      replicationPhase: 'streaming',
      pipelineStatus: 'running',
      lagSeconds: 2,
    })
  }, 4000)
}

export function updateWarehouseIncludedSchemas(
  projectRef: string,
  includedSchemas: string[]
): void {
  const current = getProjectState(projectRef)
  if (!current.enabled) return

  const hadNewSchemas = includedSchemas.some((s) => !current.includedSchemas.includes(s))
  setProjectState(projectRef, {
    ...current,
    includedSchemas,
    replicationPhase: hadNewSchemas ? 'backfilling' : current.replicationPhase,
    lagSeconds: hadNewSchemas ? 30 : current.lagSeconds,
  })

  if (hadNewSchemas) {
    phaseTimer = setTimeout(() => {
      const state = getProjectState(projectRef)
      if (!state.enabled) return
      setProjectState(projectRef, {
        ...state,
        replicationPhase: 'streaming',
        pipelineStatus: 'running',
        lagSeconds: 2,
      })
    }, 4000)
  }
}
