/**
 * 告警状态组件 V2 - 标准4属性实现
 * 用于演示正确的单属性绑定和交互机制
 */

import AlertStatusV2Component from './index.vue'
export { alertStatusV2SettingConfig, type AlertStatusV2Customize } from './settingConfig'
export { alertStatusV2Definition } from './definition'

// 导出Vue组件
export { AlertStatusV2Component }

// 导出组件定义作为默认导出（自动注册系统需要）
export { alertStatusV2Definition as default } from './definition'