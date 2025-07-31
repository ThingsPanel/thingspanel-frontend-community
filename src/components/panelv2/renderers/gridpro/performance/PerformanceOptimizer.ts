/**
 * GridPro 性能优化器
 * 根据基准测试结果自动应用优化策略
 */

import type { GridProConfig } from '../types/gridpro'
import type { BenchmarkResult } from './PerformanceBenchmark'

export interface OptimizationRule {
  name: string
  condition: (results: BenchmarkResult[], config: GridProConfig) => boolean
  apply: (config: GridProConfig) => Partial<GridProConfig>
  description: string
  impact: 'low' | 'medium' | 'high'
}

export interface OptimizationSuggestion {
  rule: OptimizationRule
  reason: string
  expectedImprovement: string
  configChanges: Partial<GridProConfig>
}

export class PerformanceOptimizer {
  private rules: OptimizationRule[] = []

  constructor() {
    this.initializeRules()
  }

  /**
   * 初始化优化规则
   */
  private initializeRules(): void {
    this.rules = [
      // 虚拟化优化规则
      {
        name: 'enable_virtualization',
        condition: (results, config) => {
          const avgRenderTime = results.reduce((sum, r) => sum + r.renderTime, 0) / results.length
          return avgRenderTime > 100 && !config.virtualization?.enabled
        },
        apply: (config) => ({
          virtualization: {
            ...config.virtualization,
            enabled: true,
            bufferSize: 50,
            preloadCount: 10
          }
        }),
        description: '启用虚拟化渲染以提高大量项目的性能',
        impact: 'high'
      },

      // 批量更新优化
      {
        name: 'enable_batch_updates',
        condition: (results, config) => {
          const avgFPS = results.reduce((sum, r) => sum + r.fps, 0) / results.length
          return avgFPS < 50 && !config.performance?.batchUpdates
        },
        apply: (config) => ({
          performance: {
            ...config.performance,
            batchUpdates: true,
            batchSize: 20,
            batchInterval: 16
          }
        }),
        description: '启用批量更新以减少DOM操作频率',
        impact: 'medium'
      },

      // 节流优化
      {
        name: 'optimize_throttle',
        condition: (results, config) => {
          const avgInteractionLatency = results.reduce((sum, r) => sum + r.interactionLatency, 0) / results.length
          return avgInteractionLatency > 50 && (config.performance?.throttleInterval || 0) < 16
        },
        apply: (config) => ({
          performance: {
            ...config.performance,
            throttleInterval: 16,
            debounceInterval: 100
          }
        }),
        description: '优化节流间隔以改善交互响应性',
        impact: 'medium'
      },

      // 内存优化
      {
        name: 'enable_object_pool',
        condition: (results, config) => {
          const avgMemoryUsage = results.reduce((sum, r) => sum + r.memoryUsage.used, 0) / results.length
          return avgMemoryUsage > 50 * 1024 * 1024 && !config.performance?.enableObjectPool // 50MB
        },
        apply: (config) => ({
          performance: {
            ...config.performance,
            enableObjectPool: true,
            poolSize: 100
          }
        }),
        description: '启用对象池以减少内存分配开销',
        impact: 'medium'
      },

      // 动画优化
      {
        name: 'optimize_animations',
        condition: (results, config) => {
          const avgFPS = results.reduce((sum, r) => sum + r.fps, 0) / results.length
          return avgFPS < 45 && config.animation?.enabled
        },
        apply: (config) => ({
          animation: {
            ...config.animation,
            duration: Math.max(150, (config.animation?.duration || 300) * 0.7),
            quality: 'medium'
          }
        }),
        description: '优化动画参数以提高流畅度',
        impact: 'low'
      },

      // 碰撞检测优化
      {
        name: 'optimize_collision_detection',
        condition: (results, config) => {
          const avgRenderTime = results.reduce((sum, r) => sum + r.renderTime, 0) / results.length
          return avgRenderTime > 200 && !config.collision?.spatialIndex
        },
        apply: (config) => ({
          collision: {
            ...config.collision,
            spatialIndex: true,
            gridSize: 100
          }
        }),
        description: '启用空间索引以优化碰撞检测性能',
        impact: 'high'
      },

      // 网格计算优化
      {
        name: 'optimize_grid_calculation',
        condition: (results, config) => {
          const renderingTests = results.filter(r => r.testName.includes('Rendering'))
          const largeDatasetTests = renderingTests.filter(r => r.testName.includes('500') || r.testName.includes('1000'))
          
          if (largeDatasetTests.length === 0) return false
          
          const avgScore = largeDatasetTests.reduce((sum, r) => sum + r.scores.rendering, 0) / largeDatasetTests.length
          return avgScore < 70
        },
        apply: (config) => ({
          performance: {
            ...config.performance,
            cacheGridCalculations: true,
            useFastMath: true
          }
        }),
        description: '启用网格计算缓存和快速数学运算',
        impact: 'medium'
      },

      // 自动压缩优化
      {
        name: 'disable_auto_compact',
        condition: (results, config) => {
          const avgRenderTime = results.reduce((sum, r) => sum + r.renderTime, 0) / results.length
          return avgRenderTime > 150 && config.autoCompact?.enabled
        },
        apply: (config) => ({
          autoCompact: {
            ...config.autoCompact,
            enabled: false
          }
        }),
        description: '在性能要求高时禁用自动压缩功能',
        impact: 'medium'
      }
    ]
  }

  /**
   * 分析性能结果并生成优化建议
   */
  analyzePerformance(results: BenchmarkResult[], currentConfig: GridProConfig): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = []

    for (const rule of this.rules) {
      if (rule.condition(results, currentConfig)) {
        const configChanges = rule.apply(currentConfig)
        
        suggestions.push({
          rule,
          reason: this.generateReason(rule, results, currentConfig),
          expectedImprovement: this.estimateImprovement(rule, results),
          configChanges
        })
      }
    }

    // 按影响程度排序
    return suggestions.sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 }
      return impactOrder[b.rule.impact] - impactOrder[a.rule.impact]
    })
  }

  /**
   * 自动应用优化建议
   */
  autoOptimize(results: BenchmarkResult[], currentConfig: GridProConfig, maxImpact: 'low' | 'medium' | 'high' = 'medium'): GridProConfig {
    const suggestions = this.analyzePerformance(results, currentConfig)
    const impactOrder = { low: 1, medium: 2, high: 3 }
    const maxImpactLevel = impactOrder[maxImpact]

    // 应用符合影响级别的优化
    let optimizedConfig = { ...currentConfig }
    
    for (const suggestion of suggestions) {
      if (impactOrder[suggestion.rule.impact] <= maxImpactLevel) {
        optimizedConfig = {
          ...optimizedConfig,
          ...suggestion.configChanges
        }
      }
    }

    return optimizedConfig
  }

  /**
   * 生成优化原因说明
   */
  private generateReason(rule: OptimizationRule, results: BenchmarkResult[], config: GridProConfig): string {
    switch (rule.name) {
      case 'enable_virtualization':
        const avgRenderTime = results.reduce((sum, r) => sum + r.renderTime, 0) / results.length
        return `平均渲染时间 ${avgRenderTime.toFixed(1)}ms 超过阈值，建议启用虚拟化`

      case 'enable_batch_updates':
        const avgFPS = results.reduce((sum, r) => sum + r.fps, 0) / results.length
        return `平均帧率 ${avgFPS.toFixed(1)}fps 低于50fps，建议启用批量更新`

      case 'optimize_throttle':
        const avgLatency = results.reduce((sum, r) => sum + r.interactionLatency, 0) / results.length
        return `平均交互延迟 ${avgLatency.toFixed(1)}ms 较高，建议优化节流设置`

      case 'enable_object_pool':
        const avgMemory = results.reduce((sum, r) => sum + r.memoryUsage.used, 0) / results.length
        return `平均内存使用 ${(avgMemory / 1024 / 1024).toFixed(1)}MB 较高，建议启用对象池`

      default:
        return rule.description
    }
  }

  /**
   * 估算性能改善程度
   */
  private estimateImprovement(rule: OptimizationRule, results: BenchmarkResult[]): string {
    const impact = rule.impact

    switch (rule.name) {
      case 'enable_virtualization':
        return '预计渲染性能提升 40-60%，内存使用减少 50-70%'

      case 'enable_batch_updates':
        return '预计帧率提升 20-30%，交互响应性改善 15-25%'

      case 'optimize_throttle':
        return '预计交互延迟减少 30-50%'

      case 'enable_object_pool':
        return '预计内存使用减少 15-30%，垃圾回收压力降低'

      case 'optimize_animations':
        return '预计动画流畅度提升 10-20%'

      case 'optimize_collision_detection':
        return '预计碰撞检测性能提升 50-80%'

      default:
        const improvements = {
          high: '预计整体性能提升 20-40%',
          medium: '预计整体性能提升 10-25%',
          low: '预计整体性能提升 5-15%'
        }
        return improvements[impact]
    }
  }

  /**
   * 生成优化报告
   */
  generateOptimizationReport(suggestions: OptimizationSuggestion[]): string {
    let report = '\n📊 GridPro 性能优化报告\n'
    report += '='.repeat(50) + '\n'

    if (suggestions.length === 0) {
      report += '\n✅ 当前配置已经很好，暂无优化建议\n'
      return report
    }

    report += `\n发现 ${suggestions.length} 个优化机会：\n`

    suggestions.forEach((suggestion, index) => {
      const impact = suggestion.rule.impact
      const impactIcon = { high: '🔥', medium: '⚡', low: '💡' }[impact]
      
      report += `\n${index + 1}. ${impactIcon} ${suggestion.rule.description}\n`
      report += `   原因: ${suggestion.reason}\n`
      report += `   预期改善: ${suggestion.expectedImprovement}\n`
      report += `   影响程度: ${impact.toUpperCase()}\n`
      
      // 显示配置变更
      const changes = Object.keys(suggestion.configChanges)
      if (changes.length > 0) {
        report += `   配置变更: ${changes.join(', ')}\n`
      }
    })

    report += '\n💡 建议按优先级逐步应用这些优化，并在每次应用后重新测试性能。\n'

    return report
  }

  /**
   * 验证优化效果
   */
  async validateOptimization(
    originalResults: BenchmarkResult[],
    optimizedResults: BenchmarkResult[]
  ): Promise<{
    improvement: number
    details: {
      rendering: number
      memory: number
      responsiveness: number
    }
  }> {
    const originalAvg = this.calculateAverageScores(originalResults)
    const optimizedAvg = this.calculateAverageScores(optimizedResults)

    const improvement = optimizedAvg.overall - originalAvg.overall

    return {
      improvement,
      details: {
        rendering: optimizedAvg.rendering - originalAvg.rendering,
        memory: optimizedAvg.memory - originalAvg.memory,
        responsiveness: optimizedAvg.responsiveness - originalAvg.responsiveness
      }
    }
  }

  /**
   * 计算平均分数
   */
  private calculateAverageScores(results: BenchmarkResult[]): {
    overall: number
    rendering: number
    memory: number
    responsiveness: number
  } {
    if (results.length === 0) {
      return { overall: 0, rendering: 0, memory: 0, responsiveness: 0 }
    }

    const totals = results.reduce(
      (acc, result) => ({
        overall: acc.overall + result.scores.overall,
        rendering: acc.rendering + result.scores.rendering,
        memory: acc.memory + result.scores.memory,
        responsiveness: acc.responsiveness + result.scores.responsiveness
      }),
      { overall: 0, rendering: 0, memory: 0, responsiveness: 0 }
    )

    return {
      overall: totals.overall / results.length,
      rendering: totals.rendering / results.length,
      memory: totals.memory / results.length,
      responsiveness: totals.responsiveness / results.length
    }
  }

  /**
   * 创建性能监控配置
   */
  createMonitoringConfig(optimizedConfig: GridProConfig): Partial<GridProConfig> {
    return {
      monitoring: {
        enabled: true,
        metricsInterval: 1000,
        alertThresholds: {
          fps: 45,
          memoryUsage: 100 * 1024 * 1024, // 100MB
          renderTime: 100
        },
        autoOptimize: true,
        logLevel: 'warn'
      }
    }
  }
}