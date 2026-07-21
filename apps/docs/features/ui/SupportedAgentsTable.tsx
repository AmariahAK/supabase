'use client'

import { Check } from 'lucide-react'
import { useTheme } from 'next-themes'
import { ConnectionIcon, MCP_CLIENT_DATA } from 'ui-patterns/McpUrlBuilder'

import { PLUGIN_CLIENTS } from './AgentPluginsPanel'

// Claude.ai and ChatGPT are MCP connectors for a chat web app, not a coding agent or IDE.
const EXCLUDED_KEYS = new Set(['claude-ai', 'chatgpt'])

interface AgentRow {
  key: string
  label: string
  icon?: string
  hasDistinctDarkIcon?: boolean
  plugin: boolean
  mcp: boolean
  docsUrl?: string
}

const PLUGIN_KEYS = new Set(PLUGIN_CLIENTS.map((client) => client.key))
const MCP_KEYS = new Set(MCP_CLIENT_DATA.map((client) => client.key))

const AGENTS: AgentRow[] = (() => {
  const byKey = new Map<string, AgentRow>()

  for (const client of MCP_CLIENT_DATA) {
    if (EXCLUDED_KEYS.has(client.key)) continue
    byKey.set(client.key, {
      key: client.key,
      label: client.label,
      icon: client.icon,
      hasDistinctDarkIcon: client.hasDistinctDarkIcon,
      plugin: PLUGIN_KEYS.has(client.key),
      mcp: true,
      docsUrl: client.externalDocsUrl || undefined,
    })
  }

  for (const client of PLUGIN_CLIENTS) {
    if (EXCLUDED_KEYS.has(client.key)) continue
    const existing = byKey.get(client.key)
    if (existing) {
      existing.docsUrl = existing.docsUrl || client.docsUrl
      continue
    }
    byKey.set(client.key, {
      key: client.key,
      label: client.label,
      icon: client.icon,
      hasDistinctDarkIcon: client.hasDistinctDarkIcon,
      plugin: true,
      mcp: MCP_KEYS.has(client.key),
      docsUrl: client.docsUrl,
    })
  }

  return Array.from(byKey.values()).sort((a, b) => a.label.localeCompare(b.label))
})()

function SupportCell({ supported }: { supported: boolean }) {
  return supported ? (
    <Check size={16} strokeWidth={2} className="text-brand mx-auto" aria-label="Supported" />
  ) : (
    <span className="text-foreground-muted" aria-hidden="true">
      –
    </span>
  )
}

export function SupportedAgentsTable() {
  const { resolvedTheme } = useTheme()
  const theme = resolvedTheme === 'light' ? 'light' : 'dark'

  return (
    <div className="not-prose overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 pr-4 font-medium text-foreground-light">Agent / IDE</th>
            <th className="text-center py-2 px-4 font-medium text-foreground-light">Plugin</th>
            <th className="text-center py-2 px-4 font-medium text-foreground-light">MCP</th>
          </tr>
        </thead>
        <tbody>
          {AGENTS.map((agent) => (
            <tr key={agent.key} className="border-b last:border-0">
              <td className="py-2 pr-4">
                <div className="flex items-center gap-2">
                  {agent.icon && (
                    <ConnectionIcon
                      connection={agent.icon}
                      hasDistinctDarkIcon={agent.hasDistinctDarkIcon}
                      theme={theme}
                    />
                  )}
                  {agent.docsUrl ? (
                    <a
                      href={agent.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-link hover:underline"
                    >
                      {agent.label}
                    </a>
                  ) : (
                    agent.label
                  )}
                </div>
              </td>
              <td className="py-2 px-4">
                <SupportCell supported={agent.plugin} />
              </td>
              <td className="py-2 px-4">
                <SupportCell supported={agent.mcp} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-foreground-lighter">
        Agent Skills work with any agent that can read Markdown-based instructions — see{' '}
        <a href="/docs/guides/ai-tools/ai-skills" className="text-brand-link hover:underline">
          Agent Skills
        </a>{' '}
        for supported formats.
      </p>
    </div>
  )
}
