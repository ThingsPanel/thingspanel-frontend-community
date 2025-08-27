/**
 * 执行纯JSON配置示例
 * 展示数据架构执行器链的完整流程和每阶段结果
 */

import { MultiLayerExecutorChain } from './executors/MultiLayerExecutorChain'
import { pureJsonConfigExample } from './example-json-only-config'
import type { EnhancedDataSourceConfiguration } from './types/enhanced-types'

/**
 * 执行JSON配置并展示各阶段结果
 */
export async function executeJsonConfiguration() {
  console.log('🚀 开始执行纯JSON数据源配置')
  console.log('='.repeat(60))

  // 1. 显示配置基本信息
  console.log('📋 配置基本信息:')
  console.log(`组件ID: ${pureJsonConfigExample.componentId}`)
  console.log(`配置版本: ${pureJsonConfigExample.version}`)
  console.log(`数据源数量: ${pureJsonConfigExample.dataSources.length}`)
  console.log(`配置名称: ${pureJsonConfigExample.metadata?.name}`)
  console.log()

  try {
    // 2. 创建执行器链
    console.log('🔧 创建多层级执行器链...')
    const executorChain = new MultiLayerExecutorChain()
    console.log('✅ 执行器链创建完成')
    console.log()

    // 3. 执行配置
    console.log('⚡ 开始执行数据源配置...')
    const startTime = Date.now()

    const result = await executorChain.execute(pureJsonConfigExample)

    const endTime = Date.now()
    const executionTime = endTime - startTime

    console.log(`✅ 配置执行完成，耗时: ${executionTime}ms`)
    console.log()

    // 4. 展示执行结果
    console.log('📊 执行结果分析:')
    console.log('='.repeat(40))
    console.log(`执行状态: ${result.success ? '✅ 成功' : '❌ 失败'}`)
    console.log(`执行时间: ${result.executionTime}ms`)
    console.log(`数据源结果数量: ${result.dataSources?.length || 0}`)
    console.log()

    // 5. 详细展示每个数据源的结果
    if (result.dataSources && result.dataSources.length > 0) {
      result.dataSources.forEach((sourceResult, index) => {
        console.log(`📈 数据源 ${index + 1}: ${sourceResult.sourceId}`)
        console.log(`   状态: ${sourceResult.success ? '✅ 成功' : '❌ 失败'}`)
        console.log(`   执行时间: ${sourceResult.executionTime}ms`)
        console.log(`   数据项数量: ${sourceResult.dataItems?.length || 0}`)

        // 展示处理后的数据
        if (sourceResult.processedData) {
          console.log(`   处理后数据类型: ${typeof sourceResult.processedData}`)
          console.log(`   处理后数据预览:`)

          try {
            const preview = JSON.stringify(sourceResult.processedData, null, 4)
            // 限制输出长度
            const shortPreview = preview.length > 300 ? preview.substring(0, 300) + '...\n    }' : preview
            console.log(`    ${shortPreview}`)
          } catch (e) {
            console.log(`    [数据预览失败: ${e}]`)
          }
        }

        // 展示错误信息
        if (sourceResult.errors && sourceResult.errors.length > 0) {
          console.log(`   错误信息:`)
          sourceResult.errors.forEach(error => {
            console.log(`     ❌ ${error}`)
          })
        }

        // 展示数据项详情
        if (sourceResult.dataItems && sourceResult.dataItems.length > 0) {
          sourceResult.dataItems.forEach((itemResult, itemIndex) => {
            console.log(`   📄 数据项 ${itemIndex + 1}:`)
            console.log(`      状态: ${itemResult.success ? '✅ 成功' : '❌ 失败'}`)
            console.log(`      执行时间: ${itemResult.executionTime}ms`)

            if (itemResult.fetchedData) {
              console.log(`      原始数据长度: ${JSON.stringify(itemResult.fetchedData).length} 字符`)
            }

            if (itemResult.processedData !== undefined) {
              console.log(`      处理后数据: ${JSON.stringify(itemResult.processedData)}`)
            }

            if (itemResult.errors && itemResult.errors.length > 0) {
              itemResult.errors.forEach(error => {
                console.log(`      ❌ ${error}`)
              })
            }
          })
        }
        console.log()
      })
    }

    // 6. 展示最终合并结果
    console.log('🔄 最终合并结果:')
    console.log('='.repeat(40))
    if (result.finalResult) {
      console.log('合并后数据结构:')
      try {
        const finalPreview = JSON.stringify(result.finalResult, null, 2)
        // 限制输出长度以便阅读
        if (finalPreview.length > 1000) {
          const shortFinal = finalPreview.substring(0, 1000) + '\n  ...\n}'
          console.log(shortFinal)
          console.log(`\n[完整数据长度: ${finalPreview.length} 字符]`)
        } else {
          console.log(finalPreview)
        }
      } catch (e) {
        console.log(`[数据展示失败: ${e}]`)
      }
    } else {
      console.log('❌ 无最终合并结果')
    }

    // 7. 性能分析
    console.log()
    console.log('📊 性能分析:')
    console.log('='.repeat(40))
    console.log(`总执行时间: ${executionTime}ms`)

    if (result.dataSources) {
      const avgExecutionTime =
        result.dataSources.reduce((sum, ds) => sum + (ds.executionTime || 0), 0) / result.dataSources.length
      console.log(`平均数据源执行时间: ${avgExecutionTime.toFixed(2)}ms`)

      const slowestSource = result.dataSources.reduce((slowest, current) =>
        (current.executionTime || 0) > (slowest.executionTime || 0) ? current : slowest
      )
      console.log(`最慢数据源: ${slowestSource.sourceId} (${slowestSource.executionTime}ms)`)
    }

    return result
  } catch (error) {
    console.error('❌ 配置执行失败:')
    console.error(error)
    throw error
  }
}

/**
 * 展示各个执行阶段的详细信息
 */
export async function demonstrateExecutionStages() {
  console.log('🔍 数据架构执行器链阶段分析')
  console.log('='.repeat(60))

  // 阶段1: 配置解析
  console.log('📋 阶段1: 配置解析')
  console.log('输入: EnhancedDataSourceConfiguration')
  console.log('处理: 解析配置结构、验证配置完整性')

  pureJsonConfigExample.dataSources.forEach((source, index) => {
    console.log(`数据源 ${index + 1}: ${source.sourceId}`)
    source.dataItems.forEach((item, itemIndex) => {
      console.log(`  数据项 ${itemIndex + 1}: ${item.item.id} (${item.item.type})`)
      console.log(`    显示名: ${item.item.metadata?.displayName}`)
      console.log(`    处理路径: ${item.processing?.filterPath}`)
    })
  })
  console.log()

  // 阶段2: 数据获取
  console.log('📥 阶段2: 数据项获取 (DataItemFetcher)')
  console.log('输入: DataItem配置')
  console.log('处理: 根据数据项类型获取原始数据')
  console.log('输出: 原始JSON字符串数据')
  console.log()

  // 阶段3: 数据处理
  console.log('⚙️ 阶段3: 数据项处理 (DataItemProcessor)')
  console.log('输入: 原始数据 + ProcessingConfig')
  console.log('处理: JSONPath过滤、类型转换、默认值处理')
  console.log('输出: 处理后的结构化数据')
  console.log()

  // 阶段4: 数据源合并
  console.log('🔄 阶段4: 数据源合并 (DataSourceMerger)')
  console.log('输入: 多个处理后的数据项')
  console.log('处理: 根据MergeStrategy合并数据项')
  console.log('输出: 合并后的数据源结果')
  console.log()

  // 阶段5: 多源集成
  console.log('🌐 阶段5: 多源集成 (MultiSourceIntegrator)')
  console.log('输入: 多个数据源结果')
  console.log('处理: 跨数据源的数据整合')
  console.log('输出: 最终的组件数据')
  console.log()

  // 执行实际配置
  return await executeJsonConfiguration()
}

// 导出执行函数
export default {
  executeJsonConfiguration,
  demonstrateExecutionStages,
  pureJsonConfigExample
}
