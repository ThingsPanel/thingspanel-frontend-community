/**
 * 配置生成模块导出
 * 包含简化的数据源配置生成器
 */

// 配置生成器
export {
  SimpleConfigGenerator,
  simpleConfigGenerator
} from '@/core/data-architecture/config-generation/SimpleConfigGenerator'

// 向后兼容的别名导出
export { simpleConfigGenerator as configGenerator } from '@/core/data-architecture/config-generation/SimpleConfigGenerator'

// 系统对象导出（向后兼容）
import { simpleConfigGenerator } from '@/core/data-architecture/config-generation/SimpleConfigGenerator'

export const dataSourceSystem = {
  // 核心组件
  configGenerator: simpleConfigGenerator
}
