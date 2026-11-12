import { defineComponent, h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ModelEditorError } from '@/views/device/template/native-model-errors'

vi.mock('@/locales', () => ({ $t: (key: string) => key }))
vi.mock('@/service/api', () => ({
  getTemplat: vi.fn(),
  putTemplat: vi.fn(),
  telemetryApi: vi.fn(),
  attributesApi: vi.fn(),
  eventsApi: vi.fn(),
  commandsApi: vi.fn()
}))
vi.mock('@/components/thingsvis/ThingsVisWidget.vue', () => ({
  default: defineComponent({
    props: ['mode', 'config'],
    emits: ['save'],
    setup(props, { emit, expose }) {
      expose({ triggerSave: () => emit('save', { nodes: [], canvas: { mode: 'grid', width: 375, height: 900 } }) })
      return () => h('div', { 'data-mode': props.mode })
    }
  })
}))
vi.mock('naive-ui', () => {
  const Slot = defineComponent({
    setup:
      (_, { slots }) =>
      () =>
        h('div', [slots.default?.(), slots['header-extra']?.(), slots.footer?.()])
  })
  const Button = defineComponent({
    props: ['disabled'],
    emits: ['click'],
    setup:
      (props, { slots, emit }) =>
      () =>
        h('button', { disabled: props.disabled, onClick: () => emit('click') }, slots.default?.())
  })
  const Modal = defineComponent({
    props: ['show'],
    setup:
      (props, { slots }) =>
      () =>
        props.show ? h('div', { 'data-modal': true }, slots.default?.()) : null
  })
  const Select = defineComponent({
    props: ['value', 'options', 'disabled'],
    emits: ['update:value'],
    setup:
      (props, { emit }) =>
      () =>
        h(
          'select',
          {
            value: props.value,
            disabled: props.disabled,
            onChange: (event: Event) => emit('update:value', Number((event.target as HTMLSelectElement).value))
          },
          props.options.map((option: any) => h('option', { value: option.value }, option.label))
        )
  })
  return {
    NButton: Button,
    NModal: Modal,
    NSelect: Select,
    NCard: Slot,
    NSpace: Slot,
    NEmpty: Slot,
    NSpin: Slot,
    NIcon: Slot
  }
})

import AppChart from '@/views/device/template/components/step/app-chart-config.vue'
import WebChart from '@/views/device/template/components/step/web-chart-config.vue'

const wrappers: ReturnType<typeof mount>[] = []
const errors = vi.fn()
beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  window.$message = { success: vi.fn(), error: errors } as unknown as typeof window.$message
})
afterEach(() => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount())
  vi.restoreAllMocks()
})
function fixture(component: typeof AppChart, key: 'appChartConfig' | 'webChartConfig') {
  let revision = 1
  let resources: any = {
    appChartConfig: null,
    webChartConfig: null,
    [key]: { nodes: [], canvas: { mode: 'grid', width: 375, height: 844 }, refreshInterval: 5000 }
  }
  const copy = (value: any) => JSON.parse(JSON.stringify(value))
  const port = {
    load: vi.fn(async () => ({ resources: copy(resources), revision })),
    update: vi.fn(async (mutator: (current: any) => any, options: any) => {
      if (
        options.openedRevision !== revision &&
        JSON.stringify(options.openedValue) !== JSON.stringify(resources[key])
      ) {
        throw new ModelEditorError('图表配置已被其他编辑者修改，请重新打开图表后再保存。')
      }
      resources = mutator(copy(resources))
      revision += 1
      return { resources: copy(resources), revision }
    })
  }
  const wrapper = mount(component, {
    props: {
      deviceTemplateId: 'qa-model',
      stepCurrent: 1,
      modalVisible: true,
      isEditMode: true,
      nativeResourcePort: port,
      nativePlatformFields: [],
      nativeResourcesRevision: 1
    }
  })
  wrappers.push(wrapper)
  return {
    wrapper,
    port,
    read: () => resources[key],
    remote: (interval: number) => {
      revision += 1
      resources[key] = { ...resources[key], refreshInterval: interval }
      return revision
    }
  }
}
async function button(wrapper: ReturnType<typeof mount>, text: string) {
  const found = wrapper.findAll('button').find(item => item.text() === text)
  expect(found, text).toBeTruthy()
  await found!.trigger('click')
  await flushPromises()
}
it('App frequency is edited inside the modal and saved with layout', async () => {
  const f = fixture(AppChart, 'appChartConfig')
  await flushPromises()
  expect(f.wrapper.find('select').exists()).toBe(false)
  await button(f.wrapper, '编辑配置')
  await f.wrapper.get('select').setValue('10000')
  await button(f.wrapper, '保存配置')
  expect(f.read().refreshInterval).toBe(10000)
  expect(f.read().canvas.height).toBe(900)
  expect(f.wrapper.find('[data-modal]').exists()).toBe(false)
  expect(f.wrapper.text()).toContain('10秒')
})
it('cancel discards App frequency draft and reopening reads the current server value', async () => {
  const f = fixture(AppChart, 'appChartConfig')
  await flushPromises()
  await button(f.wrapper, '编辑配置')
  await f.wrapper.get('select').setValue('10000')
  await button(f.wrapper, '取消')
  expect(f.port.update).not.toHaveBeenCalled()
  f.remote(30000)
  await button(f.wrapper, '编辑配置')
  expect((f.wrapper.get('select').element as HTMLSelectElement).value).toBe('30000')
})
describe.each([
  { component: AppChart, key: 'appChartConfig' as const, label: 'App' },
  { component: WebChart, key: 'webChartConfig' as const, label: 'Web' }
])('$label editor session', ({ component, key }) => {
  it('does not open stale editor content after a failed fresh read', async () => {
    const f = fixture(component, key)
    await flushPromises()
    f.port.load.mockRejectedValueOnce(new Error('offline'))
    await button(f.wrapper, '编辑配置')
    expect(f.wrapper.find('[data-mode="editor"]').exists()).toBe(false)
    expect(f.port.update).not.toHaveBeenCalled()
    expect(errors).toHaveBeenCalled()
  })
  it('keeps original CAS baseline while editing and refuses a remote conflicting update', async () => {
    const f = fixture(component, key)
    await flushPromises()
    await button(f.wrapper, '编辑配置')
    if (key === 'appChartConfig') await f.wrapper.get('select').setValue('10000')
    const loads = f.port.load.mock.calls.length
    await f.wrapper.setProps({ nativeResourcesRevision: f.remote(30000) })
    await flushPromises()
    expect(f.port.load.mock.calls.length).toBe(loads)
    await button(f.wrapper, '保存配置')
    expect(f.port.update.mock.calls[0][1].openedRevision).toBe(1)
    expect(f.read().refreshInterval).toBe(30000)
    expect(f.wrapper.find('[data-mode="editor"]').exists()).toBe(true)
    expect(errors).toHaveBeenCalledWith(expect.stringContaining('重新打开图表'))
  })
})
