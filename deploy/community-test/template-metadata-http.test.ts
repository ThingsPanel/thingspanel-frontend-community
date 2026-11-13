import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { defineComponent, h, reactive } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  base: '',
  transport: null as any,
  route: null as any,
  error: vi.fn(),
  success: vi.fn(),
  warning: vi.fn(),
  go: vi.fn()
}))
// Retain the real Axios adapter, interceptors, retry and rejecting flat envelope.
// Only the destination and unrelated authentication/UI dependencies are fixtures.
vi.mock('@/service/request', async () => {
  const { createFlatRequest } = await import('@sa/axios')
  const transport = () =>
    (state.transport ||= createFlatRequest({ baseURL: state.base, adapter: 'http', timeout: 2000, retries: 0 } as any, {
      isBackendSuccess: response => response.data.code === 200,
      transformBackendResponse: response => response.data.data
    }))
  return {
    request: {
      get: (...args: any[]) => transport().get(...args),
      put: (...args: any[]) => transport().put(...args)
    }
  }
})
vi.mock('@/router', () => ({ router: { go: state.go } }))
vi.mock('vue-router', () => ({ useRoute: () => state.route }))
vi.mock('@/locales', () => ({ $t: (value: string) => value }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (value: string) => value }) }))
vi.mock('@/store/modules/tab', () => ({ useTabStore: () => ({ removeTab: vi.fn() }) }))
vi.mock('@/hooks/common/router', () => ({ useRouterPush: () => ({ routerPushByKey: vi.fn() }) }))
vi.mock('@/utils/storage', () => ({ localStg: { get: () => '' } }))
vi.mock('@/utils/common/tool', () => ({ getDemoServerUrl: () => 'http://localhost/api/v1' }))
vi.mock('@/views/device/config-detail/modules/components/topic-mapping-modal.vue', () => ({
  default: { template: '<div/>' }
}))
vi.mock('@/views/device/config-detail/modules/form.vue', () => ({ default: { template: '<div/>' } }))
vi.mock('@/service/api/device', () => ({
  deviceConfigAdd: vi.fn(),
  deviceConfigDel: vi.fn(),
  deviceConfigVoucherType: vi.fn(async () => ({ data: {} })),
  deviceProtocalServiceList: vi.fn(async () => ({ data: { protocol: [], service: [] } })),
  protocolPluginConfigForm: vi.fn(async () => ({ data: [] })),
  getTopicMappingList: vi.fn(async () => ({ data: { list: [] } })),
  createTopicMapping: vi.fn(),
  updateTopicMapping: vi.fn(),
  deleteTopicMapping: vi.fn()
}))
vi.mock('naive-ui', async () => {
  const { defineComponent, h } = await import('vue')
  const slot = defineComponent({
    setup:
      (_, { slots }) =>
      () =>
        h('div', slots.default?.())
  })
  return {
    NButton: slot,
    NEmpty: slot,
    NPopconfirm: slot,
    NSpace: slot,
    NDataTable: slot,
    NSwitch: slot,
    NTooltip: slot,
    NIcon: slot,
    NFlex: slot,
    useMessage: () => ({ error: state.error, success: state.success }),
    useDialog: () => ({ warning: state.warning })
  }
})
import {
  readDeviceConfigMetadata,
  saveDeviceConfigMetadata,
  templateSaveError
} from '@/service/api/device-config-metadata'
import Editor from '@/views/device/config-edit/index.vue'
import Connection from '@/views/device/config-detail/modules/connection-info.vue'
import Extend from '@/views/device/config-detail/modules/extend-info.vue'
import Settings from '@/views/device/config-detail/modules/setting-info.vue'

const tag = `"dc1-${'a'.repeat(64)}"`
const nextTag = `"dc1-${'b'.repeat(64)}"`
const conflict = '模板已被其他操作修改，请重新加载后再保存'
let server: Server
let currentTag = tag
let storedName = 'original'
let rejectStatus = 412
const requests: { method?: string; ifMatch?: string; body: any }[] = []
const original = () => ({
  id: 'A',
  name: storedName,
  protocol_type: 'MQTT',
  protocol_config: '{}',
  additional_info: '[]',
  other_config: '{"heartbeat":17,"extension":"keep"}',
  auto_register: 0
})
beforeAll(async () => {
  server = createServer((req, res) => {
    let raw = ''
    req.on('data', chunk => (raw += chunk))
    req.on('end', () => {
      const body = raw ? JSON.parse(raw) : null
      requests.push({ method: req.method, ifMatch: req.headers['if-match'] as string, body })
      res.setHeader('Content-Type', 'application/json')
      if (req.method === 'GET') {
        res.setHeader('ETag', currentTag)
        res.end(JSON.stringify({ code: 200, data: original() }))
      } else if (req.headers['if-match'] !== currentTag) {
        res.statusCode = rejectStatus
        res.end(
          JSON.stringify({
            code: 201002,
            data: { reason: 'template_revision_conflict' },
            message: 'Template changed; reload before saving'
          })
        )
      } else {
        storedName = body.name || storedName
        currentTag = nextTag
        res.end(JSON.stringify({ code: 200, data: {} }))
      }
    })
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  state.base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`
})
afterAll(async () => {
  await new Promise<void>(resolve => server.close(() => resolve()))
})
const wrappers: ReturnType<typeof mount>[] = []
beforeEach(() => {
  vi.clearAllMocks()
  requests.length = 0
  currentTag = tag
  storedName = 'original'
  rejectStatus = 412
  state.transport = null
  state.route = reactive({ query: { id: 'A' }, path: '/device/config-edit' })
})
afterEach(() => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount())
  vi.restoreAllMocks()
})
const slot = defineComponent({
  setup:
    (_, { slots }) =>
    () =>
      h('div', slots.default?.())
})
const form = defineComponent({
  setup: (_, { slots, expose }) => {
    expose({ validate: async () => undefined, restoreValidation() {} })
    return () => h('div', slots.default?.())
  }
})
function page(component: any) {
  const wrapper = mount(component, {
    props: component === Editor ? {} : { configInfo: original(), configEtag: tag },
    global: {
      config: { globalProperties: { getPlatform: () => 'web' } as any },
      stubs: {
        ...Object.fromEntries(
          [
            'NModal',
            'NCard',
            'NFormItem',
            'NUpload',
            'NInput',
            'NInputNumber',
            'NSelect',
            'NSwitch',
            'NButton',
            'NRadio',
            'NRadioGroup'
          ].map(name => [name, slot])
        ),
        NForm: form
      }
    }
  })
  wrappers.push(wrapper)
  return { wrapper, vm: (wrapper.vm as any).$.setupState }
}
async function loaded(vm: any) {
  for (let attempt = 0; attempt < 50 && vm.loadedConfigId !== 'A'; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 10))
    await flushPromises()
  }
  expect(vm.loadedConfigId).toBe('A')
  vm.configFormRef = { validate: async () => undefined, restoreValidation: vi.fn() }
}

it.each([412, 200])(
  'real transport status %s maps the stale-write response without mutation or automatic reload',
  async status => {
    rejectStatus = status
    const a = await readDeviceConfigMetadata('A')
    const b = await readDeviceConfigMetadata('A')
    expect(a.etag).toBe(tag)
    expect(b.etag).toBe(tag)
    await saveDeviceConfigMetadata({ id: 'A', name: 'winner' }, a.etag)
    const draft = { id: 'A', name: 'unsaved draft' }
    const result = await saveDeviceConfigMetadata(draft, b.etag)
    expect(templateSaveError(result.error)).toBe(conflict)
    expect(draft).toEqual({ id: 'A', name: 'unsaved draft' })
    expect(storedName).toBe('winner')
    expect(requests.map(row => row.method)).toEqual(['GET', 'GET', 'PUT', 'PUT'])
    expect(requests.at(-1)?.ifMatch).toBe(tag)
  }
)

it('two mounted editors preserve the stale draft and require explicit reload confirmation after actual HTTP 412', async () => {
  const a = page(Editor)
  const b = page(Editor)
  await loaded(a.vm)
  await loaded(b.vm)
  a.vm.configForm.name = 'winner'
  await a.vm.handleSubmit()
  expect(storedName).toBe('winner')
  expect(state.go).toHaveBeenCalledTimes(1)
  b.vm.configForm.name = 'unsaved draft'
  await b.vm.handleSubmit()
  expect(state.error).toHaveBeenLastCalledWith(conflict)
  expect(b.vm.configForm.name).toBe('unsaved draft')
  expect(b.vm.loading).toBe(false)
  expect(state.go).toHaveBeenCalledTimes(1)
  expect(requests.filter(row => row.method === 'PUT')).toHaveLength(2)
  expect(requests.filter(row => row.method === 'GET')).toHaveLength(2)
  const reload = vi.spyOn(window.location, 'reload').mockImplementation(() => {})
  b.vm.reloadConfig()
  expect(state.warning).toHaveBeenCalledOnce()
  expect(reload).not.toHaveBeenCalled()
  expect(state.warning.mock.calls[0][0]).toMatchObject({
    content: '重新加载将放弃未保存的修改。',
    negativeText: '取消'
  })
  expect(b.vm.configForm.name).toBe('unsaved draft')
  state.warning.mock.calls[0][0].onPositiveClick()
  expect(reload).toHaveBeenCalledOnce()
})

it.each(['connection', 'extension', 'online', 'registration', 'image'])(
  '%s editor handles the real rejected envelope without success/reset events',
  async entry => {
    currentTag = nextTag
    const component = entry === 'connection' ? Connection : entry === 'extension' ? Extend : Settings
    const { wrapper, vm } = page(component)
    await flushPromises()
    if (entry === 'connection') {
      vm.protocol_config = { endpoint: '/unsaved' }
      await vm.handleSubmit()
      expect(vm.protocol_config).toEqual({ endpoint: '/unsaved' })
    } else if (entry === 'extension') {
      vm.visible = true
      vm.extendInfoList = [{ name: 'unsaved' }]
      await vm.handleSave()
      expect(vm.visible).toBe(true)
      expect(vm.extendInfoList).toEqual([{ name: 'unsaved' }])
    } else if (entry === 'image') await vm.saveImagePath('qa/unsaved.png')
    else {
      vm.showModal = true
      vm.modalIndex = entry === 'online' ? 2 : 1
      vm.onlinejson.heartbeat = 20
      vm.auto_register = true
      await vm.onSubmit()
      expect(vm.showModal).toBe(true)
    }
    expect(state.error).toHaveBeenLastCalledWith(conflict)
    expect(state.success).not.toHaveBeenCalled()
    expect(wrapper.emitted('change')).toBeUndefined()
    expect(wrapper.emitted('upDateConfig')).toBeUndefined()
    expect(requests.filter(row => row.method === 'PUT')).toHaveLength(1)
    expect(requests.at(-1)?.ifMatch).toBe(tag)
  }
)
