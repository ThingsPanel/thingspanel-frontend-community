import { localStg } from '@/utils/storage'
import { createTemplateNativeClient } from './template-native-transport'

/** Native device access template reads using the existing Community auth store. */
export const templateNative = createTemplateNativeClient({
  fetch: (input, init) => globalThis.fetch(input, init),
  getToken: () => localStg.get('token') as string | undefined,
  getLanguage: () => localStg.get('lang') as string | undefined
})

export { TemplateNativeError } from './template-native-transport'
export type {
  CreateDeviceAccessTemplate,
  DeviceAccessTemplate,
  DeviceAccessTemplateListQuery,
  DeviceAccessTemplatePage,
  UpdateDeviceAccessTemplate,
  TemplateNativeClient,
  TemplateNativeErrorBody
} from './template-native-transport'
