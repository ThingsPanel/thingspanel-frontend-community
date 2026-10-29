import { localStg } from '@/utils/storage'
import { createFileAssetsNativeClient } from './file-assets-native-transport'

/** Native file assets; credentials continue to use the Community auth store. */
export const fileAssetsNative = createFileAssetsNativeClient({
  fetch: (input, init) => globalThis.fetch(input, init),
  getToken: () => localStg.get('token') as string | undefined,
  getLanguage: () => localStg.get('lang') as string | undefined
})

export {
  createFileAssetOperationKey,
  createFileAssetsNativeClient,
  FileAssetNativeError
} from './file-assets-native-transport'
export type {
  FileAsset,
  FileAssetIdempotencyKey,
  FileAssetNativeErrorBody,
  FileAssetUpload,
  FileAssetsNativeClient,
  FileAssetsNativeOptions
} from './file-assets-native-transport'
