import { localStg } from '@/utils/storage'
import { createDeviceNativeClient } from './device-native-transport'

/** Native Encore device queries using the existing Community auth store. */
export const deviceNative = createDeviceNativeClient({
  fetch: (input, init) => globalThis.fetch(input, init),
  getToken: () => localStg.get('token') as string | undefined,
  getLanguage: () => localStg.get('lang') as string | undefined
})

export { DeviceNativeError } from './device-native-transport'
export type {
  DeviceListQuery,
  DeviceStatisticsQuery,
  DeviceStatistics,
  DeviceNativeClient,
  DeviceNativeOptions,
  DeviceNativeErrorBody,
  DevicePage,
  Device,
  DeviceTemplateBinding,
  DeviceTemplateBindingResponse,
  CreateDevice,
  UpdateDevice
} from './device-native-transport'
