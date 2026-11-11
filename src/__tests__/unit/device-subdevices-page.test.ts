import { flushPromises, mount } from '@vue/test-utils'
import naive from 'naive-ui'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Subdevices from '@/views/device/details/modules/native-subdevices.vue'

const gatewayId = '7c1bdb51-842a-4baa-8f58-4cb27f7132fd'
const childId = '11111111-842a-4baa-8f58-4cb27f7132fd'
const { device, lifecycle } = vi.hoisted(() => ({
  device: { listSubdevices: vi.fn(), list: vi.fn() },
  lifecycle: { readGatewayMembership: vi.fn(), setGatewayMembership: vi.fn() }
}))

vi.mock('@/service/api/device-native', () => ({ deviceNative: device }))
vi.mock('@/service/api/device-lifecycle-native', () => ({ deviceLifecycleNative: lifecycle }))

const child = {
  id: childId,
  name: 'sensor-1',
  deviceNumber: 'N1',
  deviceKind: 'subdevice',
  administrativeState: 'enabled',
  gatewayId
}
const page = (items: unknown[]) => ({ items, page: 1, pageSize: 20, total: items.length })

async function mountPage() {
  const wrapper = mount(Subdevices, { props: { id: gatewayId }, global: { plugins: [naive] } })
  await flushPromises()
  return wrapper
}

describe('device sub-devices page (native gateway membership)', () => {
  beforeEach(() => {
    device.listSubdevices.mockReset().mockResolvedValue(page([child]))
    device.list.mockReset().mockResolvedValue(page([]))
    lifecycle.readGatewayMembership.mockReset().mockResolvedValue({ etag: '"v1"' })
    lifecycle.setGatewayMembership.mockReset().mockResolvedValue({ operation: { id: 'op-1', state: 'pending' } })
  })

  it('lists the gateway sub-devices from the native API', async () => {
    const wrapper = await mountPage()
    expect(device.listSubdevices).toHaveBeenCalledWith(gatewayId, { page: 1, pageSize: 20, search: '' })
    expect(wrapper.text()).toContain('sensor-1')
  })

  it('shows the read error and no rows when listing fails', async () => {
    device.listSubdevices.mockRejectedValue(new Error('boom'))
    const wrapper = await mountPage()
    expect(wrapper.text()).toContain('boom')
    expect(wrapper.text()).not.toContain('sensor-1')
  })

  it('unbind reads the current ETag, then sends a null membership under If-Match and reloads', async () => {
    const wrapper = await mountPage()
    ;(wrapper.vm as any).unbind(child)
    await flushPromises()
    expect(lifecycle.readGatewayMembership).toHaveBeenCalledWith(childId)
    const [id, body, etag, key] = lifecycle.setGatewayMembership.mock.calls[0]
    expect([id, body, etag]).toEqual([childId, { gatewayId: null, subdeviceAddress: null }, '"v1"'])
    expect(typeof key).toBe('string')
    expect(device.listSubdevices).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('op-1')
  })

  it('bind requires a device and an address before any request is made', async () => {
    const wrapper = await mountPage()
    const vm = wrapper.vm as any
    vm.submitBind()
    await flushPromises()
    expect(vm.writeError).toBe('请选择要绑定的设备')
    vm.selectedId = childId
    vm.submitBind()
    expect(vm.writeError).toBe('请填写子设备地址')
    expect(lifecycle.setGatewayMembership).not.toHaveBeenCalled()
    vm.address = ' 0x01 '
    vm.submitBind()
    await flushPromises()
    expect(lifecycle.setGatewayMembership.mock.calls[0][1]).toEqual({ gatewayId, subdeviceAddress: '0x01' })
  })
})
