import { localStg } from '@/utils/storage'
import { createProxyPattern, createServiceConfig } from '~/env.config'

export interface ExternalProvider {
  id: string
  label: string
  kind: 'oidc' | 'wechat-mini' | 'wechat-web'
}

export interface LoginOptions {
  password: { enabled: boolean }
  external: { enabled: boolean; providers: ExternalProvider[] }
}

export interface ProviderConfig extends ExternalProvider {
  enabled?: boolean
  issuer?: string
  clientId?: string
  clientSecret?: string
  authorizeUrl?: string
  tokenUrl?: string
  jwksUrl?: string
  redirectUrl?: string
  appId?: string
  appSecret?: string
  tenantIds: string[]
}
export interface ProviderSetting {
  config: ProviderConfig
  revision: number
  validatedRevision: number
  testedRevision: number
  testedAt?: string
  publishedRevision: number
  enabled: boolean
  secretConfigured: boolean
}
export interface ProviderSettingsView {
  editable: boolean
  reason?: string
  callbackUrl: string
  diagnostics?: Array<{ id: string; code: string }>
  providers: ProviderSetting[]
  tenants?: Array<{ id: string; name: string }>
}
export interface ExternalBinding {
  id: string
  provider: string
  enabled: boolean
  self_unlinked: boolean
  created_at: string
}
export type ExternalResult = { status: 'binding_required'; provider: string } | Api.Auth.LoginToken

export function authEndpoint(path: string) {
  const { otherBaseURL } = createServiceConfig(import.meta.env)
  const base = import.meta.env.VITE_HTTP_PROXY === 'Y' ? createProxyPattern() : otherBaseURL.demo || '/api/v1'
  return `${base.replace(/\/$/, '')}${path}`
}

// Auth-only adapter: binding-required and a temporary provider failure must not
// trigger the global session-expired dialog or silently discard a valid session.
export async function externalAuth<T>(path: string, body?: unknown): Promise<T> {
  const token = localStg.get('token')
  const response = await fetch(authEndpoint(path), {
    method: body ? 'POST' : 'GET',
    credentials: 'include',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}`, 'x-token': token } : {})
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000)
  })
  if (!response.ok) {
    const error = new Error(`AUTH_${response.status}`) as Error & { fields?: string[] }
    const details = await response.json().catch(() => null)
    if (Array.isArray(details?.data?.fields))
      error.fields = details.data.fields.filter((field: unknown) => typeof field === 'string')
    throw error
  }
  const envelope = await response.json()
  if (envelope.code !== 200) throw new Error('AUTH_FAILED')
  return envelope.data as T
}

export const getLoginOptions = (channel: 'web' | 'mp-weixin' | 'app') =>
  externalAuth<LoginOptions>(`/auth/login-options?channel=${channel}`)
