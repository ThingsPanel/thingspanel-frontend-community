import { thingModelNative } from '@/service/api/thingmodel-native'
import type { DeviceConfigNativeBinding } from '@/service/api/native-template-binding'
import type { SnapshotDetail } from '@/service/api/thingmodel-native-transport'
import type { PlatformField } from '@/utils/thingsvis/types'
import {
  assertCompleteNativeDeviceBinding,
  assertDeviceSnapshotMatchesBinding,
  hasNativeDeviceBinding,
  nativeDevicePlatformFields
} from './native-device-model-contract'

export interface ResolvedDeviceNativeModel {
  snapshot: SnapshotDetail
  platformFields: PlatformField[]
  bindingRevision: number
}

export { deviceBindingRequiresNativeModel, hasNativeDeviceBinding, nativeCommandOptions } from './native-device-model-contract'

/** Resolve only the version explicitly bound to this device config. */
export function resolveDeviceNativeModel(
  binding: DeviceConfigNativeBinding | null | undefined
): Promise<ResolvedDeviceNativeModel | null> {
  if (!hasNativeDeviceBinding(binding)) return Promise.resolve(null)
  const { modelID, revision, bindingRevision } = assertCompleteNativeDeviceBinding(binding)
  return thingModelNative.version(modelID, revision).then(snapshot => {
    assertDeviceSnapshotMatchesBinding(binding, snapshot)
    const platformFields = nativeDevicePlatformFields(snapshot.model)
    return { snapshot, platformFields, bindingRevision }
  })
}
