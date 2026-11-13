/** Maintenance-overlay logic: poll `/system-status/status.json` and classify the outcome. */

export interface MaintenanceStatus {
  id?: string
  kind?: string
  state: 'idle' | 'running' | 'done' | 'failed' | 'aborted' | string
  step?: string
  percent?: number
  component?: string
  code?: string
}

export type MaintenanceOutcome = 'running' | 'done' | 'rolled_back' | 'needs_human' | 'failed'

export const STATUS_URL = '/system-status/status.json'

/** Map a status document to what the overlay should show. Never suggests retrying. */
export function classifyMaintenance(status: MaintenanceStatus | undefined): MaintenanceOutcome {
  if (!status) return 'running'
  if (status.state === 'done') return 'done'
  if (status.state === 'failed' || status.state === 'aborted') {
    const code = status.code ?? ''
    if (code.endsWith('needs_human')) return 'needs_human'
    if (code.endsWith('rolled_back')) return 'rolled_back'
    return 'failed'
  }
  // idle or running (idle right after a restart of the agent still means "not finished for us")
  return 'running'
}

export function clampPercent(value: unknown): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0
  return Math.max(0, Math.min(100, Math.round(n)))
}

export interface MaintenancePollerOptions {
  fetch: typeof globalThis.fetch
  intervalMs?: number
  onStatus: (status: MaintenanceStatus) => void
  /** Called on every poll that could not produce a status (nginx/agent restarting). */
  onUnreachable?: () => void
  setTimer?: (fn: () => void, ms: number) => unknown
  clearTimer?: (handle: unknown) => void
}

/**
 * Polls the public status file every 2 s. Stops itself on a terminal state
 * (done / failed / aborted) after reporting it once.
 */
export function createMaintenancePoller(options: MaintenancePollerOptions) {
  const interval = options.intervalMs ?? 2000
  const setTimer = options.setTimer ?? ((fn, ms) => setTimeout(fn, ms))
  const clearTimer = options.clearTimer ?? (h => clearTimeout(h as ReturnType<typeof setTimeout>))
  let handle: unknown
  let running = false

  async function tick() {
    if (!running) return
    try {
      const res = await options.fetch(STATUS_URL, { cache: 'no-store', headers: { Accept: 'application/json' } })
      if (!res.ok) throw new Error(`status ${res.status}`)
      const doc = (await res.json()) as MaintenanceStatus
      if (!doc || typeof doc.state !== 'string') throw new Error('invalid status document')
      if (!running) return
      options.onStatus(doc)
      if (classifyMaintenance(doc) !== 'running') {
        running = false
        return
      }
    } catch {
      options.onUnreachable?.()
    }
    if (running) handle = setTimer(tick, interval)
  }

  return {
    start() {
      if (running) return
      running = true
      void tick()
    },
    stop() {
      running = false
      if (handle !== undefined) clearTimer(handle)
      handle = undefined
    },
    get running() {
      return running
    }
  }
}
