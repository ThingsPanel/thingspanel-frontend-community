/**
 * Pure state rules for the template "设备设置" slice.
 *
 * Three independent edits live here and each one is patched on its own:
 * the cover asset and the administrative state sit next to `configuration`,
 * while the auto-register flag and the online policy live inside
 * `configuration.access`. The policy edit splices only the four scalars it
 * owns, so provider parameters (which can hold integers above 2^53) keep the
 * server's original tokens.
 */

import type { DeviceAccessTemplate } from './template-native-transport'
import { readConfigurationObject, replaceConfigurationPath } from './template-configuration-raw'

export type TemplateOnlineMode = 'transport' | 'heartbeat' | 'activity'
export type TemplateAdministrativeState = 'enabled' | 'disabled'

export interface TemplateAccessPolicy {
  autoRegister: boolean
  onlineMode: TemplateOnlineMode
  onlineTimeoutSeconds: number
}

export interface TemplateOnlineModeOption {
  value: TemplateOnlineMode
  label: string
}

export const ONLINE_MODE_OPTIONS: TemplateOnlineModeOption[] = [
  { value: 'transport', label: '连接状态判定' },
  { value: 'heartbeat', label: '心跳判定' },
  { value: 'activity', label: '数据活跃判定' }
]

const MIN_TIMEOUT_SECONDS = 1
const MAX_TIMEOUT_SECONDS = 86400

export function readAccessPolicy(template: DeviceAccessTemplate | null): TemplateAccessPolicy | null {
  const access = template?.configuration?.access
  if (!access) return null
  return {
    autoRegister: Boolean(access.credentialPolicy?.autoRegister),
    onlineMode: (access.onlinePolicy?.mode ?? 'transport') as TemplateOnlineMode,
    onlineTimeoutSeconds: Number(access.onlinePolicy?.timeoutSeconds ?? 0)
  }
}

export function validateAccessPolicy(policy: TemplateAccessPolicy): string | undefined {
  if (!ONLINE_MODE_OPTIONS.some(option => option.value === policy.onlineMode)) return '在线判定方式无效。'
  if (
    !Number.isInteger(policy.onlineTimeoutSeconds) ||
    policy.onlineTimeoutSeconds < MIN_TIMEOUT_SECONDS ||
    policy.onlineTimeoutSeconds > MAX_TIMEOUT_SECONDS
  ) {
    return `在线判定超时必须是 ${MIN_TIMEOUT_SECONDS} 到 ${MAX_TIMEOUT_SECONDS} 之间的整数秒。`
  }
  return undefined
}

/**
 * Produces the exact `configuration` text to PATCH for the policy edit: only
 * the four policy scalars change, every other token stays as the server sent it.
 */
export function buildAccessPolicyConfiguration(rawText: string, policy: TemplateAccessPolicy): string {
  let text = replaceConfigurationPath(
    rawText,
    ['access', 'credentialPolicy', 'autoRegister'],
    policy.autoRegister ? 'true' : 'false'
  )
  text = replaceConfigurationPath(text, ['access', 'onlinePolicy', 'mode'], JSON.stringify(policy.onlineMode))
  text = replaceConfigurationPath(
    text,
    ['access', 'onlinePolicy', 'timeoutSeconds'],
    String(policy.onlineTimeoutSeconds)
  )
  return readConfigurationObject(text)
}

/** Cover and administrative state are patched on their own, never with `configuration`. */
export function buildImageAssetPatch(assetId: string | null): string {
  return `{"imageAssetId":${assetId === null ? 'null' : JSON.stringify(assetId)}}`
}

export function buildAdministrativeStatePatch(state: TemplateAdministrativeState): string {
  if (state !== 'enabled' && state !== 'disabled') throw new Error('Administrative state must be enabled or disabled')
  return `{"administrativeState":${JSON.stringify(state)}}`
}

export function nextAdministrativeState(state: string | undefined): TemplateAdministrativeState {
  return state === 'disabled' ? 'enabled' : 'disabled'
}

/** A disabled template still shows its existing devices; it only blocks new binding. */
export function administrativeStateNotice(state: string | undefined): string {
  return state === 'disabled'
    ? '模板已停用：不会新绑定或新激活设备，已绑定设备保持原状。'
    : '模板已启用：允许新绑定设备。'
}
