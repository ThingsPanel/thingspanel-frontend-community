/**
 * 数据仓库完整验证脚本
 * 验证SUBTASK-003的所有验收标准
 */

import { dataWarehouse, EnhancedDataWarehouse } from './DataWarehouse'
import { simpleDataBridge } from './SimpleDataBridge'
import type { ComponentDataRequirement } from './SimpleDataBridge'

/**
 * 验证结果接口
 */
interface ValidationResult {
  testName: string
  success: boolean
  message: string
  details?: any
}

/**
 * 验证报告接口
 */
interface ValidationReport {
  totalTests: number
  passedTests: number
  failedTests: number
  successRate: number
  results: ValidationResult[]
  summary: {
    cacheIntegration: boolean
    dataIsolation: boolean
    performanceOptimization: boolean
    dynamicParameterInterfaces: boolean
  }
}

/**
 * 执行单个验证测试
 */
async function runValidationTest(
  testName: string,
  testFunction: () => Promise<boolean | { success: boolean; details?: any }>
): Promise<ValidationResult> {
  console.log(`🧪 执行验证: ${testName}`)

  try {
    const result = await testFunction()

    if (typeof result === 'boolean') {
      return {
        testName,
        success: result,
        message: result ? '✅ 测试通过' : '❌ 测试失败'
      }
    } else {
      return {
        testName,
        success: result.success,
        message: result.success ? '✅ 测试通过' : '❌ 测试失败',
        details: result.details
      }
    }
  } catch (error) {
    return {
      testName,
      success: false,
      message: `❌ 测试异常: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 验证VisualEditorBridge缓存机制扩展
 */
async function validateCacheIntegration(): Promise<{ success: boolean; details: any }> {
  // 清理初始状态
  simpleDataBridge.clearAllCache()

  const testData = { temperature: 25.5, humidity: 60, timestamp: Date.now() }

  // 1. 测试数据存储
  dataWarehouse.storeComponentData('cache_test_comp', 'sensor1', testData, 'json')

  // 2. 通过SimpleDataBridge获取数据
  const retrievedData = simpleDataBridge.getComponentData('cache_test_comp')

  // 3. 验证数据一致性
  const dataMatch = JSON.stringify(retrievedData) === JSON.stringify({ sensor1: testData })

  // 4. 测试缓存清理
  simpleDataBridge.clearComponentCache('cache_test_comp')
  const clearedData = simpleDataBridge.getComponentData('cache_test_comp')
  const cacheCleared = clearedData === null

  // 5. 测试全局缓存清理
  dataWarehouse.storeComponentData('cache_test_comp2', 'sensor2', testData, 'json')
  simpleDataBridge.clearAllCache()
  const allCleared = simpleDataBridge.getComponentData('cache_test_comp2') === null

  return {
    success: dataMatch && cacheCleared && allCleared,
    details: {
      dataMatch,
      cacheCleared,
      allCleared,
      retrievedData,
      clearedData
    }
  }
}

/**
 * 验证多数据源数据隔离存储
 */
async function validateDataIsolation(): Promise<{ success: boolean; details: any }> {
  const warehouse = new EnhancedDataWarehouse()

  // 测试数据
  const sensorData = { temperature: 22.5, location: 'room1' }
  const apiData = { status: 'online', lastUpdate: Date.now() }
  const wsData = { realTimeValue: 100, connectionId: 'ws_123' }

  // 存储到同一组件的不同数据源
  warehouse.storeComponentData('isolation_test_comp', 'sensor_source', sensorData, 'json')
  warehouse.storeComponentData('isolation_test_comp', 'api_source', apiData, 'http')
  warehouse.storeComponentData('isolation_test_comp', 'websocket_source', wsData, 'websocket')

  // 获取组件数据，验证隔离性
  const componentData = warehouse.getComponentData('isolation_test_comp')

  // 验证数据结构
  const expectedStructure = {
    sensor_source: sensorData,
    api_source: apiData,
    websocket_source: wsData
  }

  const structureMatch = JSON.stringify(componentData) === JSON.stringify(expectedStructure)

  // 测试单独清理某个数据源（通过清理整个组件来模拟）
  warehouse.clearComponentCache('isolation_test_comp')
  const isolationMaintained = warehouse.getComponentData('isolation_test_comp') === null

  // 测试不同组件间的隔离
  warehouse.storeComponentData('comp_a', 'shared_source', { compA: true }, 'json')
  warehouse.storeComponentData('comp_b', 'shared_source', { compB: true }, 'json')

  const compAData = warehouse.getComponentData('comp_a')
  const compBData = warehouse.getComponentData('comp_b')

  const crossIsolation =
    compAData &&
    compAData.shared_source.compA === true &&
    compBData &&
    compBData.shared_source.compB === true &&
    compAData.shared_source.compB === undefined &&
    compBData.shared_source.compA === undefined

  return {
    success: structureMatch && isolationMaintained && crossIsolation,
    details: {
      structureMatch,
      isolationMaintained,
      crossIsolation,
      componentData,
      compAData,
      compBData,
      expectedStructure
    }
  }
}

/**
 * 验证性能优化和内存管理机制
 */
async function validatePerformanceOptimization(): Promise<{ success: boolean; details: any }> {
  const warehouse = new EnhancedDataWarehouse()

  // 性能指标重置
  warehouse.resetPerformanceMetrics()

  // 生成测试负载
  const testData = { value: 'performance_test_data_'.repeat(100) } // ~2KB数据

  const startTime = performance.now()

  // 执行大量写入操作
  for (let i = 0; i < 100; i++) {
    warehouse.storeComponentData(`perf_comp_${i}`, 'data_source', testData, 'json')
  }

  const writeEndTime = performance.now()
  const writeTime = writeEndTime - startTime

  // 执行大量读取操作
  const readStartTime = performance.now()
  let readHits = 0
  let readMisses = 0

  for (let i = 0; i < 200; i++) {
    const data = warehouse.getComponentData(`perf_comp_${i % 100}`)
    if (data) readHits++
    else readMisses++

    // 添加一些未命中的读取
    const missData = warehouse.getComponentData(`nonexistent_${i}`)
    if (!missData) readMisses++
  }

  const readEndTime = performance.now()
  const readTime = readEndTime - readStartTime

  // 获取性能指标
  const metrics = warehouse.getPerformanceMetrics()
  const stats = warehouse.getStorageStats()

  // 验证性能要求
  const writePerformanceOk = writeTime < 1000 // 100次写入应在1秒内完成
  const readPerformanceOk = readTime < 500 // 300次读取应在0.5秒内完成
  const memoryTracked = stats.memoryUsageMB > 0
  const metricsTracked = metrics.totalRequests > 0
  const cacheHitRateCalculated = metrics.cacheHitRate >= 0 && metrics.cacheHitRate <= 1

  // 测试缓存过期
  warehouse.setCacheExpiry(50) // 50ms过期
  warehouse.storeComponentData('expiry_test', 'data', { test: true }, 'json')

  const beforeExpiry = warehouse.getComponentData('expiry_test')
  await new Promise(resolve => setTimeout(resolve, 100)) // 等待过期
  const afterExpiry = warehouse.getComponentData('expiry_test')

  const expiryWorking = beforeExpiry !== null && afterExpiry === null

  return {
    success:
      writePerformanceOk &&
      readPerformanceOk &&
      memoryTracked &&
      metricsTracked &&
      cacheHitRateCalculated &&
      expiryWorking,
    details: {
      writeTime: writeTime.toFixed(2),
      readTime: readTime.toFixed(2),
      writePerformanceOk,
      readPerformanceOk,
      memoryTracked,
      memoryUsageMB: stats.memoryUsageMB.toFixed(2),
      metricsTracked,
      cacheHitRateCalculated,
      cacheHitRate: metrics.cacheHitRate.toFixed(3),
      totalRequests: metrics.totalRequests,
      expiryWorking,
      beforeExpiry,
      afterExpiry
    }
  }
}

/**
 * 验证动态参数存储管理预留接口
 */
async function validateDynamicParameterInterfaces(): Promise<{ success: boolean; details: any }> {
  const warehouse = new EnhancedDataWarehouse()

  // 测试预留接口的存在性
  const interfaceExists = {
    storeDynamicParameter: typeof warehouse.storeDynamicParameter === 'function',
    getDynamicParameter: typeof warehouse.getDynamicParameter === 'function',
    getAllDynamicParameters: typeof warehouse.getAllDynamicParameters === 'function',
    clearDynamicParameters: typeof warehouse.clearDynamicParameters === 'function'
  }

  const allInterfacesExist = Object.values(interfaceExists).every(exists => exists)

  // 测试接口基本功能（Phase 1阶段的默认行为）
  let functionalityTest = true
  let errorDetails = ''

  try {
    // 存储动态参数
    warehouse.storeDynamicParameter('test_comp', 'param1', 'value1')

    // 获取动态参数
    const param1 = warehouse.getDynamicParameter('test_comp', 'param1')

    // 获取所有动态参数
    const allParams = warehouse.getAllDynamicParameters('test_comp')

    // 清理动态参数
    warehouse.clearDynamicParameters('test_comp')

    // Phase 1阶段：接口应该存在并能被调用，但返回值可以是占位符
    const interfaceCallable = param1 !== undefined && allParams !== undefined

    functionalityTest = interfaceCallable
  } catch (error) {
    functionalityTest = false
    errorDetails = error instanceof Error ? error.message : String(error)
  }

  // 验证预留的数据结构
  const hasReservedStructures = warehouse.hasReservedDynamicParameterStructures()

  return {
    success: allInterfacesExist && functionalityTest && hasReservedStructures,
    details: {
      interfaceExists,
      allInterfacesExist,
      functionalityTest,
      hasReservedStructures,
      errorDetails
    }
  }
}

/**
 * 执行完整的数据仓库验证
 */
export async function runCompleteValidation(): Promise<ValidationReport> {
  console.log('🎯 开始数据仓库完整验证')
  console.log('验证SUBTASK-003的所有验收标准...\n')

  const results: ValidationResult[] = []

  // 执行所有验证测试
  const tests = [
    {
      name: '扩展现有VisualEditorBridge缓存机制',
      testFunction: validateCacheIntegration
    },
    {
      name: '实现多数据源数据隔离存储',
      testFunction: validateDataIsolation
    },
    {
      name: '实现性能优化和内存管理机制',
      testFunction: validatePerformanceOptimization
    },
    {
      name: '添加动态参数存储管理预留接口',
      testFunction: validateDynamicParameterInterfaces
    }
  ]

  for (const test of tests) {
    const result = await runValidationTest(test.name, test.testFunction)
    results.push(result)

    if (result.success) {
      console.log(`✅ ${test.name}`)
    } else {
      console.log(`❌ ${test.name}: ${result.message}`)
      if (result.details) {
        console.log('   详细信息:', result.details)
      }
    }
  }

  // 生成报告
  const passedTests = results.filter(r => r.success).length
  const failedTests = results.filter(r => !r.success).length

  const report: ValidationReport = {
    totalTests: results.length,
    passedTests,
    failedTests,
    successRate: passedTests / results.length,
    results,
    summary: {
      cacheIntegration: results.find(r => r.testName.includes('缓存机制'))?.success || false,
      dataIsolation: results.find(r => r.testName.includes('数据隔离'))?.success || false,
      performanceOptimization: results.find(r => r.testName.includes('性能优化'))?.success || false,
      dynamicParameterInterfaces: results.find(r => r.testName.includes('动态参数'))?.success || false
    }
  }

  console.log('\n📊 验证报告:')
  console.log(`总测试数: ${report.totalTests}`)
  console.log(`通过测试: ${report.passedTests}`)
  console.log(`失败测试: ${report.failedTests}`)
  console.log(`成功率: ${(report.successRate * 100).toFixed(1)}%`)

  console.log('\n🎯 验收标准达成情况:')
  Object.entries(report.summary).forEach(([key, passed]) => {
    const emoji = passed ? '✅' : '❌'
    const label = {
      cacheIntegration: '扩展现有VisualEditorBridge缓存机制',
      dataIsolation: '实现多数据源数据隔离存储',
      performanceOptimization: '实现性能优化和内存管理机制',
      dynamicParameterInterfaces: '添加动态参数存储管理预留接口'
    }[key]
    console.log(`${emoji} ${label}`)
  })

  const overallSuccess = report.successRate >= 1.0
  console.log(`\n🏁 SUBTASK-003 总体状态: ${overallSuccess ? '✅ 完成' : '❌ 需要修复'}`)

  return report
}

/**
 * 快速验证脚本（用于开发调试）
 */
export async function quickValidation(): Promise<boolean> {
  console.log('⚡ 快速验证数据仓库功能...')

  try {
    // 基本功能测试
    const testData = { quickTest: true, timestamp: Date.now() }

    // 存储测试
    dataWarehouse.storeComponentData('quick_test', 'source1', testData, 'json')
    const retrieved = dataWarehouse.getComponentData('quick_test')

    // 集成测试
    const bridgeData = simpleDataBridge.getComponentData('quick_test')

    // 性能测试
    const stats = simpleDataBridge.getStorageStats()
    const metrics = simpleDataBridge.getWarehouseMetrics()

    const basicWorks = retrieved !== null && bridgeData !== null
    const statsWork = stats.totalComponents > 0 && typeof metrics.cacheHitRate === 'number'

    console.log(basicWorks && statsWork ? '✅ 快速验证通过' : '❌ 快速验证失败')

    return basicWorks && statsWork
  } catch (error) {
    console.error('❌ 快速验证异常:', error)
    return false
  }
}

// 开发环境自动提供验证工具
if (import.meta.env.DEV) {
  console.log('🔧 [数据仓库] 验证工具已加载')
  console.log('💡 验证方法:')
  console.log('  • await runCompleteValidation() - 完整验证')
  console.log('  • await quickValidation() - 快速验证')
}
