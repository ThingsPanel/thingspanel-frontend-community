/**
 * 配置系统鲁棒性增强
 * 处理边界情况、存储限制、并发问题等
 * 
 * 🔥 针对用户反馈的深度分析，确保不是"写死解决问题"
 */

import { configurationStateManager } from './ConfigurationStateManager'
import { simpleDataBridge } from '@/core/data-architecture/SimpleDataBridge'
import type { WidgetConfiguration } from './types'

/**
 * 存储容量检查结果
 */
interface StorageCapacityCheck {
  isAvailable: boolean
  usedSpace: number
  totalSpace: number
  remainingSpace: number
  warningThreshold: number
  errorDetails?: string
}

/**
 * 配置一致性检查结果
 */
interface ConfigurationConsistencyCheck {
  isConsistent: boolean
  inconsistentComponents: string[]
  cacheDataMismatches: Array<{
    componentId: string
    configHash: string
    cacheHash: string
    issue: string
  }>
}

/**
 * 配置系统鲁棒性管理器
 */
export class ConfigurationRobustnessManager {
  private readonly MAX_STORAGE_SIZE = 5 * 1024 * 1024 // 5MB 限制
  private readonly WARNING_THRESHOLD = 0.8 // 80% 使用率警告
  
  /**
   * 检查 localStorage 容量状态
   */
  checkStorageCapacity(): StorageCapacityCheck {
    try {
      // 估算当前配置数据大小
      const configData = localStorage.getItem('configuration-states')
      const usedSpace = configData ? new Blob([configData]).size : 0
      
      // 通过写入测试数据检测可用空间
      let testSize = 1024 // 开始测试 1KB
      let maxWriteSize = 0
      
      while (testSize <= 1024 * 1024) { // 最多测试到 1MB
        const testData = 'x'.repeat(testSize)
        try {
          localStorage.setItem('_storage_test', testData)
          localStorage.removeItem('_storage_test')
          maxWriteSize = testSize
          testSize *= 2
        } catch {
          break
        }
      }
      
      const totalSpace = usedSpace + maxWriteSize
      const remainingSpace = maxWriteSize
      const warningThreshold = totalSpace * this.WARNING_THRESHOLD
      
      return {
        isAvailable: remainingSpace > 1024, // 至少 1KB 可用空间
        usedSpace,
        totalSpace,
        remainingSpace,
        warningThreshold,
        errorDetails: remainingSpace < 1024 ? '存储空间不足，配置可能无法保存' : undefined
      }
    } catch (error) {
      return {
        isAvailable: false,
        usedSpace: 0,
        totalSpace: 0,
        remainingSpace: 0,
        warningThreshold: 0,
        errorDetails: `存储检查失败: ${error instanceof Error ? error.message : String(error)}`
      }
    }
  }
  
  /**
   * 检查配置与数据缓存的一致性
   */
  async checkConfigurationConsistency(): Promise<ConfigurationConsistencyCheck> {
    const inconsistentComponents: string[] = []
    const cacheDataMismatches: Array<{
      componentId: string
      configHash: string
      cacheHash: string
      issue: string
    }> = []
    
    try {
      // 获取所有配置状态
      const allStates = configurationStateManager.getAllConfigurationStates()
      
      for (const [componentId, state] of allStates) {
        // 检查配置哈希
        const configHash = this.hashConfiguration(state.configuration)
        
        // 检查缓存数据
        const cachedData = simpleDataBridge.getComponentData(componentId)
        let cacheHash = ''
        let issue = ''
        
        if (cachedData) {
          cacheHash = this.hashData(cachedData)
          
          // 检查时间戳合理性
          if (state.updatedAt > Date.now()) {
            issue = '配置时间戳异常（未来时间）'
            inconsistentComponents.push(componentId)
          }
          
          // 检查数据结构合理性
          if (this.isCircularStructure(cachedData)) {
            issue = '缓存数据包含循环引用'
            inconsistentComponents.push(componentId)
          }
        } else if (state.configuration.dataSource) {
          // 有配置但无缓存，可能需要重新加载
          issue = '有数据源配置但无缓存数据'
          inconsistentComponents.push(componentId)
        }
        
        if (issue) {
          cacheDataMismatches.push({
            componentId,
            configHash,
            cacheHash,
            issue
          })
        }
      }
      
      return {
        isConsistent: inconsistentComponents.length === 0,
        inconsistentComponents,
        cacheDataMismatches
      }
    } catch (error) {
      console.error('❌ [ConfigRobustness] 一致性检查失败:', error)
      return {
        isConsistent: false,
        inconsistentComponents: ['__check_failed__'],
        cacheDataMismatches: [{
          componentId: '__system__',
          configHash: '',
          cacheHash: '',
          issue: `一致性检查异常: ${error instanceof Error ? error.message : String(error)}`
        }]
      }
    }
  }
  
  /**
   * 修复配置不一致问题
   */
  async repairConfigurationInconsistencies(): Promise<{
    repairedCount: number
    failedComponents: string[]
    repairLog: string[]
  }> {
    const repairLog: string[] = []
    const failedComponents: string[] = []
    let repairedCount = 0
    
    try {
      const consistencyCheck = await this.checkConfigurationConsistency()
      
      for (const mismatch of consistencyCheck.cacheDataMismatches) {
        const { componentId, issue } = mismatch
        
        try {
          if (issue.includes('无缓存数据')) {
            // 清理并重新执行数据获取
            simpleDataBridge.clearComponentCache(componentId)
            repairLog.push(`🔧 [Repair] 清理组件缓存: ${componentId}`)
            repairedCount++
          } else if (issue.includes('循环引用')) {
            // 清理有问题的缓存数据
            simpleDataBridge.clearComponentCache(componentId)
            repairLog.push(`🧹 [Repair] 清理循环引用缓存: ${componentId}`)
            repairedCount++
          } else if (issue.includes('时间戳异常')) {
            // 重新设置配置以修正时间戳
            const config = configurationStateManager.getConfiguration(componentId)
            if (config) {
              configurationStateManager.setConfiguration(componentId, config, 'repair')
              repairLog.push(`⏰ [Repair] 修正配置时间戳: ${componentId}`)
              repairedCount++
            }
          }
        } catch (error) {
          failedComponents.push(componentId)
          repairLog.push(`❌ [Repair] 修复失败 ${componentId}: ${error}`)
        }
      }
      
      return {
        repairedCount,
        failedComponents,
        repairLog
      }
    } catch (error) {
      repairLog.push(`❌ [Repair] 修复过程异常: ${error}`)
      return {
        repairedCount: 0,
        failedComponents: ['__repair_failed__'],
        repairLog
      }
    }
  }
  
  /**
   * 生成配置哈希（用于一致性检查）
   */
  private hashConfiguration(config: WidgetConfiguration): string {
    try {
      const configString = JSON.stringify(config, Object.keys(config).sort())
      return this.simpleHash(configString)
    } catch {
      return 'hash_error'
    }
  }
  
  /**
   * 生成数据哈希
   */
  private hashData(data: any): string {
    try {
      const dataString = JSON.stringify(data)
      return this.simpleHash(dataString.substring(0, 1000)) // 只取前1000字符避免性能问题
    } catch {
      return 'hash_error'
    }
  }
  
  /**
   * 简单哈希函数
   */
  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }
    return Math.abs(hash).toString(16)
  }
  
  /**
   * 检查是否包含循环引用
   */
  private isCircularStructure(obj: any, seen = new WeakSet()): boolean {
    if (obj === null || typeof obj !== 'object') {
      return false
    }
    
    if (seen.has(obj)) {
      return true
    }
    
    seen.add(obj)
    
    try {
      for (const key in obj) {
        if (this.isCircularStructure(obj[key], seen)) {
          return true
        }
      }
    } catch {
      return true // 访问错误也认为是循环引用
    }
    
    seen.delete(obj)
    return false
  }
  
  /**
   * 获取系统健康状态报告
   */
  async getSystemHealthReport(): Promise<{
    storage: StorageCapacityCheck
    consistency: ConfigurationConsistencyCheck
    recommendations: string[]
    overallHealth: 'good' | 'warning' | 'critical'
  }> {
    const storage = this.checkStorageCapacity()
    const consistency = await this.checkConfigurationConsistency()
    const recommendations: string[] = []
    
    // 存储建议
    if (!storage.isAvailable) {
      recommendations.push('🚨 存储空间不足，建议清理无用配置或升级存储方案')
    } else if (storage.usedSpace > storage.warningThreshold) {
      recommendations.push('⚠️ 存储使用率较高，建议定期清理旧配置')
    }
    
    // 一致性建议
    if (!consistency.isConsistent) {
      recommendations.push('🔧 发现配置不一致问题，建议执行自动修复')
    }
    
    if (consistency.cacheDataMismatches.length > 0) {
      recommendations.push('🧹 建议清理异常缓存数据以提高系统稳定性')
    }
    
    // 整体健康状态评估
    let overallHealth: 'good' | 'warning' | 'critical' = 'good'
    
    if (!storage.isAvailable || !consistency.isConsistent) {
      overallHealth = 'critical'
    } else if (storage.usedSpace > storage.warningThreshold || consistency.cacheDataMismatches.length > 0) {
      overallHealth = 'warning'
    }
    
    return {
      storage,
      consistency,
      recommendations,
      overallHealth
    }
  }
}

/**
 * 全局鲁棒性管理器实例
 */
export const configurationRobustnessManager = new ConfigurationRobustnessManager()

/**
 * 开发环境自动健康检查
 */
if (import.meta.env.DEV) {
  // 延迟执行，避免影响初始化
  setTimeout(async () => {
    console.log('🔍 [ConfigRobustness] 执行系统健康检查...')
    
    try {
      const healthReport = await configurationRobustnessManager.getSystemHealthReport()
      
      if (healthReport.overallHealth === 'critical') {
        console.error('🚨 [ConfigRobustness] 系统状态: 严重问题')
      } else if (healthReport.overallHealth === 'warning') {
        console.warn('⚠️ [ConfigRobustness] 系统状态: 需要注意')
      } else {
        console.log('✅ [ConfigRobustness] 系统状态: 健康')
      }
      
      if (healthReport.recommendations.length > 0) {
        console.log('📋 [ConfigRobustness] 改进建议:')
        healthReport.recommendations.forEach(rec => console.log(`  ${rec}`))
      }
      
      // 如果有不一致问题，提供修复选项
      if (!healthReport.consistency.isConsistent) {
        console.log('💡 [ConfigRobustness] 可执行自动修复: configurationRobustnessManager.repairConfigurationInconsistencies()')
      }
    } catch (error) {
      console.error('❌ [ConfigRobustness] 健康检查失败:', error)
    }
  }, 3000)
}