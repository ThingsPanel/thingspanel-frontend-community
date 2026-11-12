import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({
  getInstallCatalog: vi.fn(),
  getInstallation: vi.fn(),
  submitInstall: vi.fn(),
  updateInstallConfig: vi.fn(),
  installAction: vi.fn(),
  uninstallPlugin: vi.fn()
}))

vi.mock('@/service/api/plugin-install', () => ({
  ...api,
  installErrorCode: (e: any) => e?.code || '',
  installErrorMessage: (e: any) => e?.message || ''
}))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ locale: { value: 'en-us' } }) }))

import InstallPlugins from '@/views/apply/plugin/InstallPlugins.vue'

const field = { required: true, secret: false, description: 'Home Assistant URL', validate: 'url' }
const secret = { required: true, secret: true, description: 'Long-lived token' }
const catalog = (installation: any = null) => [
  {
    id: 'homeassistant',
    display_name: 'Home Assistant',
    version: '1.0.0',
    description: 'HA connector',
    service_identifier: 'homeassistant',
    fields: { HA_BASE_URL: field, HA_ACCESS_TOKEN: secret },
    installation
  }
]
const installed = (over: any = {}) => ({
  id: 'i1',
  plugin_id: 'homeassistant',
  state: 'enabled',
  desired: 'enabled',
  generation: 1,
  version: '1.0.0',
  health: 'ok',
  op_id: 'op',
  op_step: '',
  error_code: '',
  config: { HA_BASE_URL: 'http://ha:8123' },
  secrets_set: ['HA_ACCESS_TOKEN'],
  updated_at: '',
  events: [],
  ...over
})

describe('plugin install page', () => {
  afterEach(() => vi.unstubAllGlobals())

  beforeEach(() => {
    document.body.innerHTML = ''
    Object.values(api).forEach(f => f.mockReset())
    api.getInstallation.mockResolvedValue({ data: null, error: null })
  })

  it('shows the catalog card with its state', async () => {
    api.getInstallCatalog.mockResolvedValue({ data: catalog(installed()), error: null })
    const w = mount(InstallPlugins, { attachTo: document.body })
    await flushPromises()
    expect(w.text()).toContain('Home Assistant')
    expect(w.text()).toContain('Enabled')
    w.unmount()
  })

  it('opens management over HTTP when randomUUID is unavailable', async () => {
    vi.stubGlobal('crypto', { getRandomValues: globalThis.crypto.getRandomValues.bind(globalThis.crypto) })
    api.getInstallCatalog.mockResolvedValue({ data: catalog(installed()), error: null })
    const w = mount(InstallPlugins, { attachTo: document.body })
    try {
      await flushPromises()
      await w.find('[data-testid="plugin-homeassistant"] button').trigger('click')
      await flushPromises()
      expect(document.body.querySelector('.n-drawer')).not.toBeNull()
      expect(api.getInstallation).toHaveBeenCalledWith('i1')
    } finally {
      w.unmount()
    }
  })

  it('explains when the host agent is offline', async () => {
    api.getInstallCatalog.mockResolvedValue({ data: null, error: { code: 'AGENT_OFFLINE' } })
    const w = mount(InstallPlugins, { attachTo: document.body })
    await flushPromises()
    expect(w.text()).toContain('agent is offline')
    w.unmount()
  })

  it('installs once even if the button is clicked repeatedly, and wipes the token from the page afterwards', async () => {
    vi.stubGlobal('crypto', { getRandomValues: globalThis.crypto.getRandomValues.bind(globalThis.crypto) })
    api.getInstallCatalog.mockResolvedValue({ data: catalog(), error: null })
    let release: (v: unknown) => void = () => {}
    api.submitInstall.mockImplementation(() => new Promise(r => (release = r)))
    const w = mount(InstallPlugins, { attachTo: document.body })
    await flushPromises()
    await w.find('[data-testid="plugin-homeassistant"] button').trigger('click')
    await flushPromises()
    const inputs = document.body.querySelectorAll('input')
    expect(inputs.length).toBe(2)
    const [url, token] = [inputs[0], inputs[1]] as HTMLInputElement[]
    expect(token.type).toBe('password')
    expect(token.autocomplete).toBe('new-password')
    url.value = 'http://ha.local:8123'
    url.dispatchEvent(new Event('input'))
    token.value = 'SECRET-TOKEN-1'
    token.dispatchEvent(new Event('input'))
    await flushPromises()
    const install = Array.from(document.body.querySelectorAll('button')).find(
      b => b.textContent?.trim() === 'Install' && b.closest('.n-drawer')
    )!
    install.click()
    install.click()
    install.click()
    await flushPromises()
    expect(api.submitInstall).toHaveBeenCalledTimes(1)
    const [pluginId, config, key] = api.submitInstall.mock.calls[0]
    expect(pluginId).toBe('homeassistant')
    expect(config).toEqual({ HA_BASE_URL: 'http://ha.local:8123', HA_ACCESS_TOKEN: 'SECRET-TOKEN-1' })
    expect(typeof key).toBe('string')
    release({ data: installed({ state: 'installing', secrets_set: ['HA_ACCESS_TOKEN'] }), error: null })
    await flushPromises()
    expect(document.body.innerHTML).not.toContain('SECRET-TOKEN-1')
    expect(JSON.stringify(Object.entries(localStorage))).not.toContain('SECRET-TOKEN-1')
    w.unmount()
  })

  it('rejects a non-http address before sending anything', async () => {
    api.getInstallCatalog.mockResolvedValue({ data: catalog(), error: null })
    const w = mount(InstallPlugins, { attachTo: document.body })
    await flushPromises()
    await w.find('[data-testid="plugin-homeassistant"] button').trigger('click')
    await flushPromises()
    const inputs = document.body.querySelectorAll('input') as NodeListOf<HTMLInputElement>
    inputs[0].value = 'javascript:alert(1)'
    inputs[0].dispatchEvent(new Event('input'))
    inputs[1].value = 'tok'
    inputs[1].dispatchEvent(new Event('input'))
    await flushPromises()
    Array.from(document.body.querySelectorAll('button'))
      .find(b => b.textContent?.trim() === 'Install' && b.closest('.n-drawer'))!
      .click()
    await flushPromises()
    expect(api.submitInstall).not.toHaveBeenCalled()
    expect(document.body.textContent).toContain('http(s)')
    w.unmount()
  })
})
