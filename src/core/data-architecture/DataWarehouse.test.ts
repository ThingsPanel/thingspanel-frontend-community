/**
 * 数据仓库测试套件
 * 测试多数据源隔离、性能优化、内存管理等功能
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  dataWarehouse,
  EnhancedDataWarehouse,
  type DataStorageItem,
  type PerformanceMetrics
} from '@/core/data-architecture/DataWarehouse'

describe('EnhancedDataWarehouse', () => {
  let warehouse: EnhancedDataWarehouse

  beforeEach(() => {
    // 为每个测试创建新的仓库实例
    warehouse = new EnhancedDataWarehouse()
    // 设置较短的缓存过期时间便于测试
    warehouse.setCacheExpiry(100)
  })

  describe('基础数据存储和获取', () => {
    it('应该能存储和获取组件数据', () => {
      const testData = { temperature: 25, humidity: 60 }

      warehouse.storeComponentData('comp1', 'sensor1', testData, 'json')

      const retrievedData = warehouse.getComponentData('comp1')
      expect(retrievedData).toEqual({ sensor1: testData })
    })

    it('应该支持多数据源隔离存储', () => {
      const sensorData = { temperature: 25 }
      const apiData = { status: 'ok' }

      warehouse.storeComponentData('comp1', 'sensor1', sensorData, 'json')
      warehouse.storeComponentData('comp1', 'api1', apiData, 'http')

      const allData = warehouse.getComponentData('comp1')
      expect(allData).toEqual({
        sensor1: sensorData,
        api1: apiData
      })
    })

    it('应该返回null当组件数据不存在时', () => {
      const result = warehouse.getComponentData('nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('缓存过期机制', () => {
    it('应该在数据过期后返回null', async () => {
      const testData = { value: 123 }

      warehouse.storeComponentData('comp1', 'source1', testData, 'json')

      // 验证数据初始存在
      expect(warehouse.getComponentData('comp1')).toEqual({ source1: testData })

      // 等待过期
      await new Promise(resolve => setTimeout(resolve, 150))

      // 验证数据已过期
      expect(warehouse.getComponentData('comp1')).toBeNull()
    })

    it('应该自动清理过期数据', async () => {
      warehouse.storeComponentData('comp1', 'source1', { value: 1 }, 'json')
      warehouse.storeComponentData('comp2', 'source2', { value: 2 }, 'json')

      // 等待过期
      await new Promise(resolve => setTimeout(resolve, 150))

      // 触发清理
      warehouse.performMaintenance()

      const stats = warehouse.getStorageStats()
      expect(stats.totalComponents).toBe(0)
      expect(stats.totalDataSources).toBe(0)
    })
  })

  describe('性能监控', () => {
    it('应该跟踪缓存命中率', () => {
      const testData = { value: 123 }

      // 存储数据
      warehouse.storeComponentData('comp1', 'source1', testData, 'json')

      // 多次访问以生成命中统计
      warehouse.getComponentData('comp1') // 命中
      warehouse.getComponentData('comp1') // 命中
      warehouse.getComponentData('comp2') // 未命中

      const metrics = warehouse.getPerformanceMetrics()
      expect(metrics.cacheHitRate).toBe(2 / 3) // 2命中 / 3总访问
      expect(metrics.totalRequests).toBe(3)
    })

    it('应该跟踪响应时间', () => {
      const testData = { value: 123 }

      warehouse.storeComponentData('comp1', 'source1', testData, 'json')
      warehouse.getComponentData('comp1')

      const metrics = warehouse.getPerformanceMetrics()
      expect(metrics.averageResponseTime).toBeGreaterThan(0)
      expect(metrics.totalRequests).toBe(1)
    })
  })

  describe('内存管理', () => {
    it('应该计算内存使用量', () => {
      const largeData = { data: 'x'.repeat(1000) }

      warehouse.storeComponentData('comp1', 'source1', largeData, 'json')

      const stats = warehouse.getStorageStats()
      expect(stats.memoryUsageMB).toBeGreaterThan(0)
    })

    it('应该跟踪组件和数据源数量', () => {
      warehouse.storeComponentData('comp1', 'source1', { a: 1 }, 'json')
      warehouse.storeComponentData('comp1', 'source2', { b: 2 }, 'http')
      warehouse.storeComponentData('comp2', 'source3', { c: 3 }, 'json')

      const stats = warehouse.getStorageStats()
      expect(stats.totalComponents).toBe(2)
      expect(stats.totalDataSources).toBe(3)
    })
  })

  describe('缓存清理功能', () => {
    it('应该能清除单个组件缓存', () => {
      warehouse.storeComponentData('comp1', 'source1', { a: 1 }, 'json')
      warehouse.storeComponentData('comp2', 'source2', { b: 2 }, 'json')

      warehouse.clearComponentCache('comp1')

      expect(warehouse.getComponentData('comp1')).toBeNull()
      expect(warehouse.getComponentData('comp2')).toEqual({ source2: { b: 2 } })
    })

    it('应该能清除所有缓存', () => {
      warehouse.storeComponentData('comp1', 'source1', { a: 1 }, 'json')
      warehouse.storeComponentData('comp2', 'source2', { b: 2 }, 'json')

      warehouse.clearAllCache()

      expect(warehouse.getComponentData('comp1')).toBeNull()
      expect(warehouse.getComponentData('comp2')).toBeNull()

      const stats = warehouse.getStorageStats()
      expect(stats.totalComponents).toBe(0)
    })
  })

  describe('动态参数预留接口', () => {
    it('应该提供动态参数存储接口（预留）', () => {
      // 验证接口存在（为Phase 2准备）
      expect(typeof warehouse.storeDynamicParameter).toBe('function')
      expect(typeof warehouse.getDynamicParameter).toBe('function')
      expect(typeof warehouse.getAllDynamicParameters).toBe('function')
    })

    it('动态参数接口应该返回预期值', () => {
      // 当前阶段返回默认值
      warehouse.storeDynamicParameter('comp1', 'param1', 'value1')

      const value = warehouse.getDynamicParameter('comp1', 'param1')
      const allParams = warehouse.getAllDynamicParameters('comp1')

      // Phase 1: 返回默认值，Phase 2: 实现完整功能
      expect(value).toBeDefined()
      expect(allParams).toBeDefined()
    })
  })

  describe('错误处理', () => {
    it('应该优雅处理无效输入', () => {
      expect(() => {
        warehouse.storeComponentData('', 'source1', {}, 'json')
      }).not.toThrow()

      expect(() => {
        warehouse.storeComponentData('comp1', '', {}, 'json')
      }).not.toThrow()
    })

    it('应该处理循环引用数据', () => {
      const circularData: any = { name: 'test' }
      circularData.self = circularData

      expect(() => {
        warehouse.storeComponentData('comp1', 'source1', circularData, 'json')
      }).not.toThrow()
    })
  })

  describe('边界条件测试', () => {
    it('应该处理大量数据存储', () => {
      // 存储100个组件，每个2个数据源
      for (let i = 0; i < 100; i++) {
        warehouse.storeComponentData(`comp${i}`, 'source1', { value: i }, 'json')
        warehouse.storeComponentData(`comp${i}`, 'source2', { value: i * 2 }, 'http')
      }

      const stats = warehouse.getStorageStats()
      expect(stats.totalComponents).toBe(100)
      expect(stats.totalDataSources).toBe(200)
      expect(stats.memoryUsageMB).toBeGreaterThan(0)
    })

    it('应该处理频繁的读写操作', () => {
      const startTime = Date.now()

      // 执行1000次读写操作
      for (let i = 0; i < 1000; i++) {
        warehouse.storeComponentData('testComp', 'source1', { iteration: i }, 'json')
        warehouse.getComponentData('testComp')
      }

      const endTime = Date.now()
      const duration = endTime - startTime

      // 性能检查：1000次操作应该在合理时间内完成
      expect(duration).toBeLessThan(1000) // 少于1秒

      const metrics = warehouse.getPerformanceMetrics()
      expect(metrics.totalRequests).toBe(1000)
    })
  })

  describe('维护和监控', () => {
    it('应该提供详细的性能指标', () => {
      warehouse.storeComponentData('comp1', 'source1', { value: 1 }, 'json')
      warehouse.getComponentData('comp1')
      warehouse.getComponentData('nonexistent')

      const metrics = warehouse.getPerformanceMetrics()

      expect(metrics).toHaveProperty('cacheHitRate')
      expect(metrics).toHaveProperty('averageResponseTime')
      expect(metrics).toHaveProperty('totalRequests')
      expect(metrics).toHaveProperty('cacheHits')
      expect(metrics).toHaveProperty('cacheMisses')

      expect(typeof metrics.cacheHitRate).toBe('number')
      expect(typeof metrics.averageResponseTime).toBe('number')
      expect(metrics.totalRequests).toBe(2)
    })

    it('应该支持性能指标重置', () => {
      warehouse.getComponentData('comp1') // 生成一些指标

      warehouse.resetPerformanceMetrics()

      const metrics = warehouse.getPerformanceMetrics()
      expect(metrics.totalRequests).toBe(0)
      expect(metrics.cacheHits).toBe(0)
      expect(metrics.cacheMisses).toBe(0)
    })
  })
})

describe('全局数据仓库实例', () => {
  it('应该提供全局单例', () => {
    expect(dataWarehouse).toBeInstanceOf(EnhancedDataWarehouse)
  })

  it('全局实例应该与新实例隔离', () => {
    const newWarehouse = new EnhancedDataWarehouse()

    dataWarehouse.storeComponentData('comp1', 'source1', { global: true }, 'json')
    newWarehouse.storeComponentData('comp1', 'source1', { global: false }, 'json')

    expect(dataWarehouse.getComponentData('comp1')).toEqual({ source1: { global: true } })
    expect(newWarehouse.getComponentData('comp1')).toEqual({ source1: { global: false } })
  })
})
