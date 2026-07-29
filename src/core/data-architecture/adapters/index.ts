/**
 * 配置适配器模块导出索引
 * 提供配置版本转换和兼容性处理功能
 */

// ==================== 主要适配器类导出 ====================
export {
  ConfigurationAdapter,
  createConfigurationAdapter,
  type ConversionResult
} from '@/core/data-architecture/adapters/ConfigurationAdapter'

// ==================== 便捷函数导出 ====================
export { detectConfigVersion, upgradeToV2, downgradeToV1 } from '@/core/data-architecture/adapters/ConfigurationAdapter'

// ==================== 适配器版本信息 ====================
export const ADAPTER_VERSION = '1.0.0'

export const ADAPTER_FEATURES = {
  VERSION_DETECTION: true,
  LOSSLESS_UPGRADE: true,
  COMPATIBLE_DOWNGRADE: true,
  BATCH_CONVERSION: true,
  VALIDATION: true
} as const
