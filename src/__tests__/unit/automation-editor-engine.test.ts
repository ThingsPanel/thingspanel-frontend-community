import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import EngineEditor from '@/views/automation/modules/engine-editor.vue'

const { mode, legacyMounted } = vi.hoisted(() => ({ mode: vi.fn(), legacyMounted: vi.fn() }))
vi.mock('@/service/api/automation-runtime', () => ({ getAutomationMode: mode }))
vi.mock('@/views/automation/rule-edit/index.vue', () => ({
  default: { props: ['initialKind'], template: '<div data-test="native">{{ initialKind }}</div>' }
}))
const Legacy = defineComponent({ setup: legacyMounted, template: '<div data-test="legacy" />' })
function open(kind: 'scene' | 'automation' = 'scene') {
  return mount(EngineEditor, {
    props: { kind },
    slots: { legacy: Legacy },
    global: {
      stubs: {
        NSpin: { template: '<div><slot /></div>' },
        NAlert: { template: '<div><slot /><slot name="action" /></div>' },
        NButton: { template: '<button><slot /></button>' }
      }
    }
  })
}

describe('automation editor uses the confirmed backend engine', () => {
  beforeEach(() => {
    mode.mockReset()
    legacyMounted.mockReset()
  })
  it.each(['scene', 'automation'] as const)(
    'opens the native %s editor without mounting the lossy legacy form',
    async kind => {
      let resolve!: (value: string) => void
      mode.mockReturnValue(
        new Promise(r => {
          resolve = r
        })
      )
      const wrapper = open(kind)
      expect(legacyMounted).not.toHaveBeenCalled()
      expect(wrapper.find('[data-test="native"]').exists()).toBe(false)
      resolve('native')
      await flushPromises()
      expect(wrapper.get('[data-test="native"]').text()).toBe(kind)
      expect(legacyMounted).not.toHaveBeenCalled()
      wrapper.unmount()
    }
  )
  it('preserves the legacy editor when the backend explicitly selects legacy', async () => {
    mode.mockResolvedValue('legacy')
    const wrapper = open()
    await flushPromises()
    expect(wrapper.find('[data-test="legacy"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="native"]').exists()).toBe(false)
    wrapper.unmount()
  })
  it('blocks both editors when discovery fails and allows an explicit retry', async () => {
    mode.mockRejectedValueOnce(new Error('状态查询失败')).mockResolvedValueOnce('native')
    const wrapper = open()
    await flushPromises()
    expect(wrapper.text()).toContain('状态查询失败')
    expect(legacyMounted).not.toHaveBeenCalled()
    expect(wrapper.find('[data-test="native"]').exists()).toBe(false)
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-test="native"]').text()).toBe('scene')
    expect(legacyMounted).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})
