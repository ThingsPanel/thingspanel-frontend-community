import { localStg } from '@/utils/storage'
import { createDeviceCredentialNativeClient } from './device-credentials-native-transport'

/** Native credential reads and audited one-time creation using Community auth. */
export const deviceCredentialsNative = createDeviceCredentialNativeClient({
  fetch: (input, init) => globalThis.fetch(input, init),
  getToken: () => localStg.get('token') as string | undefined,
  getLanguage: () => localStg.get('lang') as string | undefined
})

export { DeviceCredentialNativeError } from './device-credentials-native-transport'
export type {
  CredentialChangeAccepted,
  CreateDeviceCredential,
  DeviceCredentialNativeClient,
  DeviceCredentialNativeErrorBody,
  DeviceCredentialSecret,
  DeviceCredentialSummary,
  DeviceCredentialSummaryPage,
  DeviceCredentialListQuery
} from './device-credentials-native-transport'
