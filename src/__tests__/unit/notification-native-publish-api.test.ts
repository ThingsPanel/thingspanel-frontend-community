import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getNativeNotificationGroupPublishStatus, publishNativeNotificationGroup } from '@/service/api/notification'

const { requestMock } = vi.hoisted(() => ({ requestMock: { get: vi.fn(), post: vi.fn() } }))
vi.mock('@/service/request', () => ({ request: requestMock }))

describe('legacy alert publication adapter', () => {
  beforeEach(() => {
    requestMock.get.mockReset()
    requestMock.post.mockReset()
  })

  it('reads publication status through the authenticated legacy request client', async () => {
    requestMock.get.mockResolvedValue({
      data: { published: false, status: 'unpublished', routeVersion: 0, effectiveGroupRevision: 0 },
      error: null
    })
    await expect(getNativeNotificationGroupPublishStatus('native-group-1')).resolves.toEqual({
      published: false,
      status: 'unpublished',
      routeVersion: 0,
      effectiveGroupRevision: 0
    })
    expect(requestMock.get).toHaveBeenCalledWith('/notification_group/native-publish', {
      params: { nativeGroupId: 'native-group-1' },
      silentError: true
    })
  })

  it('sends one publication request with the frozen body, caller key, and automatic retries disabled', async () => {
    const body = {
      operation: 'publish' as const,
      nativeGroupId: 'native-group-1',
      groupRevision: 4,
      name: 'Fixture group',
      expectedRouteVersion: 0
    }
    const published = {
      published: true,
      nativeGroupId: body.nativeGroupId,
      legacyGroupId: 'legacy-alias-1',
      groupRevision: body.groupRevision,
      effectiveGroupRevision: body.groupRevision,
      routeVersion: 1,
      engine: 'ENCORE',
      enabled: true,
      name: body.name
    }
    requestMock.post.mockResolvedValue({ data: published, error: null })

    await expect(publishNativeNotificationGroup(body, 'fixture-stable-key')).resolves.toEqual(published)
    expect(requestMock.post).toHaveBeenCalledTimes(1)
    expect(requestMock.post).toHaveBeenCalledWith('/notification_group/native-publish', body, {
      headers: { 'Idempotency-Key': 'fixture-stable-key' },
      silentError: true,
      'axios-retry': { retries: 0 }
    })
  })

  it('sends a stop request once with its original key and route version', async () => {
    const body = { operation: 'unpublish' as const, nativeGroupId: 'native-group-1', expectedRouteVersion: 7 }
    const stopped = {
      published: false,
      status: 'stopped',
      legacyGroupId: 'legacy-alias-1',
      nativeGroupId: body.nativeGroupId,
      groupRevision: 4,
      effectiveGroupRevision: 0,
      routeVersion: 8,
      engine: 'legacy',
      enabled: false,
      name: 'Fixture group'
    }
    requestMock.post.mockResolvedValue({ data: stopped, error: null })

    await expect(publishNativeNotificationGroup(body, 'fixture-stop-key')).resolves.toEqual(stopped)
    expect(requestMock.post).toHaveBeenCalledTimes(1)
    expect(requestMock.post).toHaveBeenCalledWith('/notification_group/native-publish', body, {
      headers: { 'Idempotency-Key': 'fixture-stop-key' },
      silentError: true,
      'axios-retry': { retries: 0 }
    })
  })

  it('rejects a success response for a different native group', async () => {
    requestMock.post.mockResolvedValue({
      data: {
        published: true,
        nativeGroupId: 'other-group',
        legacyGroupId: 'legacy-alias-1',
        groupRevision: 4,
        effectiveGroupRevision: 4,
        routeVersion: 1,
        name: 'Fixture group'
      },
      error: null
    })
    await expect(
      publishNativeNotificationGroup(
        {
          operation: 'publish',
          nativeGroupId: 'native-group-1',
          groupRevision: 4,
          name: 'Fixture group',
          expectedRouteVersion: 0
        },
        'fixture-stable-key'
      )
    ).rejects.toThrow('Invalid alert publication status.')
  })
})
