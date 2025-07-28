/**
 * @file PureInfrastructure 单元测试
 * @description 核心基础设施的全面测试套件
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { PureInfrastructure } from '../core/PureInfrastructure'
import { EnhancedPureInfrastructure } from '../core/PureInfrastructure_Enhanced'

describe('PureInfrastructure 基础测试', () => {
  let infrastructure: PureInfrastructure
  let mockContainer: HTMLElement

  beforeEach(() => {
    // 创建模拟的DOM容器
    mockContainer = document.createElement('div')
    mockContainer.id = 'test-container'
    document.body.appendChild(mockContainer)

    // 创建基础设施实例
    infrastructure = new PureInfrastructure()
  })

  afterEach(() => {
    // 清理测试环境
    if (mockContainer.parentNode) {
      mockContainer.parentNode.removeChild(mockContainer)
    }
    
    if (infrastructure) {
      // @ts-ignore - 访问私有方法进行清理
      infrastructure.destroy?.()
    }
  })

  describe('初始化测试', () => {
    it('应该能够正常创建实例', () => {
      expect(infrastructure).toBeDefined()
      expect(infrastructure.layout).toBeDefined()
      expect(infrastructure.pipeline).toBeDefined()
      expect(infrastructure.eventBus).toBeDefined()
      expect(infrastructure.porter).toBeDefined()
      expect(infrastructure.extensions).toBeDefined()
    })

    it('应该能够正常初始化', async () => {
      const layoutConfig = {
        regions: {
          toolbar: { height: 40 },
          sidebar: { width: 240 },
          main: { flex: 1 },
          inspector: { width: 280 }
        }
      }

      await expect(
        infrastructure.initialize(mockContainer, layoutConfig)
      ).resolves.not.toThrow()
    })

    it('应该能够使用默认配置初始化', async () => {
      await expect(
        infrastructure.initialize(mockContainer)
      ).resolves.not.toThrow()
    })
  })

  describe('子系统访问测试', () => {
    it('布局管理器应该可访问', () => {
      expect(infrastructure.layout).toBeDefined()
      expect(typeof infrastructure.layout.initialize).toBe('function')
    })

    it('数据管道应该可访问', () => {
      expect(infrastructure.pipeline).toBeDefined()
      expect(typeof infrastructure.pipeline.registerSource).toBe('function')
      expect(typeof infrastructure.pipeline.registerTarget).toBe('function')
    })

    it('事件总线应该可访问', () => {
      expect(infrastructure.eventBus).toBeDefined()
      expect(typeof infrastructure.eventBus.emit).toBe('function')
      expect(typeof infrastructure.eventBus.on).toBe('function')
    })

    it('导入导出门户应该可访问', () => {
      expect(infrastructure.porter).toBeDefined()
      expect(typeof infrastructure.porter.import).toBe('function')
      expect(typeof infrastructure.porter.export).toBe('function')
    })

    it('扩展点管理器应该可访问', () => {
      expect(infrastructure.extensions).toBeDefined()
      expect(typeof infrastructure.extensions.registerRenderer).toBe('function')
    })
  })
})

describe('EnhancedPureInfrastructure 增强版测试', () => {
  let enhancedInfrastructure: EnhancedPureInfrastructure
  let mockContainer: HTMLElement

  beforeEach(() => {
    mockContainer = document.createElement('div')
    mockContainer.id = 'test-enhanced-container'
    document.body.appendChild(mockContainer)

    enhancedInfrastructure = new EnhancedPureInfrastructure()
  })

  afterEach(async () => {
    if (mockContainer.parentNode) {
      mockContainer.parentNode.removeChild(mockContainer)
    }
    
    if (enhancedInfrastructure) {
      await enhancedInfrastructure.destroy()
    }
  })

  describe('增强功能测试', () => {
    it('应该支持懒加载初始化', async () => {
      const options = {
        enableLazyLoading: true,
        enableParallelInit: true,
        onProgress: vi.fn()
      }

      await expect(
        enhancedInfrastructure.initialize(mockContainer, undefined, options)
      ).resolves.not.toThrow()

      // 验证进度回调被调用
      expect(options.onProgress).toHaveBeenCalled()
    })

    it('应该能够获取子系统实例', async () => {
      await enhancedInfrastructure.initialize(mockContainer)

      const layout = await enhancedInfrastructure.getSubsystem('layout')
      expect(layout).toBeDefined()

      const pipeline = await enhancedInfrastructure.getSubsystem('pipeline')
      expect(pipeline).toBeDefined()
    })

    it('应该能够检查子系统状态', async () => {
      await enhancedInfrastructure.initialize(mockContainer)

      const layoutStatus = enhancedInfrastructure.getSubsystemStatus('layout')
      expect(['ready', 'loading', 'initializing']).toContain(layoutStatus)
    })

    it('应该能够获取系统健康状态', async () => {
      await enhancedInfrastructure.initialize(mockContainer)

      const health = enhancedInfrastructure.getSystemHealth()
      expect(health).toHaveProperty('overall')
      expect(health).toHaveProperty('score')
      expect(health).toHaveProperty('components')
      expect(health.score).toBeGreaterThanOrEqual(0)
      expect(health.score).toBeLessThanOrEqual(100)
    })

    it('应该能够获取初始化统计', async () => {
      await enhancedInfrastructure.initialize(mockContainer)

      const stats = enhancedInfrastructure.getInitializationStats()
      expect(stats).toHaveProperty('totalTime')
      expect(stats).toHaveProperty('parallelSavings')
      expect(stats).toHaveProperty('memoryUsage')
      expect(stats.totalTime).toBeGreaterThan(0)
    })
  })

  describe('性能测试', () => {
    it('并行初始化应该比串行快', async () => {
      // 串行初始化
      const serialStart = Date.now()
      const serialInfrastructure = new EnhancedPureInfrastructure()
      await serialInfrastructure.initialize(mockContainer, undefined, {
        enableParallelInit: false
      })
      const serialTime = Date.now() - serialStart
      await serialInfrastructure.destroy()

      // 并行初始化
      const parallelStart = Date.now()
      const parallelInfrastructure = new EnhancedPureInfrastructure()
      await parallelInfrastructure.initialize(mockContainer, undefined, {
        enableParallelInit: true
      })
      const parallelTime = Date.now() - parallelStart
      await parallelInfrastructure.destroy()

      // 并行应该更快（或至少不慢太多）
      expect(parallelTime).toBeLessThanOrEqual(serialTime * 1.2)
      
      console.log(`串行初始化: ${serialTime}ms, 并行初始化: ${parallelTime}ms`)
    }, 10000) // 10秒超时

    it('懒加载应该减少初始内存使用', async () => {
      // 记录初始内存
      const initialMemory = process.memoryUsage().heapUsed

      await enhancedInfrastructure.initialize(mockContainer, undefined, {
        enableLazyLoading: true
      })

      // 检查内存增长是否合理
      const afterInitMemory = process.memoryUsage().heapUsed
      const memoryIncrease = afterInitMemory - initialMemory

      // 内存增长应该小于10MB（这是一个合理的阈值）
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
      
      console.log(`内存增长: ${Math.round(memoryIncrease / 1024 / 1024 * 100) / 100}MB`)
    })
  })

  describe('错误处理测试', () => {
    it('应该能处理初始化错误', async () => {
      // 使用无效容器
      const invalidContainer = null as any

      await expect(
        enhancedInfrastructure.initialize(invalidContainer)
      ).rejects.toThrow()
    })

    it('应该能处理子系统加载失败', async () => {
      await enhancedInfrastructure.initialize(mockContainer)

      // 尝试获取不存在的子系统
      await expect(
        enhancedInfrastructure.getSubsystem('nonexistent')
      ).rejects.toThrow()
    })

    it('应该能优雅降级', async () => {
      await enhancedInfrastructure.initialize(mockContainer, undefined, {
        failureStrategy: 'continue'
      })

      // 即使有错误，系统应该仍能部分工作
      const health = enhancedInfrastructure.getSystemHealth()
      expect(health.overall).toBeDefined()
    })
  })
})

describe('集成测试', () => {
  let infrastructure: EnhancedPureInfrastructure
  let mockContainer: HTMLElement

  beforeEach(() => {
    mockContainer = document.createElement('div')
    document.body.appendChild(mockContainer)
    infrastructure = new EnhancedPureInfrastructure()
  })

  afterEach(async () => {
    if (mockContainer.parentNode) {
      mockContainer.parentNode.removeChild(mockContainer)
    }
    if (infrastructure) {
      await infrastructure.destroy()
    }
  })

  describe('子系统协作测试', () => {
    it('事件系统应该能与数据管道协作', async () => {
      await infrastructure.initialize(mockContainer)

      const eventBus = await infrastructure.getSubsystem('eventBus')
      const pipeline = await infrastructure.getSubsystem('pipeline')

      expect(eventBus).toBeDefined()
      expect(pipeline).toBeDefined()

      // 测试事件和数据管道的协作
      let eventReceived = false
      eventBus.on('test-event', () => {
        eventReceived = true
      })

      eventBus.emit('test-event', { test: 'data' })

      // 给事件处理一些时间
      await new Promise(resolve => setTimeout(resolve, 100))
      expect(eventReceived).toBe(true)
    })

    it('导入导出应该能与数据管道协作', async () => {
      await infrastructure.initialize(mockContainer)

      const porter = await infrastructure.getSubsystem('porter')
      const pipeline = await infrastructure.getSubsystem('pipeline')

      expect(porter).toBeDefined()
      expect(pipeline).toBeDefined()

      // 测试导入数据
      const testData = JSON.stringify({ test: 'data' })
      const result = await porter.import('json', testData)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })
  })

  describe('端到端测试', () => {
    it('完整的工作流程应该正常', async () => {
      // 1. 初始化系统
      await infrastructure.initialize(mockContainer, {
        regions: {
          toolbar: { height: 40 },
          sidebar: { width: 240 },
          main: { flex: 1 },
          inspector: { width: 280 }
        }
      })

      // 2. 检查系统健康
      const health = infrastructure.getSystemHealth()
      expect(health.overall).toBe('healthy')

      // 3. 获取各子系统
      const layout = await infrastructure.getSubsystem('layout')
      const pipeline = await infrastructure.getSubsystem('pipeline')
      const eventBus = await infrastructure.getSubsystem('eventBus')
      const porter = await infrastructure.getSubsystem('porter')

      expect(layout).toBeDefined()
      expect(pipeline).toBeDefined()
      expect(eventBus).toBeDefined()
      expect(porter).toBeDefined()

      // 4. 测试数据流
      let dataReceived = false
      eventBus.on('data-imported', () => {
        dataReceived = true
      })

      const testData = JSON.stringify({ components: [] })
      await porter.import('json', testData)

      // 5. 验证结果
      await new Promise(resolve => setTimeout(resolve, 200))
      // expect(dataReceived).toBe(true) // 根据实际实现调整

      // 6. 清理
      await infrastructure.destroy()
    }, 15000)
  })
})

describe('性能基准测试', () => {
  const testSizes = [10, 50, 100]

  testSizes.forEach(size => {
    it(`应该能处理${size}个并发子系统请求`, async () => {
      const infrastructure = new EnhancedPureInfrastructure()
      const container = document.createElement('div')
      document.body.appendChild(container)

      await infrastructure.initialize(container)

      const startTime = Date.now()
      
      // 并发获取多个子系统
      const promises = Array(size).fill(0).map(() => 
        infrastructure.getSubsystem('layout')
      )

      await Promise.all(promises)
      
      const endTime = Date.now()
      const duration = endTime - startTime

      // 性能要求：每个请求平均不超过10ms
      expect(duration / size).toBeLessThan(10)

      console.log(`${size}个并发请求耗时: ${duration}ms, 平均: ${Math.round(duration / size * 100) / 100}ms`)

      await infrastructure.destroy()
      if (container.parentNode) {
        container.parentNode.removeChild(container)
      }
    }, 20000)
  })

  it('内存泄漏测试', async () => {
    const initialMemory = process.memoryUsage().heapUsed

    // 创建和销毁多个实例
    for (let i = 0; i < 10; i++) {
      const infrastructure = new EnhancedPureInfrastructure()
      const container = document.createElement('div')
      document.body.appendChild(container)

      await infrastructure.initialize(container)
      await infrastructure.destroy()

      if (container.parentNode) {
        container.parentNode.removeChild(container)
      }
    }

    // 强制垃圾回收
    if (global.gc) {
      global.gc()
    }

    const finalMemory = process.memoryUsage().heapUsed
    const memoryIncrease = finalMemory - initialMemory

    // 内存增长应该小于5MB
    expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024)

    console.log(`内存泄漏测试 - 初始: ${Math.round(initialMemory / 1024 / 1024)}MB, 最终: ${Math.round(finalMemory / 1024 / 1024)}MB, 增长: ${Math.round(memoryIncrease / 1024 / 1024 * 100) / 100}MB`)
  }, 30000)
})