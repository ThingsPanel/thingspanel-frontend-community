const HISTORY_SUFFIX = '__history'

const HISTORY_TARGET_PROPS = new Set(['data', 'dataset'])

const FIELD_BINDING_EXPR_RE = /^\{\{\s*ds\.([^.\s]+)\.data(?:\.(.+?))?\s*\}\}$/

function normalizeHistoryExpression(expression: unknown): unknown {
  if (typeof expression !== 'string') return expression

  const match = FIELD_BINDING_EXPR_RE.exec(expression.trim())
  if (!match) return expression

  const dataSourceId = match[1]
  const fieldPath = match[2]
  if (!dataSourceId || !fieldPath || fieldPath.endsWith(HISTORY_SUFFIX)) {
    return expression
  }

  return `{{ ds.${dataSourceId}.data.${fieldPath}${HISTORY_SUFFIX} }}`
}

function isHistoryChartWidgetType(widgetType: unknown): boolean {
  if (typeof widgetType !== 'string') return false
  const normalized = widgetType.toLowerCase()
  const isChart = normalized.startsWith('chart-') || normalized.startsWith('chart/')
  if (!isChart) return false
  return normalized.includes('line') || normalized.includes('bar') || normalized.includes('uplot')
}

function normalizeNodeBindings(node: any) {
  const widgetType = node?.schemaRef?.type ?? node?.type
  if (!isHistoryChartWidgetType(widgetType)) return
  if (!Array.isArray(node?.data)) return

  node.data = node.data.map((binding: any) => {
    if (!HISTORY_TARGET_PROPS.has(binding?.targetProp)) return binding
    return {
      ...binding,
      expression: normalizeHistoryExpression(binding.expression)
    }
  })
}

export function normalizeThingsVisHistoryBindings<T>(config: T): T {
  if (!config || typeof config !== 'object') return config

  const target = config as any

  if (Array.isArray(target.nodes)) {
    target.nodes.forEach(normalizeNodeBindings)
  }

  if (target.nodesById && typeof target.nodesById === 'object') {
    Object.values(target.nodesById).forEach(normalizeNodeBindings)
  }

  return config
}
