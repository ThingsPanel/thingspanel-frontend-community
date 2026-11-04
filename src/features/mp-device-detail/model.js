import { extractDeviceFields } from './schema.js'

function chartConfig(raw) {
  const value = typeof raw === 'string' ? JSON.parse(raw || 'null') : raw
  // Older templates store [] when no mobile visualization has been configured.
  return Array.isArray(value) && value.length === 0 ? null : value
}

export async function loadDeviceModel(device, context, { dataOnly = false } = {}) {
  const binding = device.device_config || {}
  if (
    binding.native_thing_model_id != null ||
    binding.native_thing_model_snapshot_id != null ||
    binding.native_thing_model_revision != null
  ) {
    const revision = Number(binding.native_thing_model_revision)
    const bindingRevision = Number(binding.native_binding_revision)
    if (
      !binding.native_thing_model_id ||
      !binding.native_thing_model_snapshot_id ||
      !Number.isInteger(revision) ||
      revision < 1 ||
      !Number.isInteger(bindingRevision) ||
      bindingRevision < 1 ||
      binding.device_template_id
    )
      throw new Error('设备绑定的物模型版本不完整')
    const snapshot = await context.request(
      `/api/v2/thing-models/${encodeURIComponent(binding.native_thing_model_id)}/versions/${revision}`,
      null,
      'GET',
      true
    )
    if (
      snapshot.modelID !== binding.native_thing_model_id ||
      snapshot.snapshotID !== binding.native_thing_model_snapshot_id ||
      snapshot.publishedRevision !== revision
    )
      throw new Error('物模型版本与设备绑定不一致')
    const fields = (snapshot.model?.fields || []).map((field) => {
      const value = field.valueType || {}
      const kind = field.kind.toLowerCase()
      const type =
        ['INT', 'FLOAT', 'NUMBER'].includes(value.kind) || (value.kind === 'ENUM' && value.baseKind === 'NUMBER')
          ? 'number'
          : value.kind === 'BOOL' || value.baseKind === 'BOOLEAN'
            ? 'boolean'
            : ['COMMAND', 'EVENT'].includes(field.kind)
              ? 'json'
              : 'string'
      return {
        id: field.identifier,
        name: field.nameI18n?.default || field.identifier,
        type,
        dataType: kind,
        unit: field.unit || '',
        writable: kind === 'command',
        options:
          value.kind === 'BOOL' && value.constraint
            ? [
                ...(value.constraint.trueText ? [{ value: true, label: value.constraint.trueText }] : []),
                ...(value.constraint.falseText ? [{ value: false, label: value.constraint.falseText }] : [])
              ]
            : (value.enumValues || []).map((option) => ({
                value: option.code,
                label: option.label?.default || String(option.code)
              })),
        nativeSchema: field.parameters
          ? { kind: field.kind, parameters: field.parameters }
          : { kind: field.kind, valueType: value },
        ...(kind === 'command' ? { write: { target: 'command', property: field.identifier, payloadType: type } } : {})
      }
    })
    return { fields, config: dataOnly ? null : chartConfig(snapshot.resources?.appChartConfig), native: true }
  }
  if (!binding.device_template_id) return { fields: [], config: null, native: false }
  const templateId = binding.device_template_id
  const kinds = ['telemetry', 'attributes', 'events', 'commands']
  const [template, ...results] = await Promise.all([
    dataOnly ? Promise.resolve(null) : context.api(`device/template/detail/${encodeURIComponent(templateId)}`),
    ...kinds.map((kind) =>
      context.api(`device/model/${kind}`, { device_template_id: templateId, page: 1, page_size: 1000 })
    )
  ])
  return {
    config: chartConfig(template?.app_chart_config),
    fields: extractDeviceFields(Object.fromEntries(kinds.map((kind, index) => [kind, results[index]]))),
    native: false
  }
}
