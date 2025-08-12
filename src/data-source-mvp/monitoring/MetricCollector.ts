import type { Metric, MetricReport } from './types'

export class MetricCollector {
  private metrics: Metric[] = []
  private maxMetrics = 1000 // 保留最近1000条记录

  record(metric: Metric): void {
    this.metrics.push(metric)

    // 保持指标数量在限制内
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift()
    }
  }

  generateReport(): MetricReport {
    const recentMetrics = this.metrics.slice(-100) // 最近100条

    return {
      totalRequests: this.metrics.length,
      successfulRequests: this.metrics.filter(m => m.success).length,
      failedRequests: this.metrics.filter(m => !m.success).length,
      averageResponseTime: this.calculateAverageResponseTime(recentMetrics),
      minResponseTime: Math.min(...recentMetrics.map(m => m.responseTime)),
      maxResponseTime: Math.max(...recentMetrics.map(m => m.responseTime)),
      errorRate: this.calculateErrorRate(),
      lastUpdated: new Date()
    }
  }

  private calculateAverageResponseTime(metrics: Metric[]): number {
    if (metrics.length === 0) return 0
    return metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length
  }

  private calculateErrorRate(): number {
    if (this.metrics.length === 0) return 0
    return this.metrics.filter(m => !m.success).length / this.metrics.length
  }
}
