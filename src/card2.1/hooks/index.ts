/**
 * Card 2.1 Hooks 入口
 * 提供组件树管理和 Visual Editor 集成功能
 */

// 🔥 简化：只保留核心Hook
export { useComponentTree } from '@/card2.1/hooks/useComponentTree'
export { useCard2Props } from '@/card2.1/hooks/useCard2Props'

// 导出类型
export type { ComponentTreeOptions, FilteredComponentTree } from '@/card2.1/hooks/useComponentTree'
