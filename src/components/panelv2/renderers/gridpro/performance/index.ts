/**
 * GridPro 性能模块统一导出
 */

export { PerformanceBenchmark, createDefaultBenchmarkConfig, runQuickBenchmark } from './PerformanceBenchmark'
export { PerformanceOptimizer } from './PerformanceOptimizer'
export { default as PerformanceMonitor } from './PerformanceMonitor.vue'

export type { BenchmarkResult, BenchmarkConfig } from './PerformanceBenchmark'
export type { OptimizationRule, OptimizationSuggestion } from './PerformanceOptimizer'

// 导出测试脚本
export { 
  PerformanceTestManager,
  runQuickPerformanceTest,
  runFullPerformanceTest,
  exportTestResults
} from '../scripts/runPerformanceTests'

// 导出性能工具
export {
  createPerformanceMonitoringSuite,
  GridPerformanceOptimizer,
  PerformanceTimer,
  MemoryMonitor,
  FPSMonitor,
  RenderProfiler,
  performanceUtils
} from '../utils/performanceUtils'

/**
 * 性能测试工具函数
 */
export async function createPerformanceReport(config: any, itemCount: number): Promise<string> {
  const { PerformanceBenchmark, createDefaultBenchmarkConfig } = await import('./PerformanceBenchmark')
  const { PerformanceOptimizer } = await import('./PerformanceOptimizer')
  
  const benchmark = new PerformanceBenchmark(createDefaultBenchmarkConfig())
  const optimizer = new PerformanceOptimizer()
  
  try {
    const results = await benchmark.runBenchmarkSuite()
    const suggestions = optimizer.analyzePerformance(results, config)
    
    let report = '\n🚀 GridPro 性能报告\n'
    report += '='.repeat(50) + '\n'
    
    // 基本信息
    report += `\n📊 测试配置:\n`
    report += `   项目数量: ${itemCount}\n`
    report += `   测试时间: ${new Date().toLocaleString()}\n`
    
    // 性能指标摘要
    if (results.length > 0) {
      const avgScore = results.reduce((sum, r) => sum + r.scores.overall, 0) / results.length
      const avgRenderTime = results.reduce((sum, r) => sum + r.renderTime, 0) / results.length
      const avgFPS = results.reduce((sum, r) => sum + r.fps, 0) / results.length
      const avgMemory = results.reduce((sum, r) => sum + r.memoryUsage.used, 0) / results.length
      
      report += `\n📈 性能摘要:\n`
      report += `   综合评分: ${avgScore.toFixed(1)}/100\n`
      report += `   平均渲染时间: ${avgRenderTime.toFixed(1)}ms\n`
      report += `   平均帧率: ${avgFPS.toFixed(1)}fps\n`
      report += `   平均内存使用: ${(avgMemory / 1024 / 1024).toFixed(1)}MB\n`
    }
    
    // 优化建议
    if (suggestions.length > 0) {
      report += optimizer.generateOptimizationReport(suggestions)
    }
    
    return report
    
  } finally {
    benchmark.dispose()
  }
}

/**
 * 性能优化预设配置
 */
export const PERFORMANCE_PRESETS = {
  // 高性能模式 - 适用于现代高端设备
  highPerformance: {
    animation: {
      enabled: true,
      duration: 200,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      quality: 'high'
    },
    performance: {
      batchUpdates: true,
      batchSize: 50,
      batchInterval: 8,
      throttleInterval: 8,
      debounceInterval: 50,
      enableObjectPool: true,
      poolSize: 200,
      cacheGridCalculations: true,
      useFastMath: true
    },
    virtualization: {
      enabled: false, // 高性能设备可以不启用虚拟化
      bufferSize: 100,
      preloadCount: 20
    }
  },

  // 平衡模式 - 适用于大多数设备
  balanced: {
    animation: {
      enabled: true,
      duration: 250,
      easing: 'ease-out',
      quality: 'medium'
    },
    performance: {
      batchUpdates: true,
      batchSize: 30,
      batchInterval: 16,
      throttleInterval: 16,
      debounceInterval: 100,
      enableObjectPool: true,
      poolSize: 100,
      cacheGridCalculations: true,
      useFastMath: false
    },
    virtualization: {
      enabled: true,
      bufferSize: 50,
      preloadCount: 10
    }
  },

  // 节能模式 - 适用于低端设备或省电需求
  powerSaving: {
    animation: {
      enabled: false,
      duration: 150,
      easing: 'linear',
      quality: 'low'
    },
    performance: {
      batchUpdates: true,
      batchSize: 20,
      batchInterval: 32,
      throttleInterval: 32,
      debounceInterval: 200,
      enableObjectPool: true,
      poolSize: 50,
      cacheGridCalculations: true,
      useFastMath: true
    },
    virtualization: {
      enabled: true,
      bufferSize: 20,
      preloadCount: 5
    }
  },

  // 内存优化模式 - 适用于内存受限环境
  memoryOptimized: {
    animation: {
      enabled: false,
      duration: 200,
      easing: 'linear',
      quality: 'low'
    },
    performance: {
      batchUpdates: true,
      batchSize: 10,
      batchInterval: 16,
      throttleInterval: 16,
      debounceInterval: 100,
      enableObjectPool: true,
      poolSize: 30,
      cacheGridCalculations: false, // 关闭缓存以节省内存
      useFastMath: true
    },
    virtualization: {
      enabled: true,
      bufferSize: 10,
      preloadCount: 3
    }
  }
}

/**
 * 根据设备能力自动选择预设
 */
export function detectOptimalPreset(): keyof typeof PERFORMANCE_PRESETS {
  // 检测设备内存
  const memory = (navigator as any).deviceMemory || 4 // 默认4GB
  
  // 检测CPU核心数
  const cores = navigator.hardwareConcurrency || 4
  
  // 检测是否为移动设备
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  
  // 检测是否支持硬件加速
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
  const hasWebGL = !!gl
  
  // 根据设备能力评分
  let score = 0
  
  if (memory >= 8) score += 3
  else if (memory >= 4) score += 2
  else score += 1
  
  if (cores >= 8) score += 2
  else if (cores >= 4) score += 1
  
  if (hasWebGL) score += 1
  if (!isMobile) score += 1
  
  // 根据评分选择预设
  if (score >= 7) return 'highPerformance'
  if (score >= 4) return 'balanced'
  if (score >= 2) return 'powerSaving'
  return 'memoryOptimized'
}

/**
 * 应用性能预设
 */
export function applyPerformancePreset(
  preset: keyof typeof PERFORMANCE_PRESETS,
  baseConfig: any
): any {
  const presetConfig = PERFORMANCE_PRESETS[preset]
  
  return {
    ...baseConfig,
    ...presetConfig
  }
}

/**
 * 创建自适应性能配置
 */
export function createAdaptivePerformanceConfig(baseConfig: any): any {
  const optimalPreset = detectOptimalPreset()
  return applyPerformancePreset(optimalPreset, baseConfig)
}