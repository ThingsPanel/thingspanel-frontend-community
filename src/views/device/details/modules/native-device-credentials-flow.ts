import type { CreateDeviceCredential } from '@/service/api/device-credentials-native'

export function nativeCredentialIdentityParts(info: {
  id?: string
  userId?: string
  tenantId?: string
  tenant_id?: string
}): { subjectId: string; tenantId: string } {
  return { subjectId: info.id || info.userId || '', tenantId: info.tenantId || info.tenant_id || '' }
}

export interface NativeCredentialCreateAttempt {
  deviceId: string
  payload: CreateDeviceCredential
  key: string
  previouslyUnknown: boolean
}

export function createNativeCredentialAttempt(
  deviceId: string,
  payload: CreateDeviceCredential,
  key: string
): NativeCredentialCreateAttempt {
  return { deviceId, payload: { ...payload }, key, previouslyUnknown: false }
}

export function shouldRetainNativeCredentialAttempt(
  status: number | undefined,
  outcomeUnknown: boolean,
  previouslyUnknown: boolean
): boolean {
  return outcomeUnknown || previouslyUnknown || status !== 422
}

export async function createNativeCredentialAndRefresh<T>(
  attempt: NativeCredentialCreateAttempt,
  // eslint-disable-next-line no-unused-vars
  create: (deviceId: string, payload: CreateDeviceCredential, key: string) => Promise<T>,
  // eslint-disable-next-line no-unused-vars
  acceptCreated: (result: T) => void,
  // eslint-disable-next-line no-unused-vars
  refreshSummaries: (deviceId: string) => Promise<void>,
  isCurrentSession: () => boolean = () => true
): Promise<{ result: T; refreshFailed: boolean; stale: boolean }> {
  const result = await create(attempt.deviceId, attempt.payload, attempt.key)
  if (!isCurrentSession()) return { result, refreshFailed: false, stale: true }
  acceptCreated(result)
  try {
    await refreshSummaries(attempt.deviceId)
    return { result, refreshFailed: false, stale: !isCurrentSession() }
  } catch {
    const stale = !isCurrentSession()
    return { result, refreshFailed: !stale, stale }
  }
}
