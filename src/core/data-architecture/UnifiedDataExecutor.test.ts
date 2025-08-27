/**
 * UnifiedDataExecutor 功能测试
 * Task 2.1: 验证统一执行器的基本功能
 */

import { UnifiedDataExecutor, type UnifiedDataConfig } from './UnifiedDataExecutor'

/**
 * 测试统一执行器功能
 * 可在浏览器控制台中运行: await testUnifiedDataExecutor()
 */
export async function testUnifiedDataExecutor(): Promise<void> {
  console.log('🧪 [测试] 开始测试 UnifiedDataExecutor')

  const executor = new UnifiedDataExecutor()

  // 测试1: 静态数据源
  console.log('\n📋 测试1: 静态数据源')
  const staticConfig: UnifiedDataConfig = {
    id: 'test-static-1',
    type: 'static',
    config: {
      data: {
        message: 'Hello from UnifiedDataExecutor!',
        timestamp: Date.now(),
        items: [1, 2, 3, 4, 5]
      }
    }
  }

  const staticResult = await executor.execute(staticConfig)
  console.log('静态数据源结果:', staticResult)

  // 测试2: JSON数据源
  console.log('\n📋 测试2: JSON数据源')
  const jsonConfig: UnifiedDataConfig = {
    id: 'test-json-1',
    type: 'json',
    config: {
      jsonContent: JSON.stringify({
        users: [
          { id: 1, name: 'Alice', age: 25 },
          { id: 2, name: 'Bob', age: 30 }
        ],
        total: 2
      })
    }
  }

  const jsonResult = await executor.execute(jsonConfig)
  console.log('JSON数据源结果:', jsonResult)

  // 测试3: HTTP数据源 (使用JSONPlaceholder)
  console.log('\n📋 测试3: HTTP数据源')
  const httpConfig: UnifiedDataConfig = {
    id: 'test-http-1',
    type: 'http',
    config: {
      url: 'https://jsonplaceholder.typicode.com/posts/1',
      method: 'GET'
    }
  }

  const httpResult = await executor.execute(httpConfig)
  console.log('HTTP数据源结果:', httpResult)

  // 测试4: 批量执行
  console.log('\n📋 测试4: 批量执行')
  const batchConfigs = [staticConfig, jsonConfig]
  const batchResults = await executor.executeMultiple(batchConfigs)
  console.log('批量执行结果:', batchResults)

  // 测试5: 错误处理
  console.log('\n📋 测试5: 错误处理')
  const errorConfig: UnifiedDataConfig = {
    id: 'test-error-1',
    type: 'json',
    config: {
      jsonContent: '{ invalid json content' // 无效JSON
    }
  }

  const errorResult = await executor.execute(errorConfig)
  console.log('错误处理结果:', errorResult)

  // 测试6: 不支持的类型
  console.log('\n📋 测试6: 不支持的类型')
  const unsupportedConfig: UnifiedDataConfig = {
    id: 'test-unsupported-1',
    type: 'unknown' as any,
    config: {}
  }

  const unsupportedResult = await executor.execute(unsupportedConfig)
  console.log('不支持类型结果:', unsupportedResult)

  // 测试7: 支持的数据源类型
  console.log('\n📋 测试7: 支持的数据源类型')
  const supportedTypes = executor.getSupportedTypes()
  console.log('支持的类型:', supportedTypes)

  console.log('\n✅ [测试] UnifiedDataExecutor 功能测试完成')
}

/**
 * 测试与 SimpleDataBridge 的集成
 */
export async function testSimpleDataBridgeIntegration(): Promise<void> {
  console.log('🧪 [测试] 开始测试 SimpleDataBridge 集成')

  // 动态导入避免循环依赖
  const { simpleDataBridge } = await import('./SimpleDataBridge')

  const testRequirement = {
    componentId: 'test-component-1',
    dataSources: [
      {
        id: 'dataSource1',
        type: 'static' as const,
        config: {
          data: {
            temperature: 25.5,
            humidity: 60,
            status: 'normal'
          }
        }
      },
      {
        id: 'dataSource2',
        type: 'json' as const,
        config: {
          jsonContent: JSON.stringify({
            alerts: ['高温报警', '低湿度报警'],
            lastUpdate: new Date().toISOString()
          })
        }
      }
    ]
  }

  const result = await simpleDataBridge.executeComponent(testRequirement)
  console.log('SimpleDataBridge 集成结果:', result)

  console.log('✅ [测试] SimpleDataBridge 集成测试完成')
}

// 将测试函数暴露到全局作用域，便于控制台调试
if (typeof window !== 'undefined') {
  ;(window as any).testUnifiedDataExecutor = testUnifiedDataExecutor(window as any).testSimpleDataBridgeIntegration =
    testSimpleDataBridgeIntegration
  console.log('🧪 [测试] 测试函数已暴露到全局作用域:')
  console.log('  - window.testUnifiedDataExecutor()')
  console.log('  - window.testSimpleDataBridgeIntegration()')
}
