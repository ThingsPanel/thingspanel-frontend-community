import { beforeEach, describe, expect, it, vi } from 'vitest'

const { requestMock, authState, resetStoreMock } = vi.hoisted(() => ({
  requestMock: vi.fn(),
  resetStoreMock: vi.fn(),
  authState: {
    token: 'session-token',
    userInfo: { id: 'user-1', tenant_id: 'tenant-1', authority: 'TENANT_ADMIN', roles: ['TENANT_ADMIN'] }
  }
}))

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({ request: requestMock })),
    isAxiosError: (error: unknown) => Boolean((error as { isAxiosError?: boolean })?.isAxiosError),
    get: vi.fn()
  }
}))

vi.mock('@/store/modules/auth', () => ({
  useAuthStore: () => ({ ...authState, resetStore: resetStoreMock })
}))

import {
  getNotificationUiCapabilities,
  invalidateNotificationSession,
  NotificationServiceUnavailableError,
  notificationV2,
  stripSecretConfig,
  unsupportedNotificationSchemaPaths,
  validateNotificationConfigValue
} from '@/service/api/notification-v2'

const envelope = <T>(data: T) => ({ code: 200, message: 'ok', requestId: 'request-1', data })

describe('notification v2 client', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_NOTIFICATION_API_BASE_URL', 'https://encore.example.test')
    requestMock.mockReset()
    resetStoreMock.mockReset()
    authState.token = 'session-token'
    authState.userInfo.tenant_id = 'tenant-1'
  })

  it('preserves the 202 envelope and sends the stable test key with the session bearer', async () => {
    const response = envelope({
      accepted: true,
      notificationId: 'notice-1',
      deliveryIds: ['delivery-1'],
      intakeStatus: 'ready'
    })
    requestMock.mockResolvedValue({ status: 202, data: response })

    const result = await notificationV2.testInstance(
      'instance-1',
      {
        recipient: { kind: 'phone', address: '+14155550100' },
        content: { kind: 'text', text: 'test' },
        expiresAt: '2026-10-09T00:05:00.000Z'
      },
      'stable-test-key-0001'
    )

    expect(result).toEqual({ ...response, httpStatus: 202 })
    expect(requestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: '/api/v2/notification-instances/instance-1/test',
        headers: expect.objectContaining({
          Authorization: 'Bearer session-token',
          'Idempotency-Key': 'stable-test-key-0001'
        })
      })
    )
  })

  it('accepts create HTTP 201 only when the body retains code 200', async () => {
    requestMock.mockResolvedValue({ status: 201, data: envelope({ id: 'plugin-1' }) })
    await expect(
      notificationV2.registerPlugin(
        {
          pluginId: 'sample',
          pluginVersion: '1.0.0',
          origin: 'https://plugin.example.test',
          authSecret: 'write-only-secret',
          manifestDigest: `sha256:${'a'.repeat(64)}`
        },
        'registration-key-0001'
      )
    ).resolves.toMatchObject({ httpStatus: 201, data: { id: 'plugin-1' }, code: 200 })
    expect(requestMock.mock.calls[0][0].data.authSecret).toBe('write-only-secret')
  })

  it('lets an uncertain test retry reuse the original idempotency key', async () => {
    const networkFailure = Object.assign(new Error('timeout'), { isAxiosError: true })
    requestMock.mockRejectedValueOnce(networkFailure).mockResolvedValueOnce({
      status: 202,
      data: envelope({
        accepted: true,
        notificationId: 'notice-replay',
        deliveryIds: ['delivery-1'],
        intakeStatus: 'ready'
      })
    })
    const body = {
      recipient: { kind: 'email' as const, address: 'ops@example.test' },
      content: { kind: 'text' as const, text: 'one explicit test' },
      expiresAt: '2026-10-09T00:05:00.000Z'
    }
    await expect(notificationV2.testInstance('instance-1', body, 'stable-test-key-0002')).rejects.toMatchObject({
      outcomeUncertain: true
    })
    await notificationV2.testInstance('instance-1', body, 'stable-test-key-0002')

    expect(requestMock.mock.calls.map(([config]) => config.headers['Idempotency-Key'])).toEqual([
      'stable-test-key-0002',
      'stable-test-key-0002'
    ])
  })

  it('treats a malformed HTTP 202 test response as uncertain and replays the same body and key', async () => {
    const body = {
      recipient: { kind: 'phone' as const, address: '+8613800000000' },
      content: { kind: 'template' as const, template: { id: 'SMS_123', params: { code: '1234' } } },
      expiresAt: '2026-10-09T00:05:00.000Z'
    }
    requestMock.mockResolvedValueOnce({ status: 202, data: { code: 200, data: { accepted: true } } })
    requestMock.mockResolvedValueOnce({
      status: 202,
      data: envelope({
        accepted: true,
        notificationId: 'notice-replayed',
        deliveryIds: ['delivery-1'],
        intakeStatus: 'ready'
      })
    })

    await expect(notificationV2.testInstance('instance-1', body, 'stable-malformed-test-key')).rejects.toMatchObject({
      httpStatus: 202,
      outcomeUncertain: true
    })
    await notificationV2.testInstance('instance-1', body, 'stable-malformed-test-key')

    expect(requestMock.mock.calls.map(([config]) => config.headers['Idempotency-Key'])).toEqual([
      'stable-malformed-test-key',
      'stable-malformed-test-key'
    ])
    expect(requestMock.mock.calls.map(([config]) => config.data)).toEqual([body, body])
  })

  it('treats a malformed HTTP 201 plugin registration response as uncertain and replays the same body and key', async () => {
    const body = {
      pluginId: 'aliyunsms',
      pluginVersion: '1.0.0',
      origin: 'https://plugin.example.test',
      authSecret: 'independent-plugin-secret',
      manifestDigest: `sha256:${'a'.repeat(64)}`
    }
    requestMock.mockResolvedValueOnce({ status: 201, data: { code: 200, data: { id: 'plugin-1' } } })
    requestMock.mockResolvedValueOnce({ status: 201, data: envelope({ id: 'plugin-1' }) })

    await expect(notificationV2.registerPlugin(body, 'stable-malformed-registration-key')).rejects.toMatchObject({
      httpStatus: 201,
      outcomeUncertain: true
    })
    await notificationV2.registerPlugin(body, 'stable-malformed-registration-key')

    expect(requestMock.mock.calls.map(([config]) => config.headers['Idempotency-Key'])).toEqual([
      'stable-malformed-registration-key',
      'stable-malformed-registration-key'
    ])
    expect(requestMock.mock.calls.map(([config]) => config.data)).toEqual([body, body])
  })

  it('edits and validates the Alibaba SMS template allowlist JSON schema', () => {
    const configSchema = {
      type: 'object',
      additionalProperties: false,
      required: ['template_allowlist'],
      properties: {
        region: { type: 'string', pattern: '^[a-z0-9-]{3,32}$' },
        template_allowlist: { type: 'array', minItems: 1, items: { type: 'string', minLength: 1 } }
      }
    }
    const schema = configSchema.properties.template_allowlist

    expect(
      Object.entries(configSchema.properties).flatMap(([name, propertySchema]) =>
        unsupportedNotificationSchemaPaths(propertySchema, name)
      )
    ).toEqual([])
    expect(validateNotificationConfigValue(['SMS_123'], schema, 'template_allowlist')).toBeNull()
    expect(validateNotificationConfigValue([], schema, 'template_allowlist')).toContain('add more items')
    expect(validateNotificationConfigValue([123], schema, 'template_allowlist')).toContain('expected string')
    expect(validateNotificationConfigValue('cn-hangzhou', configSchema.properties.region, 'region')).toBeNull()
    expect(validateNotificationConfigValue({ template_allowlist: ['SMS_123'] }, configSchema)).toBeNull()
  })

  it('accepts the bundled SMTP email and DingTalk/Webhook URI schemas while rejecting unknown formats', () => {
    const email = { type: 'string', format: 'email' }
    const uri = { type: 'string', format: 'uri' }
    expect(unsupportedNotificationSchemaPaths(email, 'from_email')).toEqual([])
    expect(unsupportedNotificationSchemaPaths(uri, 'webhook')).toEqual([])
    expect(validateNotificationConfigValue('sender@example.test', email)).toBeNull()
    expect(validateNotificationConfigValue('invalid-address', email)).toContain('expected email')
    expect(validateNotificationConfigValue('https://oapi.dingtalk.com/robot/send?access_token=fixture', uri)).toBeNull()
    expect(validateNotificationConfigValue('/relative-callback', uri)).toContain('expected absolute URI')
    expect(unsupportedNotificationSchemaPaths({ type: 'string', format: 'custom-account' }, 'account')).toEqual([
      'account.format'
    ])
  })

  it('keeps validation and instance saves on non-send endpoints', async () => {
    requestMock
      .mockResolvedValueOnce({ status: 200, data: envelope({ valid: true, errors: [] }) })
      .mockResolvedValueOnce({ status: 201, data: envelope({ id: 'instance-1' }) })

    await notificationV2.validateInstance({
      draft: { pluginRegistrationId: 'plugin-1', channel: 'email', config: { host: 'smtp.example.test' } }
    })
    await notificationV2.createInstance(
      {
        pluginRegistrationId: 'plugin-1',
        name: 'Mail',
        channel: 'email',
        config: { host: 'smtp.example.test' },
        providerIdentity: { account: 'team' }
      },
      'instance-create-key-1'
    )

    expect(requestMock.mock.calls.map(([config]) => config.url)).toEqual([
      '/api/v2/notification-instances/validate',
      '/api/v2/notification-instances'
    ])
    expect(requestMock.mock.calls.some(([config]) => String(config.url).endsWith('/test'))).toBe(false)
  })

  it('keeps domain HTTP errors distinct and invokes existing auth reset on 401', async () => {
    const conflict = Object.assign(new Error('conflict'), {
      isAxiosError: true,
      response: {
        status: 409,
        data: { code: 409, message: 'version conflict', requestId: 'request-2', details: { reason: 'stale' } }
      }
    })
    requestMock.mockRejectedValueOnce(conflict)
    await expect(notificationV2.listPlugins()).rejects.toMatchObject({
      httpStatus: 409,
      code: 409,
      requestId: 'request-2',
      message: 'version conflict'
    })

    const unauthorized = Object.assign(new Error('unauthorized'), {
      isAxiosError: true,
      response: { status: 401, data: { code: 'unauthenticated', message: 'sign in again' } }
    })
    requestMock.mockRejectedValueOnce(unauthorized)
    await expect(notificationV2.listPlugins()).rejects.toMatchObject({ httpStatus: 401 })
    expect(resetStoreMock).toHaveBeenCalledOnce()
  })

  it('distinguishes secret-clear 403/409 responses from an unconfigured Encore API', async () => {
    const clearBody = { expectedVersion: 2, secrets: { clear: ['from_password'] } }
    requestMock
      .mockRejectedValueOnce(
        Object.assign(new Error('forbidden'), {
          isAxiosError: true,
          response: { status: 403, data: { code: 403, message: 'clear permission required' } }
        })
      )
      .mockRejectedValueOnce(
        Object.assign(new Error('conflict'), {
          isAxiosError: true,
          response: { status: 409, data: { code: 409, message: 'instance version changed' } }
        })
      )

    await expect(notificationV2.updateInstance('instance-1', clearBody, 'clear-key-403')).rejects.toMatchObject({
      httpStatus: 403,
      message: 'clear permission required',
      outcomeUncertain: false
    })
    await expect(notificationV2.updateInstance('instance-1', clearBody, 'clear-key-409')).rejects.toMatchObject({
      httpStatus: 409,
      message: 'instance version changed',
      outcomeUncertain: false
    })

    expect(
      requestMock.mock.calls.map(([config]) => [config.url, config.data, config.headers['Idempotency-Key']])
    ).toEqual([
      ['/api/v2/notification-instances/instance-1', clearBody, 'clear-key-403'],
      ['/api/v2/notification-instances/instance-1', clearBody, 'clear-key-409']
    ])

    vi.stubEnv('VITE_NOTIFICATION_API_BASE_URL', '')
    await expect(
      notificationV2.updateInstance('instance-1', clearBody, 'clear-key-unconfigured')
    ).rejects.toBeInstanceOf(NotificationServiceUnavailableError)
    expect(requestMock).toHaveBeenCalledTimes(2)
  })

  it('rejects responses from a previous tenant session before exposing the result', async () => {
    let resolveRequest!: () => void
    let requestResult: unknown
    requestMock.mockReturnValueOnce(
      new Promise(resolve => {
        resolveRequest = () => resolve(requestResult)
      })
    )
    const pending = notificationV2.listPlugins()
    invalidateNotificationSession()
    requestResult = { status: 200, data: envelope({ items: [{ id: 'old-tenant-plugin' }] }) }
    resolveRequest()
    await expect(pending).rejects.toMatchObject({ name: 'NotificationSessionChangedError' })
  })

  it('fails closed when the dedicated Encore API base URL is unset', async () => {
    vi.stubEnv('VITE_NOTIFICATION_API_BASE_URL', '')
    await expect(notificationV2.listPlugins()).rejects.toBeInstanceOf(NotificationServiceUnavailableError)
    expect(requestMock).not.toHaveBeenCalled()
  })

  it('derives frontend controls from the approved role map', () => {
    expect(getNotificationUiCapabilities()).toMatchObject({
      canRead: true,
      canManage: true,
      canSendTest: true,
      canManagePlugins: false
    })
    authState.userInfo.roles = ['TENANT_USER']
    authState.userInfo.authority = 'TENANT_USER'
    expect(getNotificationUiCapabilities()).toMatchObject({
      canRead: true,
      canManage: false,
      canSendTest: false,
      canManagePlugins: false
    })
  })

  it('removes secret fields before an instance response can populate an editor', () => {
    expect(stripSecretConfig({ account: 'ops', password: 'should-not-enter-form' }, ['password'])).toEqual({
      account: 'ops'
    })
  })
})
