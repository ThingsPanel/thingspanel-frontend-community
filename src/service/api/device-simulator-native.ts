import { localStg } from '@/utils/storage'
import { createDeviceSimulatorNativeClient } from './device-simulator-native-transport'

/** Native Encore device simulator (profile, sessions, runs). */
export const deviceSimulatorNative = createDeviceSimulatorNativeClient({
  fetch: (input, init) => globalThis.fetch(input, init),
  getToken: () => localStg.get('token') as string | undefined,
  getLanguage: () => localStg.get('lang') as string | undefined
})

export { DeviceSimulatorNativeError, FIRST_PROFILE_ETAG } from './device-simulator-native-transport'
export type { SimulationRun, SimulationSession, SimulatorProfile } from './device-simulator-native-transport'
