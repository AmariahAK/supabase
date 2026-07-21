import { ArrowRight, Plus, Sparkles } from 'lucide-react'
import { Button } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'

import CopyButton from '@/components/ui/CopyButton'
import {
  LOG_DESTINATION,
  UNIT_NAME_LOWER,
  WORKERS_CLI,
  WORKERS_SKILL_MARKDOWN,
  WORKER_REGION,
} from '@/lib/constants/workers'
import { DOCS_URL } from '@/lib/constants'

const STEPS = [
  {
    title: 'Detects your stack',
    body: 'The CLI inspects your project and picks the right runtime — Node, Deno, Bun, Python, or your Dockerfile.',
  },
  {
    title: 'Builds & schedules',
    body: `Your ${UNIT_NAME_LOWER} is built and scheduled onto a microVM in ${WORKER_REGION.short}, right next to your database.`,
  },
  {
    title: 'Streams back here',
    body: `Lifecycle events and logs stream to ${LOG_DESTINATION} and show up on this page.`,
  },
]

export const WorkersEmptyState = ({ onCreate }: { onCreate: () => void }) => {
  return (
    <div className="grid grid-cols-1 items-stretch gap-px overflow-hidden rounded-md border border-default bg-border lg:grid-cols-[1fr_360px]">
      {/* Left: what happens next */}
      <div className="bg-studio p-8">
        <h2 className="text-lg text-foreground">Deploy a {UNIT_NAME_LOWER}</h2>
        <p className="mt-1 max-w-lg text-sm text-foreground-light">
          Workers are created from the CLI. Copy the command, or spin up a mock {UNIT_NAME_LOWER} to
          preview how it appears here.
        </p>

        <Button className="mt-4" icon={<Plus />} onClick={onCreate}>
          Create {UNIT_NAME_LOWER}
        </Button>

        <ol className="mt-6 flex flex-col gap-5">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-default text-xs text-foreground-light">
                {index + 1}
              </span>
              <div>
                <p className="text-sm text-foreground">{step.title}</p>
                <p className="mt-0.5 max-w-md text-sm text-foreground-lighter">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Right: command + skill + docs */}
      <div className="flex flex-col gap-4 bg-surface-75 p-6">
        <div>
          <p className="mb-2 text-xs uppercase tracking-wide text-foreground-lighter">Run this</p>
          <Input
            copy
            showCopyOnHover
            readOnly
            className="font-mono text-xs tracking-tight"
            value={WORKERS_CLI.deploy}
          />
        </div>

        <div className="rounded-md border border-default bg-surface-100 p-4">
          <div className="flex items-center gap-2">
            <p className="text-sm text-foreground">SKILL.md</p>
            <span className="inline-flex items-center gap-1 rounded-full border border-default px-2 py-0.5 text-[10px] uppercase text-foreground-lighter">
              <Sparkles size={10} /> for agents
            </span>
          </div>
          <p className="mt-1 text-xs text-foreground-lighter">
            Drop a skill file into your agent so it can deploy and manage workers for you.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <CopyButton
              variant="default"
              size="tiny"
              text={WORKERS_SKILL_MARKDOWN}
              copyLabel="Copy SKILL.md"
              copiedLabel="Copied SKILL.md"
            />
            <a
              href={`${DOCS_URL}/guides/workers`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-foreground-light hover:text-foreground"
            >
              View docs
              <ArrowRight size={12} />
            </a>
          </div>
        </div>

        <a
          href={`${DOCS_URL}/guides/workers`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between rounded-md border border-default px-4 py-3 text-sm text-foreground-light hover:text-foreground"
        >
          Read the docs
          <ArrowRight size={14} />
        </a>
      </div>
    </div>
  )
}
