import { request } from '../request'

/**
 * One-click plugin installation (backend: /api/v1/plugin/catalog and /api/v1/plugin/installs, tenant administrator).
 * Secret values (for example a Home Assistant token) are only ever sent in a request body and are never kept: the
 * server answers with the NAMES of secrets that are set, not their values.
 */

export type InstallState =
  | 'pending_config'
  | 'installing'
  | 'installed'
  | 'enabled'
  | 'failed'
  | 'uninstalling'
  | 'uninstalled'

export interface InstallField {
  required: boolean
  secret: boolean
  description: string
  validate?: string
}

export interface InstallEvent {
  id: number
  op_id: string
  step: string
  outcome: 'ok' | 'failed' | 'waiting'
  code: string
  created_at: string
}

export interface Installation {
  id: string
  plugin_id: string
  state: InstallState
  desired: string
  generation: number
  version: string
  health: '' | 'ok' | 'degraded' | 'error'
  op_id: string
  op_step: string
  error_code: string
  config: Record<string, string>
  secrets_set: string[]
  updated_at: string
  events?: InstallEvent[]
}

export interface CatalogItem {
  id: string
  display_name: string
  version: string
  description: string
  service_identifier: string
  fields: Record<string, InstallField>
  /** R7: a newer catalog version than the installed one exists. */
  update_available?: boolean
  installation: Installation | null
}

const quiet = { silentError: true } as any

/** Error code from the backend envelope, e.g. AGENT_OFFLINE, PLUGIN_INSTALL_NOT_CONFIGURED, INVALID_CONFIG. */
export function installErrorCode(error: any): string {
  return error?.response?.data?.data?.errorCode || ''
}

export function installErrorMessage(error: any): string {
  return error?.response?.data?.message || error?.message || ''
}

export async function getInstallCatalog() {
  return await request.get<CatalogItem[]>('/plugin/catalog', quiet)
}

export async function getInstallation(id: string) {
  return await request.get<Installation>(`/plugin/installs/${id}`, quiet)
}

export async function submitInstall(pluginId: string, config: Record<string, string>, idempotencyKey: string) {
  return await request.post<Installation>(
    '/plugin/installs',
    { plugin_id: pluginId, config },
    { ...quiet, headers: { 'Idempotency-Key': idempotencyKey } }
  )
}

export async function updateInstallConfig(id: string, config: Record<string, string>) {
  return await request.put<Installation>(`/plugin/installs/${id}/config`, { config }, quiet)
}

/** R7: upgrade a running plugin to the catalog version. Async: poll getInstallation until enabled / failed. */
export async function upgradeInstall(id: string) {
  return await request.post<Installation>(`/plugin/installs/${id}/upgrade`, {}, quiet)
}

export async function installAction(id: string, action: 'enable' | 'disable' | 'retry') {
  return await request.post<Installation>(`/plugin/installs/${id}/${action}`, {}, quiet)
}

export async function uninstallPlugin(id: string) {
  return await request.delete<Installation>(`/plugin/installs/${id}`, quiet)
}
