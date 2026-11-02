import { describe, expect, it, vi } from 'vitest'
import { waitForReadingExport } from '@/service/api/device-runtime-export-wait'

const job = (state: string, extra: Record<string, unknown> = {}) => ({
  operationId: 'op1',
  state,
  downloadId: null,
  checksum: null,
  ...extra
})
const fast = { intervalMs: 1, sleep: async () => {} }

describe('waitForReadingExport', () => {
  it('returns a finished job without polling', async () => {
    const client = { getReadingExport: vi.fn() }
    const done = await waitForReadingExport(client, job('succeeded', { downloadId: 'd1' }), fast)
    expect(done.downloadId).toBe('d1')
    expect(client.getReadingExport).not.toHaveBeenCalled()
  })

  it('polls a running job until it succeeds and reports progress', async () => {
    const client = {
      getReadingExport: vi
        .fn()
        .mockResolvedValueOnce(job('running'))
        .mockResolvedValueOnce(job('succeeded', { downloadId: 'd2' }))
    }
    const onProgress = vi.fn()
    const done = await waitForReadingExport(client, job('pending'), { ...fast, onProgress })
    expect(done.downloadId).toBe('d2')
    expect(client.getReadingExport).toHaveBeenCalledWith('op1')
    expect(onProgress).toHaveBeenCalledTimes(2)
  })

  it('throws the server failure detail', async () => {
    const client = { getReadingExport: vi.fn().mockResolvedValue(job('failed', { failure: '导出过大' })) }
    await expect(waitForReadingExport(client, job('running'), fast)).rejects.toThrow('导出过大')
  })

  it('gives up after the timeout', async () => {
    const client = { getReadingExport: vi.fn().mockResolvedValue(job('running')) }
    await expect(
      waitForReadingExport(client, job('running'), { intervalMs: 10, timeoutMs: 30, sleep: async () => {} })
    ).rejects.toThrow('仍在进行')
  })

  it('refuses a succeeded job that has no file', async () => {
    await expect(waitForReadingExport({ getReadingExport: vi.fn() }, job('succeeded'), fast)).rejects.toThrow(
      '没有生成文件'
    )
  })
})
