import { localStg } from '@/utils/storage'
import { createDeviceCommandNativeClient } from './device-command-native-transport'

/** Native Encore device command submissions and receipts. */
export const deviceCommandNative = createDeviceCommandNativeClient({
  fetch: (input, init) => globalThis.fetch(input, init),
  getToken: () => localStg.get('token') as string | undefined,
  getLanguage: () => localStg.get('lang') as string | undefined
})

export { DeviceCommandNativeError } from './device-command-native-transport'
export type { CommandReceipt, CommandReceiptPage, CommandSubmitBody } from './device-command-native-transport'
