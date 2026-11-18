import { shallowMount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import CommandDelivery from '@/views/device/details/modules/command-delivery.vue'
import Stats from '@/views/device/details/modules/stats.vue'
import DistributionAndTable from '@/views/device/details/modules/public/distribution-and-table.vue'
import { attributeDataPub, commandDataPub, getAttributeDataSetLogs, getCommandDataSetLogs } from '@/service/api/device'
import { deviceCommandNative } from '@/service/api/device-command-native'

vi.mock('@/locales', () => ({ $t: (key: string) => key }))
vi.mock('@/service/api/device', () => ({
  attributeDataPub: vi.fn(),
  commandDataPub: vi.fn(),
  getAttributeDataSetLogs: vi.fn(),
  getCommandDataSetLogs: vi.fn()
}))
vi.mock('@/service/api/device-command-native', () => ({
  deviceCommandNative: { submit: vi.fn(), list: vi.fn() }
}))
vi.mock('@/service/api/device-runtime-native', () => ({ deviceRuntimeNative: { listReadings: vi.fn() } }))
vi.mock('@/views/device/native-model-consumption', async () => {
  const { hasNativeDeviceBinding, deviceBindingRequiresNativeModel } = await import(
    '@/views/device/native-device-model-contract'
  )
  return {
    hasNativeDeviceBinding,
    deviceBindingRequiresNativeModel,
    nativeCommandOptions: () => [],
    resolveDeviceNativeModel: async () => null
  }
})
vi.mock('@/views/device/details/modules/public/distribution-and-table.vue', () => ({
  default: {
    props: ['manualCommand', 'submitApi', 'fetchDataApi', 'nativeCommandsResolved', 'expect'],
    template: '<div />'
  }
}))

const id = '2cd020b0-8663-4536-96f0-dd0b958d7bfc'
const global = { stubs: { NAlert: true } }

describe('device detail downlink', () => {
  it('shows attribute submission and its live records alongside current readings', () => {
    const wrapper = shallowMount(Stats, { props: { id }, global })
    const [, history] = wrapper.findAllComponents(DistributionAndTable)
    expect(history.props('submitApi')).toBe(attributeDataPub)
    expect(history.props('fetchDataApi')).toBe(getAttributeDataSetLogs)
  })

  it('uses manual command submission and community receipts for an unbound device', () => {
    const wrapper = shallowMount(CommandDelivery, { props: { id, deviceData: { device_config: null } }, global })
    const table = wrapper.getComponent(DistributionAndTable)
    expect(table.props('manualCommand')).toBe(true)
    expect(table.props('submitApi')).toBe(commandDataPub)
    expect(table.props('fetchDataApi')).toBe(getCommandDataSetLogs)
    expect(table.props('expect')).toBe(false)
  })

  it('uses the pinned model workflow for a bound device', async () => {
    vi.mocked(deviceCommandNative.list).mockResolvedValue({ items: [], page: 1, pageSize: 4, total: 0 })
    const wrapper = shallowMount(CommandDelivery, {
      props: { id, deviceData: { device_config: { native_thing_model_snapshot_id: id } } },
      global
    })
    const table = wrapper.getComponent(DistributionAndTable)
    expect(table.props('manualCommand')).toBe(false)
    expect(table.props('nativeCommandsResolved')).toBe(true)
    expect(table.props('expect')).toBe(true)
    expect(table.props('submitApi')).not.toBe(commandDataPub)
    await table.props('fetchDataApi')({ device_id: id })
    expect(deviceCommandNative.list).toHaveBeenCalledWith(id, { page: 1, pageSize: 4 })
  })
})
