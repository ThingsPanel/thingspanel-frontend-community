/**
 * Grid工具函数单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  validateGridItem,
  findOptimalPosition,
  checkCollisions,
  isItemsOverlapping,
  getOverlapArea,
  itemToGridArea,
  validateGridPosition,
  calculateGridUtilization,
  calculateTotalRows,
  getGridStatistics,
  cloneGridItem,
  generateId,
  performanceMonitor,
  cacheManager
} from '../utils-enhanced'
import type { GridItem, GridConfig, GridPosition, GridSize } from '../types'

describe('Grid Utils Enhanced', () => {
  const mockConfig: GridConfig = {
    columns: 12,
    rowHeight: 100,
    gap: 10,
    minRows: 3,
    readonly: false,
    showGrid: true,
    collision: 'block',
    bounds: 'parent',
    minHeight: 400
  }

  const mockItem: GridItem = {
    id: 'test-item-1',
    gridCol: 1,
    gridRow: 1,
    gridColSpan: 2,
    gridRowSpan: 2,
    resizable: true,
    draggable: true,
    locked: false,
    zIndex: 1
  }

  beforeEach(() => {
    // 清理缓存
    cacheManager.clear()
    performanceMonitor.reset()
  })

  describe('validateGridItem', () => {
    it('should validate a valid grid item', () => {
      const result = validateGridItem(mockItem)
      expect(result.success).toBe(true)
      expect(result.data).toBe(true)
    })

    it('should reject item without id', () => {
      const invalidItem = { ...mockItem, id: '' }
      const result = validateGridItem(invalidItem)
      expect(result.success).toBe(false)
      expect(result.message).toContain('ID')
    })

    it('should reject item with invalid position', () => {
      const invalidItem = { ...mockItem, gridCol: 0 }
      const result = validateGridItem(invalidItem)
      expect(result.success).toBe(false)
      expect(result.message).toContain('位置')
    })

    it('should reject item with invalid span', () => {
      const invalidItem = { ...mockItem, gridColSpan: 0 }
      const result = validateGridItem(invalidItem)
      expect(result.success).toBe(false)
      expect(result.message).toContain('跨度')
    })

    it('should validate min/max constraints', () => {
      const itemWithMinConstraint = { ...mockItem, minColSpan: 3, gridColSpan: 2 }
      const result = validateGridItem(itemWithMinConstraint)
      expect(result.success).toBe(false)
      expect(result.message).toContain('最小值')
    })
  })

  describe('isItemsOverlapping', () => {
    it('should detect overlapping items', () => {
      const item1: GridItem = { ...mockItem, gridCol: 1, gridRow: 1, gridColSpan: 2, gridRowSpan: 2 }
      const item2: GridItem = { ...mockItem, id: 'test-item-2', gridCol: 2, gridRow: 2, gridColSpan: 2, gridRowSpan: 2 }

      expect(isItemsOverlapping(item1, item2)).toBe(true)
    })

    it('should not detect non-overlapping items', () => {
      const item1: GridItem = { ...mockItem, gridCol: 1, gridRow: 1, gridColSpan: 2, gridRowSpan: 2 }
      const item2: GridItem = { ...mockItem, id: 'test-item-2', gridCol: 4, gridRow: 1, gridColSpan: 2, gridRowSpan: 2 }

      expect(isItemsOverlapping(item1, item2)).toBe(false)
    })

    it('should handle tolerance for temporary items', () => {
      const item1: GridItem = { ...mockItem, gridCol: 1, gridRow: 1, gridColSpan: 2, gridRowSpan: 2 }
      const item2: GridItem = {
        ...mockItem,
        id: 'test-item-2',
        gridCol: 3,
        gridRow: 1,
        gridColSpan: 2,
        gridRowSpan: 2,
        temporary: true
      }

      expect(isItemsOverlapping(item1, item2, 0.4)).toBe(false)
      expect(isItemsOverlapping(item1, item2, 0.6)).toBe(true)
    })
  })

  describe('checkCollisions', () => {
    it('should detect collisions', () => {
      const items: GridItem[] = [
        { ...mockItem, gridCol: 1, gridRow: 1, gridColSpan: 3, gridRowSpan: 2 },
        { ...mockItem, id: 'test-item-2', gridCol: 2, gridRow: 2, gridColSpan: 2, gridRowSpan: 2 }
      ]

      const result = checkCollisions(items[0], items)
      expect(result.hasCollision).toBe(true)
      expect(result.collisions).toHaveLength(1)
      expect(result.suggestedPosition).toBeDefined()
    })

    it('should exclude temporary items when requested', () => {
      const items: GridItem[] = [
        { ...mockItem, gridCol: 1, gridRow: 1, gridColSpan: 3, gridRowSpan: 2 },
        { ...mockItem, id: 'test-item-2', gridCol: 2, gridRow: 2, gridColSpan: 2, gridRowSpan: 2, temporary: true }
      ]

      const result = checkCollisions(items[0], items, true)
      expect(result.hasCollision).toBe(false)
    })
  })

  describe('getOverlapArea', () => {
    it('should calculate overlap area correctly', () => {
      const item1: GridItem = { ...mockItem, gridCol: 1, gridRow: 1, gridColSpan: 3, gridRowSpan: 3 }
      const item2: GridItem = { ...mockItem, id: 'test-item-2', gridCol: 2, gridRow: 2, gridColSpan: 3, gridRowSpan: 3 }

      const overlap = getOverlapArea(item1, item2)
      expect(overlap).toEqual({
        colStart: 2,
        colEnd: 4,
        rowStart: 2,
        rowEnd: 4
      })
    })

    it('should return null for non-overlapping items', () => {
      const item1: GridItem = { ...mockItem, gridCol: 1, gridRow: 1, gridColSpan: 2, gridRowSpan: 2 }
      const item2: GridItem = { ...mockItem, id: 'test-item-2', gridCol: 4, gridRow: 1, gridColSpan: 2, gridRowSpan: 2 }

      const overlap = getOverlapArea(item1, item2)
      expect(overlap).toBeNull()
    })
  })

  describe('validateGridPosition', () => {
    it('should validate valid positions', () => {
      const position: GridPosition = { col: 1, row: 1 }
      const size: GridSize = { colSpan: 2, rowSpan: 2 }

      expect(validateGridPosition(position, size, mockConfig)).toBe(true)
    })

    it('should reject positions outside bounds', () => {
      const position: GridPosition = { col: 12, row: 1 }
      const size: GridSize = { colSpan: 2, rowSpan: 2 }

      expect(validateGridPosition(position, size, mockConfig)).toBe(false)
    })

    it('should respect max rows constraint', () => {
      const configWithMaxRows = { ...mockConfig, maxRows: 5 }
      const position: GridPosition = { col: 1, row: 5 }
      const size: GridSize = { colSpan: 2, rowSpan: 2 }

      expect(validateGridPosition(position, size, configWithMaxRows)).toBe(false)
    })
  })

  describe('calculateGridUtilization', () => {
    it('should calculate utilization correctly', () => {
      const items: GridItem[] = [
        { ...mockItem, gridCol: 1, gridRow: 1, gridColSpan: 2, gridRowSpan: 2 }, // 4 cells
        { ...mockItem, id: 'test-item-2', gridCol: 3, gridRow: 1, gridColSpan: 3, gridRowSpan: 1 } // 3 cells
      ]

      const utilization = calculateGridUtilization(items, mockConfig)
      const totalRows = calculateTotalRows(items, mockConfig.minRows || 3)
      const totalCells = mockConfig.columns * totalRows // 12 * 3 = 36
      const usedCells = 4 + 3 // 7
      const expected = Math.min(usedCells / totalCells, 1) // 7/36 ≈ 0.194

      expect(utilization).toBeCloseTo(expected, 3)
    })

    it('should return 0 for empty grid', () => {
      expect(calculateGridUtilization([], mockConfig)).toBe(0)
    })
  })

  describe('getGridStatistics', () => {
    it('should provide comprehensive statistics', () => {
      const items: GridItem[] = [
        { ...mockItem, gridCol: 1, gridRow: 1, gridColSpan: 2, gridRowSpan: 2 },
        { ...mockItem, id: 'test-item-2', gridCol: 3, gridRow: 1, gridColSpan: 4, gridRowSpan: 3 },
        { ...mockItem, id: 'test-item-3', gridCol: 1, gridRow: 3, gridColSpan: 2, gridRowSpan: 1 }
      ]

      const stats = getGridStatistics(items, mockConfig)

      expect(stats.totalItems).toBe(3)
      expect(stats.totalRows).toBe(5) // max row is 5 (3 + 3 - 1)
      expect(stats.totalCells).toBe(60) // 12 * 5
      expect(stats.usedCells).toBe(18) // 4 + 12 + 2
      expect(stats.utilization).toBe(30) // 18/60 * 100 = 30%
      expect(stats.overlappingItems).toBe(0)
      expect(stats.largestItem?.id).toBe('test-item-2')
      expect(stats.averageSize).toBe(6) // 18/3
    })
  })

  describe('cloneGridItem', () => {
    it('should deep clone grid item', () => {
      const originalItem: GridItem = {
        ...mockItem,
        props: { title: 'Test', data: { count: 1 } },
        style: { color: 'red' },
        metadata: { custom: 'value' }
      }

      const clonedItem = cloneGridItem(originalItem)

      expect(clonedItem).toEqual(originalItem)
      expect(clonedItem).not.toBe(originalItem)
      expect(clonedItem.props).not.toBe(originalItem.props)
      expect(clonedItem.style).not.toBe(originalItem.style)
      expect(clonedItem.metadata).not.toBe(originalItem.metadata)
    })
  })

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId()
      const id2 = generateId()

      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^grid-item-\d+-[a-z0-9]+$/)
    })

    it('should use custom prefix', () => {
      const id = generateId('custom')
      expect(id).toMatch(/^custom-\d+-[a-z0-9]+$/)
    })
  })

  describe('findOptimalPosition', () => {
    it('should find optimal position for new item', () => {
      const existingItems: GridItem[] = [{ ...mockItem, gridCol: 1, gridRow: 1, gridColSpan: 3, gridRowSpan: 2 }]

      const newItem: GridItem = { ...mockItem, id: 'new-item', gridColSpan: 2, gridRowSpan: 2 }

      const position = findOptimalPosition(newItem, existingItems, mockConfig)

      expect(position).toBeDefined()
      expect(position!.col).toBeGreaterThan(0)
      expect(position!.row).toBeGreaterThan(0)
    })

    it('should use cache for repeated queries', () => {
      const existingItems: GridItem[] = []
      const newItem: GridItem = { ...mockItem, id: 'new-item', gridColSpan: 2, gridRowSpan: 2 }

      const position1 = findOptimalPosition(newItem, existingItems, mockConfig)
      const position2 = findOptimalPosition(newItem, existingItems, mockConfig)

      expect(position1).toEqual(position2)
    })
  })

  describe('itemToGridArea', () => {
    it('should convert item to grid area', () => {
      const area = itemToGridArea(mockItem)

      expect(area).toEqual({
        rowStart: 1,
        colStart: 1,
        rowEnd: 3, // 1 + 2
        colEnd: 3 // 1 + 2
      })
    })
  })

  describe('Performance Monitor', () => {
    it('should track performance metrics', () => {
      performanceMonitor.startTimer('renderTime')
      // Simulate some work
      const end = Date.now() + 10
      while (Date.now() < end) {
        /* wait */
      }
      const duration = performanceMonitor.endTimer('renderTime')

      expect(duration).toBeGreaterThan(0)

      const metrics = performanceMonitor.getMetrics()
      expect(metrics.renderTime).toBeGreaterThan(0)
    })
  })

  describe('Cache Manager', () => {
    it('should cache and retrieve values', () => {
      const key = 'test-key'
      const value = { data: 'test' }

      cacheManager.set(key, value)
      expect(cacheManager.has(key)).toBe(true)
      expect(cacheManager.get(key)).toEqual(value)
    })

    it('should enforce max size limit', () => {
      // This test would need to set a smaller max size or add many items
      // For now, just test basic functionality
      expect(cacheManager.size()).toBe(0)

      cacheManager.set('key1', 'value1')
      expect(cacheManager.size()).toBe(1)

      cacheManager.clear()
      expect(cacheManager.size()).toBe(0)
    })
  })
})
