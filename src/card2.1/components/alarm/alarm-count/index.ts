/**
 * alarm-count 告警计数组件入口
 * 统一导出组件定义、配置和Vue组件
 */

export { default } from './definition'
export { default as AlarmCountComponent } from './index.vue'
export { alarmCountSettingConfig, type AlarmCountConfig, type AlarmCountCustomize } from './settingConfig'
