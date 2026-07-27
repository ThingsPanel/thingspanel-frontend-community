/**
 * Grid 布局算法工具函数
 * 专门处理布局计算、位置查找、碰撞检测等算法
 */

import type { GridLayoutPlusItem, LayoutOperationResult } from '../gridLayoutPlusTypes'

/**
 * 查找可用位置
 */
export function findAvailablePosition(
  layout: GridLayoutPlusItem[],
  w: number,
  h: number,
  cols: number = 12,
  startY: number = 0
): { x: number; y: number } {
  try {
    // 简单的位置查找算法
    for (let y = startY; y < startY + 100; y++) {
      for (let x = 0; x <= cols - w; x++) {
        const proposed = { x, y, w, h }

        // 检查是否与现有项目冲突
        const hasCollision = layout.some(item => {
          return !(
            proposed.x + proposed.w <= item.x ||
            proposed.x >= item.x + item.w ||
            proposed.y + proposed.h <= item.y ||
            proposed.y >= item.y + item.h
          )
        })

        if (!hasCollision) {
          return { x, y }
        }
      }
    }

    // 如果找不到位置，返回底部
    const maxY = Math.max(0, ...layout.map(item => item.y + item.h))
    return { x: 0, y: maxY }
  } catch (error) {
    console.error('Failed to find available position:', error)
    return { x: 0, y: startY }
  }
}

/**
 * 优化查找可用位置（更高效的算法）
 */
export function findOptimalPosition(
  layout: GridLayoutPlusItem[],
  w: number,
  h: number,
  cols: number = 12,
  preferredX?: number,
  preferredY?: number
): { x: number; y: number; score: number } {
  try {
    const candidates: Array<{ x: number; y: number; score: number }> = []

    // 如果有首选位置，先检查
    if (preferredX !== undefined && preferredY !== undefined) {
      const candidate = { x: preferredX, y: preferredY, score: 0 }
      if (isPositionAvailable(layout, preferredX, preferredY, w, h, cols)) {
        candidate.score = 100 // 最高分
        candidates.push(candidate)
      }
    }

    // 搜索最优位置
    const maxY = Math.max(10, ...layout.map(item => item.y + item.h))

    for (let y = 0; y < maxY + 5; y++) {
      for (let x = 0; x <= cols - w; x++) {
        if (isPositionAvailable(layout, x, y, w, h, cols)) {
          // 计算位置得分（越靠上左越好）
          const score = calculatePositionScore(x, y, w, h, layout, cols)
          candidates.push({ x, y, score })
        }
      }
    }

    // 如果没有找到任何可用位置，返回底部位置
    if (candidates.length === 0) {
      const bottomY = Math.max(0, ...layout.map(item => item.y + item.h))
      return { x: 0, y: bottomY, score: 0 }
    }

    // 返回得分最高的位置
    return candidates.reduce((best, current) => (current.score > best.score ? current : best))
  } catch (error) {
    console.error('Failed to find optimal position:', error)
    return { x: 0, y: 0, score: 0 }
  }
}

/**
 * 检查位置是否可用
 */
export function isPositionAvailable(
  layout: GridLayoutPlusItem[],
  x: number,
  y: number,
  w: number,
  h: number,
  cols: number,
  excludeId?: string
): boolean {
  try {
    // 检查边界
    if (x < 0 || y < 0 || x + w > cols) {
      return false
    }

    // 检查碰撞
    const proposed = { x, y, w, h }
    return !layout.some(item => {
      if (excludeId && item.i === excludeId) return false

      return !(
        proposed.x + proposed.w <= item.x ||
        proposed.x >= item.x + item.w ||
        proposed.y + proposed.h <= item.y ||
        proposed.y >= item.y + item.h
      )
    })
  } catch (error) {
    console.error('Failed to check position availability:', error)
    return false
  }
}

/**
 * 计算位置得分
 */
function calculatePositionScore(
  x: number,
  y: number,
  w: number,
  h: number,
  layout: GridLayoutPlusItem[],
  cols: number
): number {
  try {
    let score = 1000

    // Y位置惩罚（越高得分越低）
    score -= y * 10

    // X位置轻微惩罚（偏左更好）
    score -= x * 2

    // 边缘位置加分
    if (x === 0) score += 5 // 左边缘
    if (x + w === cols) score += 3 // 右边缘

    // 与现有项目的邻接关系加分
    for (const item of layout) {
      // 垂直邻接
      if ((item.y + item.h === y || y + h === item.y) && !(x + w <= item.x || x >= item.x + item.w)) {
        score += 20 // 垂直相邻
      }

      // 水平邻接
      if ((item.x + item.w === x || x + w === item.x) && !(y + h <= item.y || y >= item.y + item.h)) {
        score += 15 // 水平相邻
      }
    }

    return Math.max(0, score)
  } catch (error) {
    console.error('Failed to calculate position score:', error)
    return 0
  }
}

/**
 * 紧凑布局算法
 */
export function compactLayout(
  layout: GridLayoutPlusItem[],
  cols: number,
  verticalCompact: boolean = true
): GridLayoutPlusItem[] {
  if (!verticalCompact || layout.length === 0) return layout

  try {
    // 按Y坐标排序，确保我们从上到下处理项目
    const sortedLayout = [...layout].sort((a, b) => {
      if (a.y === b.y) return a.x - b.x
      return a.y - b.y
    })

    // 用于存放已处理和放置好的项目
    const compacted: GridLayoutPlusItem[] = []

    for (const item of sortedLayout) {
      // 从顶部开始为当前项目寻找新的Y坐标
      let newY = 0

      // 持续增加Y坐标，直到找到一个不与 `compacted` 中任何项目碰撞的位置
      while (!isPositionAvailable(compacted, item.x, newY, item.w, item.h, cols)) {
        newY++
      }

      // 将项目放置在找到的第一个可用位置
      compacted.push({
        ...item,
        y: newY
      })
    }

    return compacted
  } catch (error) {
    console.error('Failed to compact layout:', error)
    return layout
  }
}

/**
 * 排序布局项目
 */
export function sortLayout(
  layout: GridLayoutPlusItem[],
  sortBy: 'position' | 'size' | 'id' = 'position'
): GridLayoutPlusItem[] {
  try {
    const sorted = [...layout]

    switch (sortBy) {
      case 'position':
        return sorted.sort((a, b) => {
          if (a.y === b.y) return a.x - b.x
          return a.y - b.y
        })

      case 'size':
        return sorted.sort((a, b) => {
          const aSize = a.w * a.h
          const bSize = b.w * b.h
          return bSize - aSize // 大的在前
        })

      case 'id':
        return sorted.sort((a, b) => a.i.localeCompare(b.i))

      default:
        return sorted
    }
  } catch (error) {
    console.error('Failed to sort layout:', error)
    return layout
  }
}

/**
 * 计算布局边界
 */
export function getLayoutBounds(layout: GridLayoutPlusItem[]): {
  minX: number
  maxX: number
  minY: number
  maxY: number
  width: number
  height: number
} {
  if (layout.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 }
  }

  try {
    const minX = Math.min(...layout.map(item => item.x))
    const maxX = Math.max(...layout.map(item => item.x + item.w))
    const minY = Math.min(...layout.map(item => item.y))
    const maxY = Math.max(...layout.map(item => item.y + item.h))

    return {
      minX,
      maxX,
      minY,
      maxY,
      width: maxX - minX,
      height: maxY - minY
    }
  } catch (error) {
    console.error('Failed to get layout bounds:', error)
    return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 }
  }
}

/**
 * 计算两个项目的重叠面积
 */
export function getOverlapArea(item1: GridLayoutPlusItem, item2: GridLayoutPlusItem): number {
  try {
    const left = Math.max(item1.x, item2.x)
    const right = Math.min(item1.x + item1.w, item2.x + item2.w)
    const top = Math.max(item1.y, item2.y)
    const bottom = Math.min(item1.y + item1.h, item2.y + item2.h)

    if (left >= right || top >= bottom) {
      return 0 // 没有重叠
    }

    return (right - left) * (bottom - top)
  } catch (error) {
    console.error('Failed to calculate overlap area:', error)
    return 0
  }
}

/**
 * 移动项目到新位置并处理碰撞
 * @param layout - 当前布局
 * @param movingItem - 正在移动的项
 * @param newX - 移动项的新x坐标
 * @param newY - 移动项的新y坐标
 * @param cols - 网格的列数
 * @returns 经过碰撞处理和紧凑化后的新布局
 */
export function moveItemWithCollisionHandling(
  layout: GridLayoutPlusItem[],
  movingItem: GridLayoutPlusItem,
  newX: number,
  newY: number,
  cols: number
): GridLayoutPlusItem[] {
  // 步骤1: 布局净化与规范化
  // 深拷贝布局以进行修改，并规范化所有项的坐标。
  // 解决新添加项（坐标为 'auto' 或 undefined）无法参与碰撞检测的核心问题。
  const workingLayout = cloneLayout(layout).map(item => {
    // 检查x和y坐标是否为无效值（非数字、NaN、'auto'等）。
    const isInvalidX = typeof item.x !== 'number' || isNaN(item.x)
    const isInvalidY = typeof item.y !== 'number' || isNaN(item.y)

    // 为无效坐标提供一个临时的、可预测的初始位置。
    // 如果y坐标无效，则假定其在顶部（y=0）。
    // 如果x坐标无效，则假定其在最左侧（x=0）。
    // 这使得项的逻辑位置与其初始视觉位置（通常在左上角）相匹配。
    return {
      ...item,
      x: isInvalidX ? 0 : item.x,
      y: isInvalidY ? 0 : item.y
    }
  })

  // 步骤2: 更新移动项的位置
  // 在净化后的工作布局中找到正在移动的项。
  const movingItemInLayout = workingLayout.find(item => item.i === movingItem.i)
  // 如果找不到（理论上不应发生），则返回原始布局以保证安全。
  if (!movingItemInLayout) {
    return layout
  }

  // 将移动项的位置更新为拖拽操作提供的新坐标。
  movingItemInLayout.x = newX
  movingItemInLayout.y = newY

  // 步骤3: 连锁碰撞处理 (BFS)
  // 使用广度优先搜索（BFS）来处理由移动项引起的连锁碰撞。
  const queue: GridLayoutPlusItem[] = [movingItemInLayout]
  // `movedItems` 用于跟踪在此次操作中已经移动过的项，防止在同一次连锁反应中被重复处理，避免无限循环。
  const movedItems = new Set<string>([movingItemInLayout.i])

  // 设置最大迭代次数，作为防止无限循环的安全阀。
  let iterations = 0
  const maxIterations = workingLayout.length * workingLayout.length

  while (queue.length > 0) {
    iterations++
    if (iterations > maxIterations) {
      console.error('moveItemWithCollisionHandling: Max iterations reached, aborting.')
      return layout // 检测到可能的无限循环，返回原始布局以避免应用冻结。
    }

    const currentItem = queue.shift()!

    // 遍历布局中的所有其他项以检测与当前项的碰撞。
    for (const other of workingLayout) {
      if (other.i === currentItem.i) continue

      if (collides(currentItem, other)) {
        // 如果与静态项（static=true）发生碰撞，则认为此次移动无效，立即返回原始布局。
        if (other.static) {
          return layout
        }

        // 计算将 'other' 项向下推到的新y坐标。
        const pushToY = currentItem.y + currentItem.h

        // 只有当 'other' 项当前位置在推挤目标位置之上时，才执行推挤。
        // 这可以防止不必要的移动和潜在的循环。
        if (other.y < pushToY) {
          other.y = pushToY

          // 如果 'other' 项是第一次在此操作中被移动，则将其加入队列。
          // 这确保了它引发的后续碰撞也会被处理。
          if (!movedItems.has(other.i)) {
            movedItems.add(other.i)
            queue.push(other)
          }
        }
      }
    }
  }

  // 步骤4: 布局紧凑化
  // 在所有碰撞处理完成后，对布局进行紧凑化，移除因推挤而产生的垂直间隙。
  return compactLayout(workingLayout, cols)
}

/**
 * 深拷贝一个布局数组。
 * @param layout - 要克隆的布局。
 * @returns 返回一个新的布局数组，与原始布局完全独立。
 */
function cloneLayout(layout: GridLayoutPlusItem[]): GridLayoutPlusItem[] {
  return JSON.parse(JSON.stringify(layout))
}

/**
 * 检测两个布局项是否发生碰撞。
 * @param item1 - 第一个布局项。
 * @param item2 - 第二个布局项。
 * @returns 如果两项重叠，则返回 true，否则返回 false。
 */
function collides(item1: GridLayoutPlusItem, item2: GridLayoutPlusItem): boolean {
  if (item1.i === item2.i) return false
  if (item1.x + item1.w <= item2.x) return false
  if (item1.x >= item2.x + item2.w) return false
  if (item1.y + item1.h <= item2.y) return false
  if (item1.y >= item2.y + item2.h) return false
  return true
}
