import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import DeviceCover from '@/components/dev-card-item/device-cover.vue'
import { fileAssetsNative } from '@/service/api/file-assets-native'

vi.mock('@/service/api/file-assets-native', () => ({ fileAssetsNative: { get: vi.fn() } }))
const options = { global: { stubs: { SvgIcon: true } } }

describe('device card cover', () => {
  it('shows a fallback without a cover and when an image fails', async () => {
    const wrapper = mount(DeviceCover, options)
    expect(wrapper.find('img').exists()).toBe(false)
    expect(fileAssetsNative.get).not.toHaveBeenCalled()
    vi.mocked(fileAssetsNative.get).mockResolvedValueOnce({ asset: { downloadUrl: '/cover.png' } } as any)
    await wrapper.setProps({ assetId: 'cover', name: 'Sensor' })
    await flushPromises()
    expect(wrapper.get('img').attributes('src')).toBe('/cover.png')
    await wrapper.get('img').trigger('error')
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('svg-icon-stub').exists()).toBe(true)
  })

  it('ignores a stale response after switching templates', async () => {
    let resolve: (value: any) => void = () => {}
    vi.mocked(fileAssetsNative.get).mockReturnValueOnce(
      new Promise(done => {
        resolve = done
      })
    )
    const wrapper = mount(DeviceCover, { ...options, props: { assetId: 'old' } })
    await wrapper.setProps({ assetId: null })
    resolve({ asset: { downloadUrl: '/old.png' } })
    await flushPromises()
    expect(wrapper.find('img').exists()).toBe(false)
  })
})
