/**
 * gauge-dashboard-v2 仪表盘组件导出
 * Card2.1标准组件导出文件 - 使用 vue-echarts 重写版本
 */

// 导入组件定义作为默认导出
import gaugeDashboardV2Definition from './definition'

// 默认导出组件定义（自动注册系统需要）
export default gaugeDashboardV2Definition

// 导出组件定义和注册函数
export { gaugeDashboardV2Definition }

// 导出类型定义
export type { GaugeDashboardV2Config, GaugeDashboardCustomize, GaugeColorRange } from './settingConfig'

// 导出设置配置
export { gaugeDashboardV2SettingConfig, customConfig } from './settingConfig'

// 导出组件实现
export { default as GaugeDashboardV2Card } from './index.vue'
export { default as GaugeDashboardV2Setting } from './setting.vue'
export { default as GaugeDashboardV2Test } from './GaugeDashboardV2Test.vue'