import { describe, expect, it, vi } from 'vitest'
import { SystemApiError, createSystemClient, isMaintenanceResponse } from '@/service/api/system-transport'
import { formatBytes } from '@/utils/system-format'

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

function client(fetchImpl: typeof fetch, onMaintenance?: () => void) {
  return createSystemClient({ fetch: fetchImpl, getToken: () => 'tok', getLanguage: () => 'zh-CN', onMaintenance })
}

describe('system API client', () => {
  it('sends auth + JSON body and returns the plain JSON', async () => {
    const fetchMock = vi.fn(async () =>
      json(200, { operation: { id: 'op1', kind: 'restart', state: 'running', step: 's', percent: 0 } })
    )
    const res = await client(fetchMock as unknown as typeof fetch).restart('full')
    expect(res.operation.id).toBe('op1')
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('/api/system/restart')
    expect(init.method).toBe('POST')
    expect(init.body).toBe('{"scope":"full"}')
    const headers = init.headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer tok')
    expect(headers.get('Content-Type')).toBe('application/json')
  })

  it('upgrade posts {to}; backup names are URL-encoded', async () => {
    const fetchMock = vi.fn(async () => json(200, {}))
    const c = client(fetchMock as unknown as typeof fetch)
    await c.upgrade('v1.4.0')
    await c.restoreBackup('a b/c')
    await c.deleteBackup('x')
    const calls = fetchMock.mock.calls as unknown as Array<[string, RequestInit]>
    expect(calls[0][1].body).toBe('{"to":"v1.4.0"}')
    expect(calls[1][0]).toBe('/api/system/backups/a%20b%2Fc/restore')
    expect(calls[2][1].method).toBe('DELETE')
  })

  it('listBackups tolerates an empty body', async () => {
    const c = client((async () => json(200, {})) as unknown as typeof fetch)
    expect(await c.listBackups()).toEqual([])
  })

  it('503 unavailable is flagged so the feature can be hidden', async () => {
    const c = client((async () => json(503, { code: 'unavailable', message: 'no manager' })) as unknown as typeof fetch)
    const err = await c.status().catch(e => e)
    expect(err).toBeInstanceOf(SystemApiError)
    expect(err.unavailable).toBe(true)
    expect(err.maintenance).toBe(false)
  })

  it('503 with maintenance:true calls the maintenance hook and is not "unavailable"', async () => {
    const hook = vi.fn()
    const c = client(
      (async () =>
        json(503, { code: 503, message: 'service unavailable', maintenance: true })) as unknown as typeof fetch,
      hook
    )
    const err = await c.updates().catch(e => e)
    expect(hook).toHaveBeenCalledOnce()
    expect(err.maintenance).toBe(true)
    expect(err.unavailable).toBe(false)
  })

  it('exposes the fixed detail code such as system_busy', async () => {
    const c = client((async () =>
      json(412, {
        code: 'failed_precondition',
        message: 'busy',
        details: { code: 'system_busy' }
      })) as unknown as typeof fetch)
    const err = await c.restart('control').catch(e => e)
    expect(err.status).toBe(412)
    expect(err.detailCode).toBe('system_busy')
  })

  it('network failure becomes a status-0 error', async () => {
    const c = client((async () => {
      throw new TypeError('x')
    }) as unknown as typeof fetch)
    const err = await c.status().catch(e => e)
    expect(err.status).toBe(0)
  })

  it('isMaintenanceResponse only matches 503 + maintenance:true', () => {
    expect(isMaintenanceResponse(503, { maintenance: true })).toBe(true)
    expect(isMaintenanceResponse(503, { code: 'unavailable' })).toBe(false)
    expect(isMaintenanceResponse(500, { maintenance: true })).toBe(false)
    expect(isMaintenanceResponse(503, undefined)).toBe(false)
  })

  it('formatBytes', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1536)).toBe('1.5 KB')
    expect(formatBytes(-1)).toBe('-')
  })
})
