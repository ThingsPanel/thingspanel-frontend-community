// 数据适配器统一导出
// Unified exports for data adapters

export * from './GridAdapter'
export * from './CanvasAdapter'
export * from './mockData'

// 适配器注册表
import { GridAdapter } from './GridAdapter'
import { CanvasAdapter } from './CanvasAdapter'

/** 适配器映射表 */
export const ADAPTER_MAP = {
  grid: GridAdapter,
  canvas: CanvasAdapter
} as const

/** 适配器类型 */
export type AdapterType = keyof typeof ADAPTER_MAP

/** 获取适配器实例 */
export function getAdapter(type: AdapterType) {
  const AdapterClass = ADAPTER_MAP[type]
  if (!AdapterClass) {
    throw new Error(`Adapter not found for type: ${type}`)
  }
  return new AdapterClass()
}

/** 检查适配器是否可用 */
export function isAdapterAvailable(type: string): type is AdapterType {
  return type in ADAPTER_MAP
}
