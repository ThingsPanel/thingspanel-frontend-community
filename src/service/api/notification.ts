import { request } from '../request'

export type NativeNotificationGroupPublishRequest = {
  operation: 'publish'
  nativeGroupId: string
  groupRevision: number
  name: string
  expectedRouteVersion: number
}

export type NativeNotificationGroupUnpublishRequest = {
  operation: 'unpublish'
  nativeGroupId: string
  expectedRouteVersion: number
}

export type NativeNotificationGroupRouteRequest =
  | NativeNotificationGroupPublishRequest
  | NativeNotificationGroupUnpublishRequest

export type NativeNotificationGroupPublishStatus =
  | {
      published: false
      routeVersion: number
      status?: string
      effectiveGroupRevision: 0
      nativeGroupId?: string
      legacyGroupId?: string
      groupRevision?: number
      engine?: string
      enabled?: boolean
      name?: string
    }
  | {
      published: true
      nativeGroupId: string
      legacyGroupId: string
      groupRevision: number
      routeVersion: number
      effectiveGroupRevision: number
      engine?: string
      enabled?: boolean
      name?: string
      status?: string
    }

function normalizeNativeNotificationGroupPublishStatus(value: unknown): NativeNotificationGroupPublishStatus {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Invalid alert publication status.')
  }
  const status = value as Record<string, unknown>
  if (
    status.published === false &&
    Number.isSafeInteger(status.routeVersion) &&
    (status.routeVersion as number) >= 0 &&
    (status.effectiveGroupRevision === 0 || status.effectiveGroupRevision === undefined) &&
    (status.status === undefined || typeof status.status === 'string') &&
    (status.nativeGroupId === undefined || typeof status.nativeGroupId === 'string') &&
    (status.legacyGroupId === undefined || typeof status.legacyGroupId === 'string') &&
    (status.groupRevision === undefined || Number.isSafeInteger(status.groupRevision)) &&
    (status.engine === undefined || typeof status.engine === 'string') &&
    (status.enabled === undefined || typeof status.enabled === 'boolean') &&
    (status.name === undefined || typeof status.name === 'string')
  ) {
    return { ...status, effectiveGroupRevision: 0 } as NativeNotificationGroupPublishStatus
  }
  if (
    status.published === true &&
    typeof status.nativeGroupId === 'string' &&
    status.nativeGroupId.length > 0 &&
    typeof status.legacyGroupId === 'string' &&
    status.legacyGroupId.length > 0 &&
    Number.isSafeInteger(status.groupRevision) &&
    (status.groupRevision as number) > 0 &&
    Number.isSafeInteger(status.routeVersion) &&
    (status.routeVersion as number) > 0 &&
    Number.isSafeInteger(status.effectiveGroupRevision ?? status.groupRevision) &&
    ((status.effectiveGroupRevision ?? status.groupRevision) as number) > 0 &&
    (status.engine === undefined || typeof status.engine === 'string') &&
    (status.enabled === undefined || typeof status.enabled === 'boolean') &&
    (status.name === undefined || typeof status.name === 'string') &&
    (status.status === undefined || typeof status.status === 'string')
  ) {
    return {
      ...status,
      effectiveGroupRevision: status.effectiveGroupRevision ?? status.groupRevision
    } as NativeNotificationGroupPublishStatus
  }
  throw new Error('Invalid alert publication status.')
}

export const getNativeNotificationGroupPublishStatus = async (nativeGroupId: string) => {
  const response = await request.get('/notification_group/native-publish', {
    params: { nativeGroupId },
    silentError: true
  })
  return normalizeNativeNotificationGroupPublishStatus(response?.data)
}

export const publishNativeNotificationGroup = async (
  body: NativeNotificationGroupRouteRequest,
  idempotencyKey: string
) => {
  const response = await request.post('/notification_group/native-publish', body, {
    headers: { 'Idempotency-Key': idempotencyKey },
    silentError: true,
    'axios-retry': { retries: 0 }
  })
  const status = normalizeNativeNotificationGroupPublishStatus(response?.data)
  if (status.nativeGroupId !== body.nativeGroupId) {
    throw new Error('Invalid alert publication status.')
  }
  if (body.operation === 'publish' && (!status.published || status.groupRevision !== body.groupRevision))
    throw new Error('Invalid alert publication status.')
  if (body.operation === 'unpublish' && status.published) throw new Error('Invalid alert publication status.')
  return status
}

// notification-group
export const getNotificationGroupList = async (params: Api.Alarm.NotificationGroupParams) => {
  return await request.get<{
    list: Api.Alarm.NotificationGroupList[]
    total: number
  }>('/notification_group/list', { params })
}

export const getNotificationGroupDetail = async (params: { id: string }) => {
  return await request.get<Api.Alarm.NotificationGroupList>(`notification_group/${params.id}`)
}

export const deleteNotificationGroup = async (params: { id: string }) => {
  return await request.delete<Api.BaseApi.Data>(`/notification_group/${params.id}`)
}

export const postNotificationGroup = async (params: Api.Alarm.AddNotificationGroupParams) => {
  return await request.post<Api.BaseApi.Data>('/notification_group', params)
}

export const putNotificationGroup = async (
  params: {
    description: string
    name: string
    notification_config: string
    notification_type: string
    remark?: string
    status: string
    tenant_id: string
  },
  id: string
) => {
  return await request.put<Api.BaseApi.Data>(`/notification_group/${id}`, params)
}

export const getUserList = async (params: { page: number; page_size: number; name?: string }) => {
  return await request.get('/user/selector', { params })
}

// notification-record
export const getNotificationHistoryList = async (params: Api.Alarm.NotificationHistoryParams) => {
  return await request.get<{
    list: Api.Alarm.NotificationHistoryList[]
    total: number
  }>('/notification_history/list', { params })
}
