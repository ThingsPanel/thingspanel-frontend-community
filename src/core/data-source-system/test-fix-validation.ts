/**
 * 修复效果验证脚本
 * 直接测试数据源执行器核心功能，验证类型一致性修复是否有效
 */

import { createMultiDataSourceExecutor } from './core/MultiDataSourceExecutor'
import type { MultiDataSourceConfig } from './types/execution'

/**
 * 创建测试配置 - 模拟用户原始问题场景
 */
function createTestConfig(): MultiDataSourceConfig {
  return {
    version: '2.0.0',
    exportTime: new Date().toISOString(),
    dataSources: {
      devices: {
        name: '设备数据',
        fieldsToMap: [{ sourceProperty: 'list', targetProperty: 'devices', description: '设备列表' }],
        configuration: {
          rawDataList: [
            {
              id: 'device-data',
              name: '设备HTTP数据',
              type: 'http' as const,
              config: {
                httpConfig: {
                  method: 'GET' as const,
                  url: 'https://jsonplaceholder.typicode.com/users',
                  headers: [],
                  params: [],
                  bodyType: 'none' as const,
                  bodyContent: '',
                  timeout: 5000
                },
                // 模拟用户的过滤路径问题
                filterPath: '$.data.list[0]',
                processScript: 'return data.map(item => ({ id: item.id, name: item.name, status: "online" }));'
              }
            }
          ],
          finalProcessingType: 'merge-object' as const
        }
      },
      metrics: {
        name: '指标数据',
        fieldsToMap: [{ sourceProperty: 'metrics', targetProperty: 'metrics', description: '系统指标' }],
        configuration: {
          rawDataList: [
            {
              id: 'metrics-data',
              name: '指标HTTP数据',
              type: 'http' as const,
              config: {
                httpConfig: {
                  method: 'GET' as const,
                  url: 'https://jsonplaceholder.typicode.com/posts',
                  headers: [],
                  params: [],
                  bodyType: 'none' as const,
                  bodyContent: '',
                  timeout: 5000
                },
                // 同样的路径格式问题
                filterPath: '$.data.list[0]',
                processScript: 'return { count: data.length, items: data.slice(0, 3) };'
              }
            }
          ],
          finalProcessingType: 'merge-object' as const
        }
      }
    }
  }
}

/**
 * 执行验证测试
 */
export async function validateFix(): Promise<void> {
  console.log('🧪 [Fix-Validation] 开始验证修复效果...')

  try {
    // 1. 创建测试配置
    const testConfig = createTestConfig()
    console.log('📋 [Fix-Validation] 测试配置已创建')
    console.log(`   数据源数量: ${Object.keys(testConfig.dataSources).length}`)
    console.log(`   数据源列表: ${Object.keys(testConfig.dataSources).join(', ')}`)

    // 2. 创建执行器并加载配置
    const executor = createMultiDataSourceExecutor()
    executor.loadConfig(testConfig)
    console.log('✅ [Fix-Validation] 执行器配置加载成功')

    // 3. 执行数据处理
    console.log('🚀 [Fix-Validation] 开始执行数据处理...')
    const state = await executor.executeAll()

    // 4. 分析执行结果
    console.log('📊 [Fix-Validation] 执行完成，分析结果...')
    console.log(`   成功数据源: ${state.overallStats.successfulDataSources}/${state.overallStats.totalDataSources}`)
    console.log(`   失败数据源: ${state.overallStats.failedDataSources}`)
    console.log(`   总耗时: ${state.overallStats.totalDuration}ms`)

    // 5. 检查每个数据源的结果
    let hasScriptMetadataIssue = false
    let hasEmptyResultIssue = false

    Object.entries(state.finalResults).forEach(([key, value]) => {
      console.log(`\n🔍 [Fix-Validation] 检查数据源 ${key}:`)

      if (value === null || value === undefined) {
        console.log(`   ❌ 返回空结果`)
        hasEmptyResultIssue = true
      } else if (typeof value === 'object' && 'success' in value && 'data' in value) {
        console.log(`   ❌ 仍返回脚本执行元数据对象（修复无效）`)
        console.log(`   📄 对象结构: ${Object.keys(value).join(', ')}`)
        hasScriptMetadataIssue = true
      } else {
        console.log(`   ✅ 成功返回处理后数据`)
        console.log(`   📄 数据类型: ${typeof value}`)
        if (typeof value === 'object' && value !== null) {
          console.log(`   📄 对象结构: ${Object.keys(value).join(', ')}`)
        }
      }
    })

    // 6. 总结修复效果
    console.log('\n🎯 [Fix-Validation] 修复效果总结:')

    if (!hasScriptMetadataIssue && !hasEmptyResultIssue) {
      console.log('   ✅ 所有问题已修复')
      console.log('   ✅ 脚本执行返回正确数据（非元数据对象）')
      console.log('   ✅ 所有数据源返回有效结果')
    } else {
      if (hasScriptMetadataIssue) {
        console.log('   ❌ 脚本执行仍返回元数据对象，需进一步修复')
      }
      if (hasEmptyResultIssue) {
        console.log('   ❌ 部分数据源返回空结果，需检查数据处理逻辑')
      }
    }

    // 7. 输出最终结果结构
    console.log('\n📦 [Fix-Validation] 最终结果结构:')
    console.log(JSON.stringify(state.finalResults, null, 2))

    // 8. 清理
    executor.destroy()
    console.log('\n🗑️ [Fix-Validation] 执行器已清理')
  } catch (error) {
    console.error('❌ [Fix-Validation] 验证过程中出现错误:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`   错误信息: ${errorMessage}`)

    if (error instanceof Error && error.stack) {
      console.error(`   错误堆栈:`, error.stack)
    }
  }
}

/**
 * 如果直接运行此文件，执行验证
 */
if (import.meta.hot) {
  console.log('🔥 [Fix-Validation] 热重载环境，不自动执行验证')
} else if (typeof window === 'undefined') {
  // Node.js 环境
  validateFix()
}
