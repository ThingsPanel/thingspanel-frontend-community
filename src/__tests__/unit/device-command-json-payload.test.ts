import { ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
vi.mock('naive-ui', async () => {
  const { defineComponent, h } = await import('vue')
  const names = [
    'NButton',
    'NCard',
    'NCheckbox',
    'NDataTable',
    'NEmpty',
    'NFlex',
    'NForm',
    'NFormItem',
    'NGrid',
    'NGridItem',
    'NIcon',
    'NInput',
    'NInputNumber',
    'NModal',
    'NPagination',
    'NPopover',
    'NSelect',
    'NSwitch',
    'NTabs',
    'NTabPane'
  ]
  return Object.fromEntries(
    names.map(name => [
      name,
      defineComponent({
        name,
        props: ['disabled', 'show'],
        emits: ['click', 'update:value'],
        setup(props, { slots, emit, expose }) {
          if (name === 'NForm') expose({ validate: async () => undefined, restoreValidation() {} })
          return () =>
            name === 'NButton'
              ? h('button', { disabled: props.disabled, onClick: () => emit('click') }, slots.default?.())
              : h('div', slots.default?.())
        }
      })
    ])
  )
})
vi.mock('@/locales', () => ({ $t: (key: string) => key }))
vi.mock('@sa/hooks', () => ({ useLoading: () => ({ loading: ref(false), startLoading() {}, endLoading() {} }) }))
vi.mock('@/service/api', () => ({
  commandDataById: vi.fn(async () => ({ data: [] })),
  commandDataPub: vi.fn(),
  deviceCustomCommandsIdList: vi.fn(async () => ({ data: [] })),
  getAttributeDataSet: vi.fn(async () => ({ data: [] }))
}))
import Distribution from '@/views/device/details/modules/public/distribution-and-table.vue'

const nativeOptions = [
  {
    data_identifier: 'switch',
    data_name: 'Switch',
    params: JSON.stringify([{ data_identifier: 'enabled', data_name: 'Enabled', param_type: 'Boolean' }])
  }
]
const wrappers: ReturnType<typeof mount>[] = []
afterEach(() => wrappers.splice(0).forEach(wrapper => wrapper.unmount()))

async function page(extra = {}) {
  const submitApi = vi.fn(async (_params: any) => ({ data: {}, error: null }))
  const wrapper = mount(Distribution, {
    props: {
      id: 'qa',
      isCommand: true,
      buttonName: 'open',
      tableColumns: [],
      submitApi,
      fetchDataApi: async () => ({ data: [] }) as any,
      nativeCommandOptions: nativeOptions,
      ...extra
    },
    global: {
      config: { globalProperties: { getPlatform: () => false } as any },
      stubs: { SvgIcon: true }
    }
  })
  wrappers.push(wrapper)
  await flushPromises()
  if (wrapper.props('isCommand')) wrapper.findComponent({ name: 'NSelect' }).vm.$emit('update:value', 'switch')
  wrapper.findComponent({ name: 'NTabs' }).vm.$emit('update:value', 'command')
  await flushPromises()
  const input = wrapper.findAllComponents({ name: 'NInput' }).at(-1)!
  const send = () => wrapper.findAll('button').find(button => button.text() === 'page.irrigation.distribute')!
  return { wrapper, submitApi, input, send }
}

it.each(['false', 'true', '0', 'null', '[1,false]', '"on"', '{"enabled":false}'])(
  'legacy raw JSON %s is submitted unchanged',
  async text => {
    const { input, send, submitApi } = await page()
    input.vm.$emit('update:value', text)
    await flushPromises()
    expect(send().attributes('disabled')).toBeUndefined()
    await send().trigger('click')
    await flushPromises()
    expect(submitApi).toHaveBeenCalledOnce()
    expect(submitApi).toHaveBeenCalledWith({ device_id: 'qa', identify: 'switch', value: text })
  }
)

it.each(['', '   ', '{broken', 'undefined'])('raw command input %j cannot submit', async text => {
  const { input, send, submitApi } = await page()
  input.vm.$emit('update:value', text)
  await flushPromises()
  expect(send().attributes('disabled')).toBeDefined()
  await send().trigger('click')
  expect(submitApi).not.toHaveBeenCalled()
})

it.each([{ nativeCommandsResolved: true }, { nativeOnly: true, nativeCommandsResolved: true }, { isCommand: false }])(
  'typed and attribute payloads stay object-only: %j',
  async mode => {
    const { input, send, submitApi } = await page(mode)
    for (const text of ['false', '0', 'null', '[1]', '"on"']) {
      input.vm.$emit('update:value', text)
      await flushPromises()
      expect(send().attributes('disabled')).toBeDefined()
      await send().trigger('click')
    }
    expect(submitApi).not.toHaveBeenCalled()
    input.vm.$emit('update:value', '{"enabled":false}')
    await flushPromises()
    expect(send().attributes('disabled')).toBeUndefined()
    await send().trigger('click')
    await flushPromises()
    expect(submitApi).toHaveBeenCalledOnce()
  }
)

const requiredOptions = [
  {
    data_identifier: 'switch',
    data_name: 'Switch',
    params: JSON.stringify([
      { data_identifier: 'enabled', data_name: 'Enabled', param_type: 'Boolean' },
      { data_identifier: 'level', data_name: 'Level', param_type: 'Number' },
      { data_identifier: 'reason', data_name: 'Reason', param_type: 'string' },
      { data_identifier: 'mode', data_name: 'Mode', param_type: 'Enum', enum_config: [{ value: 'auto', desc: 'Auto' }] }
    ])
  }
]

it('empty visual parameters show inline errors and make no request', async () => {
  const { wrapper, send, submitApi } = await page({
    nativeCommandsResolved: true,
    nativeCommandOptions: requiredOptions
  })
  wrapper.findComponent({ name: 'NTabs' }).vm.$emit('update:value', 'visual')
  await flushPromises()
  await send().trigger('click')
  await flushPromises()
  expect(submitApi).not.toHaveBeenCalled()
  const feedback = wrapper.findAllComponents({ name: 'NFormItem' }).map(item => item.attributes('feedback'))
  expect(feedback).toContain('Enabled：generate.command-param-required')
  expect(feedback).toContain('Level：generate.command-param-required')
  expect(feedback).toContain('Reason：generate.command-param-required')
})

it('visual false and zero are preserved and a required string must be entered', async () => {
  const { wrapper, send, submitApi } = await page({
    nativeCommandsResolved: true,
    nativeCommandOptions: requiredOptions
  })
  wrapper.findComponent({ name: 'NTabs' }).vm.$emit('update:value', 'visual')
  await flushPromises()
  const selects = wrapper.findAllComponents({ name: 'NSelect' })
  selects[1].vm.$emit('update:value', false)
  selects[2].vm.$emit('update:value', 'auto')
  wrapper.findComponent({ name: 'NInputNumber' }).vm.$emit('update:value', 0)
  await send().trigger('click')
  await flushPromises()
  expect(submitApi).not.toHaveBeenCalled()
  wrapper.findComponent({ name: 'NInput' }).vm.$emit('update:value', 'QA reason')
  await flushPromises()
  await send().trigger('click')
  await flushPromises()
  expect(submitApi).toHaveBeenCalledOnce()
  expect(JSON.parse(submitApi.mock.calls[0][0].value)).toEqual({
    enabled: false,
    level: 0,
    reason: 'QA reason',
    mode: 'auto'
  })
})

it.each(['{}', '{"enabled":"false"}', '{"enabled":false,"extra":1}'])(
  'native raw parameters %s are rejected without transport',
  async text => {
    const { input, send, submitApi } = await page({ nativeCommandsResolved: true })
    input.vm.$emit('update:value', text)
    await flushPromises()
    await send().trigger('click')
    await flushPromises()
    expect(submitApi).not.toHaveBeenCalled()
  }
)

it('known zero-parameter native commands send an explicit empty object', async () => {
  const { wrapper, send, submitApi } = await page({
    nativeCommandsResolved: true,
    nativeCommandOptions: [{ data_identifier: 'switch', params: '[]' }]
  })
  wrapper.findComponent({ name: 'NTabs' }).vm.$emit('update:value', 'visual')
  await flushPromises()
  await send().trigger('click')
  await flushPromises()
  expect(submitApi).toHaveBeenCalledWith({ device_id: 'qa', identify: 'switch', value: '{}' })
})

it('an unavailable native command definition cannot submit arbitrary JSON', async () => {
  const { input, send, submitApi } = await page({ nativeCommandsResolved: true, nativeCommandOptions: [] })
  input.vm.$emit('update:value', '{"enabled":true}')
  await flushPromises()
  await send().trigger('click')
  await flushPromises()
  expect(submitApi).not.toHaveBeenCalled()
})

it.each([
  '{"enabled":false,"level":"0","reason":"QA","mode":"auto"}',
  '{"enabled":false,"level":0,"reason":"QA","mode":"unknown"}',
  '{"enabled":false,"level":0,"reason":null,"mode":"auto"}'
])('native raw typed parameters %s never reach transport', async text => {
  const { input, send, submitApi } = await page({ nativeCommandsResolved: true, nativeCommandOptions: requiredOptions })
  input.vm.$emit('update:value', text)
  await flushPromises()
  await send().trigger('click')
  await flushPromises()
  expect(submitApi).not.toHaveBeenCalled()
})
