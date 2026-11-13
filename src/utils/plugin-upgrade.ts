import type { CatalogItem, Installation } from '@/service/api/plugin-install'

export type PluginUpgradePhase = 'idle' | 'starting' | 'installing' | 'success' | 'failed' | 'timeout'

export interface PluginUpgradeRowState {
  phase: PluginUpgradePhase
  /** True when the request itself was refused (UP_TO_DATE, BAD_STATE, AGENT_OFFLINE…): retrying the install is wrong, upgrade can be tried again. */
  apiError?: boolean
  /** Fixed error code (`error_code` of a failed installation, or an API error code such as BAD_STATE). */
  errorCode?: string
  opStep?: string
  /** Version shown after success. */
  version?: string
}

/** Catalog items that can be upgraded: an update exists and the plugin is actually installed. */
export function upgradablePlugins(catalog: CatalogItem[] | undefined | null): CatalogItem[] {
  return (catalog ?? []).filter(item => item.update_available === true && item.installation)
}

/** Buttons are disabled while an upgrade of that row is in flight. */
export function isUpgradeBusy(phase: PluginUpgradePhase | undefined): boolean {
  return phase === 'starting' || phase === 'installing'
}

export type PluginUpgradeApiResult<T> = { data?: T | null; error?: unknown }

export interface PluginUpgraderOptions {
  upgrade: (id: string) => Promise<PluginUpgradeApiResult<Installation>>
  /** Re-runs the failed install flow (`POST …/retry`). */
  retry: (id: string) => Promise<PluginUpgradeApiResult<Installation>>
  getInstallation: (id: string) => Promise<PluginUpgradeApiResult<Installation>>
  errorCode: (error: unknown) => string
  onChange: (id: string, state: PluginUpgradeRowState) => void
  intervalMs?: number
  /** Give up polling after this long; the row then shows "timeout" (outcome unknown, check the plugin page). */
  maxMs?: number
  now?: () => number
  setTimer?: (fn: () => void, ms: number) => unknown
  clearTimer?: (handle: unknown) => void
}

/** Starts a plugin upgrade and polls the installation until enabled (success) or failed. Never touches the maintenance overlay. */
export function createPluginUpgrader(options: PluginUpgraderOptions) {
  const interval = options.intervalMs ?? 2000
  const maxMs = options.maxMs ?? 10 * 60 * 1000
  const now = options.now ?? (() => Date.now())
  const setTimer = options.setTimer ?? ((fn, ms) => setTimeout(fn, ms))
  const clearTimer = options.clearTimer ?? (h => clearTimeout(h as ReturnType<typeof setTimeout>))
  const timers = new Map<string, unknown>()
  const active = new Set<string>()

  function finish(id: string) {
    active.delete(id)
    const h = timers.get(id)
    if (h !== undefined) clearTimer(h)
    timers.delete(id)
  }

  function interpret(id: string, inst: Installation): boolean {
    if (inst.state === 'enabled') {
      options.onChange(id, { phase: 'success', version: inst.version })
      return true
    }
    if (inst.state === 'failed') {
      options.onChange(id, {
        phase: 'failed',
        errorCode: inst.error_code || undefined,
        opStep: inst.op_step || undefined
      })
      return true
    }
    options.onChange(id, { phase: 'installing', opStep: inst.op_step || undefined })
    return false
  }

  /** `installationId` is `catalog.installation.id`. Returns false when a run for it is already active. */
  async function start(installationId: string, mode: 'upgrade' | 'retry' = 'upgrade'): Promise<boolean> {
    if (active.has(installationId)) return false
    active.add(installationId)
    options.onChange(installationId, { phase: 'starting' })
    const res = await (mode === 'retry' ? options.retry : options.upgrade)(installationId)
    if (res.error || !res.data) {
      active.delete(installationId)
      options.onChange(installationId, {
        phase: 'failed',
        errorCode: options.errorCode(res.error) || 'REQUEST_FAILED',
        apiError: true
      })
      return true
    }
    // A fresh upgrade answers state=installing; anything terminal in the very first answer is taken at face value.
    const startedAt = now()
    if (interpret(installationId, res.data)) {
      finish(installationId)
      return true
    }
    const tick = async () => {
      if (!active.has(installationId)) return
      if (now() - startedAt > maxMs) {
        finish(installationId)
        options.onChange(installationId, { phase: 'timeout' })
        return
      }
      const r = await options.getInstallation(installationId)
      if (!active.has(installationId)) return
      if (r.data && interpret(installationId, r.data)) {
        finish(installationId)
        return
      }
      timers.set(installationId, setTimer(tick, interval)) // transient poll errors just retry
    }
    timers.set(installationId, setTimer(tick, interval))
    return true
  }

  function dispose() {
    for (const id of [...active]) finish(id)
  }

  return { start, dispose, isActive: (id: string) => active.has(id) }
}
