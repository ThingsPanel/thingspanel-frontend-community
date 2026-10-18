import type { DeviceConfigNativeBinding } from '../../service/api/native-template-binding'
import type { ModelDraft, SnapshotDetail } from '../../service/api/thingmodel-native-transport'
import type { PlatformField } from '../../utils/thingsvis/types'
import { nativeModelFieldsToPlatformFields } from './template/native-model-resources'

export function hasNativeDeviceBinding(binding: DeviceConfigNativeBinding | null | undefined) {
  return Boolean(
    binding?.native_thing_model_id || binding?.native_thing_model_snapshot_id ||
    Number(binding?.native_thing_model_revision) > 0
  )
}

export function deviceBindingRequiresNativeModel(binding: DeviceConfigNativeBinding | null | undefined) {
  return hasNativeDeviceBinding(binding) || Boolean(binding?.device_template_id)
}

export function assertCompleteNativeDeviceBinding(binding: DeviceConfigNativeBinding | null | undefined) {
  const modelID = binding?.native_thing_model_id?.trim()
  const snapshotID = binding?.native_thing_model_snapshot_id?.trim()
  const revision = Number(binding?.native_thing_model_revision)
  const bindingRevision = Number(binding?.native_binding_revision)
  if (!modelID || !snapshotID || !Number.isInteger(revision) || revision < 1 || !Number.isInteger(bindingRevision) || bindingRevision < 1) {
    throw new Error('Device template has an incomplete native thing model binding')
  }
  return { modelID, snapshotID, revision, bindingRevision }
}

export function assertDeviceSnapshotMatchesBinding(
  binding: DeviceConfigNativeBinding | null | undefined,
  snapshot: SnapshotDetail
) {
  const { modelID, snapshotID, revision } = assertCompleteNativeDeviceBinding(binding)
  if (snapshot.modelID !== modelID || snapshot.snapshotID !== snapshotID || snapshot.publishedRevision !== revision) {
    throw new Error('Bound thing model snapshot does not match the device template binding')
  }
}

export function nativeDevicePlatformFields(model: ModelDraft): PlatformField[] {
  // Telemetry/events must never be routed through a write target, including old writable telemetry snapshots.
  return nativeModelFieldsToPlatformFields(model).map(field => {
    if (field.dataType === 'attribute' || field.dataType === 'command') return field
    const { writable: _writable, write: _write, ...readOnlyField } = field
    return { ...readOnlyField, writable: false }
  })
}

export function nativeCommandOptions(model: ModelDraft) {
  return nativeModelFieldsToPlatformFields(model)
    .filter(field => field.dataType === 'command')
    .map(field => {
      const params = (field.nativeSchema?.parameters as { items?: Array<any> } | undefined)?.items || []
      return {
        data_name: field.name,
        data_identifier: field.id,
        params: JSON.stringify(params.map(parameter => {
          const valueType = parameter.valueType
          const paramType = valueType?.kind === 'ENUM' ? 'Enum'
            : valueType?.kind === 'BOOL' ? 'Boolean'
              : ['INT', 'FLOAT', 'NUMBER'].includes(valueType?.kind) ? 'Number' : 'String'
          return {
            id: parameter.identifier,
            data_name: parameter.nameI18n?.default || parameter.identifier,
            data_identifier: parameter.identifier,
            param_type: valueType?.kind === 'STRING' ? 'string' : paramType,
            data_type: valueType?.kind === 'ENUM' ? valueType.baseKind : paramType,
            description: parameter.descriptionI18n?.default || '',
            enum_config: valueType?.kind === 'ENUM'
              ? valueType.enumValues.map((option: any) => ({ value: option.code, desc: option.label.default }))
              : []
          }
        }))
      }
    })
}
