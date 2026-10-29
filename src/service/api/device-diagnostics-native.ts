import { localStg } from '@/utils/storage'
import { createDeviceDiagnosticsNativeClient } from './device-diagnostics-native-transport'

/** Native Encore device diagnostics: stage checks, honest counters, recent failures. */
export const deviceDiagnosticsNative = createDeviceDiagnosticsNativeClient({
  fetch: (input, init) => globalThis.fetch(input, init),
  getToken: () => localStg.get('token') as string | undefined,
  getLanguage: () => localStg.get('lang') as string | undefined
})

export { DeviceDiagnosticsNativeError, counterView } from './device-diagnostics-native-transport'
export type {
  CounterView,
  DeviceDiagnostic,
  DiagnosticCheck,
  DiagnosticCounter,
  DiagnosticFailure
} from './device-diagnostics-native-transport'
