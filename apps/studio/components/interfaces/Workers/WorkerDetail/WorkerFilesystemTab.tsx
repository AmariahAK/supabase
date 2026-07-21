import { File, Folder } from 'lucide-react'
import { useMemo, useState } from 'react'
import { cn } from 'ui'

import { WorkerNotRunning } from './WorkerNotRunning'
import { isWorkerRunning } from '../WorkerActions'
import type { Worker } from '../Workers.types'
import { getWorkerRuntime } from '@/lib/constants/workers'

interface FsEntry {
  name: string
  path: string
  size: string
  isDir?: boolean
  content?: string
}

// Mocked filesystem listing for /app inside the worker.
const buildEntries = (worker: Worker): FsEntry[] => {
  const runtime = getWorkerRuntime(worker.runtime)
  const entryFile =
    worker.runtime === 'python'
      ? { name: 'main.py', body: 'import os\n\nport = os.environ["PORT"]\nprint(f"listening on {port}")\n' }
      : worker.runtime === 'dockerfile'
        ? { name: 'Dockerfile', body: 'FROM alpine:3.20\nCOPY . /app\nWORKDIR /app\nCMD ["./run.sh"]\n' }
        : { name: 'index.js', body: 'const port = process.env.PORT\n\nBun?.serve?.({ port })\nconsole.log(`listening on ${port}`)\n' }

  return [
    { name: 'node_modules', path: '/app/node_modules', size: '—', isDir: true },
    {
      name: entryFile.name,
      path: `/app/${entryFile.name}`,
      size: '1.2 KB',
      content: entryFile.body,
    },
    {
      name: 'package.json',
      path: '/app/package.json',
      size: '312 B',
      content: JSON.stringify(
        { name: worker.slug, version: '1.0.0', private: true, engines: { [worker.runtime]: '*' } },
        null,
        2
      ),
    },
    {
      name: 'README.md',
      path: '/app/README.md',
      size: '840 B',
      content: `# ${worker.name}\n\nDeployed on the ${runtime.label} runtime.\n`,
    },
    { name: '.env', path: '/app/.env', size: '96 B', content: 'PORT=8080\nLOG_LEVEL=info\n' },
  ]
}

export const WorkerFilesystemTab = ({ worker }: { worker: Worker }) => {
  const entries = useMemo(() => buildEntries(worker), [worker.runtime, worker.slug, worker.name])
  const firstFile = entries.find((entry) => !entry.isDir)
  const [selected, setSelected] = useState<string | undefined>(firstFile?.path)

  if (!isWorkerRunning(worker)) {
    return <WorkerNotRunning worker={worker} feature="filesystem" />
  }

  const active = entries.find((entry) => entry.path === selected)

  return (
    <div className="p-4">
      <div className="grid h-[calc(100vh-320px)] min-h-[360px] grid-cols-1 gap-px overflow-hidden rounded-md border border-default bg-border md:grid-cols-[260px_1fr]">
        {/* Tree */}
        <div className="overflow-y-auto bg-surface-100">
          <div className="border-b border-default px-3 py-2 font-mono text-xs text-foreground-lighter">
            /app
          </div>
          {entries.map((entry) => {
            const isActive = entry.path === selected
            const Icon = entry.isDir ? Folder : File
            return (
              <button
                key={entry.path}
                disabled={entry.isDir}
                onClick={() => !entry.isDir && setSelected(entry.path)}
                className={cn(
                  'flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm',
                  entry.isDir ? 'cursor-default text-foreground-light' : 'text-foreground',
                  isActive ? 'bg-surface-300' : !entry.isDir && 'hover:bg-surface-200'
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Icon size={14} strokeWidth={1.5} className="shrink-0 text-foreground-lighter" />
                  <span className="truncate">{entry.name}</span>
                </span>
                <span className="shrink-0 font-mono text-xs text-foreground-lighter">
                  {entry.size}
                </span>
              </button>
            )
          })}
        </div>

        {/* Preview */}
        <div className="flex flex-col overflow-hidden bg-studio">
          {active ? (
            <>
              <div className="border-b border-default px-4 py-2 font-mono text-xs text-foreground-light">
                {active.path}
              </div>
              <pre className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-foreground-light">
                {active.content}
              </pre>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-sm text-foreground-lighter">Select a file to preview</p>
            </div>
          )}
        </div>
      </div>
      <p className="mt-2 text-xs text-foreground-lighter">
        Mocked read-only view of the worker's filesystem for the alpha preview.
      </p>
    </div>
  )
}
