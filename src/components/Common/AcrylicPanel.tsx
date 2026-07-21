/**
 * AcrylicPanel - 通用亚克力玻璃浮层容器
 *
 * 适用于：Settings、Dropdown、Dialog、Popup 等二级浮层。
 * 视觉风格：Apple Vision Pro 亚克力窗口质感。
 */

import { forwardRef, type ReactNode, type HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

interface AcrylicPanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /** 圆角大小，默认 rounded-3xl */
  rounded?: '2xl' | '3xl'
  /** 是否添加 inset 高光，默认 true */
  highlight?: boolean
}

const ROUNDED = {
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
}

export const AcrylicPanel = forwardRef<HTMLDivElement, AcrylicPanelProps>(
  ({ children, rounded = '3xl', highlight = true, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-white/45',
          'backdrop-blur-2xl',
          'border border-white/50',
          ROUNDED[rounded],
          'shadow-xl',
          highlight && 'shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    )
  },
)

AcrylicPanel.displayName = 'AcrylicPanel'
