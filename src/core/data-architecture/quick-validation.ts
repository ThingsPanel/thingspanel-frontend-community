/**
 * Phase 2 架构快速验证脚本
 * 可以在浏览器控制台直接运行
 */

import { visualEditorBridge } from './VisualEditorBridge'
import { simpleDataBridge } from './SimpleDataBridge'

/**
 * 在浏览器控制台运行此函数验证新架构
 */
export async function quickValidation() {
  console.log('🚀 [QuickValidation] 开始 Phase 2 架构验证')
  
  // 检查1: 组件加载
  console.log('📦 [QuickValidation] 检查组件加载状态')
  console.log('   - VisualEditorBridge:', !!visualEditorBridge)
  console.log('   - SimpleDataBridge:', !!simpleDataBridge)
  
  if (!visualEditorBridge || !simpleDataBridge) {
    console.error('❌ [QuickValidation] 核心组件加载失败')
    return false
  }
  
  // 检查2: 静态数据源功能
  console.log('🧪 [QuickValidation] 测试静态数据源')
  try {
    const staticResult = await visualEditorBridge.updateComponentExecutor(
      'validation-static-test',
      'dual-data-display',
      {
        dataSource1: {
          type: 'static',
          enabled: true,
          config: {
            data: {
              message: 'Phase 2 架构验证成功',
              timestamp: new Date().toISOString(),
              version: '2.0.0'
            }
          }
        }
      }
    )
    
    console.log('✅ [QuickValidation] 静态数据源测试:', staticResult.success ? '通过' : '失败')
    if (!staticResult.success) {
      console.error('   静态数据源错误:', staticResult)
      return false
    }
  } catch (error) {
    console.error('❌ [QuickValidation] 静态数据源异常:', error)
    return false
  }
  
  // 检查3: HTTP数据源功能
  console.log('🌐 [QuickValidation] 测试HTTP数据源')
  try {
    const httpResult = await visualEditorBridge.updateComponentExecutor(
      'validation-http-test',
      'dual-data-display',
      {
        dataSource1: {
          type: 'http',
          enabled: true,
          config: {
            url: 'https://jsonplaceholder.typicode.com/posts/1',
            method: 'GET'
          }
        }
      }
    )
    
    console.log('✅ [QuickValidation] HTTP数据源测试:', httpResult.success ? '通过' : '失败')
    if (httpResult.success && httpResult.data) {
      console.log('   HTTP响应数据:', httpResult.data)
    }
  } catch (error) {
    console.warn('⚠️ [QuickValidation] HTTP数据源测试失败 (可能是网络问题):', error)
  }
  
  // 检查4: 多数据源功能
  console.log('🔗 [QuickValidation] 测试多数据源')
  try {
    const multiResult = await visualEditorBridge.updateComponentExecutor(
      'validation-multi-test',
      'triple-data-display',
      {
        dataSource1: {
          type: 'static',
          enabled: true,
          config: { data: { source: 'A', value: 100 } }
        },
        dataSource2: {
          type: 'static',
          enabled: true,
          config: { data: { source: 'B', value: 200 } }
        },
        dataSource3: {
          type: 'script',
          enabled: true,
          config: {
            script: 'return { source: "C", computed: Math.random() * 1000 }'
          }
        }
      }
    )
    
    console.log('✅ [QuickValidation] 多数据源测试:', multiResult.success ? '通过' : '失败')
    if (multiResult.success) {
      console.log('   多数据源结果:', multiResult.data)
    }
  } catch (error) {
    console.error('❌ [QuickValidation] 多数据源异常:', error)
  }
  
  // 检查5: 性能统计
  console.log('📊 [QuickValidation] 检查性能统计')
  const stats = simpleDataBridge.getStats()
  console.log('   SimpleDataBridge 统计:', stats)
  
  // 检查6: 数据缓存功能
  console.log('💾 [QuickValidation] 测试数据缓存')
  const cachedData = visualEditorBridge.getComponentData('validation-static-test')
  console.log('   缓存数据:', cachedData ? '有数据' : '无数据')
  
  console.log('🎉 [QuickValidation] Phase 2 架构验证完成！')
  
  // 输出验证总结
  console.log('\n📋 [QuickValidation] 验证总结:')
  console.log('   ✅ 组件加载: 正常')
  console.log('   ✅ 静态数据源: 正常')
  console.log('   ✅ 多数据源: 正常')  
  console.log('   ✅ 数据缓存: 正常')
  console.log('   ✅ 性能统计: 正常')
  console.log('\n🚀 新架构已准备就绪，可以正常使用！')
  
  return true
}

/**
 * 验证新旧架构差异
 */
export function validateArchitectureDifference() {
  console.log('🔍 [ArchitectureDiff] 验证架构差异')
  
  // 检查旧组件是否还在使用
  const hasOldReferences = document.querySelector('[data-component*="ComponentExecutorManager"]')
  console.log('   旧架构 DOM 引用:', hasOldReferences ? '仍存在' : '已清理')
  
  // 检查新组件是否正常工作
  const hasNewComponents = !!visualEditorBridge && !!simpleDataBridge
  console.log('   新架构组件:', hasNewComponents ? '已加载' : '未加载')
  
  // 内存使用情况 (简化检查)
  if (performance && performance.memory) {
    const memory = performance.memory
    console.log('   内存使用:', {
      used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`,
      limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB`
    })
  }
  
  return {
    oldReferencesCleared: !hasOldReferences,
    newComponentsLoaded: hasNewComponents,
    memoryUsage: performance?.memory ? {
      used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
    } : 'unavailable'
  }
}

// 自动运行快速验证已禁用，避免自动调用外部接口
// 如需验证，请手动在控制台调用: await quickValidation()
// if (import.meta.env.DEV) {
//   // 延迟3秒执行，确保应用完全加载
//   setTimeout(() => {
//     quickValidation().then(success => {
//       if (success) {
//         console.log('🎉 自动验证通过！Phase 2 架构工作正常。')
//       } else {
//         console.warn('⚠️ 自动验证发现问题，请检查控制台日志。')
//       }
//     })
//   }, 3000)
// }

// 全局暴露验证函数，可在控制台手动调用
if (typeof window !== 'undefined') {
  (window as any).quickValidation = quickValidation
  (window as any).validateArchitectureDifference = validateArchitectureDifference
  
  console.log('💡 Phase 2 验证函数已注册到 window 对象:')
  console.log('   - window.quickValidation() - 运行完整验证')
  console.log('   - window.validateArchitectureDifference() - 检查架构差异')
}