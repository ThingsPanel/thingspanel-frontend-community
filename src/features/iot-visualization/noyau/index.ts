/**
 * Noyau (核心引擎) 统一导出
 * 这是核心引擎的公共 API
 */

// 导出类型系统
export * from './types'

// 导出状态管理
export * from './state'

// 导出数据源引擎
export * from './data-sources'

// 导出交互引擎
export * from './interactions'

/**
 * Noyau 版本
 */
export const NOYAU_VERSION = '1.0.0'

/**
 * Noyau 特性
 */
export const NOYAU_FEATURES = {
  /** 状态管理 */
  stateManagement: true,
  /** 数据源引擎 */
  dataSourceEngine: true,
  /** 交互引擎 */
  interactionEngine: true,
  /** 历史记录/撤销重做 */
  historyManagement: true,
  /** 多选操作 */
  multiSelection: true
} as const