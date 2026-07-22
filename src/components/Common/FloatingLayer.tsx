/**
 * FloatingLayer - 统一浮层 Portal 组件
 *
 * 将 dropdown / popover / menu 渲染到 document.body，
 * 绕过父级 backdrop-filter 合成层对 backdrop-filter 采样的阻断。
 *
 * 用法：
 *   <FloatingLayer>
 *     <div className="acrylic-floating">...</div>
 *   </FloatingLayer>
 */

import { type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface FloatingLayerProps {
  children: ReactNode
}

export function FloatingLayer({ children }: FloatingLayerProps) {
  return createPortal(children, document.body)
}
