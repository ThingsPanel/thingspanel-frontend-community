import { localStg } from '@/utils/storage'
import { createDeviceDebugNativeClient } from './device-debug-native-transport'

/** Native Encore device debug sessions and logs. */
export const deviceDebugNative = createDeviceDebugNativeClient({
  fetch: (input, init) => globalThis.fetch(input, init),
  getToken: () => localStg.get('token') as string | undefined,
  getLanguage: () => localStg.get('lang') as string | undefined
})

export { DeviceDebugNativeError, parseStoredDebugSession } from './device-debug-native-transport'
export type { DebugLog, DebugLogPage, DebugSession, StoredDebugSession } from './device-debug-native-transport'
