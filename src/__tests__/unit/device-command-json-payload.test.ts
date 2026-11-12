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

const wrappers: ReturnType<typeof mount>[] = []
afterEach(() => wrappers.splice(0).forEach(wrapper => wrapper.unmount()))

async function page(extra = {}) {
  const submitApi = vi.fn(async () => ({ data: {}, error: null }))
  const wrapper = mount(Distribution, {
    props: {
      id: 'qa',
      isCommand: true,
      buttonName: 'open',
      tableColumns: [],
      submitApi,
      fetchDataApi: async () => ({ data: [] }) as any,
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
  const input = wrapper.findComponent({ name: 'NInput' })
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

it.each([{ nativeCommandsResolved: true }, { nativeOnly: true }, { isCommand: false }])(
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
