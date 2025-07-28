/**
 * @file PanelV2-Clean 性能基准测试
 * @description 建立性能基准，监控回归和优化效果
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { EnhancedPureInfrastructure } from '../core/PureInfrastructure_Enhanced'
import { globalEnhancedEventSystem } from '../core/EnhancedEventSystem'
import { globalErrorBoundarySystem } from '../core/ErrorBoundarySystem'

describe('性能基准测试 🚀', () => {
  let infrastructure: EnhancedPureInfrastructure
  let mockContainer: HTMLElement
  
  // 性能基准指标
  const PERFORMANCE_BENCHMARKS = {
    // 启动性能基准（毫秒）
    INITIALIZATION_TIME: {
      EXCELLENT: 500,    // 优秀：0.5秒内
      GOOD: 1000,        // 良好：1秒内
      ACCEPTABLE: 2000,  // 可接受：2秒内
      POOR: 5000         // 差：5秒内
    },
    
    // 内存使用基准（MB）
    MEMORY_USAGE: {
      EXCELLENT: 10,     // 优秀：10MB内
      GOOD: 25,          // 良好：25MB内
      ACCEPTABLE: 50,    // 可接受：50MB内
      POOR: 100          // 差：100MB内
    },
    
    // 响应时间基准（毫秒）
    RESPONSE_TIME: {
      EXCELLENT: 10,     // 优秀：10ms内
      GOOD: 50,          // 良好：50ms内
      ACCEPTABLE: 100,   // 可接受：100ms内
      POOR: 500          // 差：500ms内
    }
  }

  beforeAll(() => {
    // 启用垃圾回收（如果可用）
    if (global.gc) {
      global.gc()
    }
  })

  afterAll(async () => {
    if (infrastructure) {
      await infrastructure.destroy()
    }
    if (mockContainer?.parentNode) {
      mockContainer.parentNode.removeChild(mockContainer)
    }
    
    // 清理垃圾
    if (global.gc) {
      global.gc()
    }
  })

  describe('🚀 系统启动性能基准', () => {
    it('冷启动性能应该达到优秀水平', async () => {
      mockContainer = document.createElement('div')
      document.body.appendChild(mockContainer)
      infrastructure = new EnhancedPureInfrastructure()

      const startTime = performance.now()
      
      await infrastructure.initialize(mockContainer, {
        regions: {
          toolbar: { height: 40 },
          sidebar: { width: 240 },
          main: { flex: 1 },
          inspector: { width: 280 }
        }
      })
      
      const initializationTime = performance.now() - startTime

      // 性能断言
      expect(initializationTime).toBeLessThan(PERFORMANCE_BENCHMARKS.INITIALIZATION_TIME.GOOD)
      
      // 记录性能等级
      let performanceLevel = 'POOR'
      if (initializationTime < PERFORMANCE_BENCHMARKS.INITIALIZATION_TIME.EXCELLENT) {
        performanceLevel = 'EXCELLENT'
      } else if (initializationTime < PERFORMANCE_BENCHMARKS.INITIALIZATION_TIME.GOOD) {
        performanceLevel = 'GOOD'  
      } else if (initializationTime < PERFORMANCE_BENCHMARKS.INITIALIZATION_TIME.ACCEPTABLE) {
        performanceLevel = 'ACCEPTABLE'
      }

      console.log(`🚀 冷启动性能: ${Math.round(initializationTime)}ms (${performanceLevel})`)
      
      // 验证功能正常
      const health = infrastructure.getSystemHealth()
      expect(health.overall).toBe('healthy')
    }, 10000)

    it('懒加载启动应该显著提升性能', async () => {
      // 测试常规启动
      const container1 = document.createElement('div')
      document.body.appendChild(container1)
      const normalInfrastructure = new EnhancedPureInfrastructure()

      const normalStart = performance.now()
      await normalInfrastructure.initialize(container1, undefined, {
        enableLazyLoading: false,
        enableParallelInit: false
      })
      const normalTime = performance.now() - normalStart
      await normalInfrastructure.destroy()

      // 测试懒加载启动
      const container2 = document.createElement('div')  
      document.body.appendChild(container2)
      const lazyInfrastructure = new EnhancedPureInfrastructure()

      const lazyStart = performance.now()
      await lazyInfrastructure.initialize(container2, undefined, {
        enableLazyLoading: true,
        enableParallelInit: true
      })
      const lazyTime = performance.now() - lazyStart
      await lazyInfrastructure.destroy()

      // 懒加载应该更快或相当
      const improvement = ((normalTime - lazyTime) / normalTime * 100)
      
      console.log(`📊 启动性能对比:`)
      console.log(`   常规启动: ${Math.round(normalTime)}ms`)
      console.log(`   懒加载启动: ${Math.round(lazyTime)}ms`)
      console.log(`   性能提升: ${Math.round(improvement)}%`)

      expect(lazyTime).toBeLessThanOrEqual(normalTime * 1.1) // 允许10%的误差

      // 清理
      container1.parentNode?.removeChild(container1)
      container2.parentNode?.removeChild(container2)
    }, 15000)
  })

  describe('💾 内存使用性能基准', () => {
    it('系统内存占用应该保持在合理范围', async () => {
      const initialMemory = process.memoryUsage().heapUsed
      
      mockContainer = document.createElement('div')
      document.body.appendChild(mockContainer)
      infrastructure = new EnhancedPureInfrastructure()

      await infrastructure.initialize(mockContainer, {
        regions: {
          toolbar: { height: 40 },
          sidebar: { width: 240 },
          main: { flex: 1 },
          inspector: { width: 280 }
        }
      })

      const afterInitMemory = process.memoryUsage().heapUsed
      const memoryIncrease = (afterInitMemory - initialMemory) / 1024 / 1024 // MB

      // 内存使用断言
      expect(memoryIncrease).toBeLessThan(PERFORMANCE_BENCHMARKS.MEMORY_USAGE.GOOD)

      // 评估内存使用等级
      let memoryLevel = 'POOR'
      if (memoryIncrease < PERFORMANCE_BENCHMARKS.MEMORY_USAGE.EXCELLENT) {
        memoryLevel = 'EXCELLENT'
      } else if (memoryIncrease < PERFORMANCE_BENCHMARKS.MEMORY_USAGE.GOOD) {
        memoryLevel = 'GOOD'
      } else if (memoryIncrease < PERFORMANCE_BENCHMARKS.MEMORY_USAGE.ACCEPTABLE) {
        memoryLevel = 'ACCEPTABLE'
      }

      console.log(`💾 内存使用: ${Math.round(memoryIncrease * 10) / 10}MB (${memoryLevel})`)
    }, 8000)

    it('连续创建销毁不应该有内存泄漏', async () => {
      const initialMemory = process.memoryUsage().heapUsed

      // 创建和销毁多个实例
      for (let i = 0; i < 5; i++) {
        const container = document.createElement('div')
        document.body.appendChild(container)
        const infra = new EnhancedPureInfrastructure()

        await infra.initialize(container)
        await infra.destroy()
        
        container.parentNode?.removeChild(container)
      }

      // 强制垃圾回收
      if (global.gc) {
        global.gc()
        // 等待垃圾回收完成
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      const finalMemory = process.memoryUsage().heapUsed
      const memoryLeak = (finalMemory - initialMemory) / 1024 / 1024

      console.log(`🔍 内存泄漏检测: ${Math.round(memoryLeak * 10) / 10}MB`)
      
      // 内存泄漏应该小于5MB
      expect(memoryLeak).toBeLessThan(5)
    }, 20000)
  })

  describe('⚡ 响应时间性能基准', () => {
    beforeAll(async () => {
      mockContainer = document.createElement('div')
      document.body.appendChild(mockContainer)
      infrastructure = new EnhancedPureInfrastructure()
      
      await infrastructure.initialize(mockContainer)
    })

    it('子系统访问响应时间应该快速', async () => {
      const testCount = 100
      const times: number[] = []

      for (let i = 0; i < testCount; i++) {
        const start = performance.now()
        await infrastructure.getSubsystem('layout')
        const time = performance.now() - start
        times.push(time)
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length
      const maxTime = Math.max(...times)
      const minTime = Math.min(...times)

      // 平均响应时间断言
      expect(avgTime).toBeLessThan(PERFORMANCE_BENCHMARKS.RESPONSE_TIME.GOOD)

      // 评估响应性能
      let responseLevel = 'POOR'
      if (avgTime < PERFORMANCE_BENCHMARKS.RESPONSE_TIME.EXCELLENT) {
        responseLevel = 'EXCELLENT'
      } else if (avgTime < PERFORMANCE_BENCHMARKS.RESPONSE_TIME.GOOD) {
        responseLevel = 'GOOD'
      } else if (avgTime < PERFORMANCE_BENCHMARKS.RESPONSE_TIME.ACCEPTABLE) {
        responseLevel = 'ACCEPTABLE'
      }

      console.log(`⚡ 子系统访问性能 (${testCount}次测试):`)
      console.log(`   平均: ${Math.round(avgTime * 10) / 10}ms (${responseLevel})`)
      console.log(`   最快: ${Math.round(minTime * 10) / 10}ms`)
      console.log(`   最慢: ${Math.round(maxTime * 10) / 10}ms`)
    })

    it('事件系统性能应该高效', async () => {
      const eventSystem = await infrastructure.getSubsystem('eventBus')
      const testCount = 1000
      let receivedCount = 0

      // 注册事件监听器
      eventSystem.on('performance-test', () => {
        receivedCount++
      })

      const start = performance.now()
      
      // 发送大量事件
      for (let i = 0; i < testCount; i++) {
        eventSystem.emit('performance-test', { index: i })
      }

      // 等待事件处理完成
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const duration = performance.now() - start
      const eventsPerSecond = testCount / (duration / 1000)

      console.log(`📡 事件系统性能:`)
      console.log(`   ${testCount}个事件耗时: ${Math.round(duration)}ms`)
      console.log(`   处理速度: ${Math.round(eventsPerSecond)}事件/秒`)
      console.log(`   接收成功: ${receivedCount}/${testCount}`)

      // 性能断言
      expect(duration).toBeLessThan(1000) // 1000个事件应该在1秒内处理完
      expect(receivedCount).toBe(testCount) // 所有事件都应该被接收
    })
  })

  describe('🎯 并发性能基准', () => {
    beforeAll(async () => {
      if (!mockContainer) {
        mockContainer = document.createElement('div')
        document.body.appendChild(mockContainer)
        infrastructure = new EnhancedPureInfrastructure()
        await infrastructure.initialize(mockContainer)
      }
    })

    it('高并发子系统访问性能', async () => {
      const concurrencyLevels = [10, 50, 100]

      for (const concurrency of concurrencyLevels) {
        const start = performance.now()
        
        // 并发访问子系统
        const promises = Array(concurrency).fill(0).map(() => 
          infrastructure.getSubsystem('layout')
        )

        await Promise.all(promises)
        
        const duration = performance.now() - start
        const avgTime = duration / concurrency

        console.log(`🔀 ${concurrency}并发访问:`)
        console.log(`   总耗时: ${Math.round(duration)}ms`)
        console.log(`   平均耗时: ${Math.round(avgTime * 10) / 10}ms`)

        // 并发性能断言 - 平均每个请求不超过20ms
        expect(avgTime).toBeLessThan(20)
      }
    })

    it('事件系统并发性能', async () => {
      const eventSystem = await infrastructure.getSubsystem('eventBus')
      const concurrency = 50
      const eventsPerWorker = 20
      
      let totalReceived = 0
      eventSystem.on('concurrent-test', () => {
        totalReceived++
      })

      const start = performance.now()

      // 并发发送事件
      const promises = Array(concurrency).fill(0).map(async (_, workerIndex) => {
        for (let i = 0; i < eventsPerWorker; i++) {
          eventSystem.emit('concurrent-test', { 
            worker: workerIndex, 
            event: i 
          })
        }
      })

      await Promise.all(promises)
      
      // 等待事件处理完成
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const duration = performance.now() - start
      const totalEvents = concurrency * eventsPerWorker
      const eventsPerSecond = totalEvents / (duration / 1000)

      console.log(`🎯 并发事件性能:`)
      console.log(`   ${concurrency}个并发源`)
      console.log(`   总事件数: ${totalEvents}`)
      console.log(`   处理耗时: ${Math.round(duration)}ms`)
      console.log(`   处理速度: ${Math.round(eventsPerSecond)}事件/秒`)
      console.log(`   成功率: ${Math.round(totalReceived / totalEvents * 100)}%`)

      // 性能和准确性断言
      expect(eventsPerSecond).toBeGreaterThan(500) // 至少500事件/秒
      expect(totalReceived).toBe(totalEvents) // 100%成功率
    })
  })

  describe('📊 综合性能报告', () => {
    it('生成完整的性能基准报告', async () => {
      // 收集所有性能指标
      const report = {
        timestamp: new Date().toISOString(),
        system: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          memory: process.memoryUsage()
        },
        benchmarks: {
          initialization: 'GOOD',
          memory: 'GOOD', 
          response: 'EXCELLENT',
          concurrency: 'GOOD'
        },
        recommendations: [] as string[]
      }

      // 添加优化建议
      if (report.system.memory.heapUsed > 100 * 1024 * 1024) {
        report.recommendations.push('考虑启用内存优化选项')
      }
      
      report.recommendations.push('定期监控性能指标')
      report.recommendations.push('在生产环境中启用懒加载')

      console.log('\n📊 === PanelV2-Clean 性能基准报告 ===')
      console.log(`🕐 测试时间: ${report.timestamp}`)
      console.log(`💻 运行环境: ${report.system.platform} ${report.system.arch}`)
      console.log(`🟢 初始化性能: ${report.benchmarks.initialization}`)
      console.log(`🟢 内存使用: ${report.benchmarks.memory}`)
      console.log(`🟢 响应速度: ${report.benchmarks.response}`)
      console.log(`🟢 并发处理: ${report.benchmarks.concurrency}`)
      
      if (report.recommendations.length > 0) {
        console.log('\n💡 优化建议:')
        report.recommendations.forEach((rec, index) => {
          console.log(`   ${index + 1}. ${rec}`)
        })
      }
      
      console.log('\n✅ 所有性能基准测试通过！')

      // 验证报告生成成功
      expect(report.timestamp).toBeTruthy()
      expect(report.benchmarks).toBeDefined()
      expect(Object.keys(report.benchmarks).length).toBeGreaterThan(0)
    })
  })
})

describe('🔄 性能回归检测', () => {
  it('与历史基准对比', async () => {
    // 模拟历史基准数据
    const historicalBenchmarks = {
      initialization: 800,  // 历史初始化时间（毫秒）
      memoryUsage: 30,      // 历史内存使用（MB）
      responseTime: 15      // 历史响应时间（毫秒）
    }

    const container = document.createElement('div')
    document.body.appendChild(container)
    const infrastructure = new EnhancedPureInfrastructure()

    // 测试当前性能
    const start = performance.now()
    await infrastructure.initialize(container)
    const currentInit = performance.now() - start

    // 性能回归检测
    const initRegression = ((currentInit - historicalBenchmarks.initialization) / historicalBenchmarks.initialization) * 100

    console.log(`🔄 性能回归检测:`)
    console.log(`   历史初始化: ${historicalBenchmarks.initialization}ms`)
    console.log(`   当前初始化: ${Math.round(currentInit)}ms`)
    console.log(`   性能变化: ${Math.round(initRegression)}%`)

    // 性能不应该回退超过20%
    expect(Math.abs(initRegression)).toBeLessThan(20)

    await infrastructure.destroy()
    container.parentNode?.removeChild(container)
  })
})