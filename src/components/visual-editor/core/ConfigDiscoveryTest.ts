/**
 * ConfigDiscovery 性能测试工具
 * 用于验证优化效果和性能监控
 */

import { getConfigDiscovery } from './ConfigDiscovery'
import { createLogger } from '@/utils/logger'

const logger = createLogger('ConfigDiscoveryTest')

/**
 * 性能测试类
 */
export class ConfigDiscoveryPerformanceTest {
  private discovery = getConfigDiscovery()

  /**
   * 运行基础性能测试
   */
  async runBasicPerformanceTest(): Promise<void> {
    logger.info('开始运行 ConfigDiscovery 性能测试')

    const testStart = performance.now()

    try {
      // 清除之前的缓存以确保测试准确性
      this.discovery.clearCache()
      this.discovery.clearStats()

      // 第一次扫描（无缓存）
      logger.info('=== 第一次扫描（无缓存）===')
      const firstScanStart = performance.now()
      await this.discovery.initialize()
      const firstScanTime = performance.now() - firstScanStart

      const firstScanStats = this.discovery.getStats()
      logger.info(`第一次扫描完成：${Math.round(firstScanTime)}ms`)
      logger.info(`发现组件数量：${firstScanStats.total}`)
      logger.info(`成功率：${firstScanStats.performance.successRate}%`)
      logger.info(`缓存命中率：${firstScanStats.performance.cacheHitRate}%`)

      // 重置发现器，模拟应用重启
      this.discovery.dispose()

      // 第二次扫描（有缓存）
      logger.info('=== 第二次扫描（有缓存）===')
      const secondScanStart = performance.now()
      await this.discovery.initialize()
      const secondScanTime = performance.now() - secondScanStart

      const secondScanStats = this.discovery.getStats()
      logger.info(`第二次扫描完成：${Math.round(secondScanTime)}ms`)
      logger.info(`发现组件数量：${secondScanStats.total}`)
      logger.info(`成功率：${secondScanStats.performance.successRate}%`)
      logger.info(`缓存命中率：${secondScanStats.performance.cacheHitRate}%`)

      // 性能对比
      const speedUpRatio = firstScanTime / Math.max(secondScanTime, 1)
      logger.info(`=== 性能对比 ===`)
      logger.info(`缓存优化提升：${Math.round(speedUpRatio * 100) / 100}x`)
      logger.info(`时间节省：${Math.round(firstScanTime - secondScanTime)}ms`)

      // 输出详细性能报告
      const report = this.discovery.getPerformanceReport()
      logger.info('=== 详细性能报告 ===')
      console.table(report.overview)
      console.table(report.componentLoadTimes)
      console.table(report.errors)
      console.table(report.cache)
    } catch (error) {
      logger.error('性能测试失败:', error)
    } finally {
      const totalTestTime = performance.now() - testStart
      logger.info(`总测试时间：${Math.round(totalTestTime)}ms`)
    }
  }

  /**
   * 测试缓存机制
   */
  async testCachePerformance(): Promise<void> {
    logger.info('开始测试缓存机制')

    try {
      // 清除缓存
      this.discovery.clearCache()

      // 多次初始化测试
      const times: number[] = []

      for (let i = 0; i < 3; i++) {
        this.discovery.dispose()

        const start = performance.now()
        await this.discovery.initialize()
        const end = performance.now()

        times.push(end - start)
        logger.info(`第 ${i + 1} 次初始化耗时：${Math.round(end - start)}ms`)
      }

      logger.info('=== 缓存性能测试结果 ===')
      logger.info(`首次扫描：${Math.round(times[0])}ms`)
      logger.info(`缓存扫描1：${Math.round(times[1])}ms`)
      logger.info(`缓存扫描2：${Math.round(times[2])}ms`)
      logger.info(`平均缓存性能提升：${Math.round((times[0] / ((times[1] + times[2]) / 2)) * 100) / 100}x`)
    } catch (error) {
      logger.error('缓存性能测试失败:', error)
    }
  }

  /**
   * 测试并发扫描性能
   */
  async testConcurrentScanPerformance(): Promise<void> {
    logger.info('开始测试并发扫描性能')

    try {
      // 清除缓存以确保真实扫描
      this.discovery.clearCache()

      // 模拟多个并发初始化请求
      const concurrentRequests = 5
      const promises: Promise<void>[] = []

      const startTime = performance.now()

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(this.discovery.initialize())
      }

      await Promise.all(promises)

      const endTime = performance.now()
      const totalTime = endTime - startTime

      logger.info('=== 并发扫描测试结果 ===')
      logger.info(`${concurrentRequests} 个并发请求总耗时：${Math.round(totalTime)}ms`)
      logger.info(`平均每个请求耗时：${Math.round(totalTime / concurrentRequests)}ms`)

      const stats = this.discovery.getStats()
      logger.info(`最终发现组件数量：${stats.total}`)
    } catch (error) {
      logger.error('并发扫描测试失败:', error)
    }
  }

  /**
   * 运行完整的性能测试套件
   */
  async runFullTestSuite(): Promise<void> {
    logger.info('🚀 开始运行完整的 ConfigDiscovery 性能测试套件')

    try {
      await this.runBasicPerformanceTest()
      await this.testCachePerformance()
      await this.testConcurrentScanPerformance()

      logger.info('✅ 所有性能测试完成')

      // 输出最终统计
      const finalReport = this.discovery.exportDiscoveryInfo()
      logger.info('=== 最终测试报告 ===')
      console.log('Complete Discovery Info:', finalReport)
    } catch (error) {
      logger.error('❌ 性能测试套件执行失败:', error)
    }
  }

  /**
   * 生成性能基准报告
   */
  generateBenchmarkReport(): any {
    const stats = this.discovery.getStats()
    const performanceReport = this.discovery.getPerformanceReport()

    return {
      timestamp: new Date().toISOString(),
      benchmark: {
        totalComponents: stats.total,
        avgScanTime: performanceReport.overview.avgScanTime,
        cacheHitRate: performanceReport.overview.cacheHitRate,
        successRate: performanceReport.overview.successRate,
        avgComponentLoadTime: performanceReport.componentLoadTimes.avg
      },
      optimization: {
        cacheEnabled: stats.cache.enabled,
        concurrencyLimit: 4, // maxConcurrency
        intelligentFiltering: true,
        performanceMonitoring: true
      },
      recommendations: this.generateOptimizationRecommendations(performanceReport)
    }
  }

  /**
   * 生成优化建议
   */
  private generateOptimizationRecommendations(report: any): string[] {
    const recommendations: string[] = []

    if (report.overview.successRate < 90) {
      recommendations.push('成功率较低，建议检查文件路径和模块加载逻辑')
    }

    if (report.overview.cacheHitRate < 50) {
      recommendations.push('缓存命中率较低，建议检查缓存策略和过期时间')
    }

    if (report.componentLoadTimes.avg > 50) {
      recommendations.push('组件加载时间较长，建议优化异步组件加载逻辑')
    }

    if (report.errors.rate > 10) {
      recommendations.push('错误率较高，建议加强错误处理和文件验证')
    }

    if (recommendations.length === 0) {
      recommendations.push('性能表现良好，无需特殊优化')
    }

    return recommendations
  }
}

// 导出测试实例
export const configDiscoveryTest = new ConfigDiscoveryPerformanceTest()

// 全局测试函数，可在浏览器控制台中调用
if (typeof window !== 'undefined') {
  ;(window as any).testConfigDiscoveryPerformance = () => {
    return configDiscoveryTest.runFullTestSuite()
  }
  ;(window as any).getConfigDiscoveryBenchmark = () => {
    return configDiscoveryTest.generateBenchmarkReport()
  }
}
