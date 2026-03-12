/**
 * E2E Integration Tests: ThingsPanel → ThingsVis 数据链路
 * doc-02 — ThingsPanel 侧
 *
 * 测试策略: 单元测试，不启动真实 iframe。
 * 验证: extractPlatformFields 提取、useHistoryBackfill 调用时机、告警推送逻辑。
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

// ─── tp-01: extractPlatformFields 事件字段测试 ──────────────────────────────

describe('tp-01: extractPlatformFields — event 类型', () => {
  let extractPlatformFields: (template: any) => any[]

  beforeEach(async () => {
    const mod = await import('@/utils/thingsvis/platform-fields')
    extractPlatformFields = mod.extractPlatformFields
  })

  it('提取事件字段（dataType=event）', () => {
    const template = {
      telemetry: [{ key: 'temperature', name: '温度', data_type: 'float' }],
      events: [{ key: 'alarm_high_temp', name: '高温告警', data_type: 'json' }]
    }
    const fields = extractPlatformFields(template)
    const eventField = fields.find(f => f.id === 'alarm_high_temp')

    expect(eventField).toBeDefined()
    expect(eventField?.dataType).toBe('event')
    expect(eventField?.type).toBe('json')
  })

  it('无事件字段时不返回 event 类型', () => {
    const template = {
      telemetry: [{ key: 'temperature', name: '温度', data_type: 'float' }]
    }
    const fields = extractPlatformFields(template)
    expect(fields.some(f => f.dataType === 'event')).toBe(false)
  })

  it('同时提取 telemetry、attribute、command、event 四类', () => {
    const template = {
      telemetry: [{ key: 'temp', name: '温度', data_type: 'float' }],
      attributes: [{ key: 'location', name: '位置', data_type: 'string' }],
      commands: [{ key: 'switch', name: '开关', data_type: 'boolean' }],
      events: [{ key: 'alarm', name: '告警', data_type: 'json' }]
    }
    const fields = extractPlatformFields(template)
    const types = new Set(fields.map(f => f.dataType))
    expect(types.has('telemetry')).toBe(true)
    expect(types.has('attribute')).toBe(true)
    expect(types.has('command')).toBe(true)
    expect(types.has('event')).toBe(true)
  })
})

// ─── tp-02: useHistoryBackfill ───────────────────────────────────────────────

describe('tp-02: useHistoryBackfill', () => {
  it('仅对 telemetry 字段调用历史 API', async () => {
    const { useHistoryBackfill } = await import('@/hooks/thingsvis/useHistoryBackfill')

    // Mock telemetryDataHistoryList
    const mockApi = vi.fn().mockResolvedValue({
      data: { list: [{ x: '2026-03-12T10:00:00Z', y: '25.3' }] }
    })
    vi.mock('@/service/api/device', () => ({
      telemetryDataHistoryList: mockApi,
      deviceAlarmStatus: vi.fn().mockResolvedValue({ data: [] }),
      deviceAlarmHistory: vi.fn().mockResolvedValue({ data: { list: [] } })
    }))

    const pushHistory = vi.fn()
    const deviceId = ref('device-001')
    const platformFields = ref([
      { id: 'temperature', name: '温度', type: 'number' as const, dataType: 'telemetry' as const },
      { id: 'location', name: '位置', type: 'string' as const, dataType: 'attribute' as const }
    ])

    const { backfill } = useHistoryBackfill(deviceId, platformFields, pushHistory)
    await backfill()

    // 仅对 telemetry 字段调用 API
    expect(mockApi).toHaveBeenCalledTimes(1)
    expect(mockApi).toHaveBeenCalledWith(expect.objectContaining({ key: 'temperature' }))
    // pushHistory 被调用
    expect(pushHistory).toHaveBeenCalledWith('temperature', expect.any(Array))
  })

  it('不含 telemetry 字段时不发起 API 调用', async () => {
    const { useHistoryBackfill } = await import('@/hooks/thingsvis/useHistoryBackfill')
    const mockApi = vi.fn()
    vi.mock('@/service/api/device', () => ({
      telemetryDataHistoryList: mockApi
    }))

    const pushHistory = vi.fn()
    const deviceId = ref('device-001')
    const platformFields = ref([
      { id: 'location', name: '位置', type: 'string' as const, dataType: 'attribute' as const }
    ])

    const { backfill } = useHistoryBackfill(deviceId, platformFields, pushHistory)
    await backfill()

    expect(mockApi).not.toHaveBeenCalled()
    expect(pushHistory).not.toHaveBeenCalled()
  })
})

// ─── tp-04: useAlarmPush ─────────────────────────────────────────────────────

describe('tp-04: useAlarmPush', () => {
  it('仅对 event 字段查询告警状态', async () => {
    const { useAlarmPush } = await import('@/hooks/thingsvis/useAlarmPush')

    const mockAlarmStatus = vi.fn().mockResolvedValue({
      data: [{ alarm_name: 'alarm_high_temp', is_active: true, alarm_level: 'critical', alarm_description: '温度超限' }]
    })
    vi.mock('@/service/api/device', () => ({
      deviceAlarmStatus: mockAlarmStatus,
      deviceAlarmHistory: vi.fn().mockResolvedValue({ data: { list: [] } })
    }))

    const pushData = vi.fn()
    const pushHistory = vi.fn()
    const deviceId = ref('device-001')
    const platformFields = ref([
      { id: 'temperature', name: '温度', type: 'number' as const, dataType: 'telemetry' as const },
      { id: 'alarm_high_temp', name: '告警', type: 'json' as const, dataType: 'event' as const }
    ])

    const { start, stop } = useAlarmPush(deviceId, platformFields, pushData, pushHistory)
    start()

    // 等待异步请求
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(mockAlarmStatus).toHaveBeenCalled()
    expect(pushData).toHaveBeenCalledWith(
      expect.objectContaining({
        alarm_high_temp: expect.objectContaining({ active: true, level: 'critical' })
      })
    )

    stop()
  })

  it('无 event 字段时跳过所有告警逻辑', async () => {
    const { useAlarmPush } = await import('@/hooks/thingsvis/useAlarmPush')
    const mockAlarmStatus = vi.fn()
    vi.mock('@/service/api/device', () => ({
      deviceAlarmStatus: mockAlarmStatus
    }))

    const pushData = vi.fn()
    const pushHistory = vi.fn()
    const deviceId = ref('device-001')
    const platformFields = ref([
      { id: 'temperature', name: '温度', type: 'number' as const, dataType: 'telemetry' as const }
    ])

    const { start, stop } = useAlarmPush(deviceId, platformFields, pushData, pushHistory)
    start()

    await new Promise(resolve => setTimeout(resolve, 10))
    expect(mockAlarmStatus).not.toHaveBeenCalled()
    stop()
  })
})

// ─── tp-03: useRealtimePush (WebSocket fallback) ────────────────────────────

describe('tp-03: useRealtimePush — WebSocket 降级', () => {
  it('无 token 时跳过 WebSocket，直接启动轮询', async () => {
    const { useRealtimePush } = await import('@/hooks/thingsvis/useRealtimePush')

    // Mock localStorage 返回 null token
    vi.mock('@/utils/storage', () => ({
      localStg: { get: () => null, set: vi.fn(), remove: vi.fn() }
    }))

    const fetchLatest = vi.fn().mockResolvedValue(undefined)
    const pushData = vi.fn()
    const deviceId = ref('device-001')
    const platformFields = ref([
      { id: 'temperature', name: '温度', type: 'number' as const, dataType: 'telemetry' as const }
    ])

    const { start, stop } = useRealtimePush(deviceId, platformFields, pushData, fetchLatest)
    start()

    await new Promise(resolve => setTimeout(resolve, 50))

    // 应回退到轮询，立即执行一次 fetchLatest
    expect(fetchLatest).toHaveBeenCalled()
    stop()
  })
})
