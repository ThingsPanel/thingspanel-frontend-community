/**
 * Card2.1 核心功能导出
 */

export * from './types'
export * from './registry'
export * from './interaction-types'
export * from './interaction-manager'

// 数据源中心相关导出
export * from './data-source-center'
export * from './data-sources'

// 初始化数据源系统
import { initializeDataSources } from './data-sources'

// 自动初始化数据源
initializeDataSources()
