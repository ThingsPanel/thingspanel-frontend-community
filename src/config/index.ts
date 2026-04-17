/**
 * 配置模块统一导出
 * Configuration Module Unified Exports
 */

// 导出安全配置
export * from './security'

/**
 * 配置模块信息
 * Configuration Module Information
 */
export const configInfo = {
  version: '1.0.0',
  description: 'ThingsPanel Frontend Configuration Module',
  modules: ['security'],
  lastUpdated: new Date().toISOString()
} as const
