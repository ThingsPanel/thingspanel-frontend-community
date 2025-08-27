/**
 * 数据仓库性能基准测试
 * 验证缓存性能、内存管理和响应时间优化
 */

import { EnhancedDataWarehouse } from './DataWarehouse'
import { simpleDataBridge, type ComponentDataRequirement } from './SimpleDataBridge'

/**
 * 性能基准测试配置
 */
interface BenchmarkConfig {
  /** 测试组件数量 */
  componentCount: number
  /** 每个组件的数据源数量 */
  dataSourcesPerComponent: number
  /** 每个数据项大小（字节） */
  dataItemSize: number
  /** 读取操作次数 */
  readOperations: number
  /** 写入操作次数 */
  writeOperations: number
}

/**
 * 性能基准测试结果
 */
interface BenchmarkResult {
  config: BenchmarkConfig
  metrics: {
    /** 总执行时间（毫秒） */
    totalDuration: number
    /** 平均读取时间（毫秒） */
    averageReadTime: number
    /** 平均写入时间（毫秒） */
    averageWriteTime: number
    /** 缓存命中率 */
    cacheHitRate: number
    /** 内存使用峰值（MB） */
    peakMemoryUsage: number
    /** 每秒操作数（ops/sec） */
    operationsPerSecond: number
  }
  warehouseStats: {
    totalComponents: number
    totalDataSources: number
    memoryUsageMB: number
  }
}

/**
 * 生成测试数据
 */
function generateTestData(size: number): Record<string, any> {
  const data = {
    id: Math.random().toString(36).substring(2, 15),
    timestamp: Date.now(),
    values: [] as number[],
    metadata: {
      source: 'benchmark-test',
      version: '1.0.0'
    }
  }

  // 填充数据到指定大小
  const targetSize = size - JSON.stringify(data).length
  const arraySize = Math.max(1, Math.floor(targetSize / 8)) // 每个数字约8字节
  data.values = Array.from({ length: arraySize }, () => Math.random())

  return data
}

/**
 * 执行数据仓库性能基准测试
 */
export async function runWarehouseBenchmark(config: BenchmarkConfig): Promise<BenchmarkResult> {
  console.log('🚀 开始数据仓库性能基准测试', config)

  const warehouse = new EnhancedDataWarehouse()
  const startTime = Date.now()

  let totalReadTime = 0
  let totalWriteTime = 0
  let readOperationCount = 0
  let writeOperationCount = 0

  // 写入测试
  console.log('📝 执行写入测试...')
  for (let writeOp = 0; writeOp < config.writeOperations; writeOp++) {
    for (let comp = 0; comp < config.componentCount; comp++) {
      const componentId = `comp_${comp}_${writeOp}`

      for (let ds = 0; ds < config.dataSourcesPerComponent; ds++) {
        const writeStart = performance.now()
        const testData = generateTestData(config.dataItemSize)

        warehouse.storeComponentData(componentId, `datasource_${ds}`, testData, 'json')

        const writeEnd = performance.now()
        totalWriteTime += writeEnd - writeStart
        writeOperationCount++
      }
    }
  }

  // 读取测试
  console.log('📖 执行读取测试...')
  for (let readOp = 0; readOp < config.readOperations; readOp++) {
    for (let comp = 0; comp < config.componentCount; comp++) {
      const componentId = `comp_${comp}_0` // 读取第一次写入的数据

      const readStart = performance.now()
      const data = warehouse.getComponentData(componentId)
      const readEnd = performance.now()

      totalReadTime += readEnd - readStart
      readOperationCount++

      if (!data && comp < config.componentCount && readOp === 0) {
        console.warn(`⚠️ 数据读取失败: ${componentId}`)
      }
    }
  }

  const endTime = Date.now()
  const totalDuration = endTime - startTime

  // 获取性能指标
  const performanceMetrics = warehouse.getPerformanceMetrics()
  const storageStats = warehouse.getStorageStats()

  const result: BenchmarkResult = {
    config,
    metrics: {
      totalDuration,
      averageReadTime: readOperationCount > 0 ? totalReadTime / readOperationCount : 0,
      averageWriteTime: writeOperationCount > 0 ? totalWriteTime / writeOperationCount : 0,
      cacheHitRate: performanceMetrics.cacheHitRate,
      peakMemoryUsage: storageStats.memoryUsageMB,
      operationsPerSecond: (readOperationCount + writeOperationCount) / (totalDuration / 1000)
    },
    warehouseStats: {
      totalComponents: storageStats.totalComponents,
      totalDataSources: storageStats.totalDataSources,
      memoryUsageMB: storageStats.memoryUsageMB
    }
  }

  console.log('✅ 基准测试完成', result)
  return result
}

/**
 * 执行SimpleDataBridge集成性能测试
 */
export async function runIntegrationBenchmark(config: BenchmarkConfig): Promise<BenchmarkResult> {
  console.log('🔗 开始SimpleDataBridge集成性能测试', config)

  const startTime = Date.now()
  let totalReadTime = 0
  let totalWriteTime = 0
  let readOperationCount = 0
  let writeOperationCount = 0

  // Mock UnifiedDataExecutor 避免网络请求影响性能测试
  const { unifiedDataExecutor } = await import('./UnifiedDataExecutor')
  const originalExecute = unifiedDataExecutor.execute
  const mockExecutor = async (config: any) => {
    const testData = generateTestData(config.dataItemSize || 1000)
    return { success: true, data: testData }
  }

  // 替换执行器
  unifiedDataExecutor.execute = mockExecutor

  try {
    // 写入测试（通过SimpleDataBridge执行）
    console.log('📝 执行集成写入测试...')
    for (let writeOp = 0; writeOp < config.writeOperations; writeOp++) {
      for (let comp = 0; comp < config.componentCount; comp++) {
        const componentId = `integration_comp_${comp}_${writeOp}`

        const requirement: ComponentDataRequirement = {
          componentId,
          dataSources: Array.from({ length: config.dataSourcesPerComponent }, (_, ds) => ({
            id: `datasource_${ds}`,
            type: 'json' as const,
            config: {
              jsonContent: JSON.stringify(generateTestData(config.dataItemSize)),
              dataItemSize: config.dataItemSize
            }
          }))
        }

        const writeStart = performance.now()
        await simpleDataBridge.executeComponent(requirement)
        const writeEnd = performance.now()

        totalWriteTime += writeEnd - writeStart
        writeOperationCount++
      }
    }

    // 读取测试（从缓存读取）
    console.log('📖 执行集成读取测试...')
    for (let readOp = 0; readOp < config.readOperations; readOp++) {
      for (let comp = 0; comp < config.componentCount; comp++) {
        const componentId = `integration_comp_${comp}_0`

        const readStart = performance.now()
        const data = simpleDataBridge.getComponentData(componentId)
        const readEnd = performance.now()

        totalReadTime += readEnd - readStart
        readOperationCount++
      }
    }

    const endTime = Date.now()
    const totalDuration = endTime - startTime

    // 获取性能指标
    const warehouseMetrics = simpleDataBridge.getWarehouseMetrics()
    const storageStats = simpleDataBridge.getStorageStats()

    return {
      config,
      metrics: {
        totalDuration,
        averageReadTime: readOperationCount > 0 ? totalReadTime / readOperationCount : 0,
        averageWriteTime: writeOperationCount > 0 ? totalWriteTime / writeOperationCount : 0,
        cacheHitRate: warehouseMetrics.cacheHitRate,
        peakMemoryUsage: storageStats.memoryUsageMB,
        operationsPerSecond: (readOperationCount + writeOperationCount) / (totalDuration / 1000)
      },
      warehouseStats: {
        totalComponents: storageStats.totalComponents,
        totalDataSources: storageStats.totalDataSources,
        memoryUsageMB: storageStats.memoryUsageMB
      }
    }
  } finally {
    // 恢复原始执行器
    unifiedDataExecutor.execute = originalExecute
  }
}

/**
 * 运行完整的性能基准测试套件
 */
export async function runComprehensiveBenchmark(): Promise<{
  warehouse: BenchmarkResult[]
  integration: BenchmarkResult[]
  summary: {
    averageReadTime: number
    averageWriteTime: number
    averageCacheHitRate: number
    totalMemoryUsage: number
  }
}> {
  console.log('🎯 开始综合性能基准测试套件')

  // 测试配置矩阵
  const testConfigs: BenchmarkConfig[] = [
    // 小规模测试
    {
      componentCount: 10,
      dataSourcesPerComponent: 2,
      dataItemSize: 1000, // 1KB
      readOperations: 50,
      writeOperations: 10
    },
    // 中规模测试
    {
      componentCount: 50,
      dataSourcesPerComponent: 3,
      dataItemSize: 5000, // 5KB
      readOperations: 100,
      writeOperations: 20
    },
    // 大规模测试
    {
      componentCount: 100,
      dataSourcesPerComponent: 5,
      dataItemSize: 10000, // 10KB
      readOperations: 200,
      writeOperations: 50
    }
  ]

  const warehouseResults: BenchmarkResult[] = []
  const integrationResults: BenchmarkResult[] = []

  for (const config of testConfigs) {
    console.log(`\n📊 测试配置: ${config.componentCount} 组件 x ${config.dataSourcesPerComponent} 数据源`)

    // 数据仓库直接测试
    const warehouseResult = await runWarehouseBenchmark(config)
    warehouseResults.push(warehouseResult)

    // 清理缓存
    simpleDataBridge.clearAllCache()

    // 集成测试
    const integrationResult = await runIntegrationBenchmark(config)
    integrationResults.push(integrationResult)

    // 清理缓存
    simpleDataBridge.clearAllCache()
  }

  // 计算汇总指标
  const allResults = [...warehouseResults, ...integrationResults]
  const summary = {
    averageReadTime: allResults.reduce((sum, r) => sum + r.metrics.averageReadTime, 0) / allResults.length,
    averageWriteTime: allResults.reduce((sum, r) => sum + r.metrics.averageWriteTime, 0) / allResults.length,
    averageCacheHitRate: allResults.reduce((sum, r) => sum + r.metrics.cacheHitRate, 0) / allResults.length,
    totalMemoryUsage: Math.max(...allResults.map(r => r.metrics.peakMemoryUsage))
  }

  console.log('\n🏁 综合基准测试完成')
  console.log('📈 性能汇总:', summary)

  return {
    warehouse: warehouseResults,
    integration: integrationResults,
    summary
  }
}

/**
 * 格式化基准测试结果为可读报告
 */
export function formatBenchmarkReport(result: BenchmarkResult): string {
  return `
📊 性能基准测试报告
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 测试配置:
  • 组件数量: ${result.config.componentCount}
  • 每组件数据源: ${result.config.dataSourcesPerComponent}
  • 数据项大小: ${(result.config.dataItemSize / 1024).toFixed(1)}KB
  • 读取操作: ${result.config.readOperations}
  • 写入操作: ${result.config.writeOperations}

⏱️ 性能指标:
  • 总执行时间: ${result.metrics.totalDuration}ms
  • 平均读取时间: ${result.metrics.averageReadTime.toFixed(3)}ms
  • 平均写入时间: ${result.metrics.averageWriteTime.toFixed(3)}ms
  • 缓存命中率: ${(result.metrics.cacheHitRate * 100).toFixed(1)}%
  • 每秒操作数: ${result.metrics.operationsPerSecond.toFixed(0)} ops/sec

💾 存储统计:
  • 总组件数: ${result.warehouseStats.totalComponents}
  • 总数据源数: ${result.warehouseStats.totalDataSources}
  • 内存使用: ${result.warehouseStats.memoryUsageMB.toFixed(2)}MB
  • 内存使用峰值: ${result.metrics.peakMemoryUsage.toFixed(2)}MB

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
}

// 开发环境自动运行基准测试
if (import.meta.env.DEV) {
  console.log('🚀 [数据仓库] 性能基准测试工具已加载')
  console.log('💡 运行方法:')
  console.log('  • await runWarehouseBenchmark(config)')
  console.log('  • await runIntegrationBenchmark(config)')
  console.log('  • await runComprehensiveBenchmark()')
}
