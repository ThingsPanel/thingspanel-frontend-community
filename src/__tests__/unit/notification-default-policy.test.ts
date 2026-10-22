import { defineComponent, h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import NotificationDefaultPolicy from '@/views/alarm/notification-group/NotificationDefaultPolicy.vue'
import PopUp from '@/views/alarm/warning-message/components/pop-up.vue'

const policy = {
  nativeGroupId: 'native-1',
  aliasGroupId: 'legacy-1',
  name: 'Main policy',
  groupRevision: 2,
  routeVersion: 3,
  status: 'OPEN',
  ready: true
}
const { getPolicy, putPolicy, addAlarm, editAlarm, authState } = vi.hoisted(() => ({
  getPolicy: vi.fn(),
  putPolicy: vi.fn(),
  addAlarm: vi.fn(),
  editAlarm: vi.fn(),
  authState: { token: 'session-a', userInfo: { tenant_id: 'tenant-a', id: 'user-a', userId: 'user-a' } }
}))

vi.mock('@/service/api/notification', () => ({
  getNotificationDefaultPolicy: getPolicy,
  putNotificationDefaultPolicy: putPolicy
}))
vi.mock('@/service/api/alarm', () => ({ addWarningMessage: addAlarm, editInfo: editAlarm }))
vi.mock('@/store/modules/auth', async () => {
  const { reactive: makeReactive } = await import('vue')
  return { useAuthStore: () => makeReactive(authState) }
})
vi.mock('@/hooks/common/form', async () => {
  const { ref } = await import('vue')
  return {
    useNaiveForm: () => ({ formRef: ref({ validate: (callback: (...args: [null]) => void) => callback(null) }) })
  }
})
vi.mock('naive-ui', async () => ({
  useMessage: () => ({ success: vi.fn(), error: vi.fn() })
}))
vi.mock('@/locales', () => ({ $t: (key: string) => key }))
vi.mock('vue-i18n', async importOriginal => {
  const original = await importOriginal<typeof import('vue-i18n')>()
  return { ...original, useI18n: () => ({ locale: { value: 'en-us' } }) }
})

const SelectStub = defineComponent({
  props: ['value', 'options', 'loading', 'disabled'],
  emits: ['update:value'],
  setup(props, { emit }) {
    return () =>
      h(
        'select',
        {
          value: props.value ?? '',
          disabled: props.disabled,
          onChange: (event: Event) => emit('update:value', (event.target as HTMLSelectElement).value)
        },
        (props.options ?? []).map((option: { label: string; value: string; disabled?: boolean }) =>
          h('option', { value: option.value, disabled: option.disabled }, option.label)
        )
      )
  }
})

const ButtonStub = defineComponent({
  props: ['disabled', 'loading'],
  emits: ['click'],
  setup(props, { emit, slots }) {
    return () =>
      h('button', { disabled: props.disabled, onClick: (event: Event) => emit('click', event) }, slots.default?.())
  }
})
const PassStub = defineComponent({
  setup(_, { slots }) {
    return () => h('div', slots.default?.())
  }
})
const NFormStub = defineComponent({
  setup(_, { expose, slots }) {
    expose({ validate: (callback: (...args: [null]) => void) => callback(null) })
    return () => h('form', slots.default?.())
  }
})
const InputStub = defineComponent({
  props: ['value'],
  emits: ['update:value'],
  setup(props, { emit }) {
    return () =>
      h('input', {
        value: props.value,
        onInput: (event: Event) => emit('update:value', (event.target as HTMLInputElement).value)
      })
  }
})
const stubs = {
  NCard: PassStub,
  NAlert: PassStub,
  NSpace: PassStub,
  NFormItem: PassStub,
  NButton: ButtonStub,
  NSelect: SelectStub,
  NForm: NFormStub,
  NModal: PassStub,
  NInput: InputStub
}

describe('tenant default notification policy', () => {
  beforeEach(() => {
    getPolicy.mockReset()
    putPolicy.mockReset()
    addAlarm.mockReset()
    editAlarm.mockReset()
  })

  it('saves, reads back and clears using the frozen native ID/version contract', async () => {
    getPolicy
      .mockResolvedValueOnce({ data: { version: 4, selected: null, availablePolicies: [policy] }, error: null })
      .mockResolvedValueOnce({ data: { version: 5, selected: policy, availablePolicies: [policy] }, error: null })
      .mockResolvedValueOnce({ data: { version: 6, selected: null, availablePolicies: [policy] }, error: null })
    putPolicy
      .mockResolvedValueOnce({ data: { version: 5, selected: policy, availablePolicies: [policy] }, error: null })
      .mockResolvedValueOnce({ data: { version: 6, selected: null, availablePolicies: [policy] }, error: null })
    const wrapper = mount(NotificationDefaultPolicy, { global: { stubs } })
    await flushPromises()
    const select = wrapper.get('select')
    await select.setValue('native-1')
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(putPolicy).toHaveBeenNthCalledWith(
      1,
      { nativeGroupId: 'native-1', expectedVersion: 4 },
      expect.any(AbortSignal)
    )
    expect(getPolicy).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('Main policy')
    await select.setValue('')
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(putPolicy).toHaveBeenNthCalledWith(2, { nativeGroupId: '', expectedVersion: 5 }, expect.any(AbortSignal))
    expect(getPolicy).toHaveBeenCalledTimes(3)
    wrapper.unmount()
  })

  it('does not retry a stale-version update and tells the user to refresh', async () => {
    getPolicy.mockResolvedValue({ data: { version: 8, selected: null, availablePolicies: [policy] }, error: null })
    putPolicy.mockRejectedValue({ error: { status: 409, message: 'version conflict' } })
    const wrapper = mount(NotificationDefaultPolicy, { global: { stubs } })
    await flushPromises()
    await wrapper.get('select').setValue('native-1')
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(putPolicy).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('The default policy changed elsewhere. Refresh and choose again.')
    wrapper.unmount()
  })

  it('keeps an explicit rule policy ahead of the default and saving the rule never sends a notification', async () => {
    getPolicy.mockResolvedValue({ data: { version: 1, selected: policy, availablePolicies: [policy] }, error: null })
    addAlarm.mockResolvedValue({ data: true, error: null })
    const wrapper = mount(PopUp, {
      props: { visible: true, type: 'add', editData: null },
      global: { stubs }
    })
    await flushPromises()
    const selects = wrapper.findAll('select')
    const policySelect = selects.at(-1)!
    expect(policySelect.text()).toContain('Use tenant default policy (Main policy)')
    await policySelect.setValue('legacy-1')
    await wrapper.findAll('input').at(0)!.setValue('Rule')
    await wrapper
      .findAll('button')
      .find(button => button.text() === 'common.save')!
      .trigger('click')
    await flushPromises()
    expect(addAlarm).toHaveBeenCalledWith(expect.objectContaining({ notification_group_id: 'legacy-1' }))
    expect(addAlarm.mock.calls[0][0]).not.toHaveProperty('send')
    wrapper.findAllComponents(SelectStub).at(-1)!.vm.$emit('update:value', null)
    await flushPromises()
    await wrapper
      .findAll('button')
      .find(button => button.text() === 'common.save')!
      .trigger('click')
    await flushPromises()
    expect(addAlarm).toHaveBeenNthCalledWith(2, expect.objectContaining({ notification_group_id: '' }))
    expect(wrapper.text()).toContain('An explicit policy takes priority')
    wrapper.unmount()
  })

  it('keeps an unavailable explicit rule reference instead of falling back to the default', async () => {
    getPolicy.mockResolvedValue({ data: { version: 1, selected: policy, availablePolicies: [] }, error: null })
    const editData = {
      id: 'rule-1',
      name: 'Rule',
      alarm_level: 'H',
      alarm_repeat_time: 1,
      alarm_keep_time: 1,
      notification_group_id: 'legacy-retired',
      enabled: 'Y',
      description: ''
    }
    const wrapper = mount(PopUp, {
      props: { visible: true, type: 'edit', editData },
      global: { stubs }
    })
    await flushPromises()
    expect(wrapper.findAll('select').at(-1)!.element).toHaveProperty('value', 'legacy-retired')
    expect(wrapper.text()).toContain('This rule’s explicit policy is unavailable')
    wrapper.unmount()
  })
})
