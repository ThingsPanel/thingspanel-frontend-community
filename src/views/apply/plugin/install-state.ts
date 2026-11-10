import type { InstallEvent, InstallField, Installation, InstallState } from '@/service/api/plugin-install'

type Tx = (zh: string, en: string) => string

export type TagType = 'default' | 'info' | 'success' | 'warning' | 'error'

/** The three states the product distinguishes (installed / needs configuration / enabled) plus the transient ones. */
export function stateView(state: InstallState | undefined, tx: Tx): { label: string; type: TagType } {
  switch (state) {
    case 'pending_config':
      return { label: tx('待配置', 'Needs configuration'), type: 'warning' }
    case 'installing':
      return { label: tx('处理中', 'Working'), type: 'info' }
    case 'installed':
      return { label: tx('已安装（未启用）', 'Installed (not enabled)'), type: 'default' }
    case 'enabled':
      return { label: tx('已启用', 'Enabled'), type: 'success' }
    case 'failed':
      return { label: tx('失败', 'Failed'), type: 'error' }
    case 'uninstalling':
      return { label: tx('卸载中', 'Uninstalling'), type: 'info' }
    default:
      return { label: tx('未安装', 'Not installed'), type: 'default' }
  }
}

export const isBusy = (i?: Installation | null) => i?.state === 'installing' || i?.state === 'uninstalling'

const ERROR_TEXT: Record<string, [string, string]> = {
  agent_offline: [
    '目标主机上的安装代理不在线，恢复后会自动继续。',
    'The host agent is offline; this continues automatically when it is back.'
  ],
  agent_rejected: [
    '安装代理拒绝了该操作，请检查配置后重试。',
    'The host agent refused the operation. Check the configuration and retry.'
  ],
  identity_failed: ['无法签发插件运行身份。', 'Could not issue the plugin runtime identity.'],
  register_failed: ['无法在平台中登记该服务插件。', 'Could not register the service plugin on the platform.'],
  health_failed: [
    '插件已启动，但健康检查未通过。请检查地址和令牌是否正确，然后重试。',
    'The plugin started but its health check failed. Check the address and token, then retry.'
  ],
  config_missing: ['还有必填项未填写。', 'Required fields are still missing.'],
  plugin_unknown: ['该插件不在已签名的目录中。', 'This plugin is not in the signed catalog.'],
  generation_conflict: ['身份代次冲突，请重试。', 'Identity generation conflict; retry.']
}

export function errorText(code: string, tx: Tx): string {
  const known = ERROR_TEXT[code]
  return known ? tx(known[0], known[1]) : code ? tx(`错误：${code}`, `Error: ${code}`) : ''
}

export const STEPS = ['check', 'identity', 'agent', 'register', 'health'] as const

export function stepLabel(step: string, tx: Tx): string {
  const labels: Record<string, [string, string]> = {
    check: ['检查环境与配置', 'Check environment and configuration'],
    identity: ['签发运行身份', 'Issue runtime identity'],
    agent: ['准备并启动插件容器', 'Prepare and start the plugin container'],
    register: ['在平台登记服务', 'Register the service on the platform'],
    health: ['健康检查', 'Health check'],
    disable: ['停用', 'Disable'],
    uninstall: ['卸载', 'Uninstall']
  }
  const l = labels[step]
  return l ? tx(l[0], l[1]) : step
}

export type StepStatus = 'done' | 'active' | 'failed' | 'waiting' | 'todo'

/** Progress of the latest operation, computed from the step records (newest first as the server returns them). */
export function stepProgress(
  install: Installation,
  events: InstallEvent[] = []
): { step: string; status: StepStatus }[] {
  const outcome: Record<string, InstallEvent> = {}
  for (const e of events.filter(ev => ev.op_id === install.op_id).reverse()) {
    const key = e.step.startsWith('agent') ? 'agent' : e.step
    outcome[key] = e
  }
  const current = install.op_step.startsWith('agent') ? 'agent' : install.op_step
  return STEPS.map(step => {
    const e = outcome[step]
    if (install.state === 'failed' && current === step) return { step, status: 'failed' as StepStatus }
    if (install.state === 'installing' && e?.outcome === 'waiting') return { step, status: 'waiting' as StepStatus }
    if (install.state === 'enabled') return { step, status: 'done' as StepStatus }
    if (e?.outcome === 'ok') return { step, status: 'done' as StepStatus }
    return { step, status: 'todo' as StepStatus }
  })
}

/** Values to send: blank secrets are left out so "unchanged" never overwrites a stored secret. */
export function buildConfig(
  fields: Record<string, InstallField>,
  form: Record<string, string>
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const key of Object.keys(fields)) {
    const v = (form[key] ?? '').trim()
    if (v) out[key] = v
  }
  return out
}

export function missingFields(
  fields: Record<string, InstallField>,
  form: Record<string, string>,
  secretsSet: string[] = []
): string[] {
  return Object.entries(fields)
    .filter(([key, spec]) => spec.required && !(form[key] ?? '').trim() && !(spec.secret && secretsSet.includes(key)))
    .map(([key]) => key)
}

export function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value)
    return (u.protocol === 'http:' || u.protocol === 'https:') && !!u.host
  } catch {
    return false
  }
}
