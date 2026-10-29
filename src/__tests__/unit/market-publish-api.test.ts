import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPublishDraft, type PublishDraftRequest } from '@/service/api/market-bundle'

const { post } = vi.hoisted(() => ({ post: vi.fn() }))
vi.mock('@/service/request/request', () => ({ request: { post } }))

const params: PublishDraftRequest = {
  deviceTemplateIds: ['template-1'],
  dashboardIds: [],
  bundleKey: 'test-bundle',
  version: '1.0.0',
  marketToken: 'test-token'
}

describe('market publication response contract', () => {
  beforeEach(() => {
    post.mockReset()
  })

  it('unwraps the shared client result before returning a publication', async () => {
    const data = { bundleKey: 'test-bundle', precheckReport: { passed: true } }
    post.mockResolvedValue({ data, error: null })
    expect(await createPublishDraft(params)).toEqual({ data, error: null, precheckReport: data.precheckReport })
    expect(post).toHaveBeenCalledWith('/device/market/bundles/publish-draft', params)
  })

  it('preserves failed prechecks returned through FlatResult', async () => {
    const precheckReport = { passed: false, errors: [{ code: 'MISSING_FIELD', message: 'Missing field' }] }
    post.mockResolvedValue({
      data: null,
      error: { status: 422, data: { code: 'PRECHECK_FAILED', message: 'Precheck failed', data: { precheckReport } } }
    })
    const result = await createPublishDraft(params)
    expect(result.data).toBeNull()
    expect(result.error?.code).toBe('PRECHECK_FAILED')
    expect(result.precheckReport).toEqual(precheckReport)
  })

  it('reports transport rejection as failure', async () => {
    post.mockRejectedValue(new Error('Connection lost'))
    const result = await createPublishDraft(params)
    expect(result.data).toBeNull()
    expect(result.error?.message).toBe('Connection lost')
  })
})
