import { useEffect, useMemo, useRef, useState } from 'react'
import type { ComponentType, ReactNode } from 'react'
import { Grid2X2, PanelLeftClose, Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export type ToolGroupId =
  | 'context'
  | 'changes'
  | 'run'
  | 'automation'
  | 'integrations'
  | 'developer'
  | 'system'

export interface ToolSwitcherItem {
  id: string
  icon: ComponentType<{ size?: number; className?: string }>
  label: string
  description?: string
  group: ToolGroupId
  active?: boolean
  badge?: ReactNode
  onSelect: () => void
}

interface ToolSwitcherProps {
  isOpen: boolean
  items: ToolSwitcherItem[]
  onClose: () => void
  placement?: 'activityBar' | 'top'
  activePanelLabel?: string
  onCloseActivePanel?: () => void
}

export const PINNED_LEFT_PANEL_TYPES = new Set(['files', 'git', 'browser', 'terminal', 'problems'])

const TOOL_GROUP_ORDER: ToolGroupId[] = [
  'context',
  'changes',
  'run',
  'automation',
  'integrations',
  'developer',
  'system',
]

const TOOL_GROUP_LABELS: Record<ToolGroupId, string> = {
  context: '上下文',
  changes: '变更',
  run: '运行',
  automation: '自动化',
  integrations: '集成',
  developer: '开发',
  system: '系统',
}

export function getToolGroup(panelType: string): ToolGroupId {
  switch (panelType) {
    case 'files':
    case 'browser':
    case 'requirement':
    case 'personalHub':
      return 'context'
    case 'git':
    case 'problems':
      return 'changes'
    case 'terminal':
    case 'scheduler':
    case 'aiConsole':
      return 'run'
    case 'todo':
      return 'automation'
    case 'translate':
    case 'integration':
      return 'integrations'
    case 'developer':
    case 'demoPlugin':
      return 'developer'
    default:
      return 'system'
  }
}

function getPlacementClass(placement: ToolSwitcherProps['placement']) {
  if (placement === 'top') {
    return 'left-2 top-11 w-[min(360px,calc(100vw-16px))]'
  }

  return 'left-14 top-12 w-[min(360px,calc(100vw-72px))]'
}

export function ToolSwitcher({
  isOpen,
  items,
  onClose,
  placement = 'activityBar',
  activePanelLabel,
  onCloseActivePanel,
}: ToolSwitcherProps) {
  const { t } = useTranslation('common')
  const [query, setQuery] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) return

    setQuery('')
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 30)

    const handleMouseDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return items

    return items.filter((item) => {
      const haystack = `${item.label} ${item.description ?? ''} ${item.group}`.toLowerCase()
      return haystack.includes(normalizedQuery)
    })
  }, [items, query])

  const groupedItems = useMemo(() => {
    return TOOL_GROUP_ORDER
      .map((group) => ({
        group,
        items: filteredItems.filter((item) => item.group === group),
      }))
      .filter((section) => section.items.length > 0)
  }, [filteredItems])

  if (!isOpen) return null

  return (
    <div
      ref={menuRef}
      className={`fixed z-50 ${getPlacementClass(placement)} acrylic-panel animate-acrylic-enter`}
      style={{ maxHeight: 'min(70dvh, calc(100dvh - 64px))' }}
      role="dialog"
      aria-label={t('labels.toolSwitcher', { defaultValue: '工具切换器' })}
    >
      <div className="flex items-center gap-2 border-b border-white/30 px-3 py-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Grid2X2 className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-zinc-800">
            {t('labels.toolSwitcher', { defaultValue: '工具切换器' })}
          </div>
          {activePanelLabel ? (
            <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-zinc-500">
              <span className="truncate">
                {t('labels.activeSidebar', { defaultValue: '当前侧栏' })}: {activePanelLabel}
              </span>
              {onCloseActivePanel && (
                <button
                  type="button"
                  onClick={() => {
                    onCloseActivePanel()
                    onClose()
                  }}
                  className="inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-zinc-600 transition-colors hover:bg-black/5 hover:text-zinc-800"
                  title={t('labels.closeSidebar', { defaultValue: '关闭侧栏' })}
                >
                  <PanelLeftClose className="h-3 w-3" />
                  <span>{t('buttons.close', { defaultValue: '关闭' })}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="truncate text-xs text-zinc-500">
              {t('labels.toolSwitcherHint', { defaultValue: '按工作流分组，支持搜索和滚动' })}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-black/5 hover:text-zinc-800"
          aria-label={t('buttons.close')}
          title={t('buttons.close')}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="border-b border-white/30 px-3 py-2">
        <div className="flex h-8 items-center gap-2 rounded-lg border border-white/40 bg-white/30 px-2 text-zinc-500 focus-within:border-white/60 focus-within:text-zinc-600">
          <Search className="h-4 w-4 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('labels.searchTools', { defaultValue: '搜索工具' })}
            className="min-w-0 flex-1 bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-400"
          />
        </div>
      </div>

      <div
        className="overflow-y-auto p-2"
        style={{ maxHeight: 'calc(min(70dvh, calc(100dvh - 64px)) - 104px)' }}
      >
        {groupedItems.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm text-zinc-500">
            {t('status.noResults', { defaultValue: '没有匹配结果' })}
          </div>
        ) : (
          groupedItems.map((section) => (
            <section key={section.group} className="mb-2 last:mb-0">
              <div className="px-2 pb-1 pt-1 text-[11px] font-medium text-zinc-400">
                {t(`toolSwitcher.groups.${section.group}`, {
                  defaultValue: TOOL_GROUP_LABELS[section.group],
                })}
              </div>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        item.onSelect()
                        onClose()
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors ${
                        item.active
                          ? 'bg-primary/10 text-primary'
                          : 'text-zinc-600 hover:bg-black/5 hover:text-zinc-800'
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                          item.active ? 'bg-primary/15' : 'bg-white/40'
                        }`}
                      >
                        <Icon size={17} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{item.label}</span>
                        {item.description && (
                          <span className="block truncate text-xs text-zinc-500">
                            {item.description}
                          </span>
                        )}
                      </span>
                      {item.badge && <span className="shrink-0">{item.badge}</span>}
                    </button>
                  )
                })}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  )
}
