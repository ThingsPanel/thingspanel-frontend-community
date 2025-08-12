// src/components/visual-editor/settings/core/registry.ts
import type { SettingPanelRegistration } from '../types'

const settingPanelRegistry = new Map<string, SettingPanelRegistration>()

export function registerSettingPanel(registration: SettingPanelRegistration) {
  if (settingPanelRegistry.has(registration.type)) {
    console.warn(`组件类型 ${registration.type} 的设置面板已被覆盖注册。`)
  }
  settingPanelRegistry.set(registration.type, registration)
}

export function getSettingPanel(type: string): SettingPanelRegistration | undefined {
  return settingPanelRegistry.get(type)
}

export function getAllSettingPanels(): SettingPanelRegistration[] {
  return Array.from(settingPanelRegistry.values())
}
