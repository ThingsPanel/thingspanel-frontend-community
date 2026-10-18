import { deviceConfigEdit } from './device'
import { thingModelNative } from './thingmodel-native'
import type { SnapshotDetail } from './thingmodel-native-transport'
import { fetchPublishedThingModels } from './native-template-binding-transport'

export interface DeviceConfigNativeBinding {
  id: string
  native_thing_model_id?: string | null
  native_thing_model_snapshot_id?: string | null
  native_thing_model_revision?: number | null
  native_binding_revision?: number
  device_template_id?: string | null
}

export async function loadPublishedThingModels() {
  return fetchPublishedThingModels(options => thingModelNative.list(options))
}

export async function loadPublishedVersions(modelID: string) {
  const page = await thingModelNative.versions(modelID, { page: 1, pageSize: 100 })
  return page.items
}

export async function loadPublishedSnapshot(modelID: string, revision: number) {
  return await thingModelNative.version(modelID, revision) as SnapshotDetail & { modelID: string }
}

export async function saveNativeThingModelBinding(
  config: DeviceConfigNativeBinding,
  snapshot: { modelID: string; snapshotID: string; publishedRevision: number } | null
) {
  return deviceConfigEdit({
    id: config.id,
    native_thing_model_id: snapshot?.modelID ?? '',
    native_thing_model_snapshot_id: snapshot?.snapshotID ?? '',
    native_thing_model_revision: snapshot?.publishedRevision ?? 0,
    native_binding_revision: config.native_binding_revision ?? 0
  })
}
