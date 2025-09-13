/**
 * Card 2.1 属性处理 Hook
 * 提供简化的数据绑定和属性管理
 */

import { computed, ref } from 'vue'

/**
 * 简单的 Card 2.1 属性 Hook
 * 用于处理组件配置和数据绑定
 */
export function useCard2Props<T = Record<string, unknown>>(props: {
  config: T
  data?: Record<string, unknown>
}) {
  // 配置响应式引用
  const config = computed(() => props.config)
  
  // 显示数据响应式引用
  const displayData = computed(() => props.data || {})
  
  return {
    config,
    displayData
  }
}