/**
 * Phase 2 集成测试
 * 验证新架构的集成效果和性能提升
 */

import { visualEditorBridge } from './VisualEditorBridge'
import { simpleDataBridge } from './SimpleDataBridge'

/**
 * 测试新架构的基本功能
 */
export async function testPhase2Integration() {
  console.log('🧪 [Phase2Test] 开始测试新架构集成')

  // 测试1: 静态数据源
  console.log('📝 [Phase2Test] 测试1: 静态数据源')
  try {
    const result1 = await visualEditorBridge.updateComponentExecutor('test-component-1', 'triple-data-display', {
      dataSource1: {
        type: 'static',
        enabled: true,
        config: {
          data: {
            temperature: 25.6,
            humidity: 60,
            timestamp: new Date().toISOString()
          }
        }
      }
    })
    console.log('✅ [Phase2Test] 静态数据源测试成功:', result1.success)
  } catch (error) {
    console.error('❌ [Phase2Test] 静态数据源测试失败:', error)
  }

  // 测试2: HTTP数据源
  console.log('📝 [Phase2Test] 测试2: HTTP数据源')
  try {
    const result2 = await visualEditorBridge.updateComponentExecutor('test-component-2', 'dual-data-display', {
      dataSource1: {
        type: 'http',
        enabled: true,
        config: {
          url: 'https://jsonplaceholder.typicode.com/posts/1',
          method: 'GET'
        }
      }
    })
    console.log('✅ [Phase2Test] HTTP数据源测试成功:', result2.success)
  } catch (error) {
    console.error('❌ [Phase2Test] HTTP数据源测试失败:', error)
  }

  // 测试3: 多数据源组合
  console.log('📝 [Phase2Test] 测试3: 多数据源组合')
  try {
    const result3 = await visualEditorBridge.updateComponentExecutor('test-component-3', 'triple-data-display', {
      dataSource1: {
        type: 'static',
        enabled: true,
        config: {
          data: { sensor: 'A', value: 100 }
        }
      },
      dataSource2: {
        type: 'static',
        enabled: true,
        config: {
          data: { sensor: 'B', value: 200 }
        }
      },
      dataSource3: {
        type: 'script',
        enabled: true,
        config: {
          script: 'return { computed: Math.random() * 1000 }'
        }
      }
    })
    console.log('✅ [Phase2Test] 多数据源组合测试成功:', result3.success)
  } catch (error) {
    console.error('❌ [Phase2Test] 多数据源组合测试失败:', error)
  }

  // 测试4: 架构统计信息
  console.log('📊 [Phase2Test] 架构统计信息')
  const stats = simpleDataBridge.getStats()
  console.log('📊 [Phase2Test] SimpleDataBridge统计:', stats)

  console.log('🎉 [Phase2Test] Phase 2 集成测试完成')
}

/**
 * 性能对比测试（简化版）
 */
export async function performanceComparison() {
  console.log('⚡ [Phase2Performance] 性能对比测试')

  const testConfigs = [
    {
      componentId: 'perf-test-1',
      componentType: 'dual-data-display',
      config: {
        dataSource1: { type: 'static', enabled: true, config: { data: { test: 1 } } },
        dataSource2: { type: 'static', enabled: true, config: { data: { test: 2 } } }
      }
    },
    {
      componentId: 'perf-test-2',
      componentType: 'triple-data-display',
      config: {
        dataSource1: { type: 'static', enabled: true, config: { data: { test: 1 } } },
        dataSource2: { type: 'static', enabled: true, config: { data: { test: 2 } } },
        dataSource3: { type: 'static', enabled: true, config: { data: { test: 3 } } }
      }
    }
  ]

  const startTime = performance.now()

  // 批量执行测试
  const promises = testConfigs.map(config =>
    visualEditorBridge.updateComponentExecutor(config.componentId, config.componentType, config.config)
  )

  try {
    const results = await Promise.all(promises)
    const endTime = performance.now()
    const executionTime = endTime - startTime

    console.log('⚡ [Phase2Performance] 批量执行结果:')
    console.log(`   - 执行时间: ${executionTime.toFixed(2)}ms`)
    console.log(`   - 成功数量: ${results.filter(r => r.success).length}/${results.length}`)
    console.log(`   - 平均每个组件: ${(executionTime / results.length).toFixed(2)}ms`)
  } catch (error) {
    console.error('❌ [Phase2Performance] 性能测试失败:', error)
  }
}

// 自动运行测试已禁用，避免自动调用外部接口
// 如需测试，请手动在控制台调用: await testPhase2Integration()
// if (import.meta.env.DEV) {
//   // 延迟执行，避免影响应用启动
//   setTimeout(() => {
//     testPhase2Integration().then(() => {
//       performanceComparison()
//     })
//   }, 3000)
// }
