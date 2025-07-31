/**
 * GridPro 性能测试脚本
 * 运行完整的性能基准测试并生成优化报告
 */

import { 
  PerformanceBenchmark, 
  createDefaultBenchmarkConfig,
  runQuickBenchmark,
  type BenchmarkResult 
} from '../performance/PerformanceBenchmark'
import { PerformanceOptimizer } from '../performance/PerformanceOptimizer'
import { 
  createPerformanceMonitoringSuite,
  GridPerformanceOptimizer,
  type PerformanceTimer
} from '../utils/performanceUtils'
import { createDefaultGridProConfig } from '../types/gridpro'
import { 
  PERFORMANCE_PRESETS,
  detectOptimalPreset,
  applyPerformancePreset
} from '../performance'
import type { GridProConfig } from '../types/gridpro'

interface TestScenario {
  name: string
  description: string
  itemCounts: number[]
  config: Partial<GridProConfig>
  expectedPerformance: {
    minFPS: number
    maxRenderTime: number
    maxMemoryMB: number
  }
}

/**
 * 性能测试场景定义
 */
const TEST_SCENARIOS: TestScenario[] = [
  {
    name: 'lightweight',
    description: '轻量级场景 - 少量项目',
    itemCounts: [10, 25, 50],
    config: {
      virtualization: { enabled: false },
      animation: { enabled: true, duration: 300 },
      performance: { batchUpdates: false }
    },
    expectedPerformance: {
      minFPS: 55,
      maxRenderTime: 10,
      maxMemoryMB: 20
    }
  },
  {
    name: 'standard',
    description: '标准场景 - 中等数量项目',
    itemCounts: [100, 200, 300],
    config: {
      virtualization: { enabled: false },
      animation: { enabled: true, duration: 250 },
      performance: { batchUpdates: true, batchSize: 20 }
    },
    expectedPerformance: {
      minFPS: 45,
      maxRenderTime: 25,
      maxMemoryMB: 50
    }
  },
  {
    name: 'heavy',
    description: '重负载场景 - 大量项目',
    itemCounts: [500, 1000, 1500],
    config: {
      virtualization: { enabled: true, bufferSize: 50 },
      animation: { enabled: false },
      performance: { 
        batchUpdates: true, 
        batchSize: 50,
        enableObjectPool: true 
      }
    },
    expectedPerformance: {
      minFPS: 30,
      maxRenderTime: 50,
      maxMemoryMB: 100
    }
  },
  {
    name: 'extreme',
    description: '极限场景 - 超大量项目',
    itemCounts: [2000, 3000, 5000],
    config: {
      virtualization: { enabled: true, bufferSize: 100 },
      animation: { enabled: false },
      performance: {
        batchUpdates: true,
        batchSize: 100,
        enableObjectPool: true,
        poolSize: 200,
        throttleInterval: 32
      }
    },
    expectedPerformance: {
      minFPS: 20,
      maxRenderTime: 100,
      maxMemoryMB: 200
    }
  }
]

/**
 * 性能测试管理器
 */
export class PerformanceTestManager {
  private benchmark: PerformanceBenchmark
  private optimizer: PerformanceOptimizer
  private monitoringSuite: ReturnType<typeof createPerformanceMonitoringSuite>
  private results: Map<string, BenchmarkResult[]> = new Map()
  private reports: string[] = []

  constructor() {
    this.benchmark = new PerformanceBenchmark(createDefaultBenchmarkConfig())
    this.optimizer = new PerformanceOptimizer()
    this.monitoringSuite = createPerformanceMonitoringSuite()
  }

  /**
   * 运行所有测试场景
   */
  async runAllScenarios(): Promise<{
    results: Map<string, BenchmarkResult[]>
    reports: string[]
    summary: string
  }> {
    console.log('🚀 开始GridPro性能测试套件')
    console.log('=' .repeat(60))

    this.results.clear()
    this.reports = []

    // 检测最优预设配置
    const optimalPreset = detectOptimalPreset()
    console.log(`🎯 检测到最优预设: ${optimalPreset}`)

    // 运行各个场景测试
    for (const scenario of TEST_SCENARIOS) {
      await this.runScenario(scenario, optimalPreset)
    }

    // 生成综合报告
    const summary = this.generateSummaryReport()

    return {
      results: this.results,
      reports: this.reports,
      summary
    }
  }

  /**
   * 运行单个测试场景
   */
  private async runScenario(
    scenario: TestScenario,
    basePreset: keyof typeof PERFORMANCE_PRESETS
  ): Promise<void> {
    console.log(`\n📊 运行场景: ${scenario.name}`)
    console.log(`描述: ${scenario.description}`)
    console.log(`项目数量: ${scenario.itemCounts.join(', ')}`)

    // 合并配置
    const baseConfig = applyPerformancePreset(basePreset, createDefaultGridProConfig())
    const scenarioConfig = { ...baseConfig, ...scenario.config }

    // 运行基准测试
    const scenarioResults: BenchmarkResult[] = []

    for (const itemCount of scenario.itemCounts) {
      console.log(`  测试 ${itemCount} 个项目...`)
      
      try {
        // 更新配置中的项目数量相关设置
        const testConfig = this.adaptConfigForItemCount(scenarioConfig, itemCount)
        
        // 运行测试
        const results = await this.runBenchmarkForConfig(testConfig, itemCount)
        scenarioResults.push(...results)
        
        // 显示即时结果
        const latestResult = results[results.length - 1]
        if (latestResult) {
          console.log(`    综合评分: ${latestResult.scores.overall}/100`)
          console.log(`    渲染时间: ${latestResult.renderTime.toFixed(1)}ms`)
          console.log(`    FPS: ${latestResult.fps.toFixed(1)}`)
          console.log(`    内存: ${(latestResult.memoryUsage.used / 1024 / 1024).toFixed(1)}MB`)
        }

      } catch (error) {
        console.error(`    测试失败:`, error)
      }
    }

    // 保存结果
    this.results.set(scenario.name, scenarioResults)

    // 生成场景报告
    const scenarioReport = this.generateScenarioReport(scenario, scenarioResults)
    this.reports.push(scenarioReport)

    console.log(`✅ 场景 ${scenario.name} 测试完成`)
  }

  /**
   * 为特定项目数量调整配置
   */
  private adaptConfigForItemCount(config: GridProConfig, itemCount: number): GridProConfig {
    const adaptedConfig = { ...config }

    // 自动启用虚拟化
    if (itemCount > 200 && !adaptedConfig.virtualization?.enabled) {
      adaptedConfig.virtualization = {
        enabled: true,
        bufferSize: Math.min(100, Math.max(20, Math.floor(itemCount / 20))),
        preloadCount: Math.min(20, Math.max(5, Math.floor(itemCount / 100)))
      }
    }

    // 调整批处理大小
    if (adaptedConfig.performance?.batchUpdates) {
      adaptedConfig.performance.batchSize = Math.min(100, Math.max(10, Math.floor(itemCount / 20)))
    }

    // 调整对象池大小
    if (adaptedConfig.performance?.enableObjectPool) {
      adaptedConfig.performance.poolSize = Math.min(500, Math.max(50, Math.floor(itemCount / 10)))
    }

    return adaptedConfig
  }

  /**
   * 为特定配置运行基准测试
   */
  private async runBenchmarkForConfig(
    config: GridProConfig,
    itemCount: number
  ): Promise<BenchmarkResult[]> {
    // 创建专门的基准测试配置
    const benchmarkConfig = {
      itemCounts: [itemCount],
      testDuration: 1000, // 1秒测试
      enableMemoryProfiling: true,
      enableFPSMeasurement: true,
      enableInteractionTesting: itemCount <= 500, // 大量项目时跳过交互测试
      warmupRounds: 1
    }

    const benchmark = new PerformanceBenchmark(benchmarkConfig)
    
    try {
      const results = await benchmark.runBenchmarkSuite()
      return results
    } finally {
      benchmark.dispose()
    }
  }

  /**
   * 生成场景报告
   */
  private generateScenarioReport(
    scenario: TestScenario,
    results: BenchmarkResult[]
  ): string {
    let report = `\n📈 ${scenario.name.toUpperCase()} 场景测试报告\n`
    report += '=' .repeat(50) + '\n'
    report += `描述: ${scenario.description}\n`

    if (results.length === 0) {
      report += '⚠️  无测试结果\n'
      return report
    }

    // 计算平均指标
    const avgScore = results.reduce((sum, r) => sum + r.scores.overall, 0) / results.length
    const avgRenderTime = results.reduce((sum, r) => sum + r.renderTime, 0) / results.length
    const avgFPS = results.reduce((sum, r) => sum + r.fps, 0) / results.length
    const avgMemory = results.reduce((sum, r) => sum + r.memoryUsage.used, 0) / results.length

    report += `\n📊 平均性能指标:\n`
    report += `  综合评分: ${avgScore.toFixed(1)}/100\n`
    report += `  平均渲染时间: ${avgRenderTime.toFixed(1)}ms\n`
    report += `  平均FPS: ${avgFPS.toFixed(1)}\n`
    report += `  平均内存使用: ${(avgMemory / 1024 / 1024).toFixed(1)}MB\n`

    // 性能等级评估
    const performanceGrade = this.calculatePerformanceGrade(avgScore, scenario.expectedPerformance)
    report += `\n🏆 性能等级: ${performanceGrade.grade} (${performanceGrade.description})\n`

    // 与预期性能对比
    report += `\n📋 性能对比:\n`
    report += `  FPS: ${avgFPS.toFixed(1)} (预期 ≥${scenario.expectedPerformance.minFPS})\n`
    report += `  渲染时间: ${avgRenderTime.toFixed(1)}ms (预期 ≤${scenario.expectedPerformance.maxRenderTime}ms)\n`
    report += `  内存使用: ${(avgMemory / 1024 / 1024).toFixed(1)}MB (预期 ≤${scenario.expectedPerformance.maxMemoryMB}MB)\n`

    // 生成优化建议
    const suggestions = this.optimizer.analyzePerformance(results, scenario.config as GridProConfig)
    if (suggestions.length > 0) {
      report += `\n💡 优化建议:\n`
      suggestions.slice(0, 3).forEach((suggestion, index) => {
        report += `  ${index + 1}. ${suggestion.rule.description}\n`
        report += `     ${suggestion.reason}\n`
      })
    }

    return report
  }

  /**
   * 计算性能等级
   */
  private calculatePerformanceGrade(
    avgScore: number,
    expected: TestScenario['expectedPerformance']
  ): { grade: string; description: string } {
    if (avgScore >= 90) {
      return { grade: 'S', description: '卓越' }
    } else if (avgScore >= 80) {
      return { grade: 'A', description: '优秀' }
    } else if (avgScore >= 70) {
      return { grade: 'B', description: '良好' }
    } else if (avgScore >= 60) {
      return { grade: 'C', description: '及格' }
    } else {
      return { grade: 'D', description: '需要优化' }
    }
  }

  /**
   * 生成综合报告
   */
  private generateSummaryReport(): string {
    let summary = `\n🏆 GridPro 性能测试综合报告\n`
    summary += '=' .repeat(60) + '\n'
    summary += `测试时间: ${new Date().toLocaleString()}\n`
    summary += `测试场景: ${TEST_SCENARIOS.length} 个\n`

    // 统计所有结果
    const allResults: BenchmarkResult[] = []
    this.results.forEach(results => allResults.push(...results))

    if (allResults.length === 0) {
      summary += '\n⚠️  无有效测试结果\n'
      return summary
    }

    // 计算总体指标
    const overallAvgScore = allResults.reduce((sum, r) => sum + r.scores.overall, 0) / allResults.length
    const overallAvgRenderTime = allResults.reduce((sum, r) => sum + r.renderTime, 0) / allResults.length
    const overallAvgFPS = allResults.reduce((sum, r) => sum + r.fps, 0) / allResults.length
    const overallAvgMemory = allResults.reduce((sum, r) => sum + r.memoryUsage.used, 0) / allResults.length

    summary += `\n📊 总体性能指标:\n`
    summary += `  综合评分: ${overallAvgScore.toFixed(1)}/100\n`
    summary += `  平均渲染时间: ${overallAvgRenderTime.toFixed(1)}ms\n`
    summary += `  平均FPS: ${overallAvgFPS.toFixed(1)}\n`
    summary += `  平均内存使用: ${(overallAvgMemory / 1024 / 1024).toFixed(1)}MB\n`

    // 各场景表现总结
    summary += `\n📈 各场景表现:\n`
    this.results.forEach((results, scenarioName) => {
      if (results.length > 0) {
        const scenarioAvgScore = results.reduce((sum, r) => sum + r.scores.overall, 0) / results.length
        const grade = this.calculatePerformanceGrade(scenarioAvgScore, { minFPS: 30, maxRenderTime: 50, maxMemoryMB: 100 })
        summary += `  ${scenarioName}: ${scenarioAvgScore.toFixed(1)}/100 (${grade.grade})\n`
      }
    })

    // 性能建议
    summary += `\n💡 总体建议:\n`
    if (overallAvgScore >= 80) {
      summary += `  ✅ GridPro渲染器性能表现优秀，可以投入生产使用\n`
    } else if (overallAvgScore >= 60) {
      summary += `  ⚠️  性能表现良好，建议根据具体场景进行优化\n`
    } else {
      summary += `  ❌ 性能需要改进，建议启用所有优化选项\n`
    }

    // 最佳实践建议
    summary += `\n🎯 最佳实践建议:\n`
    summary += `  1. 当项目数量 >200 时，启用虚拟化\n`
    summary += `  2. 在移动设备上禁用动画以提高性能\n`
    summary += `  3. 启用批量更新和对象池优化内存使用\n`
    summary += `  4. 根据设备能力自动选择性能预设\n`
    summary += `  5. 定期运行性能测试，监控性能回归\n`

    return summary
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.benchmark.dispose()
    this.monitoringSuite.fps.stop()
  }
}

/**
 * 运行快速性能测试
 */
export async function runQuickPerformanceTest(): Promise<string> {
  console.log('🚀 运行快速性能测试...')
  
  try {
    const results = await runQuickBenchmark()
    
    let report = '\n⚡ 快速性能测试报告\n'
    report += '=' .repeat(40) + '\n'
    
    if (results.length > 0) {
      const avgScore = results.reduce((sum, r) => sum + r.scores.overall, 0) / results.length
      report += `综合评分: ${avgScore.toFixed(1)}/100\n`
      
      if (avgScore >= 70) {
        report += '✅ 性能表现良好\n'
      } else {
        report += '⚠️  建议运行完整测试获取优化建议\n'
      }
    } else {
      report += '❌ 测试失败，请检查环境配置\n'
    }
    
    return report
    
  } catch (error) {
    return `❌ 快速测试失败: ${error}`
  }
}

/**
 * 运行完整性能测试
 */
export async function runFullPerformanceTest(): Promise<{
  success: boolean
  summary: string
  reports: string[]
  rawData: Map<string, BenchmarkResult[]>
}> {
  const testManager = new PerformanceTestManager()
  
  try {
    const { results, reports, summary } = await testManager.runAllScenarios()
    
    return {
      success: true,
      summary,
      reports,
      rawData: results
    }
    
  } catch (error) {
    return {
      success: false,
      summary: `测试失败: ${error}`,
      reports: [],
      rawData: new Map()
    }
  } finally {
    testManager.dispose()
  }
}

/**
 * 导出测试结果到文件
 */
export function exportTestResults(
  results: Map<string, BenchmarkResult[]>,
  summary: string,
  format: 'json' | 'csv' | 'markdown' = 'json'
): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

  switch (format) {
    case 'json':
      return JSON.stringify({
        timestamp,
        summary,
        results: Object.fromEntries(results),
        metadata: {
          browser: navigator.userAgent,
          memory: (navigator as any).deviceMemory || 'unknown',
          cores: navigator.hardwareConcurrency || 'unknown'
        }
      }, null, 2)

    case 'csv':
      let csv = 'Scenario,TestName,ItemCount,OverallScore,RenderingScore,MemoryScore,ResponsivenessScore,RenderTime,FPS,MemoryUsed\n'
      results.forEach((scenarioResults, scenarioName) => {
        scenarioResults.forEach(result => {
          const itemCount = result.testName.match(/(\d+)/) || ['', '0']
          csv += `${scenarioName},${result.testName},${itemCount[1]},${result.scores.overall},${result.scores.rendering},${result.scores.memory},${result.scores.responsiveness},${result.renderTime},${result.fps},${result.memoryUsage.used}\n`
        })
      })
      return csv

    case 'markdown':
      let md = `# GridPro 性能测试报告\n\n`
      md += `**测试时间:** ${new Date().toLocaleString()}\n\n`
      md += `## 综合报告\n\n${summary}\n\n`
      md += `## 详细结果\n\n`
      
      results.forEach((scenarioResults, scenarioName) => {
        md += `### ${scenarioName.toUpperCase()}\n\n`
        md += `| 测试名称 | 综合评分 | 渲染时间(ms) | FPS | 内存使用(MB) |\n`
        md += `|---------|---------|-------------|-----|-------------|\n`
        
        scenarioResults.forEach(result => {
          md += `| ${result.testName} | ${result.scores.overall} | ${result.renderTime.toFixed(1)} | ${result.fps.toFixed(1)} | ${(result.memoryUsage.used / 1024 / 1024).toFixed(1)} |\n`
        })
        
        md += `\n`
      })
      
      return md

    default:
      return ''
  }
}

// 如果在浏览器环境中直接运行
if (typeof window !== 'undefined') {
  // 添加到全局对象供调试使用
  ;(window as any).GridProPerformanceTest = {
    runQuickTest: runQuickPerformanceTest,
    runFullTest: runFullPerformanceTest,
    exportResults: exportTestResults
  }
}