import { localStg } from '@/utils/storage'
import { createDeviceLifecycleNativeClient } from './device-lifecycle-native-transport'

/** Native Encore device write operations (gateway membership, state, template binding, deletion). */
export const deviceLifecycleNative = createDeviceLifecycleNativeClient({
  fetch: (input, init) => globalThis.fetch(input, init),
  getToken: () => localStg.get('token') as string | undefined,
  getLanguage: () => localStg.get('lang') as string | undefined
})

export { DeviceLifecycleNativeError } from './device-lifecycle-native-transport'
export type {
  AcceptedOperation,
  AdministrativeState,
  DeviceOperation,
  GatewayMembership,
  SetGatewayMembership,
  SetTemplateBinding
} from './device-lifecycle-native-transport'
