// Derived from ThingsPanel/app 74e0509; mini-program H5 owns this copy.
export function parseExtensionDefinitions(raw) {
  const value = typeof raw === 'string' ? (raw.trim() ? JSON.parse(raw) : []) : raw
  // 旧版设备配置以 {} 表示没有扩展字段，线上设备仍使用这一默认值。
  if (value == null || (typeof value === 'object' && !Array.isArray(value) && !Object.keys(value).length)) return []
  if (!Array.isArray(value)) throw new Error('设备配置中的扩展字段格式异常')
  return value
}

export function buildAdditionalInfo(original, fields) {
  const values = {}
  for (const field of fields.filter((item) => item.enable === true)) {
    if (field.type === 'Number' && field.value !== '' && !Number.isFinite(Number(field.value))) {
      throw new Error(field.name + '必须是有效数字')
    }
    values[field.name] = field.type === 'Number' ? (field.value === '' ? null : Number(field.value)) : field.value
  }
  // 保留配置外字段和旧版 extendedInfo 结构，避免保存表单时删除其他业务数据。
  const merge = (stored) =>
    Array.isArray(stored)
      ? stored
          .map((item) => ({
            ...item,
            ...(Object.prototype.hasOwnProperty.call(values, item.name) ? { value: values[item.name] } : {})
          }))
          .concat(
            Object.entries(values)
              .filter(([name]) => !stored.some((item) => item.name === name))
              .map(([name, value]) => ({ name, value }))
          )
      : { ...stored, ...values }
  return original.extendedInfo !== undefined
    ? { ...original, extendedInfo: merge(original.extendedInfo) }
    : merge(original)
}

export function validateCoordinates(longitude, latitude) {
  if (
    !!longitude !== !!latitude ||
    (longitude &&
      (!Number.isFinite(Number(longitude)) ||
        Math.abs(Number(longitude)) > 180 ||
        !Number.isFinite(Number(latitude)) ||
        Math.abs(Number(latitude)) > 90))
  ) {
    throw new Error('请填写完整且有效的经纬度')
  }
  return longitude ? longitude + ',' + latitude : ''
}
