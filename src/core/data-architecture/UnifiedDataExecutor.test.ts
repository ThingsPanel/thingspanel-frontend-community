/**
 * UnifiedDataExecutor 功能测试
 * Task 2.1: 验证统一执行器的基本功能
 */

import { UnifiedDataExecutor, type UnifiedDataConfig } from '@/core/data-architecture/UnifiedDataExecutor'

/**
 * 测试统一执行器功能
 * 可在浏览器控制台中运行: await testUnifiedDataExecutor()
 */
export async function testUnifiedDataExecutor(): Promise<void> {
  const executor = new UnifiedDataExecutor()

  // 测试1: 静态数据源
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

  // 测试2: JSON数据源
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

  // 测试3: HTTP数据源 (使用JSONPlaceholder)
  const httpConfig: UnifiedDataConfig = {
    id: 'test-http-1',
    type: 'http',
    config: {
      url: 'https://jsonplaceholder.typicode.com/posts/1',
      method: 'GET'
    }
  }

  const httpResult = await executor.execute(httpConfig)

  // 测试4: 批量执行
  const batchConfigs = [staticConfig, jsonConfig]
  const batchResults = await executor.executeMultiple(batchConfigs)

  // 测试5: 错误处理
  const errorConfig: UnifiedDataConfig = {
    id: 'test-error-1',
    type: 'json',
    config: {
      jsonContent: '{ invalid json content' // 无效JSON
    }
  }

  const errorResult = await executor.execute(errorConfig)

  // 测试6: 不支持的类型
  const unsupportedConfig: UnifiedDataConfig = {
    id: 'test-unsupported-1',
    type: 'unknown' as any,
    config: {}
  }

  const unsupportedResult = await executor.execute(unsupportedConfig)

  // 测试7: 支持的数据源类型
  const supportedTypes = executor.getSupportedTypes()
}

/**
 * 测试与 SimpleDataBridge 的集成
 */
export async function testSimpleDataBridgeIntegration(): Promise<void> {
  // 动态导入避免循环依赖
  const { simpleDataBridge } = await import('@/core/data-architecture/SimpleDataBridge')

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
}

// 将测试函数暴露到全局作用域，便于控制台调试
if (typeof window !== 'undefined') {
  ;(window as any).testUnifiedDataExecutor = testUnifiedDataExecutor(window as any).testSimpleDataBridgeIntegration =
    testSimpleDataBridgeIntegration
}
