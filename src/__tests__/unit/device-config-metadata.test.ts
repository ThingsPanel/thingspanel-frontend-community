import { beforeEach, expect, it, vi } from 'vitest'
const transport = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn() }))
vi.mock('@/service/request', () => ({ request: transport }))
import {
  readDeviceConfigMetadata,
  saveDeviceConfigMetadata,
  templateSaveError
} from '@/service/api/device-config-metadata'
const tag = `"dc1-${'a'.repeat(64)}"`
beforeEach(() => vi.clearAllMocks())
it('captures each request ETag after the normal JSON transform and does not cross concurrent reads', async () => {
  transport.get.mockImplementation(async (url, config) => {
    const id = url.split('/').at(-1)
    const etag = `"dc1-${(id === 'A' ? 'a' : 'b').repeat(64)}"`
    let data: any = JSON.stringify({ id })
    data = config.transformResponse.call({ transitional: {}, responseType: 'json' }, data, { etag })
    return { data }
  })
  const [a, b] = await Promise.all([readDeviceConfigMetadata('A'), readDeviceConfigMetadata('B')])
  expect(a).toMatchObject({ data: { id: 'A' }, etag: tag })
  expect(b.etag).not.toBe(a.etag)
  transport.put.mockResolvedValue({ data: {} })
  await saveDeviceConfigMetadata({ id: 'A', name: 'only edited field' }, a.etag)
  expect(transport.put).toHaveBeenCalledWith(
    '/device_config',
    { id: 'A', name: 'only edited field' },
    { headers: { 'If-Match': tag }, silentError: true }
  )
})
it.each([null, '', 'W/' + tag, '*'])('never silently downgrades invalid loaded version %s', async value => {
  expect((await saveDeviceConfigMetadata({ id: 'A' }, value)).error).toBeTruthy()
  expect(transport.put).not.toHaveBeenCalled()
})
it('discards the version when the response belongs to another template and maps conflict without raw payload', async () => {
  transport.get.mockImplementation(async (_url, config) => {
    config.transformResponse.call({ transitional: {}, responseType: 'json' }, {}, { etag: tag })
    return { data: { id: 'B' } }
  })
  expect((await readDeviceConfigMetadata('A')).etag).toBeNull()
  expect(templateSaveError({ response: { status: 412, data: { secret: 'not-for-ui' } } })).toBe(
    '模板已被其他操作修改，请重新加载后再保存'
  )
})
