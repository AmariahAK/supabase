import { MCP_CLIENT_DATA } from 'ui-patterns/McpUrlBuilder/clients.data'

import { PLUGIN_CLIENTS } from '~/features/ui/AgentPluginsPanel.data'
import type { ContentListingGroup } from '~/lib/content-listings.schema'

// MCP_CLIENT_DATA and PLUGIN_CLIENTS key GitHub Copilot differently — normalize before merging.
const KEY_ALIASES: Record<string, string> = {
  'copilot-cli': 'github-copilot',
}

// ContentListings defaults hasLightIcon to true whenever an icon is set (see
// ContentListings.client.tsx: `item.hasLightIcon ?? Boolean(item.icon)`), so single-variant
// icons must set `hasLightIcon: false` explicitly or they'll request a nonexistent "-light" file.
const ICON_ASSETS: Record<string, { icon: string; hasLightIcon?: boolean }> = {
  'claude-code': { icon: '/docs/img/icons/agent-claude-icon', hasLightIcon: false },
  codex: { icon: '/docs/img/icons/agent-openai-icon', hasLightIcon: true },
  cursor: { icon: '/docs/img/icons/agent-cursor-icon', hasLightIcon: true },
  'gemini-cli': { icon: '/docs/img/icons/agent-gemini-cli-icon', hasLightIcon: false },
  'github-copilot': { icon: '/docs/img/icons/agent-copilot-icon', hasLightIcon: true },
  kimi: { icon: '/docs/img/icons/agent-kimi-icon', hasLightIcon: true },
  vscode: { icon: '/docs/img/icons/agent-vscode-icon', hasLightIcon: false },
  antigravity: { icon: '/docs/img/icons/agent-antigravity-icon', hasLightIcon: false },
  windsurf: { icon: '/docs/img/icons/agent-windsurf-icon', hasLightIcon: true },
  goose: { icon: '/docs/img/icons/agent-goose-icon', hasLightIcon: true },
  factory: { icon: '/docs/img/icons/agent-factory-icon', hasLightIcon: true },
  opencode: { icon: '/docs/img/icons/agent-opencode-icon', hasLightIcon: true },
  kiro: { icon: '/docs/img/icons/agent-kiro-icon', hasLightIcon: false },
}

// Claude.ai and ChatGPT are MCP connectors for a chat web app, not a coding agent or IDE.
const EXCLUDED_KEYS = new Set(['claude-ai', 'chatgpt'])

interface AgentEntry {
  key: string
  label: string
  plugin: boolean
  mcp: boolean
  href?: string
}

const PLUGIN_KEYS = new Set(PLUGIN_CLIENTS.map((client) => client.key))
const MCP_KEYS = new Set(MCP_CLIENT_DATA.map((client) => KEY_ALIASES[client.key] ?? client.key))

function buildAgents(): AgentEntry[] {
  const byKey = new Map<string, AgentEntry>()

  for (const client of MCP_CLIENT_DATA) {
    const key = KEY_ALIASES[client.key] ?? client.key
    if (EXCLUDED_KEYS.has(key)) continue
    byKey.set(key, {
      key,
      label: client.label,
      plugin: PLUGIN_KEYS.has(key),
      mcp: true,
      href: client.externalDocsUrl || undefined,
    })
  }

  for (const client of PLUGIN_CLIENTS) {
    if (EXCLUDED_KEYS.has(client.key)) continue
    const existing = byKey.get(client.key)
    if (existing) {
      existing.href = existing.href || client.docsUrl
      continue
    }
    byKey.set(client.key, {
      key: client.key,
      label: client.label,
      plugin: true,
      mcp: MCP_KEYS.has(client.key),
      href: client.docsUrl,
    })
  }

  return Array.from(byKey.values()).sort((a, b) => a.label.localeCompare(b.label))
}

function describeSupport(plugin: boolean, mcp: boolean): string {
  if (plugin && mcp) return 'Install the plugin, or connect the MCP server directly.'
  if (plugin) return 'Install the Supabase plugin for AI coding agents.'
  return 'Connect using the Supabase MCP server.'
}

function badgeFor(plugin: boolean, mcp: boolean): string {
  if (plugin && mcp) return 'MCP + Plugin'
  if (plugin) return 'Plugin'
  return 'MCP'
}

// Fallback for clients with no external docs URL — send them to our own setup page instead
// of silently dropping the card.
function hrefFor(agent: AgentEntry): string {
  if (agent.href) return agent.href
  return agent.plugin ? '/guides/ai-tools/plugins' : '/guides/ai-tools/mcp'
}

export const aiToolsSupportedAgents: ContentListingGroup = {
  id: 'ai-tools-supported-agents',
  heading: 'Supported agents & IDEs',
  headingLevel: 'h3',
  type: 'grid',
  columns: 3,
  items: buildAgents().map((agent) => ({
    title: agent.label,
    href: hrefFor(agent),
    description: describeSupport(agent.plugin, agent.mcp),
    icon: ICON_ASSETS[agent.key]?.icon,
    hasLightIcon: ICON_ASSETS[agent.key]?.hasLightIcon,
    badge: badgeFor(agent.plugin, agent.mcp),
    badgePosition: 'below',
  })),
}
