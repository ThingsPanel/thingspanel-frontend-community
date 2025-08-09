import { reactive } from 'vue'
import type {
  MetricCollector,
  Metric,
  PerformanceReport,
  RealTimeMetrics,
  UserExperienceMetric,
  PerformanceRecommendation,
  AlertRule
} from './types'

export class DataSourceMonitor {
  private metrics: Map<string, MetricCollector> = new Map()
  private userExperienceMetrics: UserExperienceMetric[] = []
  private performanceData = reactive({
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    activeDataSources: 0,
    cacheHitRate: 0,
    memoryUsage: 0
  })

  // 性能阈值配置
  private performanceThresholds = {
    configSave: 500, // 配置保存时间阈值（毫秒）
    dataLoad: 2000, // 数据加载时间阈值（毫秒）
    bindingUpdate: 1000, // 绑定更新时间阈值（毫秒）
    cacheHitRate: 0.7 // 缓存命中率阈值
  }

  // 记录性能指标
  recordMetric(dataSourceId: string, metric: Metric): void {
    const collector = this.metrics.get(dataSourceId) || new MetricCollector()
    collector.record(metric)
    this.metrics.set(dataSourceId, collector)

    // 更新全局性能数据
    this.updateGlobalMetrics(metric)
  }

  // 获取性能报告
  getPerformanceReport(dataSourceId?: string): PerformanceReport {
    if (dataSourceId) {
      const collector = this.metrics.get(dataSourceId)
      return collector ? collector.generateReport() : null
    }

    return {
      global: this.performanceData,
      dataSources: Array.from(this.metrics.entries()).map(([id, collector]) => ({
        id,
        metrics: collector.generateReport()
      }))
    }
  }

  // 获取实时监控数据
  getRealTimeMetrics(): RealTimeMetrics {
    return {
      activeConnections: this.performanceData.activeDataSources,
      requestRate: this.calculateRequestRate(),
      errorRate: this.calculateErrorRate(),
      averageLatency: this.performanceData.averageResponseTime,
      memoryUsage: this.performanceData.memoryUsage
    }
  }

  // 记录用户体验指标
  recordUserExperienceMetric(metric: UserExperienceMetric): void {
    const { interactionType, duration, success } = metric

    // 记录用户操作性能
    this.userExperienceMetrics.push({
      timestamp: Date.now(),
      interactionType,
      duration,
      success,
      context: this.getCurrentContext()
    })

    // 触发性能告警
    if (duration > this.performanceThresholds[interactionType]) {
      this.triggerPerformanceAlert(metric)
    }
  }

  // 获取性能建议
  getPerformanceRecommendations(): PerformanceRecommendation[] {
    const recommendations: PerformanceRecommendation[] = []

    // 分析缓存命中率
    if (this.performanceData.cacheHitRate < this.performanceThresholds.cacheHitRate) {
      recommendations.push({
        type: 'cache_optimization',
        priority: 'high',
        description: '缓存命中率较低，建议优化缓存策略',
        action: '调整缓存TTL或增加预加载'
      })
    }

    // 分析响应时间
    if (this.performanceData.averageResponseTime > 2000) {
      recommendations.push({
        type: 'response_time_optimization',
        priority: 'medium',
        description: '平均响应时间较长，建议优化数据源配置',
        action: '检查网络连接或调整超时设置'
      })
    }

    return recommendations
  }

  // 设置告警规则
  setAlertRule(rule: AlertRule): void {
    // 实现告警规则设置
  }

  // 获取当前上下文
  private getCurrentContext(): string {
    return 'data_source_configuration'
  }

  // 触发性能告警
  private triggerPerformanceAlert(metric: UserExperienceMetric): void {
    console.warn(
      `性能告警: ${metric.interactionType} 操作耗时 ${metric.duration}ms，超过阈值 ${this.performanceThresholds[metric.interactionType]}ms`
    )
  }

  private updateGlobalMetrics(metric: Metric): void {
    this.performanceData.totalRequests++

    if (metric.success) {
      this.performanceData.successfulRequests++
    } else {
      this.performanceData.failedRequests++
    }

    // 更新平均响应时间
    this.performanceData.averageResponseTime = (this.performanceData.averageResponseTime + metric.responseTime) / 2
  }

  private calculateRequestRate(): number {
    // 计算每秒请求数
    return (this.performanceData.totalRequests / (Date.now() - this.startTime)) * 1000
  }

  private calculateErrorRate(): number {
    if (this.performanceData.totalRequests === 0) return 0
    return this.performanceData.failedRequests / this.performanceData.totalRequests
  }

  private startTime: number = Date.now()
}
