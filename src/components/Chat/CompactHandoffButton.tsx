/**
 * CompactHandoffButton - 压缩交接入口
 *
 * 位于聊天状态栏会话操作区。点击弹出 CompactHandoffModal，把当前会话
 * 压缩为结构化简报并在新会话继续。仅当活动会话有可压缩内容时可用。
 */

import { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Archive } from 'lucide-react'
import { clsx } from 'clsx'
import { lazy, Suspense } from 'react'
import {
  useActiveSessionId,
  useSessionMetadataList,
} from '@/stores/conversationStore/sessionStoreManager'
import { getHandoffEligibility } from '@/services/sessionHandoff'

const CompactHandoffModal = lazy(() =>
  import('./CompactHandoffModal').then((m) => ({ default: m.CompactHandoffModal })),
)

export const CompactHandoffButton = memo(function CompactHandoffButton() {
  const { t } = useTranslation('chat')
  const activeSessionId = useActiveSessionId()
  const sessionMetadataList = useSessionMetadataList()
  const [open, setOpen] = useState(false)

  const meta = sessionMetadataList.find((s) => s.id === activeSessionId)
  const eligibility = activeSessionId ? getHandoffEligibility(activeSessionId) : { enabled: false }

  if (!activeSessionId || !meta) return null

  return (
    <>
      <button
        onClick={() => eligibility.enabled && setOpen(true)}
        disabled={!eligibility.enabled}
        className={clsx(
          'flex items-center px-1.5 py-0.5 rounded shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] hover:scale-110 transition-transform',
          eligibility.enabled
            ? 'text-white hover:text-white hover:bg-white/10'
            : 'text-white/50 cursor-not-allowed',
        )}
        title={
          eligibility.enabled
            ? t('compactHandoff.entryTooltip')
            : t(eligibility.reasonKey ?? 'compactHandoff.notEligible')
        }
      >
        <Archive size={14} />
      </button>
      {open && (
        <Suspense fallback={null}>
          <CompactHandoffModal
            sessionId={activeSessionId}
            sessionTitle={meta.title}
            engineId={meta.engineId ?? 'claude-code'}
            onClose={() => setOpen(false)}
          />
        </Suspense>
      )}
    </>
  )
})

export default CompactHandoffButton
