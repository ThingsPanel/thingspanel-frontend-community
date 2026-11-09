export function prepareBoardSchema(dashboard) {
  if (!dashboard?.canvasConfig || !Array.isArray(dashboard.nodes)) throw new Error('看板配置不完整')
  const schema = JSON.parse(
    JSON.stringify({
      meta: { id: dashboard.id, name: dashboard.name },
      canvas: dashboard.canvasConfig,
      nodes: dashboard.nodes,
      dataSources: dashboard.dataSources || [],
      variables: dashboard.variables || []
    })
  )
  // 大屏保持原始比例。fit-width 的引擎缩放与 DOM 组件缩放路径不同；
  // fit-min 统一在画布外层缩放，避免移动端裁切或拉伸。
  schema.canvas.scaleMode = 'fit-min'
  schema.canvas.previewAlignY = 'center'
  const sourceIds = new Set()
  const scan = (value) => {
    if (typeof value === 'string') {
      for (const match of value.matchAll(/\bds\.(__platform_[^.\s]+__)\.data\b/g)) sourceIds.add(match[1])
    } else if (value && typeof value === 'object') Object.values(value).forEach(scan)
  }
  scan(schema.nodes)
  for (const id of sourceIds) {
    if (!schema.dataSources.some((source) => source.id === id))
      schema.dataSources.push({
        id,
        type: 'PLATFORM_FIELD',
        config: { deviceId: id.slice(11, -2), fieldMappings: {}, bufferSize: 100 }
      })
  }
  const devices = new Map()
  for (const source of schema.dataSources) {
    if (!['PLATFORM', 'PLATFORM_FIELD'].includes(String(source.type).toUpperCase())) continue
    source.type = 'PLATFORM_FIELD'
    source.config = { fieldMappings: {}, ...source.config }
    const match = /^__platform_(.+)__$/.exec(source.id)
    const deviceId = source.config.deviceId || match?.[1]
    if (!deviceId || /\{\{|\$\{/.test(deviceId)) throw new Error('看板包含未指定设备的平台数据源，请先在 PC 端配置设备')
    source.config.deviceId = deviceId
    if (!devices.has(deviceId)) devices.set(deviceId, [])
    devices.get(deviceId).push(source.id)
  }
  return { schema, devices }
}
