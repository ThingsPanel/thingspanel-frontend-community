#!/usr/bin/env tsx
/**
 * 可直接运行的JSON配置执行测试脚本
 * 展示完整的数据架构执行流程
 */

// 导入必要的模块
import { MultiLayerExecutorChain } from './executors/MultiLayerExecutorChain'
import { pureJsonConfigExample } from './example-json-only-config'

/**
 * 主执行函数
 */
async function main() {
  console.log('🎯 纯JSON数据源配置执行测试')
  console.log('='.repeat(60))
  console.log()

  try {
    // 1. 展示配置概览
    console.log('📋 配置概览:')
    console.log(`   组件ID: ${pureJsonConfigExample.componentId}`)
    console.log(`   版本: ${pureJsonConfigExample.version}`)
    console.log(`   数据源数量: ${pureJsonConfigExample.dataSources.length}`)
    console.log(`   配置名称: ${pureJsonConfigExample.metadata?.name}`)
    console.log()

    // 2. 展示每个数据源的配置细节
    console.log('🔍 数据源配置详情:')
    pureJsonConfigExample.dataSources.forEach((source, index) => {
      console.log(`   数据源 ${index + 1}: ${source.sourceId}`)
      console.log(`   合并策略: ${source.mergeStrategy.type}`)

      source.dataItems.forEach((dataItemWrapper, itemIndex) => {
        const item = dataItemWrapper.item
        console.log(`     数据项 ${itemIndex + 1}: ${item.id}`)
        console.log(`     类型: ${item.type}`)
        console.log(`     显示名: ${item.metadata?.displayName}`)
        console.log(`     处理路径: ${dataItemWrapper.processing?.filterPath}`)
        console.log(`     默认值: ${JSON.stringify(dataItemWrapper.processing?.defaultValue)}`)
        console.log(`     转换类型: ${dataItemWrapper.processing?.transform}`)
      })
      console.log()
    })

    // 3. 创建执行器链
    console.log('🔧 创建多层级执行器链...')
    const executorChain = new MultiLayerExecutorChain()
    console.log('✅ 执行器链创建完成')
    console.log()

    // 4. 执行配置
    console.log('⚡ 开始执行配置...')
    const startTime = Date.now()

    const result = await executorChain.execute(pureJsonConfigExample)

    const endTime = Date.now()
    const totalExecutionTime = endTime - startTime

    console.log(`🎉 执行完成! 总耗时: ${totalExecutionTime}ms`)
    console.log()

    // 5. 分析执行结果
    console.log('📊 执行结果分析:')
    console.log('='.repeat(50))
    console.log(`总体状态: ${result.success ? '✅ 成功' : '❌ 失败'}`)
    console.log(`执行时间: ${result.executionTime}ms`)
    console.log(`处理的数据源: ${result.dataSources?.length || 0} 个`)
    console.log()

    // 6. 详细展示每个数据源的执行结果
    if (result.dataSources && result.dataSources.length > 0) {
      console.log('📈 各数据源执行详情:')
      console.log('-'.repeat(50))

      result.dataSources.forEach((sourceResult, index) => {
        console.log(`\n🗂️  数据源 ${index + 1}: ${sourceResult.sourceId}`)
        console.log(`   执行状态: ${sourceResult.success ? '✅ 成功' : '❌ 失败'}`)
        console.log(`   执行时间: ${sourceResult.executionTime || 0}ms`)
        console.log(`   数据项数量: ${sourceResult.dataItems?.length || 0}`)

        // 展示处理后的数据概览
        if (sourceResult.processedData !== undefined) {
          console.log(`   处理后数据类型: ${typeof sourceResult.processedData}`)

          if (typeof sourceResult.processedData === 'object' && sourceResult.processedData !== null) {
            if (Array.isArray(sourceResult.processedData)) {
              console.log(`   数组长度: ${sourceResult.processedData.length}`)
              if (sourceResult.processedData.length > 0) {
                console.log(`   首个元素: ${JSON.stringify(sourceResult.processedData[0]).substring(0, 100)}...`)
              }
            } else {
              const keys = Object.keys(sourceResult.processedData)
              console.log(`   对象键数量: ${keys.length}`)
              console.log(`   主要键: ${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}`)
            }
          } else {
            console.log(`   数据值: ${JSON.stringify(sourceResult.processedData).substring(0, 100)}`)
          }
        }

        // 展示错误信息
        if (sourceResult.errors && sourceResult.errors.length > 0) {
          console.log(`   错误信息:`)
          sourceResult.errors.forEach(error => {
            console.log(`     ❌ ${error}`)
          })
        }

        // 展示各数据项的详细结果
        if (sourceResult.dataItems && sourceResult.dataItems.length > 0) {
          sourceResult.dataItems.forEach((itemResult, itemIndex) => {
            console.log(`\n   📄 数据项 ${itemIndex + 1}:`)
            console.log(`      状态: ${itemResult.success ? '✅ 成功' : '❌ 失败'}`)
            console.log(`      执行时间: ${itemResult.executionTime || 0}ms`)

            // 原始数据信息
            if (itemResult.fetchedData !== undefined) {
              const rawDataStr = JSON.stringify(itemResult.fetchedData)
              console.log(`      原始数据大小: ${rawDataStr.length} 字符`)

              try {
                const parsedData =
                  typeof itemResult.fetchedData === 'string'
                    ? JSON.parse(itemResult.fetchedData)
                    : itemResult.fetchedData

                if (typeof parsedData === 'object' && parsedData !== null) {
                  const keys = Object.keys(parsedData)
                  console.log(`      原始数据结构: {${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}}`)
                }
              } catch (e) {
                console.log(`      原始数据: 非JSON格式`)
              }
            }

            // 处理后数据信息
            if (itemResult.processedData !== undefined) {
              console.log(`      处理后数据类型: ${typeof itemResult.processedData}`)
              console.log(
                `      处理后数据: ${JSON.stringify(itemResult.processedData).substring(0, 200)}${JSON.stringify(itemResult.processedData).length > 200 ? '...' : ''}`
              )
            }

            // 错误信息
            if (itemResult.errors && itemResult.errors.length > 0) {
              itemResult.errors.forEach(error => {
                console.log(`      ❌ ${error}`)
              })
            }
          })
        }
      })
    }

    // 7. 展示最终合并结果
    console.log('\n🔄 最终合并结果:')
    console.log('='.repeat(50))

    if (result.finalResult !== undefined) {
      const finalResultStr = JSON.stringify(result.finalResult, null, 2)
      console.log('合并后数据结构:')

      if (finalResultStr.length > 2000) {
        // 超长数据只显示前面部分
        const preview = finalResultStr.substring(0, 2000)
        const lastBraceIndex = preview.lastIndexOf('\n')
        const shortPreview = preview.substring(0, lastBraceIndex) + '\n  ...\n}'
        console.log(shortPreview)
        console.log(`\n📏 完整数据长度: ${finalResultStr.length} 字符`)

        // 分析数据结构
        try {
          if (typeof result.finalResult === 'object' && result.finalResult !== null) {
            if (Array.isArray(result.finalResult)) {
              console.log(`📊 数据类型: 数组，长度 ${result.finalResult.length}`)
            } else {
              const keys = Object.keys(result.finalResult)
              console.log(`📊 数据类型: 对象，包含 ${keys.length} 个键`)
              console.log(`📊 主要键: ${keys.slice(0, 8).join(', ')}${keys.length > 8 ? '...' : ''}`)
            }
          }
        } catch (e) {
          console.log('📊 数据结构分析失败')
        }
      } else {
        console.log(finalResultStr)
      }
    } else {
      console.log('❌ 无最终合并结果')
    }

    // 8. 性能统计
    console.log('\n📊 性能统计:')
    console.log('='.repeat(50))
    console.log(`总执行时间: ${totalExecutionTime}ms`)
    console.log(`系统报告执行时间: ${result.executionTime || 0}ms`)

    if (result.dataSources && result.dataSources.length > 0) {
      const executionTimes = result.dataSources.map(ds => ds.executionTime || 0)
      const totalSourceTime = executionTimes.reduce((sum, time) => sum + time, 0)
      const avgTime = totalSourceTime / executionTimes.length
      const maxTime = Math.max(...executionTimes)
      const minTime = Math.min(...executionTimes)

      console.log(`数据源平均执行时间: ${avgTime.toFixed(2)}ms`)
      console.log(`最快数据源: ${minTime}ms`)
      console.log(`最慢数据源: ${maxTime}ms`)
      console.log(`数据源总时间: ${totalSourceTime}ms`)

      const slowestIndex = executionTimes.indexOf(maxTime)
      if (slowestIndex >= 0) {
        console.log(`最慢数据源: ${result.dataSources[slowestIndex].sourceId}`)
      }
    }

    console.log()
    console.log('🎉 测试执行完成!')

    return result
  } catch (error) {
    console.error('❌ 执行过程中发生错误:')
    console.error(error)

    // 显示错误堆栈以便调试
    if (error instanceof Error) {
      console.error('\n📍 错误堆栈:')
      console.error(error.stack)
    }

    process.exit(1)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(error => {
    console.error('主执行函数失败:', error)
    process.exit(1)
  })
}

export { main }
export default main
