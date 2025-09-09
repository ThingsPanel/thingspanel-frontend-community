/**
 * 错误处理器单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  GridError,
  GridErrorType,
  DefaultErrorHandler,
  safeExecute,
  safeExecuteAsync,
  validateGridConfig,
  validateGridItems,
  withPerformanceMonitor,
  gridErrorHandler
} from '../errorHandler'
import type { GridConfig, GridItem } from '../types'

describe('Grid Error Handler', () => {
  let errorHandler: DefaultErrorHandler

  beforeEach(() => {
    errorHandler = new DefaultErrorHandler()
    gridErrorHandler.clearErrors()
  })

  describe('GridError', () => {
    it('should create error with correct properties', () => {
      const error = new GridError('Test error', GridErrorType.VALIDATION_ERROR, { test: 'context' }, true)

      expect(error.message).toBe('Test error')
      expect(error.name).toBe('GridError')
      expect(error.type).toBe(GridErrorType.VALIDATION_ERROR)
      expect(error.context).toEqual({ test: 'context' })
      expect(error.recoverable).toBe(true)
    })
  })

  describe('DefaultErrorHandler', () => {
    it('should handle errors correctly', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const error = new GridError('Test error', GridErrorType.VALIDATION_ERROR)
      errorHandler.onError(error)

      expect(consoleSpy).toHaveBeenCalledWith('[Grid Error] Test error', undefined)
      expect(errorHandler.getErrors()).toHaveLength(1)
      expect(errorHandler.getErrors()[0]).toBe(error)

      consoleSpy.mockRestore()
    })

    it('should handle warnings correctly', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      errorHandler.onWarning('Test warning', { test: 'context' })

      expect(consoleSpy).toHaveBeenCalledWith('[Grid Warning] Test warning', { test: 'context' })
      expect(errorHandler.getWarnings()).toHaveLength(1)
      expect(errorHandler.getWarnings()[0]).toBe('Test warning')

      consoleSpy.mockRestore()
    })

    it('should throw non-recoverable errors', () => {
      const error = new GridError('Fatal error', GridErrorType.VALIDATION_ERROR, {}, false)

      expect(() => errorHandler.onError(error)).toThrow('Fatal error')
    })

    it('should limit error history', () => {
      const handler = new DefaultErrorHandler()

      // Add more than 100 errors
      for (let i = 0; i < 105; i++) {
        const error = new GridError(`Error ${i}`, GridErrorType.VALIDATION_ERROR)
        handler.onError(error)
      }

      expect(handler.getErrors()).toHaveLength(100)
      expect(handler.getErrors()[0].message).toBe('Error 5') // First 5 should be removed
    })
  })

  describe('safeExecute', () => {
    it('should execute function safely and return success result', () => {
      const fn = () => 'success'
      const result = safeExecute(fn, 'Test operation')

      expect(result.success).toBe(true)
      expect(result.data).toBe('success')
    })

    it('should catch errors and return failure result', () => {
      const fn = () => {
        throw new Error('Test error')
      }

      const result = safeExecute(fn, 'Failed operation')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Failed operation')
      expect(result.error).toBeInstanceOf(GridError)
    })
  })

  describe('safeExecuteAsync', () => {
    it('should execute async function safely', async () => {
      const fn = async () => 'async success'
      const result = await safeExecuteAsync(fn, 'Test async operation')

      expect(result.success).toBe(true)
      expect(result.data).toBe('async success')
    })

    it('should catch async errors', async () => {
      const fn = async () => {
        throw new Error('Async error')
      }

      const result = await safeExecuteAsync(fn, 'Failed async operation')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Failed async operation')
      expect(result.error).toBeInstanceOf(GridError)
    })
  })

  describe('validateGridConfig', () => {
    it('should validate correct config', () => {
      const config: Partial<GridConfig> = {
        columns: 12,
        rowHeight: 100,
        gap: 10,
        minRows: 3,
        maxRows: 10
      }

      const result = validateGridConfig(config)
      expect(result.success).toBe(true)
    })

    it('should reject invalid columns', () => {
      const config: Partial<GridConfig> = { columns: 0 }
      const result = validateGridConfig(config)

      expect(result.success).toBe(false)
      expect(result.message).toContain('配置验证失败')
    })

    it('should reject invalid row height', () => {
      const config: Partial<GridConfig> = { columns: 12, rowHeight: 0 }
      const result = validateGridConfig(config)

      expect(result.success).toBe(false)
    })

    it('should reject negative gap', () => {
      const config: Partial<GridConfig> = { columns: 12, rowHeight: 100, gap: -5 }
      const result = validateGridConfig(config)

      expect(result.success).toBe(false)
    })

    it('should reject min rows greater than max rows', () => {
      const config: Partial<GridConfig> = { columns: 12, rowHeight: 100, minRows: 10, maxRows: 5 }
      const result = validateGridConfig(config)

      expect(result.success).toBe(false)
    })
  })

  describe('validateGridItems', () => {
    it('should validate correct items', () => {
      const items: GridItem[] = [
        {
          id: 'item-1',
          gridCol: 1,
          gridRow: 1,
          gridColSpan: 2,
          gridRowSpan: 2
        },
        {
          id: 'item-2',
          gridCol: 3,
          gridRow: 1,
          gridColSpan: 2,
          gridRowSpan: 2
        }
      ]

      const result = validateGridItems(items)
      expect(result.success).toBe(true)
    })

    it('should reject duplicate IDs', () => {
      const items: GridItem[] = [
        {
          id: 'item-1',
          gridCol: 1,
          gridRow: 1,
          gridColSpan: 2,
          gridRowSpan: 2
        },
        {
          id: 'item-1', // Duplicate ID
          gridCol: 3,
          gridRow: 1,
          gridColSpan: 2,
          gridRowSpan: 2
        }
      ]

      const result = validateGridItems(items)
      expect(result.success).toBe(false)
    })

    it('should reject invalid positions', () => {
      const items: GridItem[] = [
        {
          id: 'item-1',
          gridCol: 0, // Invalid
          gridRow: 1,
          gridColSpan: 2,
          gridRowSpan: 2
        }
      ]

      const result = validateGridItems(items)
      expect(result.success).toBe(false)
    })

    it('should validate constraints', () => {
      const items: GridItem[] = [
        {
          id: 'item-1',
          gridCol: 1,
          gridRow: 1,
          gridColSpan: 1,
          gridRowSpan: 2,
          minColSpan: 2 // Constraint violation
        }
      ]

      const result = validateGridItems(items)
      expect(result.success).toBe(false)
    })
  })

  describe('withPerformanceMonitor', () => {
    it('should monitor function performance', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const slowFunction = withPerformanceMonitor(
        () => {
          // Simulate slow operation
          const end = Date.now() + 150
          while (Date.now() < end) {
            /* wait */
          }
          return 'result'
        },
        'slow operation',
        100 // 100ms threshold
      )

      const result = slowFunction()

      expect(result).toBe('result')
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('slow operation took'), expect.any(Object))

      consoleSpy.mockRestore()
    })

    it('should monitor async function performance', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const slowAsyncFunction = withPerformanceMonitor(
        async () => {
          await new Promise(resolve => setTimeout(resolve, 150))
          return 'async result'
        },
        'slow async operation',
        100
      )

      const result = await slowAsyncFunction()

      expect(result).toBe('async result')
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('slow async operation took'), expect.any(Object))

      consoleSpy.mockRestore()
    })

    it('should handle function errors', () => {
      const errorSpy = vi.spyOn(gridErrorHandler, 'onError').mockImplementation(() => {})

      const failingFunction = withPerformanceMonitor(() => {
        throw new Error('Function failed')
      }, 'failing operation')

      expect(() => failingFunction()).toThrow('Function failed')
      expect(errorSpy).toHaveBeenCalledWith(expect.any(GridError))

      errorSpy.mockRestore()
    })
  })
})
