// 性能指标接口
export interface Metric {
  dataSourceId: string
  timestamp: number
  success: boolean
  responseTime: number
  error?: string
  metadata?: Record<string, any>
}

// 性能报告接口
export interface PerformanceReport {
  global?: any
  dataSources?: Array<{
    id: string
    metrics: MetricReport
  }>
}

// 指标报告接口
export interface MetricReport {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  minResponseTime: number
  maxResponseTime: number
  errorRate: number
  lastUpdated: Date
}

// 实时监控数据接口
export interface RealTimeMetrics {
  activeConnections: number
  requestRate: number
  errorRate: number
  averageLatency: number
  memoryUsage: number
}

// 用户体验指标接口
export interface UserExperienceMetric {
  timestamp: number
  interactionType: 'configSave' | 'dataLoad' | 'bindingUpdate' | 'cacheAccess'
  duration: number
  success: boolean
  context: string
}

// 性能建议接口
export interface PerformanceRecommendation {
  type: 'cache_optimization' | 'response_time_optimization' | 'memory_optimization'
  priority: 'high' | 'medium' | 'low'
  description: string
  action: string
}

// 告警规则接口
export interface AlertRule {
  id: string
  name: string
  condition: AlertCondition
  action: AlertAction
  enabled: boolean
}

export interface AlertCondition {
  metric: string
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte'
  threshold: number
  duration: number // 持续时间（秒）
}

export interface AlertAction {
  type: 'notification' | 'webhook' | 'email'
  config: Record<string, any>
}

// 指标收集器接口
export interface MetricCollector {
  record(metric: Metric): void
  generateReport(): MetricReport
}
