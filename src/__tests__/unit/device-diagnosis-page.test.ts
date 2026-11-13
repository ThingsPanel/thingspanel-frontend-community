import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createI18n } from 'vue-i18n'
import DeviceDiagnosis from '@/views/device/details/modules/device-diagnosis.vue'

const deviceId = '7c1bdb51-842a-4baa-8f58-4cb27f7132fd'
const { diagnostics, debug } = vi.hoisted(() => ({
  diagnostics: { get: vi.fn() },
  debug: { listLogs: vi.fn(), createSession: vi.fn(), stopSession: vi.fn() }
}))

vi.mock('@/service/api/device-diagnostics-native', async importOriginal => {
  const original = await importOriginal<typeof import('@/service/api/device-diagnostics-native')>()
  return { ...original, deviceDiagnosticsNative: diagnostics }
})
vi.mock('@/service/api/device-debug-native', () => ({
  deviceDebugNative: debug,
  parseStoredDebugSession: () => null
}))
vi.mock('@/locales', () => ({ $t: (key: string) => key }))

const incomplete = { success: null, total: null, successRate: null, complete: false }

function diagnostic(overrides: Record<string, unknown> = {}) {
  return {
    deviceId,
    observedAt: '2026-10-29T12:00:00.000Z',
    checks: [
      { stage: 'metadata', state: 'pass', code: 'DEVICE_FOUND', message: 'ok' },
      { stage: 'connection', state: 'fail', code: 'DEVICE_OFFLINE', message: 'offline' },
      { stage: 'ingestion', state: 'unknown', code: 'NO_INGESTION_STATS', message: 'n/a' }
    ],
    windowFrom: '2026-10-28T12:00:00.000Z',
    windowTo: '2026-10-29T12:00:00.000Z',
    stats: { uplink: incomplete, downlink: incomplete, storage: incomplete },
    recentFailures: [
      {
        id: 'f1',
        timestamp: '2026-10-29T11:00:00.000Z',
        direction: 'downlink',
        stage: 'command',
        code: 'COMMAND_FAILED',
        message: 'runtime refused the command',
        requestId: null
      }
    ],
    recentFailuresTruncated: false,
    ...overrides
  }
}

async function mountPage(locale = 'zh-CN') {
  const wrapper = mount(DeviceDiagnosis, {
    props: { id: deviceId },
    attachTo: document.body,
    global: { plugins: [createI18n({ legacy: false, locale, messages: {} })] }
  })
  await flushPromises()
  return wrapper
}

describe('device diagnosis page (native diagnostics)', () => {
  beforeEach(() => {
    diagnostics.get.mockReset()
    debug.listLogs.mockReset().mockResolvedValue({ items: [], page: 1, pageSize: 100, total: 0 })
  })

  it('shows stage checks and shows -- instead of 0 or 100 percent when the runtime has no complete window', async () => {
    diagnostics.get.mockResolvedValue(diagnostic())
    const wrapper = await mountPage()
    expect(diagnostics.get).toHaveBeenCalledWith(deviceId, { recentFailureLimit: 20 })
    const text = wrapper.text()
    expect(text).toContain('设备资料可读取')
    expect(text).toContain('设备离线')
    expect(text).toContain('暂无完整上报统计')
    expect(text.match(/--/g)?.length).toBeGreaterThanOrEqual(3)
    expect(text).not.toMatch(/\b100(\.0)?%/)
    expect(text).not.toContain('0.0%')
  })

  it.each([
    ['NO_CREDENTIAL', '尚未创建接入凭据', 'No access credential created'],
    ['CREDENTIAL_REVOKED', '接入凭据已全部撤销', 'All access credentials revoked'],
    ['CREDENTIAL_EXPIRED', '接入凭据已全部过期', 'All access credentials expired'],
    ['CREDENTIAL_UNAVAILABLE', '暂无可用接入凭据', 'No usable access credential']
  ])('localizes %s without confusing absent and unusable credentials', async (code, zh, en) => {
    diagnostics.get.mockResolvedValue(
      diagnostic({ checks: [{ stage: 'credential', state: 'fail', code, message: 'raw server message' }] })
    )
    const chinese = await mountPage()
    expect(chinese.text()).toContain(zh)
    chinese.unmount()
    const english = await mountPage('en')
    expect(english.text()).toContain(en)
    english.unmount()
  })

  it('preserves the server message for an unknown diagnostic code', async () => {
    diagnostics.get.mockResolvedValue(
      diagnostic({
        checks: [{ stage: 'custom', state: 'unknown', code: 'FUTURE_CODE', message: 'specific runtime detail' }]
      })
    )
    const wrapper = await mountPage()
    expect(wrapper.text()).toContain('specific runtime detail')
    wrapper.unmount()
  })

  it('lists the recent failure with its message', async () => {
    diagnostics.get.mockResolvedValue(diagnostic())
    const wrapper = await mountPage()
    expect(wrapper.text()).toContain('runtime refused the command')
  })

  it('formats a complete window as a percentage with its counts', async () => {
    const complete = { success: 9, total: 10, successRate: 0.9, complete: true }
    diagnostics.get.mockResolvedValue(
      diagnostic({ stats: { uplink: complete, downlink: incomplete, storage: incomplete } })
    )
    const wrapper = await mountPage()
    expect(wrapper.text()).toContain('90.0%')
    expect(wrapper.text()).toContain('9/10条')
  })

  it('shows the error and does not invent numbers when diagnostics are unavailable', async () => {
    diagnostics.get.mockRejectedValue(new Error('诊断服务不可用'))
    const wrapper = await mountPage()
    expect(wrapper.text()).toContain('诊断服务不可用')
    expect(wrapper.text()).not.toMatch(/\b100(\.0)?%/)
  })
})
