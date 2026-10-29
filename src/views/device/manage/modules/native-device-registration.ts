import type { CreateDevice } from '@/service/api/device-native'

export interface NativeDeviceRegistrationInput {
  name: string
  tags: string[]
  templateId?: string
  deviceKind: CreateDevice['deviceKind']
}

export interface NativeDeviceRegistrationAttempt {
  payload: CreateDevice
  key: string
}

export function shouldRetainNativeDeviceRegistrationAttempt(status: number | undefined, previouslyUnknown: boolean) {
  if (previouslyUnknown || status === undefined || status === 409) return true
  return ![400, 401, 403, 404, 422].includes(status)
}

/** Device.tags contract: up to 100 unique, nonempty strings of at most 128 Unicode code points. */
export function normalizeNativeDeviceTags(values: string[]): string[] {
  if (!Array.isArray(values)) throw new Error('标签格式无效。')

  const normalized: string[] = []
  const seen = new Set<string>()
  for (const value of values) {
    if (typeof value !== 'string' || value.length === 0 || Array.from(value).length > 128) {
      throw new Error('每个标签需为 1 至 128 个字符。')
    }
    if (!seen.has(value)) {
      seen.add(value)
      normalized.push(value)
      if (normalized.length > 100) throw new Error('标签最多可设置 100 项。')
    }
  }
  return normalized
}

export function createNativeDeviceRegistrationAttempt(
  input: NativeDeviceRegistrationInput,
  key: string
): NativeDeviceRegistrationAttempt {
  const payload: CreateDevice = {
    name: input.name,
    tags: normalizeNativeDeviceTags(input.tags),
    deviceKind: input.deviceKind,
    initialAdministrativeState: 'enabled',
    ...(input.templateId ? { templateId: input.templateId } : {})
  }
  return { payload, key }
}
