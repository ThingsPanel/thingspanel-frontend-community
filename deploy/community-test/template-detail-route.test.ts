import { reactive } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
const state = vi.hoisted(() => ({ route: null as any, push: vi.fn() }))
vi.mock('vue-router', () => ({ useRoute: () => state.route }))
vi.mock('@/hooks/common/router', () => ({ useRouterPush: () => ({ routerPushByKey: state.push }) }))
vi.mock('@/locales', () => ({ $t: (key: string) => key }))
vi.mock('@/service/api/device', () => ({ deviceConfigInfo: vi.fn() }))
vi.mock('@/service/api/native-template-binding', () => ({ loadPublishedSnapshot: vi.fn() }))
vi.mock('@/views/device/config-detail/modules/associated-devices.vue', () => ({
  default: {
    name: 'AssociatedDevices',
    props: ['deviceConfigId'],
    template: '<div class="associated">{{ deviceConfigId }}</div>'
  }
}))
vi.mock('@/views/device/config-detail/modules/setting-info.vue', () => ({
  default: { name: 'SettingInfo', props: ['configInfo'], template: '<div class="settings">{{ configInfo.id }}</div>' }
}))
vi.mock('@/views/device/config-detail/modules/data-handle.vue', () => ({ default: { template: '<div/>' } }))
vi.mock('@/views/device/config-detail/modules/extend-info.vue', () => ({ default: { template: '<div/>' } }))
vi.mock('@/views/device/config-detail/modules/attribute-info.vue', () => ({ default: { template: '<div/>' } }))
vi.mock('@/views/device/config-detail/modules/connection-info.vue', () => ({ default: { template: '<div/>' } }))
vi.mock('@/views/device/config-detail/modules/alarm-info.vue', () => ({ default: { template: '<div/>' } }))
vi.mock('@/views/device/config-detail/modules/automate.vue', () => ({ default: { template: '<div/>' } }))
vi.mock('naive-ui', async () => {
  const { defineComponent, h } = await import('vue')
  return {
    NAlert: defineComponent({
      setup:
        (_, { slots }) =>
        () =>
          h('aside', slots.default?.())
    }),
    NButton: defineComponent({
      props: ['disabled'],
      emits: ['click'],
      setup:
        (props, { slots, emit }) =>
        () =>
          h('button', { disabled: props.disabled, onClick: () => emit('click') }, slots.default?.())
    })
  }
})
import Detail from '@/views/device/config-detail/index.vue'
import { deviceConfigInfo } from '@/service/api/device'
import { loadPublishedSnapshot } from '@/service/api/native-template-binding'
const wrappers: ReturnType<typeof mount>[] = []
beforeEach(() => {
  vi.clearAllMocks()
  state.route = reactive({ query: { id: 'A' } })
  vi.mocked(loadPublishedSnapshot).mockResolvedValue({ model: { name: 'bound model' } } as any)
})
afterEach(() => wrappers.splice(0).forEach(wrapper => wrapper.unmount()))
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(done => {
    resolve = done
  })
  return { promise, resolve }
}
function result(id: string, bound = false) {
  return {
    data: {
      id,
      name: 'Template ' + id,
      ...(bound ? { native_thing_model_id: 'model-' + id, native_thing_model_revision: 1 } : {})
    },
    error: null
  }
}
function page() {
  const wrapper = mount(Detail, {
    global: {
      stubs: {
        NCard: {
          props: ['title'],
          template: '<section><h1>{{ title }}</h1><slot name="header-extra"/><slot/></section>'
        },
        NTabs: { props: ['value'], template: '<div class="tabs"><slot/></div>' },
        NTabPane: { template: '<div><slot/></div>' },
        NTag: { template: '<div><slot/></div>' },
        RouterLink: { template: '<a><slot/></a>' }
      }
    }
  })
  wrappers.push(wrapper)
  return wrapper
}
const editButton = (wrapper: ReturnType<typeof mount>) =>
  wrapper.findAll('button').find(button => button.text() === 'common.edit')!

it('same component A to B clears old child pages, then edits only B', async () => {
  const b = deferred<any>()
  vi.mocked(deviceConfigInfo).mockImplementation(({ id }: any) =>
    id === 'B' ? b.promise : Promise.resolve(result(id))
  )
  const wrapper = page()
  await flushPromises()
  const oldSettings = wrapper.findComponent({ name: 'SettingInfo' }).vm
  expect(wrapper.find('h1').text()).toBe('Template A')
  state.route.query.id = 'B'
  await flushPromises()
  expect(wrapper.find('h1').text()).toBe('--')
  expect(wrapper.find('.settings').exists()).toBe(false)
  expect(editButton(wrapper).attributes('disabled')).toBeDefined()
  b.resolve(result('B'))
  await flushPromises()
  expect(wrapper.find('h1').text()).toBe('Template B')
  expect(wrapper.find('.associated').text()).toBe('B')
  expect(wrapper.findComponent({ name: 'SettingInfo' }).vm).not.toBe(oldSettings)
  await editButton(wrapper).trigger('click')
  expect(state.push).toHaveBeenCalledWith('device_config-edit', { query: { id: 'B' } })
})
it('late A detail cannot overwrite the completed B detail', async () => {
  const a = deferred<any>()
  vi.mocked(deviceConfigInfo).mockImplementation(({ id }: any) =>
    id === 'A' ? a.promise : Promise.resolve(result(id))
  )
  const wrapper = page()
  state.route.query.id = 'B'
  await flushPromises()
  a.resolve(result('A'))
  await flushPromises()
  expect(wrapper.find('h1').text()).toBe('Template B')
  expect(wrapper.find('.settings').text()).toBe('B')
})
it('late A model label cannot replace B binding label', async () => {
  const a = deferred<any>()
  vi.mocked(deviceConfigInfo).mockImplementation(async ({ id }: any) => result(id, true))
  vi.mocked(loadPublishedSnapshot).mockImplementation((id: string) =>
    id === 'model-A' ? a.promise : Promise.resolve({ model: { name: 'Model B' } } as any)
  )
  const wrapper = page()
  await flushPromises()
  state.route.query.id = 'B'
  await flushPromises()
  a.resolve({ model: { name: 'Model A' } })
  await flushPromises()
  expect(wrapper.text()).toContain('Model B')
  expect(wrapper.text()).not.toContain('Model A')
})
it('failed B read and missing route cannot reuse A or leave an active editor', async () => {
  vi.mocked(deviceConfigInfo).mockResolvedValue(result('A'))
  const wrapper = page()
  await flushPromises()
  vi.mocked(deviceConfigInfo).mockResolvedValue({ data: null, error: true } as any)
  state.route.query.id = 'B'
  await flushPromises()
  expect(wrapper.text()).not.toContain('Template A')
  expect(wrapper.find('aside').text()).toContain('设备模板加载失败')
  expect(wrapper.find('.settings').exists()).toBe(false)
  await editButton(wrapper).trigger('click')
  expect(state.push).not.toHaveBeenCalled()
  delete state.route.query.id
  await flushPromises()
  expect(wrapper.find('aside').text()).toContain('缺少设备模板 ID')
  expect(editButton(wrapper).attributes('disabled')).toBeDefined()
})
it('unexpected response ID fails closed and retry loads the requested ID', async () => {
  vi.mocked(deviceConfigInfo).mockResolvedValue(result('other'))
  const wrapper = page()
  await flushPromises()
  expect(wrapper.text()).not.toContain('Template other')
  expect(wrapper.find('.settings').exists()).toBe(false)
  vi.mocked(deviceConfigInfo).mockResolvedValue(result('A'))
  await wrapper
    .findAll('button')
    .find(button => button.text() === '重试')!
    .trigger('click')
  await flushPromises()
  expect(wrapper.find('h1').text()).toBe('Template A')
})
