import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import IdentityBindings from '@/components/auth/identity-bindings.vue'

const { externalAuth } = vi.hoisted(() => ({ externalAuth: vi.fn() }))
vi.mock('@/service/api/external-auth', () => ({ externalAuth }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('vue-router', () => ({ useRouter: () => ({ replace: vi.fn() }) }))
vi.mock('@/store/modules/auth', () => ({ useAuthStore: () => ({ resetStore: vi.fn() }) }))
vi.mock('@/components/auth/password-proof', () => ({ passwordProof: vi.fn() }))
vi.mock('@/components/auth/navigation', () => ({ rememberAuthReturn: vi.fn() }))
vi.mock('naive-ui', () =>
  Object.fromEntries(
    ['NAlert', 'NButton', 'NCard', 'NEmpty', 'NFormItem', 'NInput', 'NModal', 'NSpace', 'NTag'].map(name => [
      name,
      { name, props: ['description'], template: '<div>{{ description }}<slot /></div>' }
    ])
  )
)

function render() {
  return mount(IdentityBindings, {
    global: {
      stubs: {
        NCard: { template: '<div><slot /><slot name="header-extra" /></div>' },
        NAlert: { template: '<div><slot /></div>' },
        NEmpty: { props: ['description'], template: '<div>{{ description }}</div>' },
        NSpace: { template: '<div><slot /></div>' },
        NButton: true,
        NTag: true,
        NFormItem: true,
        NInput: true,
        NModal: true
      }
    }
  })
}

describe('linked account owner capability', () => {
  beforeEach(() => {
    externalAuth.mockReset()
  })

  it('does not call absent owner endpoints when the server explicitly disables bindings', async () => {
    externalAuth.mockResolvedValue({ bindings: { enabled: false } })
    const view = render()
    await flushPromises()
    expect(externalAuth.mock.calls.map(c => c[0])).toEqual(['/auth/login-options'])
    expect(view.text()).toContain('empty')
    expect(view.text()).not.toContain('failed')
    view.unmount()
  })

  it.each([true, undefined])('preserves endpoint failures when capability is %s', async enabled => {
    externalAuth.mockImplementation(async (path: string) => {
      if (path === '/auth/login-options') return { bindings: enabled === undefined ? undefined : { enabled } }
      if (path === '/auth/external/providers') return []
      throw new Error('AUTH_404')
    })
    const view = render()
    await flushPromises()
    expect(externalAuth).toHaveBeenCalledWith('/auth/bindings')
    expect(view.text()).toContain('failed')
    view.unmount()
  })
})
