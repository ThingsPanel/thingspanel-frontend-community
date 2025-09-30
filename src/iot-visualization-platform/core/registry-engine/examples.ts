/**
 * Registry Engine 使用示例集合
 *
 * 本文件包含了Registry Engine的各种使用场景和最佳实践示例
 * 可以作为开发参考和学习材料
 *
 * 包含示例：
 * - 基础注册和查询操作
 * - 组件统一注册管理
 * - 适配器系统集成
 * - 依赖关系管理
 * - 批量操作和事务
 * - 性能优化技巧
 */

import { registryEngine, RegistryItemType, type RegistryItem, type RegistryItemMetadata } from './index'
import { ComponentRegistryManager, type UnifiedComponentDefinition } from './component-registry'
import { adapterManager } from './adapters'

// ==================== 基础使用示例 ====================

/**
 * 示例1: 基础注册和查询操作
 * 演示Registry Engine的基本使用方法
 */
export async function basicRegistryExample() {

  // 🎯 注册一个自定义组件
  const customComponentItem: RegistryItem<any> = {
    metadata: {
      id: 'custom-weather-widget',
      name: '天气组件',
      type: RegistryItemType.CARD21_COMPONENT,
      version: '1.0.0',
      description: '显示天气信息的自定义组件',
      category: 'weather',
      tags: ['weather', 'display', 'sensor'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      enabled: true,
      priority: 10,
      dependencies: ['location-service', 'api-client']
    },
    content: {
      type: 'weather-widget',
      dataSources: [
        {
          key: 'weatherData',
          type: 'api',
          url: '/api/weather/current'
        }
      ],
      staticParams: {
        refreshInterval: 300000, // 5分钟
        showForecast: true,
        units: 'metric'
      }
    },
    validate: async () => {
      // 验证天气API是否可用
      return true
    },
    initialize: async () => {
      // 设置定时刷新
      // 注册事件监听器
    },
    cleanup: async () => {
      // 清理定时器
      // 移除事件监听器
    }
  }

  // 注册组件
  const success = await registryEngine.register(customComponentItem)

  // 查询组件
  const retrievedItem = registryEngine.get('custom-weather-widget')

  // 检查是否存在
  const exists = registryEngine.has('custom-weather-widget')

  // 按类型查询
  const card21Components = registryEngine.getByType(RegistryItemType.CARD21_COMPONENT)

  // 按标签查询
  const weatherComponents = registryEngine.getByTag('weather')

  // 复杂查询
  const queryResults = registryEngine.query({
    type: RegistryItemType.CARD21_COMPONENT,
    enabled: true,
    tags: ['sensor'],
    filter: (item) => item.metadata.priority > 5
  })

  // 获取统计信息
  const stats = registryEngine.getStats()
}

/**
 * 示例2: 组件统一注册管理
 * 演示ComponentRegistryManager的使用
 */
export async function componentRegistryExample() {

  // 🎯 注册Card2.1组件
  const card21Component = {
    type: 'temperature-sensor',
    dataSources: [
      {
        key: 'temperature',
        type: 'device',
        deviceId: '{{deviceId}}',
        metric: 'temperature'
      }
    ],
    staticParams: {
      unit: 'celsius',
      precision: 1,
      showTrend: true
    },
    interactionCapabilities: {
      supportedEvents: ['click', 'hover'],
      availableActions: ['drill-down', 'export-data']
    }
  }

  const registerResult = await ComponentRegistryManager.registerComponent(card21Component)

  // 🎯 批量注册多个组件
  const components = [
    {
      type: 'humidity-sensor',
      dataSources: [{ key: 'humidity', type: 'device' }],
      staticParams: { unit: 'percent' }
    },
    {
      type: 'pressure-sensor',
      dataSources: [{ key: 'pressure', type: 'device' }],
      staticParams: { unit: 'hPa' }
    },
    {
      type: 'air-quality-index',
      dataSources: [
        { key: 'pm25', type: 'device' },
        { key: 'pm10', type: 'device' }
      ],
      staticParams: { showDetails: true }
    }
  ]

  const batchResult = await ComponentRegistryManager.registerComponents(components)

  // 🎯 查询组件
  const temperatureComponent = ComponentRegistryManager.getComponent('temperature-sensor')

  // 按类型查询
  const sensorComponents = ComponentRegistryManager.getComponentsByType('humidity-sensor')

  // 按来源系统查询
  const card21Components = ComponentRegistryManager.getComponentsBySourceSystem('card21')

  // 复杂查询
  const multiDataSourceComponents = ComponentRegistryManager.queryComponents({
    hasDataSources: true,
    filter: (comp) => {
      const dataSources = comp.dataSources
      return Array.isArray(dataSources) && dataSources.length > 1
    }
  })

  // 获取组件统计
  const componentStats = ComponentRegistryManager.getComponentStats()
}

/**
 * 示例3: 适配器系统集成
 * 演示如何使用适配器集成现有系统
 */
export async function adapterIntegrationExample() {

  // 🎯 获取适配器状态
  const stats = adapterManager.getIntegrationStats()

  // 🎯 集成所有可用适配器
  const integrationResults = await adapterManager.integrateAll()

  // 🎯 检查集成后的组件数量
  const allComponents = ComponentRegistryManager.getAllComponents()

  // 按来源系统分组统计
  const bySourceSystem = allComponents.reduce((acc, comp) => {
    acc[comp.sourceSystem] = (acc[comp.sourceSystem] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // 🎯 获取特定适配器
  const card21Adapter = adapterManager.getAdapter('Card21RegistryAdapter')
  if (card21Adapter) {
  }
}

/**
 * 示例4: 依赖关系管理
 * 演示组件依赖关系的处理
 */
export async function dependencyManagementExample() {

  // 🎯 注册有依赖关系的组件
  const baseService: RegistryItem<any> = {
    metadata: {
      id: 'data-service',
      name: '数据服务',
      type: RegistryItemType.CARD21_COMPONENT,
      version: '1.0.0',
      description: '提供数据访问功能的基础服务',
      category: 'service',
      tags: ['service', 'data'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      enabled: true,
      priority: 100 // 高优先级，基础服务
    },
    content: {
      type: 'data-service',
      api: {
        getData: () => Promise.resolve([]),
        saveData: () => Promise.resolve()
      }
    }
  }

  const dependentComponent: RegistryItem<any> = {
    metadata: {
      id: 'chart-widget',
      name: '图表组件',
      type: RegistryItemType.CARD21_COMPONENT,
      version: '1.0.0',
      description: '依赖数据服务的图表组件',
      category: 'visualization',
      tags: ['chart', 'visualization'],
      dependencies: ['data-service'], // 依赖数据服务
      createdAt: Date.now(),
      updatedAt: Date.now(),
      enabled: true,
      priority: 50
    },
    content: {
      type: 'chart-widget',
      dataSources: [
        { key: 'chartData', type: 'service', service: 'data-service' }
      ]
    }
  }

  // 注册基础服务
  await registryEngine.register(baseService)

  // 注册依赖组件
  await registryEngine.register(dependentComponent)

  // 🎯 查询依赖关系
  const chartDependencies = registryEngine.getDependencies('chart-widget')

  const chartDependentsRecursive = registryEngine.getDependencies('chart-widget', true)

  // 查询依赖者
  const serviceDependents = registryEngine.getDependents('data-service')

  // 🎯 验证依赖完整性
  const dependencyValidation = ComponentRegistryManager.validateDependencies()

  // 🎯 尝试注册一个有缺失依赖的组件
  const invalidComponent: RegistryItem<any> = {
    metadata: {
      id: 'invalid-widget',
      name: '无效组件',
      type: RegistryItemType.CARD21_COMPONENT,
      version: '1.0.0',
      dependencies: ['non-existent-service'], // 不存在的依赖
      createdAt: Date.now(),
      updatedAt: Date.now(),
      enabled: true,
      priority: 10
    },
    content: { type: 'invalid-widget' }
  }

  const invalidResult = await registryEngine.register(invalidComponent)

  // 再次验证依赖
  const finalValidation = ComponentRegistryManager.validateDependencies()
}

/**
 * 示例5: 批量操作和事务处理
 * 演示大量组件的批量处理
 */
export async function batchOperationsExample() {

  // 🎯 生成大量测试组件
  const generateTestComponents = (count: number) => {
    const components = []
    for (let i = 0; i < count; i++) {
      components.push({
        type: `test-component-${i}`,
        dataSources: [
          {
            key: 'data',
            type: 'mock',
            value: Math.random() * 100
          }
        ],
        staticParams: {
          id: i,
          category: i % 3 === 0 ? 'sensors' : i % 3 === 1 ? 'controls' : 'displays',
          enabled: Math.random() > 0.1 // 90%概率启用
        }
      })
    }
    return components
  }

  // 生成100个测试组件
  const testComponents = generateTestComponents(100)

  // 🎯 批量注册并测量性能
  console.time('批量注册性能')
  const batchResults = await ComponentRegistryManager.registerComponents(testComponents, {
    validate: true,
    overwrite: true
  })
  console.timeEnd('批量注册性能')


  // 🎯 批量查询性能测试
  console.time('批量查询性能')
  const sensorComponents = ComponentRegistryManager.queryComponents({
    filter: (comp) => comp.staticParams?.category === 'sensors'
  })
  console.timeEnd('批量查询性能')

  // 🎯 复杂条件查询
  console.time('复杂查询性能')
  const complexQueryResults = ComponentRegistryManager.queryComponents({
    hasDataSources: true,
    sourceSystem: 'card21',
    filter: (comp) => {
      return comp.staticParams?.enabled === true &&
             comp.staticParams?.id !== undefined &&
             comp.staticParams.id % 2 === 0 // 偶数ID
    }
  })
  console.timeEnd('复杂查询性能')

  // 🎯 统计分析
  const finalStats = ComponentRegistryManager.getComponentStats()

  // 🎯 内存使用分析
  const registryEngineStats = registryEngine.getStats()
}

/**
 * 示例6: 性能优化和监控
 * 演示性能监控和优化技巧
 */
export async function performanceOptimizationExample() {

  // 🎯 设置性能监控
  let operationCount = 0
  let totalTime = 0

  const performanceMonitor = {
    startOperation: () => {
      operationCount++
      return performance.now()
    },
    endOperation: (startTime: number, operationName: string) => {
      const duration = performance.now() - startTime
      totalTime += duration
      return duration
    },
    getAverageTime: () => totalTime / operationCount
  }

  // 🎯 测试各种操作的性能

  // 注册性能
  let start = performanceMonitor.startOperation()
  await ComponentRegistryManager.registerComponent({
    type: 'performance-test-component',
    dataSources: [{ key: 'test', type: 'mock' }]
  })
  performanceMonitor.endOperation(start, '单个组件注册')

  // 查询性能
  start = performanceMonitor.startOperation()
  const component = ComponentRegistryManager.getComponent('performance-test-component')
  performanceMonitor.endOperation(start, '单个组件查询')

  // 复杂查询性能
  start = performanceMonitor.startOperation()
  const complexResults = ComponentRegistryManager.queryComponents({
    hasDataSources: true,
    sourceSystem: 'card21'
  })
  performanceMonitor.endOperation(start, '复杂条件查询')

  // 统计查询性能
  start = performanceMonitor.startOperation()
  const stats = ComponentRegistryManager.getComponentStats()
  performanceMonitor.endOperation(start, '统计信息生成')


  // 🎯 内存使用建议

  // 🎯 清理测试数据
  await ComponentRegistryManager.unregisterComponent('performance-test-component')
}

/**
 * 示例7: 错误处理和调试
 * 演示错误处理的最佳实践
 */
export async function errorHandlingExample() {

  // 🎯 监听Registry Engine事件
  registryEngine.on('error', (errorInfo) => {
    console.error('📡 Registry Engine 错误事件:', {
      操作: errorInfo.action,
      错误: errorInfo.error.message,
      元数据: errorInfo.metadata
    })
  })

  registryEngine.on('register', (metadata) => {
  })

  registryEngine.on('unregister', (id) => {
  })

  // 🎯 测试各种错误情况

  // 1. 重复注册错误
  const duplicateComponent = {
    type: 'duplicate-test',
    dataSources: [{ key: 'test', type: 'mock' }]
  }

  await ComponentRegistryManager.registerComponent(duplicateComponent)

  const duplicateResult = await ComponentRegistryManager.registerComponent(duplicateComponent)

  // 2. 无效组件定义错误
  try {
    await ComponentRegistryManager.registerComponent(null as any)
  } catch (error) {
  }

  // 3. 查询不存在的组件
  const nonExistentComponent = ComponentRegistryManager.getComponent('non-existent-component')

  // 4. 验证失败的组件
  const invalidComponent: RegistryItem<any> = {
    metadata: {
      id: 'invalid-component',
      name: '', // 空名称，会导致验证失败
      type: RegistryItemType.CARD21_COMPONENT,
      version: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      enabled: true,
      priority: 0
    },
    content: {},
    validate: () => false // 强制验证失败
  }

  const invalidResult = await registryEngine.register(invalidComponent)

  // 🎯 调试信息输出

  // 清理测试数据
  await ComponentRegistryManager.unregisterComponent('duplicate-test')
}

// ==================== 运行所有示例 ====================

/**
 * 运行所有Registry Engine示例
 * 按顺序执行所有示例，展示完整功能
 */
export async function runAllRegistryExamples() {

  try {
    // 基础功能示例
    await basicRegistryExample()

    // 组件管理示例
    await componentRegistryExample()

    // 适配器集成示例
    await adapterIntegrationExample()

    // 依赖管理示例
    await dependencyManagementExample()

    // 批量操作示例
    await batchOperationsExample()

    // 性能优化示例
    await performanceOptimizationExample()

    // 错误处理示例
    await errorHandlingExample()


    // 输出最终统计
    const finalStats = registryEngine.getStats()

  } catch (error) {
    console.error('❌ 示例运行过程中发生错误:', error)
  }
}

// 导出所有示例函数
export {
  basicRegistryExample,
  componentRegistryExample,
  adapterIntegrationExample,
  dependencyManagementExample,
  batchOperationsExample,
  performanceOptimizationExample,
  errorHandlingExample
}