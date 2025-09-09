/**
 * 全局脚本处理引擎
 * 提供安全的JavaScript脚本执行环境，支持模板、沙箱和扩展功能
 *
 * 主要功能：
 * - 安全的脚本执行环境
 * - 脚本模板管理
 * - 执行上下文管理
 * - 错误处理和日志
 * - 异步脚本支持
 */

export * from './types'
export * from './executor'
export * from './sandbox'
export * from './template-manager'
export * from './context-manager'
export * from './script-engine'

// 导出默认脚本引擎实例
export { defaultScriptEngine } from './script-engine'
