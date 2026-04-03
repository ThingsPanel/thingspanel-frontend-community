const FIELD_BINDING_EXPR_RE = /^\{\{\s*ds\.([^.\s]+)\.data(?:\.(.+?))?\s*\}\}$/

type NodeLike = Record<string, any>
type EventAction = Record<string, any>
type EventHandler = {
  event?: string
  actions?: EventAction[]
}

function parseFieldBindingExpression(expression: unknown): { dataSourceId: string; fieldPath: string } | null {
  if (typeof expression !== 'string') return null
  const match = FIELD_BINDING_EXPR_RE.exec(expression.trim())
  if (!match?.[1] || !match?.[2]) return null
  return {
    dataSourceId: match[1],
    fieldPath: match[2]
  }
}

function findSwitchWriteBinding(node: NodeLike): { dataSourceId: string; fieldPath: string } | null {
  const bindings = Array.isArray(node?.data) ? node.data : []
  const valueBinding = bindings.find((binding: any) => binding?.targetProp === 'value')
  const fromBinding = parseFieldBindingExpression(valueBinding?.expression)
  if (fromBinding) return fromBinding

  return parseFieldBindingExpression(node?.props?.value)
}

function hasCallWriteOnChange(events: EventHandler[]): boolean {
  return events.some((handler) => {
    if (handler?.event !== 'change' || !Array.isArray(handler.actions)) return false
    return handler.actions.some((action) => action?.type === 'callWrite')
  })
}

function normalizeSwitchNode(node: NodeLike): NodeLike {
  if (node?.type !== 'interaction/basic-switch') return node

  const events = Array.isArray(node.events) ? [...node.events] : []
  if (hasCallWriteOnChange(events)) return node

  const binding = findSwitchWriteBinding(node)
  if (!binding) return node

  return {
    ...node,
    events: [
      ...events,
      {
        event: 'change',
        actions: [
          {
            type: 'callWrite',
            dataSourceId: binding.dataSourceId
          }
        ]
      }
    ]
  }
}

export function normalizeInteractiveWriteBindings(config: any) {
  if (!config || !Array.isArray(config.nodes)) return config

  return {
    ...config,
    nodes: config.nodes.map((node: NodeLike) => normalizeSwitchNode(node))
  }
}
