/**
 * 精简数据源系统 - 仅保留核心配置生成功能
 * 作为新架构的兼容层存在
 */

// 🎯 核心配置生成器
import { simpleConfigGenerator } from './core/simple-config-generator'

// 🎯 核心组件导出
export { SimpleConfigGenerator, simpleConfigGenerator } from './core/simple-config-generator'

// 🏗️ 核心类型定义导出
export * from './types/simple-types'

// 📋 系统集成接口（仅用于初始化检查）
export const dataSourceSystem = {
  // 核心组件
  configGenerator: simpleConfigGenerator
}
