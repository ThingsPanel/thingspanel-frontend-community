/**
 * 数据仓库演示测试
 * 使用SUBTASK-002的示例配置数据，验证数据仓库的实际效果
 */

import { simpleDataBridge, type ComponentDataRequirement } from './SimpleDataBridge'
import { dataWarehouse } from './DataWarehouse'
import { jsonDataItemExample } from './example-enhanced-config'

/**
 * 执行数据仓库演示测试
 */
export async function runWarehouseDemoTest(): Promise<void> {
  console.log('🎯 开始数据仓库演示测试')
  console.log('使用 SUBTASK-002 产出的示例配置数据\n')

  // 清理初始状态
  simpleDataBridge.clearAllCache()
  dataWarehouse.resetPerformanceMetrics()

  console.log('📋 示例配置信息:')
  console.log('- 配置ID:', jsonDataItemExample.id)
  console.log('- 配置类型:', jsonDataItemExample.type)
  console.log('- 显示名称:', jsonDataItemExample.metadata?.displayName)
  console.log('- 描述:', jsonDataItemExample.metadata?.description)
  console.log('- JSON数据长度:', jsonDataItemExample.config.jsonData.length, '字符')

  // 解析JSON数据查看内容
  const parsedData = JSON.parse(jsonDataItemExample.config.jsonData)
  console.log('- 数据内容预览:', {
    temperature: parsedData.temperature,
    humidity: parsedData.humidity,
    location: parsedData.location,
    sensorsCount: parsedData.sensors?.length
  })

  console.log('\n' + '='.repeat(60))

  // 构建数据需求 - 转换为SimpleDataBridge格式
  const componentDataRequirement: ComponentDataRequirement = {
    componentId: 'demo_weather_panel_001',
    dataSources: [
      {
        id: jsonDataItemExample.id,
        type: 'json',
        config: {
          jsonContent: jsonDataItemExample.config.jsonData,
          validation: jsonDataItemExample.config.validation,
          preprocessing: jsonDataItemExample.config.preprocessing
        }
      }
    ]
  }

  console.log('🚀 第1次执行 - 数据获取和缓存')
  const startTime1 = performance.now()

  const result1 = await simpleDataBridge.executeComponent(componentDataRequirement)

  const endTime1 = performance.now()
  const execution1Time = endTime1 - startTime1

  console.log('执行结果:', result1.success ? '✅ 成功' : '❌ 失败')
  if (result1.success) {
    console.log('执行时间:', execution1Time.toFixed(2), 'ms')
    console.log('返回数据键:', Object.keys(result1.data || {}))

    // 显示实际数据内容
    const actualData = result1.data?.[jsonDataItemExample.id]
    if (actualData && typeof actualData === 'object') {
      console.log('实际数据:', {
        temperature: actualData.temperature,
        humidity: actualData.humidity,
        pressure: actualData.pressure,
        building: actualData.location?.building,
        sensorsCount: actualData.sensors?.length
      })
    }
  } else {
    console.log('错误信息:', result1.error)
  }

  console.log('\n' + '='.repeat(60))

  console.log('🎯 第2次执行 - 缓存命中测试')
  const startTime2 = performance.now()

  const result2 = await simpleDataBridge.executeComponent(componentDataRequirement)

  const endTime2 = performance.now()
  const execution2Time = endTime2 - startTime2

  console.log('执行结果:', result2.success ? '✅ 成功' : '❌ 失败')
  console.log('执行时间:', execution2Time.toFixed(2), 'ms')
  console.log(
    '性能提升:',
    execution1Time > execution2Time
      ? `✅ 加速 ${(((execution1Time - execution2Time) / execution1Time) * 100).toFixed(1)}%`
      : '⚠️ 未见明显提升'
  )

  console.log('\n' + '='.repeat(60))

  console.log('📊 缓存状态检查')

  // 直接从缓存获取数据
  const cachedData = simpleDataBridge.getComponentData('demo_weather_panel_001')
  console.log('缓存数据存在:', cachedData !== null ? '✅ 是' : '❌ 否')

  if (cachedData) {
    console.log('缓存数据键:', Object.keys(cachedData))
    const cachedItem = cachedData[jsonDataItemExample.id]
    if (cachedItem) {
      console.log('缓存数据内容:', {
        temperature: cachedItem.temperature,
        humidity: cachedItem.humidity,
        timestamp: cachedItem.timestamp || '无时间戳'
      })
    }
  }

  console.log('\n' + '='.repeat(60))

  console.log('📈 性能监控指标')

  const metrics = simpleDataBridge.getWarehouseMetrics()
  const stats = simpleDataBridge.getStorageStats()

  console.log('性能指标:')
  console.log('- 总请求数:', metrics.totalRequests)
  console.log('- 缓存命中数:', metrics.cacheHits)
  console.log('- 缓存未命中数:', metrics.cacheMisses)
  console.log('- 缓存命中率:', (metrics.cacheHitRate * 100).toFixed(1) + '%')
  console.log('- 平均响应时间:', metrics.averageResponseTime.toFixed(3) + 'ms')

  console.log('\n存储统计:')
  console.log('- 总组件数:', stats.totalComponents)
  console.log('- 总数据源数:', stats.totalDataSources)
  console.log('- 内存使用:', stats.memoryUsageMB.toFixed(2) + 'MB')

  console.log('\n' + '='.repeat(60))

  console.log('🧪 多数据源隔离测试')

  // 添加第二个数据源到同一组件
  const multiSourceRequirement: ComponentDataRequirement = {
    componentId: 'demo_weather_panel_001', // 同一组件
    dataSources: [
      {
        id: 'sensor_data_backup', // 新数据源
        type: 'json',
        config: {
          jsonContent: JSON.stringify({
            backupTemperature: 26.1,
            backupHumidity: 70.5,
            source: 'backup_sensor',
            status: 'active'
          })
        }
      }
    ]
  }

  const multiResult = await simpleDataBridge.executeComponent(multiSourceRequirement)
  console.log('多数据源执行:', multiResult.success ? '✅ 成功' : '❌ 失败')

  // 检查数据隔离
  const combinedData = simpleDataBridge.getComponentData('demo_weather_panel_001')
  if (combinedData) {
    console.log('组件数据源:', Object.keys(combinedData))
    console.log('数据隔离验证:', Object.keys(combinedData).length >= 2 ? '✅ 正确隔离' : '❌ 隔离失败')

    // 显示两个数据源的内容
    console.log('原始数据源温度:', combinedData[jsonDataItemExample.id]?.temperature)
    console.log('备份数据源温度:', combinedData['sensor_data_backup']?.backupTemperature)
  }

  console.log('\n' + '='.repeat(60))

  console.log('🗑️ 缓存清理测试')

  console.log('清理前组件数据存在:', simpleDataBridge.getComponentData('demo_weather_panel_001') !== null)

  // 清理单个组件缓存
  simpleDataBridge.clearComponentCache('demo_weather_panel_001')

  console.log('清理后组件数据存在:', simpleDataBridge.getComponentData('demo_weather_panel_001') !== null)

  const finalStats = simpleDataBridge.getStorageStats()
  console.log('清理后总组件数:', finalStats.totalComponents)

  console.log('\n' + '='.repeat(60))

  console.log('🎉 演示测试总结')

  const summary = {
    配置使用: '✅ 成功使用SUBTASK-002示例配置',
    数据执行: result1.success && result2.success ? '✅ 两次执行均成功' : '⚠️ 执行有问题',
    缓存机制: metrics.cacheHitRate > 0 ? '✅ 缓存命中机制工作' : '⚠️ 缓存机制需检查',
    性能提升: execution1Time > execution2Time ? '✅ 第二次执行更快' : '⚠️ 性能提升不明显',
    数据隔离: combinedData && Object.keys(combinedData).length >= 2 ? '✅ 多数据源隔离正确' : '⚠️ 数据隔离需检查',
    缓存清理: finalStats.totalComponents === 0 ? '✅ 缓存清理成功' : '⚠️ 缓存清理有问题',
    性能监控: metrics.totalRequests > 0 ? '✅ 性能监控正常' : '⚠️ 性能监控异常'
  }

  console.log('测试结果汇总:')
  Object.entries(summary).forEach(([key, value]) => {
    console.log(`- ${key}: ${value}`)
  })

  const successCount = Object.values(summary).filter(v => v.includes('✅')).length
  const totalCount = Object.keys(summary).length
  const successRate = ((successCount / totalCount) * 100).toFixed(1)

  console.log(`\n整体成功率: ${successCount}/${totalCount} (${successRate}%)`)

  if (successRate === '100.0') {
    console.log('🎊 数据仓库功能完美运行！')
  } else if (parseFloat(successRate) >= 80) {
    console.log('🎯 数据仓库功能基本正常，有少量优化空间')
  } else {
    console.log('⚠️ 数据仓库功能需要进一步调试')
  }

  // 将结果保存到window供开发者查看
  ;(window as any).warehouseDemoResult = {
    configUsed: jsonDataItemExample,
    executionResults: [result1, result2, multiResult],
    performanceMetrics: metrics,
    storageStats: finalStats,
    summary: summary,
    successRate: parseFloat(successRate)
  }

  console.log('\n💾 演示结果已保存到 window.warehouseDemoResult')
  console.log('🔍 可在控制台查看详细数据')
}

// 开发环境自动加载
if (import.meta.env.DEV) {
  console.log('🎬 [数据仓库] 演示测试脚本已加载')
  console.log('💡 运行方法: await runWarehouseDemoTest()')
  console.log(
    '💡 或在控制台输入: (await import("/src/core/data-architecture/warehouse-demo-test.ts")).runWarehouseDemoTest()'
  )
}
