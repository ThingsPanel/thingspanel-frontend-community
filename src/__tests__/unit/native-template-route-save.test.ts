import { reactive } from 'vue'
import { shallowMount, flushPromises } from '@vue/test-utils'
import { expect, it, vi } from 'vitest'
const state = vi.hoisted(() => ({ route: null as any }))
vi.mock('vue-router', () => ({ useRoute: () => state.route, useRouter: () => ({ replace: vi.fn() }) }))
vi.mock('@/store/modules/auth', () => ({ useAuthStore: () => ({ userInfo: { roles: ['TENANT_ADMIN'] } }) }))
vi.mock('@/service/api/thingmodel-native', () => ({
  createOperationKey: () => 'test-operation-key',
  thingModelNative: {}
}))
vi.mock('@/service/api/template-native', () => ({
  TemplateNativeError: class extends Error {},
  templateNative: { get: vi.fn(), update: vi.fn() }
}))
vi.mock('naive-ui', async () => ({
  ...(await vi.importActual('naive-ui')),
  useMessage: () => ({ error: vi.fn(), info: vi.fn(), success: vi.fn(), warning: vi.fn() })
}))
import Editor from '@/views/device/config-edit/native-template-editor.vue'
import { templateNative } from '@/service/api/template-native'

it('native editor never writes the new route after validation began on the prior template', async () => {
  state.route = reactive({ query: { id: 'A' }, path: '/device/config-edit' })
  const template = (id: string) => ({
    id,
    name: id,
    description: null,
    brand: null,
    productName: null,
    modelNumber: null,
    tags: [],
    configuration: {
      deviceKind: 'standalone',
      model: null,
      access: {
        mode: 'direct',
        protocol: 'mqtt',
        providerId: null,
        serviceInstanceId: null,
        credentialPolicy: { kind: 'none', autoRegister: false },
        onlinePolicy: { mode: 'transport', timeoutSeconds: 60 },
        connectionDirection: 'device_to_platform'
      }
    }
  })
  vi.mocked(templateNative.get).mockImplementation(async id => ({ template: template(id), etag: id }) as any)
  const wrapper = shallowMount(Editor)
  try {
    await flushPromises()
    const vm = (wrapper.vm as any).$.setupState
    let validated!: () => void
    vm.formRef = {
      validate: () =>
        new Promise<void>(resolve => {
          validated = resolve
        }),
      restoreValidation: vi.fn()
    }
    vm.form.name = 'changed A'
    const pending = vm.save()
    state.route.query.id = 'B'
    await flushPromises()
    expect(vm.original.id).toBe('B')
    validated()
    await pending
    expect(templateNative.update).not.toHaveBeenCalled()
    expect(vm.form.name).toBe('B')
  } finally {
    wrapper.unmount()
  }
})
