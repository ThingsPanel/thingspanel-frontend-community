import { localStg } from '@/utils/storage'
import { createProxyPattern, createServiceConfig } from '~/env.config'

export interface ExternalProvider {
  id: string
  label: string
  kind: 'oidc' | 'wechat-mini' | 'wechat-web'
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
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000)
  })
  if (!response.ok) throw new Error(`AUTH_${response.status}`)
  const envelope = await response.json()
  if (envelope.code !== 200) throw new Error('AUTH_FAILED')
  return envelope.data as T
}
