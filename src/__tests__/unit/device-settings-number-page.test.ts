import { flushPromises, mount } from '@vue/test-utils'
import naive from 'naive-ui'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import NativeDeviceSettings from '@/views/device/details/modules/native-device-settings.vue'

const deviceId = '7c1bdb51-842a-4baa-8f58-4cb27f7132fd'
const { lifecycle, devices, templates } = vi.hoisted(() => ({
  lifecycle: {
    readAdministrativeState: vi.fn(),
    setAdministrativeState: vi.fn(),
    setTemplateBinding: vi.fn(),
    requestDeletion: vi.fn(),
    changeNumber: vi.fn()
  },
  devices: { readTemplateBinding: vi.fn(), get: vi.fn() },
  templates: { list: vi.fn() }
}))

vi.mock('@/service/api/device-lifecycle-native', () => ({ deviceLifecycleNative: lifecycle }))
vi.mock('@/service/api/device-native', () => ({ deviceNative: devices }))
vi.mock('@/service/api/template-native', () => ({ templateNative: templates }))

const operation = { id: '9b1b3c0e-5f5d-4d0f-9d0e-0c1b6f3a1e11', kind: 'device_renumber', state: 'pending' }

async function mountPage() {
  const wrapper = mount(NativeDeviceSettings, {
    props: { id: deviceId },
    global: { plugins: [naive] },
    attachTo: document.body
  })
  await flushPromises()
  return wrapper
}

async function fill(wrapper: Awaited<ReturnType<typeof mountPage>>, number: string, reason: string) {
  const inputs = wrapper.findAll('input')
  const numberInput = inputs.find(input => input.attributes('placeholder') === '新编号')!
  const reasonInput = inputs.find(input => input.attributes('placeholder') === '变更原因')!
  await numberInput.setValue(number)
  await reasonInput.setValue(reason)
}

const submit = (wrapper: Awaited<ReturnType<typeof mountPage>>) =>
  wrapper
    .findAll('button')
    .find(button => button.text().includes('变更编号'))!
    .trigger('click')

describe('device settings page: number change', () => {
  beforeEach(() => {
    Object.values(lifecycle).forEach(fn => fn.mockReset())
    lifecycle.readAdministrativeState.mockResolvedValue({ state: { state: 'enabled' }, etag: '"sha256-a"' })
    devices.readTemplateBinding.mockReset().mockResolvedValue({ binding: { templateId: null }, etag: '"sha256-b"' })
    devices.get
      .mockReset()
      .mockResolvedValue({ device: { deviceNumber: 'SN-001', resourceVersion: 7 }, etag: '"sha256-c"' })
    templates.list.mockReset().mockResolvedValue({ items: [] })
  })

  it('shows the current number and submits the version-guarded request with a key', async () => {
    lifecycle.changeNumber.mockResolvedValue({ operation })
    const wrapper = await mountPage()
    expect(wrapper.text()).toContain('当前编号：SN-001')
    await fill(wrapper, 'SN-002', '换标签')
    await submit(wrapper)
    await flushPromises()
    expect(lifecycle.changeNumber).toHaveBeenCalledTimes(1)
    const [id, body, key] = lifecycle.changeNumber.mock.calls[0]
    expect(id).toBe(deviceId)
    expect(body).toEqual({ deviceNumber: 'SN-002', expectedDeviceVersion: 7, reason: '换标签' })
    expect(key).toMatch(/^[A-Za-z0-9._:-]{8,128}$/)
  })

  it('refuses an empty reason or an unchanged number without calling the server', async () => {
    const wrapper = await mountPage()
    await fill(wrapper, 'SN-001', '换标签')
    await submit(wrapper)
    expect(wrapper.text()).toContain('请输入与当前不同的新编号')
    await fill(wrapper, 'SN-002', '')
    await submit(wrapper)
    expect(wrapper.text()).toContain('请填写变更原因')
    expect(lifecycle.changeNumber).not.toHaveBeenCalled()
  })

  it('replays the identical request with the same key after an unknown outcome', async () => {
    lifecycle.changeNumber.mockRejectedValueOnce(new TypeError('network down')).mockResolvedValue({ operation })
    const wrapper = await mountPage()
    await fill(wrapper, 'SN-002', '换标签')
    await submit(wrapper)
    await flushPromises()
    expect(wrapper.text()).toContain('请求结果未知')
    await submit(wrapper)
    await flushPromises()
    expect(lifecycle.changeNumber).toHaveBeenCalledTimes(2)
    const [first, second] = lifecycle.changeNumber.mock.calls
    expect(second[2]).toBe(first[2])
    expect(second[1]).toEqual(first[1])
  })

  it('shows a taken number as a conflict', async () => {
    lifecycle.changeNumber.mockRejectedValue(
      Object.assign(new Error('device number is already reserved'), { status: 409 })
    )
    const wrapper = await mountPage()
    await fill(wrapper, 'SN-002', '换标签')
    await submit(wrapper)
    await flushPromises()
    expect(wrapper.text()).toContain('device number is already reserved')
  })
})
