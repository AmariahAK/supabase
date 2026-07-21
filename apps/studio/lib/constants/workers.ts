/**
 * Workers (private alpha) — single source of truth for every alpha-locked
 * number, vocabulary term, and copy string.
 *
 * The public product name is NOT finalized. Every user-facing noun/verb for
 * this feature routes through the constants in this file so a rename is a
 * one-line change here rather than a repo-wide find/replace. If you find a
 * hardcoded "Workers"/"worker" in a Workers component, move it here.
 *
 * All of the values below are deliberate alpha decisions (two sizes, no
 * resize, single region, no pricing, etc.) — do not "improve" them without
 * checking the alpha brief. See specs/workers-alpha/*.md.
 */

// ---------------------------------------------------------------------------
// Vocabulary
// ---------------------------------------------------------------------------

export const PRODUCT_NAME = 'Workers'
export const PRODUCT_NAME_LOWER = 'workers'
export const UNIT_NAME = 'Worker'
export const UNIT_NAME_LOWER = 'worker'
export const UNIT_NAME_PLURAL = 'Workers'
export const UNIT_NAME_PLURAL_LOWER = 'workers'

// ---------------------------------------------------------------------------
// CLI — creation and management is CLI-only at alpha (the dashboard is
// read-mostly: list, open logs, delete).
// ---------------------------------------------------------------------------

export const WORKERS_CLI = {
  deploy: 'supabase workers deploy',
  list: 'supabase workers list',
  logs: 'supabase workers logs',
  delete: 'supabase workers delete',
} as const

/**
 * Compact SKILL.md for agents — copyable from the empty state so an agent can
 * deploy and manage Workers. Mirrors specs/workers-alpha/SKILL.md.
 */
export const WORKERS_SKILL_MARKDOWN = `---
name: supabase-workers
description: Deploy and manage Supabase Workers (managed compute in microVMs next to Postgres) via the Supabase CLI.
---

# Supabase Workers (alpha)

- Deploy: \`supabase workers deploy <name> --runtime <node|deno|bun|python|dockerfile> --size <2x1|4x2> --access <public|private> --instances <1-10>\`
- Inspect: \`supabase workers list\`, \`supabase workers logs <name> --follow\`
- Remove: \`supabase workers delete <name>\` (immediate, no drain)

Constraints: two sizes only (no resize — delete + redeploy), single locked US-West region,
1–10 instances / 100 per project, no pricing at alpha. Public = HTTP via the API Gateway (needs a
valid Supabase Auth key); private = no endpoint, its logs are its product.
`

// ---------------------------------------------------------------------------
// Sizes — exactly two shapes, no resize. To change size, delete and redeploy.
// ---------------------------------------------------------------------------

export type WorkerSizeId = '2x1' | '4x2'

export interface WorkerSize {
  id: WorkerSizeId
  label: string
  memory: string
  vcpu: string
}

export const WORKER_SIZES: WorkerSize[] = [
  { id: '2x1', label: '2x1', memory: '2 GB', vcpu: '1 vCPU' },
  { id: '4x2', label: '4x2', memory: '4 GB', vcpu: '2 vCPU' },
]

export const WORKER_SIZE_GUIDANCE =
  'Sizes are fixed at deploy time. There is no resize — to change size, delete the worker and redeploy.'

export const getWorkerSize = (id: WorkerSizeId) =>
  WORKER_SIZES.find((size) => size.id === id) ?? WORKER_SIZES[0]

// ---------------------------------------------------------------------------
// Runtimes — no Rust at alpha, despite older reference material.
// ---------------------------------------------------------------------------

export type WorkerRuntimeId = 'node' | 'deno' | 'bun' | 'python' | 'dockerfile'

export interface WorkerRuntime {
  id: WorkerRuntimeId
  label: string
  /** value passed to the CLI / detected from the project */
  cliValue: string
  /** tailwind text/border color token for the runtime swatch */
  swatch: string
}

export const WORKER_RUNTIMES: WorkerRuntime[] = [
  { id: 'node', label: 'Node.js 24', cliValue: 'node', swatch: 'text-brand' },
  { id: 'deno', label: 'Deno 2.9', cliValue: 'deno', swatch: 'text-foreground' },
  { id: 'bun', label: 'Bun', cliValue: 'bun', swatch: 'text-warning' },
  { id: 'python', label: 'Python 3.14', cliValue: 'python', swatch: 'text-blue-900' },
  { id: 'dockerfile', label: 'Dockerfile', cliValue: 'dockerfile', swatch: 'text-foreground-light' },
]

export const getWorkerRuntime = (id: WorkerRuntimeId) =>
  WORKER_RUNTIMES.find((runtime) => runtime.id === id) ?? WORKER_RUNTIMES[0]

// ---------------------------------------------------------------------------
// Region — single region at alpha, always shown, always locked. Workers
// deploy next to the project's Postgres; multi-region isn't available yet.
// ---------------------------------------------------------------------------

export const WORKER_REGION = {
  id: 'us-west-1',
  label: 'US West (Oregon)',
  short: 'US West',
  why: 'Workers run in the same region as your database so calls to Postgres stay on the local network. Choosing a region is not available yet.',
} as const

// ---------------------------------------------------------------------------
// Instances — 1–10 per deploy (default 1), hard cap of 100 per project.
// No pricing or metering at alpha; the instance cap is the only budget signal.
// ---------------------------------------------------------------------------

export const WORKER_INSTANCE_LIMITS = {
  min: 1,
  max: 10,
  default: 1,
  projectCap: 100,
} as const

// ---------------------------------------------------------------------------
// Access modes
// ---------------------------------------------------------------------------

export type WorkerAccessMode = 'public' | 'private'

export interface WorkerAccessModeDef {
  id: WorkerAccessMode
  label: string
  description: string
}

export const WORKER_ACCESS_MODES: Record<WorkerAccessMode, WorkerAccessModeDef> = {
  public: {
    id: 'public',
    label: 'Public',
    description:
      'Reachable over HTTP through the Supabase API Gateway. Every request must carry a valid Supabase Auth key, which the gateway validates before forwarding. Supports HTTP, WebSockets and SSE. No load balancing across instances at alpha.',
  },
  private: {
    id: 'private',
    label: 'Private',
    description:
      "No HTTP endpoint. Only meaningful with a Dockerfile — its CMD/ENTRYPOINT runs on deploy. Its output is logs, or outbound HTTP it initiates. Its logs are its product.",
  },
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

export type WorkerLifecycleState =
  | 'deploying'
  | 'active'
  | 'suspended'
  | 'resuming'
  | 'draining'
  | 'errored'
  | 'killed'

/**
 * The happy-path sequence. `errored` is a separate fault state reachable from
 * `active` or `resuming` — NOT a step in this sequence. `killed` is terminal
 * after delete.
 */
export const WORKER_LIFECYCLE_SEQUENCE: WorkerLifecycleState[] = [
  'deploying',
  'active',
  'suspended',
  'resuming',
  'draining',
]

export const WORKER_FAULT_STATES: WorkerLifecycleState[] = ['errored']

export const WORKER_STATE_LABELS: Record<WorkerLifecycleState, string> = {
  deploying: 'Deploying',
  active: 'Active',
  suspended: 'Suspended',
  resuming: 'Resuming',
  draining: 'Draining',
  errored: 'Errored',
  killed: 'Killed',
}

export const WORKER_STATE_DESCRIPTIONS: Record<WorkerLifecycleState, string> = {
  deploying: 'Building and scheduling onto a microVM.',
  active: 'Running and serving traffic.',
  // Suspended must read as healthy-and-cheap, never as broken.
  suspended: 'Scaled to zero while idle. $0 while idle, resumes in under a second on traffic.',
  resuming: 'Waking from suspend to serve incoming traffic.',
  draining: 'Finishing in-flight requests before scaling to zero.',
  errored: 'Hit a fault and stopped. Check the logs, then redeploy.',
  killed: 'Deleted. This worker no longer exists.',
}

// ---------------------------------------------------------------------------
// Mock timers — tuned for demoability, not realism. There is no real backend
// at alpha; these drive the simulated lifecycle in workers-mock-state.ts.
// ---------------------------------------------------------------------------

export const WORKER_MOCK_TIMERS = {
  tickMs: 2000,
  idleThresholdSeconds: 20,
  resumingDurationMs: 1400,
  drainingDurationMs: 1600,
} as const

// ---------------------------------------------------------------------------
// Logs
// ---------------------------------------------------------------------------

export const LOG_DESTINATION = 'Logflare'

// ---------------------------------------------------------------------------
// Honest "not yet" copy — features intentionally absent at alpha.
// ---------------------------------------------------------------------------

export const NOT_AVAILABLE_AT_ALPHA: string[] = [
  'Cost estimates and metering',
  'Upgrading an Edge Function into a Worker',
  'MCP tools (the agent surface is a SKILL file, not MCP)',
  'Deployment history and rollback',
  'Branching',
  'Persistent disk',
  'Dependency scanning',
  'Built-in load balancing',
  'A local serve command',
  'Secret cloaking',
]
