/**
 * 画布状态选择器
 * 提供从状态派生数据的计算函数，类似 Redux Selector
 */

import type {
  ICanvasNode,
  RenderTree,
  Position,
  Size
} from '../types'

/**
 * 根据 ID 选择节点
 */
export function selectNodeById(
  nodes: RenderTree,
  id: string
): ICanvasNode | undefined {
  return nodes.find(node => node.id === id)
}

/**
 * 根据 ID 列表选择节点
 */
export function selectNodesByIds(
  nodes: RenderTree,
  ids: string[]
): ICanvasNode[] {
  const idSet = new Set(ids)
  return nodes.filter(node => idSet.has(node.id))
}

/**
 * 选择所有可见节点
 */
export function selectVisibleNodes(nodes: RenderTree): ICanvasNode[] {
  return nodes.filter(node => node.metadata.visible)
}

/**
 * 选择所有锁定节点
 */
export function selectLockedNodes(nodes: RenderTree): ICanvasNode[] {
  return nodes.filter(node => node.metadata.locked)
}

/**
 * 选择指定类型的节点
 */
export function selectNodesByType(
  nodes: RenderTree,
  type: string
): ICanvasNode[] {
  return nodes.filter(node => node.type === type)
}

/**
 * 选择所有可编辑节点（可见且未锁定）
 */
export function selectEditableNodes(nodes: RenderTree): ICanvasNode[] {
  return nodes.filter(node => node.metadata.visible && !node.metadata.locked)
}

/**
 * 选择在指定区域内的节点
 */
export function selectNodesInRegion(
  nodes: RenderTree,
  region: { x: number; y: number; width: number; height: number }
): ICanvasNode[] {
  return nodes.filter(node => {
    const { position, size } = node
    const nodeRight = position.x + size.width
    const nodeBottom = position.y + size.height
    const regionRight = region.x + region.width
    const regionBottom = region.y + region.height

    // 判断节点是否与区域相交
    return (
      position.x < regionRight &&
      nodeRight > region.x &&
      position.y < regionBottom &&
      nodeBottom > region.y
    )
  })
}

/**
 * 选择指定点下的节点（从上到下）
 */
export function selectNodeAtPoint(
  nodes: RenderTree,
  point: Position
): ICanvasNode | undefined {
  // 按 z-index 降序排序，优先返回上层节点
  const sorted = [...nodes].sort((a, b) => {
    const zIndexA = a.style.zIndex || 0
    const zIndexB = b.style.zIndex || 0
    return zIndexB - zIndexA
  })

  return sorted.find(node => {
    const { position, size } = node
    return (
      point.x >= position.x &&
      point.x <= position.x + size.width &&
      point.y >= position.y &&
      point.y <= position.y + size.height &&
      node.metadata.visible
    )
  })
}

/**
 * 计算所有节点的边界框
 */
export function selectBoundingBox(nodes: RenderTree): {
  x: number
  y: number
  width: number
  height: number
} | null {
  if (nodes.length === 0) return null

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  nodes.forEach(node => {
    const { position, size } = node
    minX = Math.min(minX, position.x)
    minY = Math.min(minY, position.y)
    maxX = Math.max(maxX, position.x + size.width)
    maxY = Math.max(maxY, position.y + size.height)
  })

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  }
}

/**
 * 计算选中节点的边界框
 */
export function selectSelectionBoundingBox(
  nodes: RenderTree,
  selectedIds: string[]
): ReturnType<typeof selectBoundingBox> {
  const selectedNodes = selectNodesByIds(nodes, selectedIds)
  return selectBoundingBox(selectedNodes)
}

/**
 * 计算节点的中心点
 */
export function selectNodeCenter(node: ICanvasNode): Position {
  return {
    x: node.position.x + node.size.width / 2,
    y: node.position.y + node.size.height / 2
  }
}

/**
 * 检查节点是否在视口内
 */
export function isNodeInViewport(
  node: ICanvasNode,
  viewport: { x: number; y: number; zoom: number; width: number; height: number }
): boolean {
  const { position, size } = node
  const nodeRight = position.x + size.width
  const nodeBottom = position.y + size.height
  const viewportRight = viewport.x + viewport.width / viewport.zoom
  const viewportBottom = viewport.y + viewport.height / viewport.zoom

  return (
    position.x < viewportRight &&
    nodeRight > viewport.x &&
    position.y < viewportBottom &&
    nodeBottom > viewport.y
  )
}

/**
 * 选择视口内的节点
 */
export function selectNodesInViewport(
  nodes: RenderTree,
  viewport: { x: number; y: number; zoom: number; width: number; height: number }
): ICanvasNode[] {
  return nodes.filter(node => isNodeInViewport(node, viewport))
}

/**
 * 统计信息选择器
 */

/**
 * 获取节点总数
 */
export function selectNodeCount(nodes: RenderTree): number {
  return nodes.length
}

/**
 * 获取按类型分组的节点数量
 */
export function selectNodeCountByType(
  nodes: RenderTree
): Record<string, number> {
  return nodes.reduce((acc, node) => {
    acc[node.type] = (acc[node.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)
}

/**
 * 获取可见节点数量
 */
export function selectVisibleNodeCount(nodes: RenderTree): number {
  return nodes.filter(node => node.metadata.visible).length
}

/**
 * 获取锁定节点数量
 */
export function selectLockedNodeCount(nodes: RenderTree): number {
  return nodes.filter(node => node.metadata.locked).length
}

/**
 * 检查是否有选中的节点
 */
export function hasSelection(selectedIds: string[]): boolean {
  return selectedIds.length > 0
}

/**
 * 检查是否为多选
 */
export function isMultiSelection(selectedIds: string[]): boolean {
  return selectedIds.length > 1
}

/**
 * 排序选择器
 */

/**
 * 按创建时间排序节点
 */
export function selectNodesSortedByCreationTime(
  nodes: RenderTree,
  order: 'asc' | 'desc' = 'desc'
): ICanvasNode[] {
  return [...nodes].sort((a, b) => {
    const diff = a.metadata.createdAt - b.metadata.createdAt
    return order === 'asc' ? diff : -diff
  })
}

/**
 * 按更新时间排序节点
 */
export function selectNodesSortedByUpdateTime(
  nodes: RenderTree,
  order: 'asc' | 'desc' = 'desc'
): ICanvasNode[] {
  return [...nodes].sort((a, b) => {
    const diff = a.metadata.updatedAt - b.metadata.updatedAt
    return order === 'asc' ? diff : -diff
  })
}

/**
 * 按 z-index 排序节点
 */
export function selectNodesSortedByZIndex(
  nodes: RenderTree,
  order: 'asc' | 'desc' = 'asc'
): ICanvasNode[] {
  return [...nodes].sort((a, b) => {
    const zIndexA = a.style.zIndex || 0
    const zIndexB = b.style.zIndex || 0
    const diff = zIndexA - zIndexB
    return order === 'asc' ? diff : -diff
  })
}

/**
 * 搜索节点
 */

/**
 * 根据数据键值搜索节点
 */
export function searchNodesByDataValue(
  nodes: RenderTree,
  dataKey: string,
  value: any
): ICanvasNode[] {
  return nodes.filter(node => node.data[dataKey] === value)
}

/**
 * 根据配置键值搜索节点
 */
export function searchNodesByConfigValue(
  nodes: RenderTree,
  configKey: string,
  value: any
): ICanvasNode[] {
  return nodes.filter(node => node.config[configKey] === value)
}

/**
 * 根据图层名称搜索节点
 */
export function searchNodesByLayerName(
  nodes: RenderTree,
  layerName: string
): ICanvasNode[] {
  return nodes.filter(node => node.metadata.layerName === layerName)
}

/**
 * 模糊搜索节点（搜索所有字符串类型的数据和配置）
 */
export function fuzzySearchNodes(
  nodes: RenderTree,
  keyword: string
): ICanvasNode[] {
  const lowerKeyword = keyword.toLowerCase()

  return nodes.filter(node => {
    // 搜索类型
    if (node.type.toLowerCase().includes(lowerKeyword)) return true

    // 搜索数据
    const dataValues = Object.values(node.data)
      .filter(v => typeof v === 'string')
      .map(v => v.toLowerCase())
    if (dataValues.some(v => v.includes(lowerKeyword))) return true

    // 搜索配置
    const configValues = Object.values(node.config)
      .filter(v => typeof v === 'string')
      .map(v => v.toLowerCase())
    if (configValues.some(v => v.includes(lowerKeyword))) return true

    // 搜索图层名称
    if (node.metadata.layerName?.toLowerCase().includes(lowerKeyword)) return true

    return false
  })
}
