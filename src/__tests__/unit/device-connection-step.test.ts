import { defineComponent, h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ConnectionStep from '@/views/device/manage/modules/add-devices-step2.vue'

const { form, info, update } = vi.hoisted(() => ({ form: vi.fn(), info: vi.fn(), update: vi.fn() }))
vi.mock('@/service/api/device', () => ({
  devicCeonnectForm: form,
  getDeviceConnectInfo: info,
  updateDeviceVoucher: update
}))
vi.mock('@/locales', () => ({ $t: (key: string) => key }))
const Container = defineComponent({
  setup:
    (_, { slots }) =>
    () =>
      h('div', slots.default?.())
})
const Form = defineComponent({
  setup(_, { slots, expose }) {
    expose({ validate: async () => {} })
    return () => h('div', slots.default?.())
  }
})
const Button = defineComponent({
  props: ['disabled'],
  emits: ['click'],
  setup:
    (props, { slots, emit }) =>
    () =>
      h('button', { disabled: props.disabled, onClick: () => emit('click') }, slots.default?.())
})

function page() {
  const nextCallback = vi.fn()
  const wrapper = mount(ConnectionStep, {
    props: { device_id: 'child', formData: { existing: 'keep' }, nextCallback, setIsSuccess: vi.fn() },
    global: {
      stubs: {
        NForm: Form,
        NCard: Container,
        NSpin: Container,
        NScrollbar: Container,
        NDescriptions: Container,
        NDescriptionsItem: Container,
        NAlert: Container,
        NButton: Button,
        NFormItem: Container,
        NInput: true,
        NSelect: true
      }
    }
  })
  return { wrapper, nextCallback }
}

beforeEach(() => {
  vi.clearAllMocks()
  info.mockResolvedValue({ data: { 连接方式: '通过网关接入' } })
  update.mockResolvedValue({ data: {}, error: null })
})

describe('device connection step', () => {
  it('completes a successful null child form without overwriting its credentials', async () => {
    form.mockResolvedValue({ data: null, error: null })
    const { wrapper, nextCallback } = page()
    await flushPromises()
    expect(wrapper.text()).toContain('通过网关接入')
    expect(wrapper.text()).toContain('common.complete')
    await wrapper.get('button').trigger('click')
    expect(nextCallback).toHaveBeenCalledOnce()
    expect(update).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('does not confuse a failed form request with a device requiring no credentials', async () => {
    form.mockResolvedValueOnce({ error: new Error('unavailable') }).mockResolvedValueOnce({ data: null })
    const { wrapper, nextCallback } = page()
    await flushPromises()
    expect(wrapper.text()).toContain('connectionLoadFailed')
    expect(wrapper.findAll('button').at(-1)?.attributes('disabled')).toBeDefined()
    expect(nextCallback).not.toHaveBeenCalled()
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(wrapper.text()).not.toContain('connectionLoadFailed')
    expect(wrapper.get('button').attributes('disabled')).toBeUndefined()
    wrapper.unmount()
  })

  it('waits for both requests and preserves the ordinary credential save path', async () => {
    let finish!: (value: unknown) => void
    form.mockReturnValue(
      new Promise(resolve => {
        finish = resolve
      })
    )
    const { wrapper, nextCallback } = page()
    expect(wrapper.get('button').attributes('disabled')).toBeDefined()
    finish({ data: [{ type: 'input', dataKey: 'username', label: 'Username' }] })
    await flushPromises()
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(update).toHaveBeenCalledWith({ device_id: 'child', voucher: '{"username":""}' })
    expect(nextCallback).toHaveBeenCalledOnce()
    wrapper.unmount()
  })
})
