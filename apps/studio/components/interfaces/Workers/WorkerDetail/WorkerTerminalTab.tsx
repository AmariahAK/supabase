import { useEffect, useMemo, useRef, useState } from 'react'

import { WorkerNotRunning } from './WorkerNotRunning'
import { isWorkerRunning } from '../WorkerActions'
import type { Worker } from '../Workers.types'
import { getWorkerRuntime, getWorkerSize, WORKER_REGION } from '@/lib/constants/workers'

interface Line {
  id: number
  kind: 'input' | 'output' | 'system'
  text: string
}

// A fully mocked shell — enough to demonstrate the shape of a real terminal
// without a backend. Handles a handful of canned commands and echoes the rest.
const runCommand = (raw: string, worker: Worker): { output: string; clear?: boolean } => {
  const cmd = raw.trim()
  if (cmd === '') return { output: '' }

  const [bin, ...args] = cmd.split(/\s+/)
  const runtime = getWorkerRuntime(worker.runtime)

  switch (bin) {
    case 'help':
      return {
        output: [
          'Available (mock) commands:',
          '  ls, pwd, whoami, env, cat <file>, echo <text>,',
          `  ${runtime.cliValue} --version, uname, clear`,
        ].join('\n'),
      }
    case 'clear':
      return { output: '', clear: true }
    case 'ls':
      return { output: 'index.js   package.json   node_modules   README.md   .env' }
    case 'pwd':
      return { output: '/app' }
    case 'whoami':
      return { output: 'worker' }
    case 'uname':
      return { output: 'Linux worker 6.1.0 microVM x86_64 GNU/Linux' }
    case 'env':
      return { output: `PORT=8080\nSUPABASE_URL=https://<project>.supabase.co\nREGION=${WORKER_REGION.id}` }
    case 'echo':
      return { output: args.join(' ') }
    case 'cat':
      if (args[0] === 'package.json') {
        return {
          output: JSON.stringify(
            { name: worker.slug, version: '1.0.0', main: 'index.js', private: true },
            null,
            2
          ),
        }
      }
      return { output: args[0] ? `cat: ${args[0]}: No such file or directory` : 'usage: cat <file>' }
    default:
      if (
        (bin === 'node' || bin === 'deno' || bin === 'bun' || bin === 'python') &&
        (args[0] === '--version' || args[0] === '-v')
      ) {
        return { output: runtime.label }
      }
      return { output: `${bin}: command not found` }
  }
}

export const WorkerTerminalTab = ({ worker }: { worker: Worker }) => {
  const runtime = getWorkerRuntime(worker.runtime)
  const size = getWorkerSize(worker.size)

  const banner = useMemo<Line[]>(
    () => [
      { id: 0, kind: 'system', text: `Connected to ${worker.name} · ${runtime.label}` },
      {
        id: 1,
        kind: 'system',
        text: `${size.memory} · ${size.vcpu} · ${WORKER_REGION.short} · type "help" for commands`,
      },
    ],
    [worker.name, runtime.label, size.memory, size.vcpu]
  )

  const [lines, setLines] = useState<Line[]>(banner)
  const [input, setInput] = useState('')
  const nextId = useRef(banner.length)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [lines])

  // Not running → gate with the shared empty state.
  if (!isWorkerRunning(worker)) {
    return <WorkerNotRunning worker={worker} feature="terminal" />
  }

  const prompt = `worker@${worker.slug}:~$`

  const submit = () => {
    const value = input
    setInput('')
    const { output, clear } = runCommand(value, worker)
    if (clear) {
      setLines([])
      return
    }
    setLines((prev) => {
      const appended: Line[] = [{ id: nextId.current++, kind: 'input', text: `${prompt} ${value}` }]
      if (output) appended.push({ id: nextId.current++, kind: 'output', text: output })
      return [...prev, ...appended]
    })
  }

  return (
    <div className="p-4">
      <div className="flex h-[calc(100vh-320px)] min-h-[360px] flex-col overflow-hidden rounded-md border border-default bg-surface-100">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 font-mono text-xs leading-relaxed">
          {lines.map((line) => (
            <pre
              key={line.id}
              className={
                line.kind === 'system'
                  ? 'whitespace-pre-wrap text-foreground-lighter'
                  : line.kind === 'input'
                    ? 'whitespace-pre-wrap text-foreground'
                    : 'whitespace-pre-wrap text-foreground-light'
              }
            >
              {line.text}
            </pre>
          ))}

          <div className="flex items-center gap-2 text-foreground">
            <span className="shrink-0 text-brand">{prompt}</span>
            <input
              autoFocus
              spellCheck={false}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') submit()
              }}
              className="flex-1 bg-transparent font-mono text-xs text-foreground outline-none"
            />
          </div>
        </div>
      </div>
      <p className="mt-2 text-xs text-foreground-lighter">
        This is a mocked shell for the alpha preview — commands run locally in the dashboard, not on
        the worker.
      </p>
    </div>
  )
}
