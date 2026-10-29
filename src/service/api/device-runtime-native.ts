import { localStg } from '@/utils/storage'
import { createDeviceRuntimeNativeClient } from './device-runtime-native-transport'

/** Native Encore device runtime reads (state, readings). */
export const deviceRuntimeNative = createDeviceRuntimeNativeClient({
  fetch: (input, init) => globalThis.fetch(input, init),
  getToken: () => localStg.get('token') as string | undefined,
  getLanguage: () => localStg.get('lang') as string | undefined
})

export { DeviceRuntimeNativeError } from './device-runtime-native-transport'
export type {
  DeviceStatusEventPage,
  Reading,
  ReadingPage,
  ReadingQuery,
  RuntimeState,
  StatusHistoryQuery
} from './device-runtime-native-transport'
