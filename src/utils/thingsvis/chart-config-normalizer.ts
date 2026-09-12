export type CanonicalChartConfig = Record<string, any>

export interface ChartConfigNormalizerOptions {
  /** Used when an AI/API payload does not include a canvas. */
  defaultCanvas?: Partial<Record<string, unknown>>
  /** Used to turn a single-field binding shorthand into a ThingsVis expression. */
  defaultDataSourceId?: string
  /** Used to create a platform source when a generated payload only contains bindings. */
  defaultDeviceId?: string
}

const DEFAULT_CANVAS = {
  mode: 'fixed',
  width: 1920,
  height: 1080,
  background: { color: 'transparent' }
}

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function finiteNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return undefined
}

function positiveNumber(...values: unknown[]): number | undefined {
  const value = finiteNumber(...values)
  return value !== undefined && value > 0 ? value : undefined
}

function parseObject(value: unknown): Record<string, any> {
  if (isRecord(value)) return value
  if (typeof value !== 'string' || !value.trim()) return {}
  try {
    const parsed = JSON.parse(value)
    return isRecord(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function normalizeCanvas(raw: unknown, nodeInputs: Record<string, any>[], options: ChartConfigNormalizerOptions) {
  const source = { ...DEFAULT_CANVAS, ...(options.defaultCanvas || {}), ...parseObject(raw) }
  const hasGridNodes = nodeInputs.some(node => {
    const grid = parseObject(node.grid)
    return Object.keys(grid).length > 0 || ['x', 'y', 'w', 'h'].every(key => finiteNumber(node[key]) !== undefined)
  })
  const mode = source.mode === 'reflow' ? 'infinite' : source.mode
  const normalizedMode =
    mode === 'grid' || mode === 'infinite' || mode === 'fixed' ? mode : hasGridNodes ? 'grid' : 'fixed'
  const canvas = {
    ...source,
    mode: normalizedMode,
    width: Math.max(1, Math.round(positiveNumber(source.width) ?? 1920)),
    height: Math.max(1, Math.round(positiveNumber(source.height) ?? 1080)),
    background: isRecord(source.background)
      ? source.background
      : { color: typeof source.background === 'string' && source.background ? source.background : 'transparent' }
  }

  if (normalizedMode === 'grid') {
    canvas.gridCols = Math.max(1, Math.round(positiveNumber(source.gridCols) ?? 24))
    canvas.gridRowHeight = Math.max(1, Math.round(positiveNumber(source.gridRowHeight, source.rowHeight) ?? 50))
    canvas.gridGap = Math.max(0, Math.round(finiteNumber(source.gridGap, source.gap) ?? 5))
    canvas.padding = Math.max(0, Math.round(finiteNumber(source.padding) ?? 0))
  }

  return canvas
}

function normalizeBaseStyle(raw: unknown): Record<string, any> {
  const source = parseObject(raw)
  return {
    ...source,
    background: {
      color: 'transparent',
      opacity: 1,
      ...(isRecord(source.background) ? source.background : {})
    },
    border: {
      style: 'solid',
      ...(isRecord(source.border) ? source.border : {})
    },
    opacity: finiteNumber(source.opacity) ?? 1
  }
}

function getFieldId(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const match = value.trim().match(/^[A-Za-z_][\w-]*(?:__history)?$/)
  return match?.[0]
}

function bindingExpression(value: unknown, dataSourceId?: string): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (/^\{\{.*\}\}$/.test(trimmed)) return trimmed
    const fieldId = getFieldId(trimmed)
    if (fieldId && dataSourceId) return `{{ ds.${dataSourceId}.data.${fieldId} }}`
    return undefined
  }
  if (!isRecord(value)) return undefined
  return bindingExpression(value.expression ?? value.binding ?? value.source ?? value.value, dataSourceId)
}

function normalizeBindings(raw: unknown, node: Record<string, any>, defaultDataSourceId?: string): any[] {
  const values = Array.isArray(raw) ? raw : raw ? [raw] : []
  return values.flatMap(value => {
    const binding = isRecord(value) ? value : { expression: value }
    const dataSourceId =
      String(binding.dataSourceId || node.dataSourceId || defaultDataSourceId || '').trim() || undefined
    const expression = bindingExpression(
      binding.expression ?? binding.binding ?? binding.source ?? binding.value ?? binding.fieldId,
      dataSourceId
    )
    if (!expression) return []
    const targetProp = String(
      binding.targetProp || binding.target || binding.property || binding.prop || binding.name || 'value'
    ).trim()
    return [
      {
        ...binding,
        targetProp: targetProp || 'value',
        expression
      }
    ]
  })
}

function normalizeGrid(
  node: Record<string, any>,
  canvas: Record<string, any>,
  fallback: { x: number; y: number; w: number; h: number }
) {
  const rawGrid = parseObject(node.grid)
  const legacyGrid = ['x', 'y', 'w', 'h'].every(key => finiteNumber(node[key]) !== undefined)
    ? node
    : isRecord(node.layout)
      ? node.layout
      : {}
  const raw = Object.keys(rawGrid).length > 0 ? rawGrid : legacyGrid
  const cols = Math.max(1, Math.round(positiveNumber(canvas.gridCols) ?? 24))
  const w = Math.min(cols, Math.max(1, Math.round(positiveNumber(raw.w, raw.width) ?? fallback.w)))
  return {
    ...rawGrid,
    x: Math.max(0, Math.round(finiteNumber(raw.x, raw.left) ?? fallback.x)),
    y: Math.max(0, Math.round(finiteNumber(raw.y, raw.top) ?? fallback.y)),
    w,
    h: Math.max(1, Math.round(positiveNumber(raw.h, raw.height) ?? fallback.h)),
    static: raw.static ?? false,
    isDraggable: raw.isDraggable ?? true,
    isResizable: raw.isResizable ?? true
  }
}

function normalizeNode(
  raw: unknown,
  index: number,
  canvas: Record<string, any>,
  defaultDataSourceId?: string,
  cursor: { x: number; y: number; rowHeight: number }
): Record<string, any> {
  const node = isRecord(raw) ? raw : {}
  const gridMode = canvas.mode === 'grid'
  const legacyHasGrid = ['x', 'y', 'w', 'h'].every(key => finiteNumber(node[key]) !== undefined)
  const fallback = { x: cursor.x, y: cursor.y, w: 6, h: 4 }
  const grid = gridMode ? normalizeGrid(node, canvas, fallback) : undefined
  if (gridMode) {
    cursor.x = grid.x + grid.w
    cursor.rowHeight = Math.max(cursor.rowHeight, grid.h)
    if (cursor.x >= Number(canvas.gridCols)) {
      cursor.x = 0
      cursor.y += cursor.rowHeight
      cursor.rowHeight = 0
    }
  }

  const cellWidth = Number(canvas.width) / Math.max(1, Number(canvas.gridCols) || 24)
  const rowHeight = Number(canvas.gridRowHeight) || 50
  const gap = Number(canvas.gridGap) || 0
  const positionSource = parseObject(node.position)
  const sizeSource = parseObject(node.size)
  const position = {
    x:
      finiteNumber(
        positionSource.x,
        legacyHasGrid ? Number(node.x) * cellWidth : node.x,
        grid ? grid.x * cellWidth : undefined
      ) ?? 0,
    y:
      finiteNumber(
        positionSource.y,
        legacyHasGrid ? Number(node.y) * (rowHeight + gap) : node.y,
        grid ? grid.y * (rowHeight + gap) : undefined
      ) ?? 0
  }
  const size = {
    width:
      positiveNumber(
        sizeSource.width,
        node.width,
        legacyHasGrid ? Number(node.w) * cellWidth : undefined,
        grid ? grid.w * cellWidth : undefined
      ) ?? 240,
    height:
      positiveNumber(
        sizeSource.height,
        node.height,
        legacyHasGrid ? Number(node.h) * rowHeight : undefined,
        grid ? grid.h * rowHeight : undefined
      ) ?? 200
  }

  const {
    x: _x,
    y: _y,
    w: _w,
    h: _h,
    width: _width,
    height: _height,
    left: _left,
    top: _top,
    layout: _layout,
    ...rest
  } = node
  const data = normalizeBindings(node.data ?? node.bindings ?? node.dataBindings, node, defaultDataSourceId)
  return {
    ...rest,
    id: String(node.id || node.key || `node-${index}`),
    type: String(node.type || node.widgetId || node.component || 'basic/text'),
    props: parseObject(node.props ?? node.properties),
    baseStyle: normalizeBaseStyle(node.baseStyle ?? node.style),
    position,
    size,
    ...(data.length > 0 ? { data } : { data: [] }),
    events: Array.isArray(node.events) ? node.events : [],
    ...(grid ? { grid } : {})
  }
}

function collectBindingFieldIds(nodes: Record<string, any>[]): Map<string, Set<string>> {
  const result = new Map<string, Set<string>>()
  nodes.forEach(node => {
    const dataSourceId = String(node.dataSourceId || '').trim()
    const bindings = Array.isArray(node.data) ? node.data : []
    bindings.forEach(binding => {
      const match =
        typeof binding?.expression === 'string' ? binding.expression.match(/ds\.([^\s.}]+)\.data\.([^\s.}]+)/) : null
      const sourceId = match?.[1] || dataSourceId
      const fieldId = getFieldId(match?.[2])
      if (!sourceId || !fieldId) return
      const fields = result.get(sourceId) || new Set<string>()
      fields.add(fieldId.replace(/__history$/, ''))
      result.set(sourceId, fields)
    })
  })
  return result
}

function normalizeDataSources(
  raw: unknown,
  nodes: Record<string, any>[],
  options: ChartConfigNormalizerOptions
): any[] {
  const sourceList = Array.isArray(raw) ? raw : []
  const requirements = collectBindingFieldIds(nodes)
  const normalized = sourceList.filter(isRecord).map((source, index) => {
    const id = String(source.id || source.key || '').trim()
    const type = String(source.type || source.kind || 'REST').toUpperCase()
    const config = parseObject(source.config)
    if (type !== 'PLATFORM_FIELD' && type !== 'PLATFORM') {
      return { ...source, id: id || `data-source-${index + 1}`, type, config }
    }
    const requested = new Set<string>(
      Array.isArray(config.requestedFields)
        ? config.requestedFields.filter((v): v is string => typeof v === 'string')
        : []
    )
    requirements.get(id)?.forEach(fieldId => requested.add(fieldId))
    const deviceId = String(config.deviceId || id.match(/^__platform_(.+)__$/)?.[1] || '').trim()
    return {
      ...source,
      id: id || `__platform_${deviceId || 'default'}__`,
      name: String(source.name || id || 'Platform fields'),
      type: 'PLATFORM_FIELD',
      config: {
        source: config.source || 'platform',
        fieldMappings: isRecord(config.fieldMappings) ? config.fieldMappings : {},
        ...config,
        ...(deviceId ? { deviceId } : {}),
        requestedFields: Array.from(requested)
      }
    }
  })

  if (normalized.length === 0 && options.defaultDeviceId) {
    const id = `__platform_${options.defaultDeviceId}__`
    const requested = Array.from(requirements.get(options.defaultDataSourceId || id) || [])
    normalized.push({
      id,
      name: 'Platform fields',
      type: 'PLATFORM_FIELD',
      config: { source: 'platform', fieldMappings: {}, deviceId: options.defaultDeviceId, requestedFields: requested }
    })
  }
  return normalized
}

/** Convert API/AI/legacy chart payloads to the schema accepted by ThingsVis. */
export function canonicalizeThingsVisConfig(
  raw: unknown,
  options: ChartConfigNormalizerOptions = {}
): CanonicalChartConfig {
  const input = typeof raw === 'string' ? parseObject(raw) : isRecord(raw) ? raw : {}
  const source = !Array.isArray(input.nodes) && isRecord(input.config) ? input.config : input
  const rawNodes = Array.isArray(source.nodes) ? source.nodes : []
  const rawBindings = Array.isArray(source.dataBindings) ? source.dataBindings : []
  const bindingByNode = new Map<string, any[]>()
  rawBindings.forEach(binding => {
    if (!isRecord(binding) || binding.nodeId === undefined) return
    const list = bindingByNode.get(String(binding.nodeId)) || []
    list.push(binding)
    bindingByNode.set(String(binding.nodeId), list)
  })
  const nodeInputs = rawNodes.map(node => {
    if (!isRecord(node)) return node
    const nodeId = String(node.id || node.key || '')
    if (Array.isArray(node.data) || !bindingByNode.has(nodeId)) return node
    return { ...node, data: bindingByNode.get(nodeId) }
  })
  const canvas = normalizeCanvas(source.canvas ?? source.canvasConfig, nodeInputs as Record<string, any>[], options)
  const cursor = { x: 0, y: 0, rowHeight: 0 }
  const nodes = nodeInputs.map((node, index) => normalizeNode(node, index, canvas, options.defaultDataSourceId, cursor))
  const dataSources = normalizeDataSources(source.dataSources, nodes, options)

  return {
    ...source,
    canvas,
    nodes,
    dataSources,
    variables: Array.isArray(source.variables) ? source.variables : [],
    ...(Array.isArray(source.platformFields) ? { platformFields: source.platformFields } : {})
  }
}

export const normalizeThingsVisConfig = canonicalizeThingsVisConfig
export const normalizeChartConfig = canonicalizeThingsVisConfig

/** A preview may hydrate platform data only after both iframe lifecycle signals. */
export function canHydrateThingsVisPreview(state: { ready: boolean; loaded: boolean }): boolean {
  return state.ready === true && state.loaded === true
}
