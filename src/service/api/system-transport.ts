/** R6 system-management client (`/api/system/*`, Encore, SYS_ADMIN only). Responses are plain JSON, not data/meta envelopes. */

export type SystemOperationState = 'idle' | 'running' | 'done' | 'failed' | 'aborted'
export type SystemOperationKind = 'restart' | 'backup' | 'restore' | 'upgrade'

export interface SystemOperation {
  id: string
  kind: SystemOperationKind
  scope?: string
  state: SystemOperationState
  step: string
  percent: number
  component?: string
  code?: string
  notes?: string
  started_at?: string
  updated_at?: string
}

export interface SystemComponent {
  name: string
  group: string
  state: string
  reason?: string
}

export interface SystemStatus {
  agent_version: string
  ok: boolean
  components: SystemComponent[]
  checked_at: string
  operation?: SystemOperation
  upgrade?: { id: string; from: string; to: string; phase: string; snapshot?: string; code?: string }
}

export interface CheckConfigResult {
  ok: boolean
  skipped?: boolean
  service?: string
  code?: string
}

export type RestartScope = 'control' | 'full'

export interface UpdateItem {
  kind: 'platform' | 'agent'
  name: string
  current: string
  latest?: string
  update_available: boolean
  can_upgrade: boolean
  instructions?: string
  valid_until?: string
}

export interface UpdatesResult {
  items: UpdateItem[]
  error?: string
}

export interface BackupItem {
  name: string
  size: number
  created_at: string
  platform_version: string
  trigger: string
  history: boolean
  valid: boolean
}

export interface SystemClientOptions {
  fetch: typeof globalThis.fetch
  getToken: () => string | undefined | null
  getLanguage?: () => string | undefined | null
  /** Called whenever any response is a maintenance 503. */
  onMaintenance?: () => void
}

export class SystemApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | undefined,
    /** Fixed machine code from `details.code`, for example `system_busy`. */
    readonly detailCode: string | undefined,
    readonly maintenance: boolean,
    message?: string
  ) {
    super(message || `System request failed (${status})`)
    this.name = 'SystemApiError'
  }

  /** 503 `unavailable`: this installation has no system manager; hide the feature. */
  get unavailable(): boolean {
    return this.status === 503 && !this.maintenance
  }
}

/** True for a `/api` response that means "a system operation is running". */
export function isMaintenanceResponse(status: number, body: unknown): boolean {
  return (
    status === 503 &&
    Boolean(body) &&
    typeof body === 'object' &&
    (body as { maintenance?: unknown }).maintenance === true
  )
}

export function createSystemClient(options: SystemClientOptions) {
  async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers = new Headers({ Accept: 'application/json' })
    const token = options.getToken()
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
      headers.set('x-token', token)
    }
    const language = options.getLanguage?.()
    if (language) headers.set('Accept-Language', language)
    if (body !== undefined) headers.set('Content-Type', 'application/json')

    let response: Response
    try {
      response = await options.fetch(`/api/system${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body)
      })
    } catch {
      throw new SystemApiError(0, undefined, undefined, false, 'System service is unreachable')
    }

    const text = await response.text().catch(() => '')
    let payload: unknown
    try {
      payload = text ? JSON.parse(text) : undefined
    } catch {
      payload = undefined
    }

    if (!response.ok) {
      const maintenance = isMaintenanceResponse(response.status, payload)
      if (maintenance) options.onMaintenance?.()
      const obj = (payload && typeof payload === 'object' ? payload : {}) as {
        code?: unknown
        message?: unknown
        details?: { code?: unknown } | null
      }
      throw new SystemApiError(
        response.status,
        typeof obj.code === 'string' ? obj.code : undefined,
        typeof obj.details?.code === 'string' ? obj.details.code : undefined,
        maintenance,
        typeof obj.message === 'string' ? obj.message : undefined
      )
    }
    return (payload ?? {}) as T
  }

  return {
    status: () => call<SystemStatus>('GET', '/status'),
    checkConfig: () => call<CheckConfigResult>('POST', '/check-config'),
    restart: (scope: RestartScope) => call<{ operation: SystemOperation }>('POST', '/restart', { scope }),
    updates: () => call<UpdatesResult>('GET', '/updates'),
    upgrade: (to: string) => call<{ operation: SystemOperation }>('POST', '/upgrade', { to }),
    listBackups: async () => (await call<{ backups?: BackupItem[] }>('GET', '/backups')).backups ?? [],
    createBackup: () => call<{ operation: SystemOperation }>('POST', '/backups'),
    restoreBackup: (name: string) =>
      call<{ operation: SystemOperation }>('POST', `/backups/${encodeURIComponent(name)}/restore`),
    deleteBackup: (name: string) => call<Record<string, never>>('DELETE', `/backups/${encodeURIComponent(name)}`)
  }
}

export type SystemClient = ReturnType<typeof createSystemClient>
