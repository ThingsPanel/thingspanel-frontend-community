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
  console.log('=== Registry Engine 基础使用示例 ===')

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
      console.log('🔍 验证天气组件配置...')
      return true
    },
    initialize: async () => {
      console.log('🚀 初始化天气组件...')
      // 设置定时刷新
      // 注册事件监听器
    },
    cleanup: async () => {
      console.log('🧹 清理天气组件资源...')
      // 清理定时器
      // 移除事件监听器
    }
  }

  // 注册组件
  const success = await registryEngine.register(customComponentItem)
  console.log(`注册结果: ${success ? '✅ 成功' : '❌ 失败'}`)

  // 查询组件
  const retrievedItem = registryEngine.get('custom-weather-widget')
  console.log('查询到的组件:', retrievedItem?.metadata.name)

  // 检查是否存在
  const exists = registryEngine.has('custom-weather-widget')
  console.log(`组件是否存在: ${exists}`)

  // 按类型查询
  const card21Components = registryEngine.getByType(RegistryItemType.CARD21_COMPONENT)
  console.log(`Card2.1组件数量: ${card21Components.length}`)

  // 按标签查询
  const weatherComponents = registryEngine.getByTag('weather')
  console.log(`天气相关组件数量: ${weatherComponents.length}`)

  // 复杂查询
  const queryResults = registryEngine.query({
    type: RegistryItemType.CARD21_COMPONENT,
    enabled: true,
    tags: ['sensor'],
    filter: (item) => item.metadata.priority > 5
  })
  console.log(`复杂查询结果: ${queryResults.length} 个组件`)

  // 获取统计信息
  const stats = registryEngine.getStats()
  console.log('注册表统计:', {
    总数: stats.total,
    启用: stats.enabled,
    禁用: stats.disabled,
    按类型: stats.byType
  })
}

/**
 * 示例2: 组件统一注册管理
 * 演示ComponentRegistryManager的使用
 */
export async function componentRegistryExample() {
  console.log('=== 组件统一注册管理示例 ===')

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
  console.log(`Card2.1组件注册: ${registerResult ? '✅ 成功' : '❌ 失败'}`)

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
  console.log(`批量注册结果: 成功 ${batchResult.successCount}, 失败 ${batchResult.failedCount}`)

  // 🎯 查询组件
  const temperatureComponent = ComponentRegistryManager.getComponent('temperature-sensor')
  console.log('温度传感器组件:', temperatureComponent?.name)

  // 按类型查询
  const sensorComponents = ComponentRegistryManager.getComponentsByType('humidity-sensor')
  console.log(`湿度传感器组件: ${sensorComponents.length} 个`)

  // 按来源系统查询
  const card21Components = ComponentRegistryManager.getComponentsBySourceSystem('card21')
  console.log(`Card2.1组件: ${card21Components.length} 个`)

  // 复杂查询
  const multiDataSourceComponents = ComponentRegistryManager.queryComponents({
    hasDataSources: true,
    filter: (comp) => {
      const dataSources = comp.dataSources
      return Array.isArray(dataSources) && dataSources.length > 1
    }
  })
  console.log(`多数据源组件: ${multiDataSourceComponents.length} 个`)

  // 获取组件统计
  const componentStats = ComponentRegistryManager.getComponentStats()
  console.log('组件统计:', {
    总数: componentStats.total,
    按类型: componentStats.byType,
    按来源系统: componentStats.bySourceSystem,
    有数据源: componentStats.withDataSources,
    有交互能力: componentStats.withInteractionCapabilities
  })
}

/**
 * 示例3: 适配器系统集成
 * 演示如何使用适配器集成现有系统
 */
export async function adapterIntegrationExample() {
  console.log('=== 适配器系统集成示例 ===')

  // 🎯 获取适配器状态
  const stats = adapterManager.getIntegrationStats()
  console.log('适配器状态:', {
    总数: stats.total,
    可用: stats.available,
    已集成: stats.integrated,
    适配器列表: stats.adapters.map(a => ({
      名称: a.name,
      版本: a.version,
      可用: a.available,
      已集成: a.integrated,
      支持类型: a.supportedTypes
    }))
  })

  // 🎯 集成所有可用适配器
  console.log('开始集成所有适配器...')
  const integrationResults = await adapterManager.integrateAll()
  console.log('集成结果:', {
    成功: integrationResults.success,
    失败: integrationResults.failed,
    详情: integrationResults.details
  })

  // 🎯 检查集成后的组件数量
  const allComponents = ComponentRegistryManager.getAllComponents()
  console.log(`集成后总组件数: ${allComponents.length}`)

  // 按来源系统分组统计
  const bySourceSystem = allComponents.reduce((acc, comp) => {
    acc[comp.sourceSystem] = (acc[comp.sourceSystem] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  console.log('按来源系统分组:', bySourceSystem)

  // 🎯 获取特定适配器
  const card21Adapter = adapterManager.getAdapter('Card21RegistryAdapter')
  if (card21Adapter) {
    console.log(`Card2.1适配器: ${card21Adapter.name} v${card21Adapter.version}`)
    console.log(`支持类型: ${card21Adapter.supportedTypes.join(', ')}`)
  }
}

/**
 * 示例4: 依赖关系管理
 * 演示组件依赖关系的处理
 */
export async function dependencyManagementExample() {
  console.log('=== 依赖关系管理示例 ===')

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
  console.log('✅ 基础服务已注册')

  // 注册依赖组件
  await registryEngine.register(dependentComponent)
  console.log('✅ 依赖组件已注册')

  // 🎯 查询依赖关系
  const chartDependencies = registryEngine.getDependencies('chart-widget')
  console.log('图表组件的直接依赖:', chartDependencies)

  const chartDependentsRecursive = registryEngine.getDependencies('chart-widget', true)
  console.log('图表组件的递归依赖:', chartDependentsRecursive)

  // 查询依赖者
  const serviceDependents = registryEngine.getDependents('data-service')
  console.log('数据服务的依赖者:', serviceDependents)

  // 🎯 验证依赖完整性
  const dependencyValidation = ComponentRegistryManager.validateDependencies()
  console.log('依赖验证结果:', {
    有效: dependencyValidation.valid,
    缺失依赖: dependencyValidation.missingDependencies
  })

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
  console.log(`无效组件注册结果: ${invalidResult ? '成功' : '失败'} (应该成功，但会有警告)`)

  // 再次验证依赖
  const finalValidation = ComponentRegistryManager.validateDependencies()
  console.log('最终依赖验证:', {
    有效: finalValidation.valid,
    缺失依赖数量: finalValidation.missingDependencies.length
  })
}

/**
 * 示例5: 批量操作和事务处理
 * 演示大量组件的批量处理
 */
export async function batchOperationsExample() {
  console.log('=== 批量操作和事务处理示例 ===')

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
  console.log(`生成 ${testComponents.length} 个测试组件`)

  // 🎯 批量注册并测量性能
  console.time('批量注册性能')
  const batchResults = await ComponentRegistryManager.registerComponents(testComponents, {
    validate: true,
    overwrite: true
  })
  console.timeEnd('批量注册性能')

  console.log('批量注册结果:', {
    成功: batchResults.successCount,
    失败: batchResults.failedCount,
    成功率: `${((batchResults.successCount / testComponents.length) * 100).toFixed(1)}%`
  })

  // 🎯 批量查询性能测试
  console.time('批量查询性能')
  const sensorComponents = ComponentRegistryManager.queryComponents({
    filter: (comp) => comp.staticParams?.category === 'sensors'
  })
  console.timeEnd('批量查询性能')
  console.log(`传感器组件数量: ${sensorComponents.length}`)

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
  console.log(`复杂查询结果: ${complexQueryResults.length} 个组件`)

  // 🎯 统计分析
  const finalStats = ComponentRegistryManager.getComponentStats()
  console.log('最终统计:', {
    总组件数: finalStats.total,
    Card21组件: finalStats.bySourceSystem.card21 || 0,
    传统组件: finalStats.bySourceSystem['legacy-card'] || 0,
    自定义组件: finalStats.bySourceSystem.custom || 0,
    有数据源: finalStats.withDataSources,
    有静态参数: finalStats.withStaticParams
  })

  // 🎯 内存使用分析
  const registryEngineStats = registryEngine.getStats()
  console.log('Registry Engine 统计:', {
    总注册项: registryEngineStats.total,
    启用项目: registryEngineStats.enabled,
    按类型分布: registryEngineStats.byType,
    最后更新: new Date(registryEngineStats.lastUpdated).toLocaleString()
  })
}

/**
 * 示例6: 性能优化和监控
 * 演示性能监控和优化技巧
 */
export async function performanceOptimizationExample() {
  console.log('=== 性能优化和监控示例 ===')

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
      console.log(`⚡ ${operationName}: ${duration.toFixed(2)}ms`)
      return duration
    },
    getAverageTime: () => totalTime / operationCount
  }

  // 🎯 测试各种操作的性能
  console.log('--- 单项操作性能测试 ---')

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

  console.log(`\n📊 性能总结:`)
  console.log(`总操作数: ${operationCount}`)
  console.log(`平均耗时: ${performanceMonitor.getAverageTime().toFixed(2)}ms`)
  console.log(`查询到的组件数: ${complexResults.length}`)
  console.log(`统计的总组件数: ${stats.total}`)

  // 🎯 内存使用建议
  console.log('\n💡 性能优化建议:')
  console.log('1. 大量组件时使用批量操作')
  console.log('2. 复杂查询优先使用索引字段（type, category, tags）')
  console.log('3. 避免频繁的统计信息生成')
  console.log('4. 定期清理不需要的组件注册')
  console.log('5. 使用filter函数时尽量简化逻辑')

  // 🎯 清理测试数据
  console.log('\n🧹 清理测试数据...')
  await ComponentRegistryManager.unregisterComponent('performance-test-component')
  console.log('✅ 测试数据清理完成')
}

/**
 * 示例7: 错误处理和调试
 * 演示错误处理的最佳实践
 */
export async function errorHandlingExample() {
  console.log('=== 错误处理和调试示例 ===')

  // 🎯 监听Registry Engine事件
  registryEngine.on('error', (errorInfo) => {
    console.error('📡 Registry Engine 错误事件:', {
      操作: errorInfo.action,
      错误: errorInfo.error.message,
      元数据: errorInfo.metadata
    })
  })

  registryEngine.on('register', (metadata) => {
    console.log(`📝 组件已注册: ${metadata.type}/${metadata.name}`)
  })

  registryEngine.on('unregister', (id) => {
    console.log(`🗑️ 组件已注销: ${id}`)
  })

  // 🎯 测试各种错误情况
  console.log('--- 错误情况测试 ---')

  // 1. 重复注册错误
  const duplicateComponent = {
    type: 'duplicate-test',
    dataSources: [{ key: 'test', type: 'mock' }]
  }

  await ComponentRegistryManager.registerComponent(duplicateComponent)
  console.log('首次注册成功')

  const duplicateResult = await ComponentRegistryManager.registerComponent(duplicateComponent)
  console.log(`重复注册结果: ${duplicateResult ? '成功' : '失败'} (预期失败)`)

  // 2. 无效组件定义错误
  try {
    await ComponentRegistryManager.registerComponent(null as any)
  } catch (error) {
    console.log('✅ 成功捕获无效组件定义错误')
  }

  // 3. 查询不存在的组件
  const nonExistentComponent = ComponentRegistryManager.getComponent('non-existent-component')
  console.log(`查询不存在组件结果: ${nonExistentComponent ? '找到' : '未找到'} (预期未找到)`)

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
  console.log(`无效组件注册结果: ${invalidResult ? '成功' : '失败'} (预期失败)`)

  // 🎯 调试信息输出
  console.log('\n--- 调试信息 ---')
  console.log('当前注册项数量:', registryEngine.getStats().total)
  console.log('错误处理组件:', ComponentRegistryManager.getAllComponents().filter(c =>
    c.type.includes('test') || c.type.includes('duplicate')
  ).length)

  // 清理测试数据
  await ComponentRegistryManager.unregisterComponent('duplicate-test')
  console.log('✅ 错误测试数据清理完成')
}

// ==================== 运行所有示例 ====================

/**
 * 运行所有Registry Engine示例
 * 按顺序执行所有示例，展示完整功能
 */
export async function runAllRegistryExamples() {
  console.log('🚀 开始运行 Registry Engine 示例集合 🚀')
  console.log('================================================\n')

  try {
    // 基础功能示例
    await basicRegistryExample()
    console.log('\n' + '='.repeat(50) + '\n')

    // 组件管理示例
    await componentRegistryExample()
    console.log('\n' + '='.repeat(50) + '\n')

    // 适配器集成示例
    await adapterIntegrationExample()
    console.log('\n' + '='.repeat(50) + '\n')

    // 依赖管理示例
    await dependencyManagementExample()
    console.log('\n' + '='.repeat(50) + '\n')

    // 批量操作示例
    await batchOperationsExample()
    console.log('\n' + '='.repeat(50) + '\n')

    // 性能优化示例
    await performanceOptimizationExample()
    console.log('\n' + '='.repeat(50) + '\n')

    // 错误处理示例
    await errorHandlingExample()

    console.log('\n================================================')
    console.log('✅ Registry Engine 示例集合运行完成 ✅')

    // 输出最终统计
    const finalStats = registryEngine.getStats()
    console.log('\n📊 最终统计信息:')
    console.log('总注册项:', finalStats.total)
    console.log('按类型分布:', finalStats.byType)
    console.log('启用项目:', finalStats.enabled)
    console.log('最后更新:', new Date(finalStats.lastUpdated).toLocaleString())

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