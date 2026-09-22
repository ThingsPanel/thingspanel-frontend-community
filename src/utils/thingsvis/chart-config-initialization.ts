import { canonicalizeThingsVisConfig, THINGSVIS_GRID_DEFAULTS } from './chart-config-normalizer'

export const APP_CANVAS_DEFAULTS = {
  mode: 'grid',
  width: 375,
  height: 844,
  gridCols: 4,
  gridRowHeight: THINGSVIS_GRID_DEFAULTS.rowHeight,
  gridGap: THINGSVIS_GRID_DEFAULTS.gap,
  padding: THINGSVIS_GRID_DEFAULTS.padding,
  responsive: false
} as const

type AppNodeSyncState = 'inherited' | 'overridden' | 'local' | 'orphaned'

type AppSyncMetadata = {
  version: 1
  webNodeIds: string[]
  tombstones: string[]
  orphanedNodeIds: string[]
}

const finiteNumber = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return undefined
}

const positiveNumber = (...values: unknown[]) => {
  const value = finiteNumber(...values)
  return value !== undefined && value > 0 ? value : undefined
}

const recordValue = (value: unknown): Record<string, any> =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, any>) : {}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(value)))

function isLandscapeAppCanvas(canvas: Record<string, any>) {
  const width = positiveNumber(canvas.width) ?? APP_CANVAS_DEFAULTS.width
  const height = positiveNumber(canvas.height) ?? APP_CANVAS_DEFAULTS.height

  // 800x844 was used by an early App editor and is portrait by ratio, but is
  // still wider than a phone canvas. Treat it as a legacy canvas as well.
  return width > height || width > 500
}

function reflowNodesToAppGrid(nodes: any[], sourceCanvas: Record<string, any>, reflowFixedNodes = true) {
  const appCols = APP_CANVAS_DEFAULTS.gridCols
  const sourceCols = Math.max(1, Math.round(positiveNumber(sourceCanvas.gridCols) ?? 24))
  const sourceWidth = positiveNumber(sourceCanvas.width) ?? 1920
  let cursorX = 0
  let cursorY = 0
  let rowHeight = 0

  const nextNodes = nodes.map(node => {
    const sourceGrid = recordValue(node?.grid)
    if (!Object.keys(sourceGrid).length && !reflowFixedNodes) return node

    const nodeSize = recordValue(node?.size)
    const sourceWidthInCols = positiveNumber(sourceGrid.w)
    const sourceHeightInRows = positiveNumber(sourceGrid.h)
    const hasSourceGrid = sourceWidthInCols !== undefined
    const sourcePixelWidth = positiveNumber(nodeSize.width, node?.width) ?? 240
    const sourcePixelHeight = positiveNumber(nodeSize.height, node?.height) ?? 200
    const width = clamp(
      hasSourceGrid ? (sourceWidthInCols * appCols) / sourceCols : (sourcePixelWidth * appCols) / sourceWidth,
      1,
      appCols
    )
    const height = Math.max(1, Math.round(sourceHeightInRows ?? sourcePixelHeight / 50))

    if (cursorX + width > appCols) {
      cursorX = 0
      cursorY += rowHeight
      rowHeight = 0
    }

    const grid = {
      ...sourceGrid,
      x: cursorX,
      y: cursorY,
      w: width,
      h: height
    }
    const cellWidth = APP_CANVAS_DEFAULTS.width / appCols
    const nextNode = {
      ...node,
      grid,
      position: {
        x: cursorX * cellWidth,
        y: cursorY * APP_CANVAS_DEFAULTS.gridRowHeight
      },
      size: {
        width: hasSourceGrid ? width * cellWidth : Math.min(APP_CANVAS_DEFAULTS.width, sourcePixelWidth),
        height: hasSourceGrid ? height * APP_CANVAS_DEFAULTS.gridRowHeight : sourcePixelHeight
      }
    }

    cursorX += width
    rowHeight = Math.max(rowHeight, height)
    return nextNode
  })

  return {
    nodes: nextNodes,
    contentRows: cursorY + rowHeight
  }
}

function nodeIdentity(node: any, index = 0) {
  const id = String(node?.id || node?.key || `node-${index}`).trim()
  return id || `node-${index}`
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : []
}

function readAppSyncMetadata(config: Record<string, any>): AppSyncMetadata {
  const raw = recordValue(config.appSync)
  return {
    version: 1,
    webNodeIds: stringArray(raw.webNodeIds),
    tombstones: stringArray(raw.tombstones),
    orphanedNodeIds: stringArray(raw.orphanedNodeIds)
  }
}

function readNodeSync(node: any) {
  return recordValue(node?.sync)
}

function nodeSourceId(node: any, index = 0) {
  const sync = readNodeSync(node)
  const sourceNodeId = String(sync.sourceNodeId || '').trim()
  return sourceNodeId || nodeIdentity(node, index)
}

function withWebNodeSync(node: any, sourceNodeId: string, state: AppNodeSyncState = 'inherited') {
  return {
    ...node,
    sync: {
      ...readNodeSync(node),
      source: 'web',
      sourceNodeId,
      state
    }
  }
}

function withLocalNodeSync(node: any) {
  return {
    ...node,
    sync: {
      ...readNodeSync(node),
      source: 'app',
      state: 'local'
    }
  }
}

function gridRowEnd(nodes: any[]) {
  return nodes.reduce((max, node) => {
    const grid = recordValue(node?.grid)
    const y = finiteNumber(grid.y) ?? 0
    const h = positiveNumber(grid.h) ?? 1
    return Math.max(max, y + h)
  }, 0)
}

function updateAppCanvasHeight(config: Record<string, any>, nodes: any[]) {
  const canvas = recordValue(config.canvas)
  const rowEnd = gridRowEnd(nodes)
  const rowHeight = Number(canvas.gridRowHeight) || APP_CANVAS_DEFAULTS.gridRowHeight
  const gap = Number(canvas.gridGap) || APP_CANVAS_DEFAULTS.gridGap
  const padding = Number(canvas.padding) || APP_CANVAS_DEFAULTS.padding
  const contentHeight = rowEnd > 0 ? rowEnd * (rowHeight + gap) - gap + padding * 2 : APP_CANVAS_DEFAULTS.height

  return {
    ...config,
    nodes,
    canvas: {
      ...canvas,
      height: Math.max(Number(canvas.height) || APP_CANVAS_DEFAULTS.height, contentHeight)
    }
  }
}

/**
 * Normalize an App chart to the phone-oriented canvas contract.
 * Web and App charts remain independent; this only migrates a legacy App
 * payload that was copied from (or saved with) a landscape Web canvas.
 */
export function normalizeAppChartConfig(raw: unknown) {
  const config = canonicalizeThingsVisConfig(raw, { defaultCanvas: APP_CANVAS_DEFAULTS })
  const canvas = recordValue(config.canvas)
  const normalizedCanvas = {
    ...canvas,
    responsive: false
  }

  if (!isLandscapeAppCanvas(canvas)) {
    return {
      ...config,
      canvas: normalizedCanvas
    }
  }

  const { nodes, contentRows } = reflowNodesToAppGrid(Array.isArray(config.nodes) ? config.nodes : [], canvas)
  const contentHeight =
    contentRows > 0
      ? contentRows * (APP_CANVAS_DEFAULTS.gridRowHeight + APP_CANVAS_DEFAULTS.gridGap) -
        APP_CANVAS_DEFAULTS.gridGap +
        APP_CANVAS_DEFAULTS.padding * 2
      : APP_CANVAS_DEFAULTS.height

  return {
    ...config,
    nodes,
    canvas: {
      ...normalizedCanvas,
      ...APP_CANVAS_DEFAULTS,
      height: Math.max(APP_CANVAS_DEFAULTS.height, contentHeight)
    }
  }
}

/**
 * Merge Web additions into an existing App configuration without touching the
 * App's local layout. App deletions are represented as tombstones so a later
 * Web save does not resurrect them.
 */
function syncWebNodesIntoApp(currentAppConfig: unknown, webConfig: unknown) {
  const app = normalizeAppChartConfig(currentAppConfig)
  const web = canonicalizeThingsVisConfig(webConfig)
  const appNodes = Array.isArray(app.nodes) ? app.nodes : []
  const webNodes = Array.isArray(web.nodes) ? web.nodes : []
  const metadata = readAppSyncMetadata(app)
  const knownWebNodeIds = new Set(
    metadata.webNodeIds.length ? metadata.webNodeIds : appNodes.map((node, index) => nodeIdentity(node, index))
  )
  const currentWebNodeIds = webNodes.map((node, index) => nodeIdentity(node, index))
  const currentWebNodeIdSet = new Set(currentWebNodeIds)
  const tombstones = new Set(metadata.tombstones)
  const appSourceIds = new Set(appNodes.map((node, index) => nodeSourceId(node, index)))

  const newWebNodes = webNodes.filter((node, index) => {
    const sourceNodeId = nodeIdentity(node, index)
    return !appSourceIds.has(sourceNodeId) && !tombstones.has(sourceNodeId)
  })

  let addedNodes: any[] = []
  if (newWebNodes.length > 0) {
    const addedConfig = normalizeAppChartConfig({
      ...web,
      nodes: newWebNodes
    })
    const baseRow = gridRowEnd(appNodes)
    addedNodes = (Array.isArray(addedConfig.nodes) ? addedConfig.nodes : []).map((node, index) => {
      const sourceNodeId = nodeIdentity(newWebNodes[index], index)
      const grid = recordValue(node.grid)
      const nextGrid = {
        ...grid,
        y: (finiteNumber(grid.y) ?? 0) + baseRow
      }
      return withWebNodeSync(
        {
          ...node,
          grid: nextGrid,
          position: {
            ...recordValue(node.position),
            y: nextGrid.y * APP_CANVAS_DEFAULTS.gridRowHeight
          }
        },
        sourceNodeId
      )
    })
  }

  const orphanedNodeIds: string[] = []
  const syncedAppNodes = appNodes.map((node, index) => {
    const sync = readNodeSync(node)
    const sourceNodeId = nodeSourceId(node, index)
    const isWebLinked = sync.source === 'web' || knownWebNodeIds.has(sourceNodeId)
    if (!isWebLinked) return node

    if (!currentWebNodeIdSet.has(sourceNodeId)) {
      orphanedNodeIds.push(sourceNodeId)
      return withWebNodeSync(node, sourceNodeId, 'orphaned')
    }

    const state = sync.state === 'overridden' ? 'overridden' : 'inherited'
    return withWebNodeSync(node, sourceNodeId, state)
  })

  return updateAppCanvasHeight(
    {
      ...app,
      appSync: {
        version: 1,
        webNodeIds: currentWebNodeIds,
        tombstones: Array.from(tombstones),
        orphanedNodeIds
      }
    },
    [...syncedAppNodes, ...addedNodes]
  )
}

/**
 * Record App-local deletes and overrides before persisting an App chart.
 * The Web chart is never mutated from this path.
 */
export function prepareAppChartConfigForSave(previousAppConfig: unknown, nextAppConfig: unknown) {
  const previous = normalizeAppChartConfig(previousAppConfig || {})
  const next = normalizeAppChartConfig(nextAppConfig)
  const metadata = readAppSyncMetadata(previous)
  const previousNodes = Array.isArray(previous.nodes) ? previous.nodes : []
  const nextNodes = Array.isArray(next.nodes) ? next.nodes : []
  const previousBySourceId = new Map(previousNodes.map((node, index) => [nodeSourceId(node, index), node]))
  const nextSourceIds = new Set(nextNodes.map((node, index) => nodeSourceId(node, index)))
  const tombstones = new Set(metadata.tombstones)

  previousNodes.forEach((node, index) => {
    const sync = readNodeSync(node)
    const sourceNodeId = nodeSourceId(node, index)
    const wasWebLinked = sync.source === 'web' || metadata.webNodeIds.includes(sourceNodeId)
    if (wasWebLinked && !nextSourceIds.has(sourceNodeId)) tombstones.add(sourceNodeId)
  })

  const nodes = nextNodes.map((node, index) => {
    const sourceNodeId = nodeSourceId(node, index)
    const existingNode = previousBySourceId.get(sourceNodeId)
    const existingSync = readNodeSync(existingNode)
    const currentSync = readNodeSync(node)

    if (currentSync.source === 'web' || existingSync.source === 'web' || metadata.webNodeIds.includes(sourceNodeId)) {
      const previousLayout = existingNode
        ? JSON.stringify({
            grid: existingNode.grid,
            position: existingNode.position,
            size: existingNode.size,
            baseStyle: existingNode.baseStyle
          })
        : ''
      const nextLayout = JSON.stringify({
        grid: node.grid,
        position: node.position,
        size: node.size,
        baseStyle: node.baseStyle
      })
      const state: AppNodeSyncState = previousLayout && previousLayout !== nextLayout ? 'overridden' : 'inherited'
      tombstones.delete(sourceNodeId)
      return withWebNodeSync(node, sourceNodeId, state)
    }

    return withLocalNodeSync(node)
  })

  return updateAppCanvasHeight(
    {
      ...next,
      appSync: {
        version: 1,
        webNodeIds: metadata.webNodeIds,
        tombstones: Array.from(tombstones),
        orphanedNodeIds: metadata.orphanedNodeIds.filter(nodeId => nextSourceIds.has(nodeId))
      }
    },
    nodes
  )
}

/**
 * Sync the Web chart baseline into App without overwriting App-local layout.
 */
export function syncAppChartConfigFromWeb(currentAppConfig: unknown, webConfig: string): string {
  const hasAppConfig =
    currentAppConfig !== null &&
    currentAppConfig !== undefined &&
    (typeof currentAppConfig !== 'string' || currentAppConfig.trim().length > 0)

  if (hasAppConfig) {
    try {
      return JSON.stringify(syncWebNodesIntoApp(currentAppConfig, webConfig))
    } catch {
      return typeof currentAppConfig === 'string' ? currentAppConfig : JSON.stringify(currentAppConfig)
    }
  }

  try {
    const parsed = canonicalizeThingsVisConfig(webConfig)
    const { nodes } = reflowNodesToAppGrid(Array.isArray(parsed.nodes) ? parsed.nodes : [], parsed.canvas, false)

    const appConfig = {
      ...parsed,
      nodes: nodes.map((node, index) => withWebNodeSync(node, nodeIdentity(node, index))),
      appSync: {
        version: 1,
        webNodeIds: parsed.nodes.map((node: any, index: number) => nodeIdentity(node, index)),
        tombstones: [],
        orphanedNodeIds: []
      },
      canvas: {
        ...(parsed.canvas || {}),
        mode: 'grid',
        ...APP_CANVAS_DEFAULTS
      }
    }
    return JSON.stringify(appConfig)
  } catch {
    return webConfig
  }
}

// Backward-compatible name for callers that still use the old initialization API.
export const initializeAppChartConfigOnce = syncAppChartConfigFromWeb
