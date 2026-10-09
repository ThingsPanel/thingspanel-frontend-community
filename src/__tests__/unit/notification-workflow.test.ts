import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive, ref } from 'vue'
import type { DispatchStatus, DeliveryStatus } from '@/service/api/notification-v2.types'
import {
  getNotificationUiCapabilities,
  notificationV2,
  parseNotificationIdentityFields,
  resolveNotificationPluginOrigin
} from '@/service/api/notification-v2'
import {
  editableNotificationSecretFields,
  isNotificationConfigFieldReadOnly,
  omitReadOnlyNotificationIdentityFields,
  snapshotNotificationMutation
} from '@/views/management/notification/identity-fields'
import {
  describeDeliveryStatus,
  describeIntakeStatus,
  getLegacyHistoryStatus
} from '@/views/alarm/notification-record/workflow'
import {
  canEnableNotificationGroup,
  cloneNotificationGroupBindings,
  isNotificationGroupEditable,
  isNotificationMemberContactSupported,
  supportsNotificationMemberTarget
} from '@/views/alarm/notification-group/workflow'

const { requestMock } = vi.hoisted(() => ({ requestMock: vi.fn() }))

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({ request: requestMock })),
    isAxiosError: (error: unknown) => Boolean((error as { isAxiosError?: boolean })?.isAxiosError)
  }
}))

vi.mock('@/store/modules/auth', () => ({
  useAuthStore: () => ({
    token: 'fake-session',
    userInfo: { id: 'user-1', tenant_id: 'tenant-1', authority: 'TENANT_ADMIN', roles: ['TENANT_ADMIN'] },
    resetStore: vi.fn()
  })
}))

describe('notification workflow status mapping', () => {
  it('serializes nested reactive group bindings without mutating the editor draft', () => {
    const binding = reactive({
      bindingId: 'chat',
      instanceId: 'instance',
      recipientSource: { kind: 'literal' as const, recipient: { kind: 'chat_id' as const, address: 'default' } },
      contentBinding: { kind: 'text' as const, title: '{{subject}}', text: '{{text}}' }
    })
    const draft = ref([binding])
    const wire = cloneNotificationGroupBindings(draft.value)
    expect(structuredClone(wire)).toEqual(wire)
    wire[0].instanceId = 'other'
    expect(draft.value[0].instanceId).toBe('instance')
    expect(wire[0].recipientSource).toEqual(binding.recipientSource)
  })
  const dispatchStatuses: DispatchStatus[] = ['queued', 'sending', 'accepted', 'failed', 'unknown']
  const deliveryStatuses: DeliveryStatus[] = ['unsupported', 'pending', 'delivered', 'failed', 'unknown']

  it('maps every dispatch and delivery combination without treating failure as a pending receipt', () => {
    const results = dispatchStatuses.flatMap(dispatch =>
      deliveryStatuses.map(delivery => describeDeliveryStatus(dispatch, delivery))
    )

    expect(results.find(result => result.zh === '发送失败')).toMatchObject({ retryAllowed: false, polling: false })
    expect(describeDeliveryStatus('failed', 'pending')).toMatchObject({
      zh: '发送失败',
      en: 'Sending failed',
      retryAllowed: false,
      polling: false
    })
    expect(describeDeliveryStatus('accepted', 'unsupported')).toMatchObject({
      zh: '服务商已受理；此通道不提供送达回执',
      retryAllowed: false
    })
    expect(describeDeliveryStatus('accepted', 'pending')).toMatchObject({
      zh: '服务商已受理；等待送达回执',
      polling: true,
      retryAllowed: false
    })
    expect(describeDeliveryStatus('accepted', 'delivered').zh).toBe('服务商报告已送达；不代表已读')
    expect(describeDeliveryStatus('accepted', 'failed').zh).toBe('服务商报告投递失败')
    expect(describeDeliveryStatus('unknown', 'pending').zh).toContain('是否受理未知')
    expect(results).toHaveLength(dispatchStatuses.length * deliveryStatuses.length)
  })

  it('keeps blocked intake separate from delivery status', () => {
    expect(describeIntakeStatus('blocked', 'member.phone is missing')).toMatchObject({
      zh: '配置/目标待处理，尚未发送',
      reason: 'member.phone is missing',
      retryAllowed: false
    })
    expect(describeIntakeStatus('ready')).toMatchObject({ zh: '请求已接收', retryAllowed: false })
  })

  it('preserves old SUCCESS and FAILURE as historical labels', () => {
    expect(getLegacyHistoryStatus('SUCCESS')).toBe('旧历史 · SUCCESS')
    expect(getLegacyHistoryStatus('FAILURE')).toBe('旧历史 · FAILURE')
  })

  it('allows edits and enabling only for native groups', () => {
    expect(isNotificationGroupEditable('native')).toBe(true)
    expect(canEnableNotificationGroup('native')).toBe(true)
    expect(isNotificationGroupEditable('legacy_unmigrated')).toBe(false)
    expect(canEnableNotificationGroup('legacy_unmigrated')).toBe(false)
    expect(isNotificationGroupEditable('projection_pending')).toBe(false)
    expect(canEnableNotificationGroup('projection_pending')).toBe(false)
  })

  it('allows only backend-resolvable member contact fields', () => {
    expect(supportsNotificationMemberTarget('email')).toBe(true)
    expect(supportsNotificationMemberTarget('sms')).toBe(true)
    expect(supportsNotificationMemberTarget('voice')).toBe(true)
    expect(supportsNotificationMemberTarget('im')).toBe(false)
    expect(supportsNotificationMemberTarget('webhook')).toBe(false)
    expect(isNotificationMemberContactSupported('email', 'email')).toBe(true)
    expect(isNotificationMemberContactSupported('sms', 'phone')).toBe(true)
    expect(isNotificationMemberContactSupported('voice', 'phone')).toBe(true)
    expect(isNotificationMemberContactSupported('im', 'applicationUserId')).toBe(false)
    expect(isNotificationMemberContactSupported('im', 'user_id')).toBe(false)
    expect(isNotificationMemberContactSupported('email', 'applicationUserId')).toBe(false)
    expect(isNotificationMemberContactSupported('webhook', 'email')).toBe(false)
    expect(isNotificationMemberContactSupported(undefined, 'applicationUserId')).toBe(false)
  })
})

describe('notification plugin identity fields', () => {
  it('preserves legacy omission and validates present identity declarations', () => {
    expect(parseNotificationIdentityFields(undefined)).toBeUndefined()
    expect(parseNotificationIdentityFields(['account_id', 'region'])).toEqual(['account_id', 'region'])
    for (const invalid of [
      [],
      ['account_id', 'account_id'],
      ['account-id'],
      ['a'.repeat(129)],
      Array(65).fill('field')
    ]) {
      expect(() => parseNotificationIdentityFields(invalid)).toThrow('identity_fields')
    }
  })

  it('locks declared identity fields and all config/secrets for legacy edits but keeps create and name controls available', () => {
    expect(isNotificationConfigFieldReadOnly('account_id', ['account_id'], true)).toBe(true)
    expect(isNotificationConfigFieldReadOnly('region', ['account_id'], true)).toBe(false)
    expect(isNotificationConfigFieldReadOnly('endpoint', undefined, true)).toBe(true)
    expect(isNotificationConfigFieldReadOnly('endpoint', undefined, false)).toBe(false)
    expect(editableNotificationSecretFields(['account_secret', 'api_password'], ['account_secret'], true)).toEqual([
      'api_password'
    ])
    expect(editableNotificationSecretFields(['api_password'], undefined, true)).toEqual([])
    expect(omitReadOnlyNotificationIdentityFields({ region: 'new' }, ['account_id'], true)).toEqual({ region: 'new' })
    expect(() => omitReadOnlyNotificationIdentityFields({ account_id: 'changed' }, ['account_id'], true)).toThrow(
      'identity_change_requires_new_instance'
    )
    expect(() => omitReadOnlyNotificationIdentityFields({ endpoint: 'changed' }, undefined, true)).toThrow(
      'identity_change_requires_new_instance'
    )
    expect(omitReadOnlyNotificationIdentityFields({ account_id: 'new' }, ['account_id'], false)).toEqual({
      account_id: 'new'
    })
  })

  it('detaches an instance mutation snapshot so an uncertain retry reuses the same key and body', () => {
    const draft = { name: 'smtp', config: { host: 'smtp.example.test' }, secrets: { set: { password: 'fixture' } } }
    const pending = snapshotNotificationMutation('stable-key', draft)
    draft.name = 'edited after timeout'
    draft.config.host = 'changed.example.test'
    draft.secrets.set.password = 'changed'

    expect(pending.key).toBe('stable-key')
    expect(pending.body).toEqual({
      name: 'smtp',
      config: { host: 'smtp.example.test' },
      secrets: { set: { password: 'fixture' } }
    })
  })
})

describe('notification workflow API mapping', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_NOTIFICATION_API_BASE_URL', 'https://encore.example.test')
    requestMock.mockReset()
  })

  it('does not expose platform plugin grant management to tenant administrators', () => {
    expect(getNotificationUiCapabilities().canManagePlugins).toBe(false)
  })

  it('sends group create and update through frozen v2 routes with stable keys', async () => {
    const group = {
      id: 'group-1',
      name: 'Cold room',
      enabled: false,
      bindings: [],
      revision: 1,
      version: 1,
      migrationState: 'native'
    }
    requestMock.mockResolvedValueOnce({ status: 201, data: { code: 200, message: 'ok', requestId: 'r1', data: group } })
    requestMock.mockResolvedValueOnce({ status: 200, data: { code: 200, message: 'ok', requestId: 'r2', data: group } })

    await notificationV2.createGroup({ name: group.name, enabled: false, bindings: [] }, 'group-create-key')
    await notificationV2.updateGroup(
      'group-1',
      { name: group.name, enabled: false, bindings: [], expectedVersion: 1 },
      'group-update-key'
    )

    expect(
      requestMock.mock.calls.map(([config]) => [config.method, config.url, config.headers['Idempotency-Key']])
    ).toEqual([
      ['POST', '/api/v2/notification-groups', 'group-create-key'],
      ['PUT', '/api/v2/notification-groups/group-1', 'group-update-key']
    ])
    expect(requestMock.mock.calls[1][0].data).toMatchObject({ expectedVersion: 1 })
  })

  it('lists safe .7 plugin grant DTOs using only the frozen query fields', async () => {
    requestMock.mockResolvedValueOnce({
      status: 200,
      data: {
        code: 200,
        message: 'ok',
        requestId: 'grant-list-1',
        data: {
          items: [
            {
              pluginRegistrationId: 'registration-1',
              tenantId: 'opaque tenant/key',
              enabled: false,
              version: 3,
              createdAt: '2026-10-09T12:00:00Z',
              updatedAt: '2026-10-09T12:05:00Z'
            }
          ],
          page: 1,
          pageSize: 20,
          total: 1
        }
      }
    })

    const response = await notificationV2.listPluginGrants({
      pluginRegistrationId: 'registration-1',
      page: 1,
      pageSize: 20
    })

    expect(response.data.items[0]).toMatchObject({ tenantId: 'opaque tenant/key', enabled: false, version: 3 })
    expect(requestMock.mock.calls[0][0]).toMatchObject({
      method: 'GET',
      url: '/api/v2/notification-plugin-grants',
      params: { pluginRegistrationId: 'registration-1', page: 1, pageSize: 20 }
    })
  })

  it('rejects extra .7 query and grant body fields before sending them', async () => {
    await expect(
      notificationV2.listPluginGrants({
        pluginRegistrationId: 'registration-1',
        page: 1,
        pageSize: 20,
        tenantId: 'must-not-be-a-filter'
      } as unknown as Parameters<typeof notificationV2.listPluginGrants>[0])
    ).rejects.toThrow('does not match the notification contract')
    await expect(
      notificationV2.setPluginGrant(
        {
          pluginRegistrationId: 'registration-1',
          tenantId: 'tenant-opaque',
          enabled: true,
          expectedVersion: 0,
          authSecret: 'fake-secret-must-not-cross-wire'
        } as unknown as Parameters<typeof notificationV2.setPluginGrant>[0],
        'invalid-grant-key'
      )
    ).rejects.toThrow('does not match the notification contract')
    expect(requestMock).not.toHaveBeenCalled()
  })

  it('creates and CAS-updates explicit tenant grants with .7 status and stable idempotency keys', async () => {
    const grant = {
      pluginRegistrationId: 'registration-1',
      tenantId: 'tenant-opaque',
      enabled: true,
      version: 1,
      createdAt: '2026-10-09T12:00:00Z',
      updatedAt: '2026-10-09T12:00:00Z'
    }
    requestMock.mockResolvedValueOnce({
      status: 201,
      data: { code: 200, message: 'ok', requestId: 'grant-create', data: grant }
    })
    requestMock.mockResolvedValueOnce({
      status: 200,
      data: { code: 200, message: 'ok', requestId: 'grant-revoke', data: { ...grant, enabled: false, version: 2 } }
    })

    await notificationV2.setPluginGrant(
      {
        pluginRegistrationId: grant.pluginRegistrationId,
        tenantId: grant.tenantId,
        enabled: true,
        expectedVersion: 0
      },
      'grant-create-key'
    )
    await notificationV2.setPluginGrant(
      {
        pluginRegistrationId: grant.pluginRegistrationId,
        tenantId: grant.tenantId,
        enabled: false,
        expectedVersion: 1
      },
      'grant-revoke-key'
    )

    expect(
      requestMock.mock.calls.map(([config]) => [config.method, config.url, config.headers['Idempotency-Key']])
    ).toEqual([
      ['PUT', '/api/v2/notification-plugin-grants', 'grant-create-key'],
      ['PUT', '/api/v2/notification-plugin-grants', 'grant-revoke-key']
    ])
    expect(requestMock.mock.calls[0][0].data).toMatchObject({
      tenantId: grant.tenantId,
      enabled: true,
      expectedVersion: 0
    })
    expect(requestMock.mock.calls[1][0].data).toMatchObject({
      tenantId: grant.tenantId,
      enabled: false,
      expectedVersion: 1
    })
  })

  it('treats unexpected 2xx and unsafe grant DTO responses as unknown and permits same-body replay', async () => {
    const body = {
      pluginRegistrationId: 'registration-1',
      tenantId: 'tenant-opaque',
      enabled: true,
      expectedVersion: 0
    }
    const grant = {
      pluginRegistrationId: body.pluginRegistrationId,
      tenantId: body.tenantId,
      enabled: body.enabled,
      version: 1,
      createdAt: '2026-10-09T12:00:00Z',
      updatedAt: '2026-10-09T12:00:00Z'
    }
    requestMock.mockResolvedValueOnce({ status: 202, data: { accepted: true } })
    requestMock.mockResolvedValueOnce({
      status: 201,
      data: { code: 200, message: 'ok', requestId: 'replayed', data: grant }
    })

    await expect(notificationV2.setPluginGrant(body, 'same-grant-key')).rejects.toMatchObject({
      httpStatus: 202,
      outcomeUncertain: true
    })
    await notificationV2.setPluginGrant(body, 'same-grant-key')
    expect(requestMock.mock.calls[0][0].headers['Idempotency-Key']).toBe('same-grant-key')
    expect(requestMock.mock.calls[1][0].headers['Idempotency-Key']).toBe('same-grant-key')
    expect(requestMock.mock.calls[1][0].data).toEqual(requestMock.mock.calls[0][0].data)

    requestMock.mockResolvedValueOnce({
      status: 201,
      data: { code: 200, message: 'ok', requestId: 'unsafe', data: { ...grant, authSecret: 'fake-secret' } }
    })
    await expect(notificationV2.setPluginGrant(body, 'unsafe-grant-key')).rejects.toMatchObject({
      httpStatus: 201,
      outcomeUncertain: true
    })
  })

  it('keeps delivery filters separate and allows request cancellation', async () => {
    requestMock.mockResolvedValueOnce({
      status: 200,
      data: { code: 200, message: 'ok', requestId: 'r3', data: { items: [], page: 2, pageSize: 20, total: 0 } }
    })
    await notificationV2.listDeliveries({
      page: 2,
      pageSize: 20,
      instanceId: 'instance-1',
      sourceId: 'alarm-1',
      dispatchStatus: 'accepted',
      deliveryStatus: 'pending',
      from: '2026-10-09T00:00:00Z',
      to: '2026-10-09T23:59:59Z'
    })
    expect(requestMock.mock.calls[0][0]).toMatchObject({
      method: 'GET',
      url: '/api/v2/notification-deliveries',
      params: {
        page: 2,
        pageSize: 20,
        instanceId: 'instance-1',
        sourceId: 'alarm-1',
        dispatchStatus: 'accepted',
        deliveryStatus: 'pending',
        from: '2026-10-09T00:00:00Z',
        to: '2026-10-09T23:59:59Z'
      }
    })

    const controller = new AbortController()
    requestMock.mockImplementationOnce(
      (config: { signal: AbortSignal }) =>
        new Promise((_, reject) => {
          config.signal.addEventListener('abort', () =>
            reject(Object.assign(new Error('canceled'), { isAxiosError: true }))
          )
        })
    )
    const pending = notificationV2.listDeliveries({ page: 1, pageSize: 10 }, controller.signal)
    controller.abort()
    await expect(pending).rejects.toMatchObject({ message: 'canceled' })
  })

  it('lists notification requests through the frozen task-query contract', async () => {
    requestMock.mockResolvedValueOnce({
      status: 200,
      data: { code: 200, message: 'ok', requestId: 'r4', data: { items: [], page: 1, pageSize: 10, total: 0 } }
    })
    await notificationV2.listNotifications({
      page: 1,
      pageSize: 10,
      sourceType: 'alarm',
      sourceId: 'alarm-7',
      intakeStatus: 'blocked',
      from: '2026-10-09T00:00:00Z',
      to: '2026-10-09T23:59:59Z'
    })
    expect(requestMock.mock.calls[0][0]).toMatchObject({
      method: 'GET',
      url: '/api/v2/notifications',
      params: {
        page: 1,
        pageSize: 10,
        sourceType: 'alarm',
        sourceId: 'alarm-7',
        intakeStatus: 'blocked',
        from: '2026-10-09T00:00:00Z',
        to: '2026-10-09T23:59:59Z'
      }
    })
  })

  it('allows insecure plugin origins only for explicitly opted-in Vite loopback development', () => {
    expect(resolveNotificationPluginOrigin('https://plugin.example.test')).toBe('https://plugin.example.test')
    expect(
      resolveNotificationPluginOrigin('http://localhost:8811/', { development: true, allowInsecureLoopback: true })
    ).toBe('http://localhost:8811')
    expect(
      resolveNotificationPluginOrigin('http://127.0.0.1:8811', { development: true, allowInsecureLoopback: true })
    ).toBe('http://127.0.0.1:8811')
    expect(() =>
      resolveNotificationPluginOrigin('http://plugin.example.test', { development: true, allowInsecureLoopback: true })
    ).toThrow(/HTTPS/)
    expect(() =>
      resolveNotificationPluginOrigin('http://localhost:8811', { development: false, allowInsecureLoopback: true })
    ).toThrow(/HTTPS/)
    expect(() =>
      resolveNotificationPluginOrigin('http://localhost:8811?token=secret', {
        development: true,
        allowInsecureLoopback: true
      })
    ).toThrow(/HTTPS/)
  })
})
