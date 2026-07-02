import { getFormattedLagValue } from '../Replication/ReplicationPipelineStatus/ReplicationPipelineStatus.utils'
import type { CopyStatus, WarehouseProjectReplicationStatus } from './warehouseDemoStore'

export type ReplicationHealth = 'healthy' | 'behind' | 'critical' | 'error'

/** WAL backlog below this is healthy — no lag amount shown in the UI. */
export const REPLICATION_LAG_BEHIND_THRESHOLD_BYTES = 50 * 1024 * 1024

/** WAL backlog at or above this is critical. */
export const REPLICATION_LAG_CRITICAL_THRESHOLD_BYTES = 500 * 1024 * 1024

export function resolveReplicationHealth(
  replication: WarehouseProjectReplicationStatus,
  copyStatus?: CopyStatus
): ReplicationHealth {
  if (
    replication.pipelineStatus === 'error' ||
    replication.replicationPhase === 'error' ||
    copyStatus === 'error'
  ) {
    return 'error'
  }

  const lagBytes = replication.replicationLagBytes ?? 0
  if (lagBytes >= REPLICATION_LAG_CRITICAL_THRESHOLD_BYTES) return 'critical'
  if (lagBytes >= REPLICATION_LAG_BEHIND_THRESHOLD_BYTES) return 'behind'
  return 'healthy'
}

export interface ReplicationLagDisplay {
  health: ReplicationHealth
  headline: string
  lagAmount?: string
  compactSuffix?: string
  tooltip: string
  tone: 'default' | 'warning' | 'destructive'
}

export function getReplicationLagDisplay(
  replication: WarehouseProjectReplicationStatus,
  copyStatus?: CopyStatus
): ReplicationLagDisplay {
  if (copyStatus === 'error' && replication.pipelineStatus === 'live') {
    return {
      health: 'error',
      headline: 'Sync error',
      compactSuffix: 'Sync error',
      tooltip: 'This linked Warehouse table could not stay in sync with Postgres.',
      tone: 'destructive',
    }
  }

  const health = resolveReplicationHealth(replication, copyStatus)
  const lagFormatted = getFormattedLagValue('bytes', replication.replicationLagBytes).display

  if (health === 'error') {
    const hasSignificantLag =
      replication.replicationLagBytes >= REPLICATION_LAG_BEHIND_THRESHOLD_BYTES

    return {
      health,
      headline: 'Replication error',
      compactSuffix: hasSignificantLag ? `${lagFormatted} behind` : 'Replication error',
      tooltip: 'Warehouse replication pipeline encountered an error. Check replication logs.',
      tone: 'destructive',
    }
  }

  if (replication.replicationPhase === 'initial_sync') {
    return {
      health: 'healthy',
      headline: 'Initial sync',
      tooltip: 'Running the first full sync for this project’s Warehouse pipeline.',
      tone: 'default',
    }
  }

  if (copyStatus === 'backfilling') {
    return {
      health: 'healthy',
      headline: 'Backfilling',
      tooltip: 'This linked Warehouse table is still catching up.',
      tone: 'default',
    }
  }

  if (health === 'healthy') {
    return {
      health,
      headline: 'Caught up',
      tooltip: 'Warehouse replication is caught up with Postgres.',
      tone: 'default',
    }
  }

  if (health === 'behind') {
    return {
      health,
      headline: 'Replication behind',
      lagAmount: lagFormatted,
      compactSuffix: `${lagFormatted} behind`,
      tooltip: `Warehouse is ${lagFormatted} behind Postgres for all tables in this project.`,
      tone: 'warning',
    }
  }

  return {
    health,
    headline: 'Severely behind',
    lagAmount: lagFormatted,
    compactSuffix: `${lagFormatted} behind`,
    tooltip: `Warehouse replication is severely behind (${lagFormatted}). Query results may be stale.`,
    tone: 'destructive',
  }
}

/** Unified table status for Settings — project lag supersedes a calm "Live" when reads may be stale. */
export type WarehouseLinkedTableStatus =
  | { type: 'copy'; copyStatus: CopyStatus }
  | {
      type: 'project'
      text: string
      tooltip: string
      tone: ReplicationLagDisplay['tone']
    }

export function getWarehouseLinkedTableStatus(
  lagDisplay: ReplicationLagDisplay | null,
  copyStatus: CopyStatus | undefined
): WarehouseLinkedTableStatus | null {
  if (!copyStatus) return null

  if (copyStatus === 'backfilling' || copyStatus === 'error') {
    return { type: 'copy', copyStatus }
  }

  if (!lagDisplay || (lagDisplay.health === 'healthy' && lagDisplay.headline === 'Caught up')) {
    return { type: 'copy', copyStatus: 'live' }
  }

  return {
    type: 'project',
    text: lagDisplay.compactSuffix ?? lagDisplay.headline,
    tooltip: lagDisplay.tooltip,
    tone: lagDisplay.tone,
  }
}
