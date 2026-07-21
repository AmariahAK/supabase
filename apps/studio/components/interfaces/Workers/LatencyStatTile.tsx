import { cn } from 'ui'

import { WORKER_LATENCY_BENCHMARK } from '@/lib/constants/workers'

/**
 * 2c — a compact stat card with an animated "ping trace". Shows the p90
 * Worker→DB round-trip against a target, with one comparison line to an
 * external host. The numbers are illustrative benchmark figures, not a live
 * measurement (see the caption). Keyframes are scoped to this component via a
 * local <style> tag, matching the design prototype.
 */
export const LatencyStatTile = ({ className }: { className?: string }) => {
  const { workerP90Ms, targetMs, externalHostMs, workerLabel, externalHostLabel, caption } =
    WORKER_LATENCY_BENCHMARK

  // Bar widths are relative to the slowest sample so the gap is legible.
  const workerWidth = Math.round((workerP90Ms / externalHostMs) * 100)

  return (
    <div className={cn('rounded-md border border-default bg-surface-100 p-4', className)}>
      <style>{`
        @keyframes worker-ping-trace {
          0% { transform: translateX(-100%); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      <div className="flex items-baseline justify-between">
        <p className="text-xs uppercase tracking-wide text-foreground-lighter">Worker → DB latency</p>
        <p className="text-xs text-foreground-lighter">
          target &lt;{targetMs}ms
        </p>
      </div>

      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-3xl font-mono text-foreground">{workerP90Ms}</span>
        <span className="text-sm text-foreground-light">ms p90</span>
      </div>

      <div className="mt-4 space-y-3">
        <PingTrace label={workerLabel} value={`${workerP90Ms}ms`} widthPct={workerWidth} tone="brand" />
        <PingTrace
          label={externalHostLabel}
          value={`${externalHostMs}ms`}
          widthPct={100}
          tone="muted"
        />
      </div>

      <p className="mt-4 text-xs text-foreground-lighter">{caption}</p>
    </div>
  )
}

const PingTrace = ({
  label,
  value,
  widthPct,
  tone,
}: {
  label: string
  value: string
  widthPct: number
  tone: 'brand' | 'muted'
}) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between text-xs">
      <span className="text-foreground-light">{label}</span>
      <span className="font-mono text-foreground-lighter">{value}</span>
    </div>
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-300">
      <div
        className={cn('h-full rounded-full', tone === 'brand' ? 'bg-brand' : 'bg-foreground-muted')}
        style={{
          width: `${widthPct}%`,
          animation: 'worker-ping-trace 1.4s ease-out infinite alternate',
        }}
      />
    </div>
  </div>
)
