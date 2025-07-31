<template>
  <div class="performance-monitor">
    <!-- 性能监控面板 -->
    <n-card v-if="showMonitor" class="monitor-panel" size="small" :style="componentThemeVars">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-medium">性能监控</span>
          <div class="flex items-center gap-2">
            <n-button
              quaternary
              size="small"
              @click="toggleMonitoring"
              :type="isMonitoring ? 'success' : 'default'"
            >
              <template #icon>
                <PlayOutline v-if="!isMonitoring" />
                <PauseOutline v-else />
              </template>
              {{ isMonitoring ? '暂停' : '开始' }}
            </n-button>
            <n-button
              quaternary
              size="small"
              @click="runBenchmark"
              :loading="benchmarkRunning"
            >
              <template #icon>
                <SpeedometerOutline />
              </template>
              基准测试
            </n-button>
            <n-button
              quaternary
              size="small"
              @click="toggleMonitor"
            >
              <template #icon>
                <CloseOutline />
              </template>
            </n-button>
          </div>
        </div>
      </template>

      <!-- 实时性能指标 -->
      <div class="metrics-grid">
        <div class="metric-item">
          <div class="metric-label">FPS</div>
          <div class="metric-value" :class="getFpsClass(currentMetrics.fps)">
            {{ currentMetrics.fps.toFixed(1) }}
          </div>
        </div>

        <div class="metric-item">
          <div class="metric-label">渲染时间</div>
          <div class="metric-value" :class="getRenderTimeClass(currentMetrics.renderTime)">
            {{ currentMetrics.renderTime.toFixed(1) }}ms
          </div>
        </div>

        <div class="metric-item">
          <div class="metric-label">内存使用</div>
          <div class="metric-value" :class="getMemoryClass(currentMetrics.memoryUsage)">
            {{ (currentMetrics.memoryUsage / 1024 / 1024).toFixed(1) }}MB
          </div>
        </div>

        <div class="metric-item">
          <div class="metric-label">项目数量</div>
          <div class="metric-value">
            {{ currentMetrics.itemCount }}
          </div>
        </div>
      </div>

      <!-- 性能图表 -->
      <div v-if="showCharts" class="charts-container">
        <div class="chart-item">
          <div class="chart-title">FPS 趋势</div>
          <div ref="fpsChartRef" class="chart" style="height: 100px;"></div>
        </div>

        <div class="chart-item">
          <div class="chart-title">内存使用趋势</div>
          <div ref="memoryChartRef" class="chart" style="height: 100px;"></div>
        </div>
      </div>

      <!-- 优化建议 -->
      <div v-if="optimizationSuggestions.length > 0" class="suggestions-container">
        <n-divider />
        <div class="suggestions-header">
          <span class="font-medium">优化建议</span>
          <n-button
            quaternary
            size="small"
            @click="applyOptimizations"
            :loading="optimizationApplying"
          >
            <template #icon>
              <FlashOutline />
            </template>
            自动优化
          </n-button>
        </div>

        <div class="suggestions-list">
          <div
            v-for="(suggestion, index) in optimizationSuggestions.slice(0, 3)"
            :key="index"
            class="suggestion-item"
          >
            <div class="suggestion-icon">
              <component
                :is="getSuggestionIcon(suggestion.rule.impact)"
                class="w-4 h-4"
              />
            </div>
            <div class="suggestion-content">
              <div class="suggestion-title">{{ suggestion.rule.description }}</div>
              <div class="suggestion-reason">{{ suggestion.reason }}</div>
            </div>
            <n-button
              quaternary
              size="tiny"
              @click="applySingleOptimization(suggestion)"
            >
              应用
            </n-button>
          </div>
        </div>
      </div>

      <!-- 基准测试结果 -->
      <div v-if="benchmarkResults.length > 0" class="benchmark-results">
        <n-divider />
        <div class="benchmark-header">
          <span class="font-medium">基准测试结果</span>
          <n-button
            quaternary
            size="small"
            @click="showBenchmarkDetails = !showBenchmarkDetails"
          >
            {{ showBenchmarkDetails ? '收起' : '详情' }}
          </n-button>
        </div>

        <div v-if="showBenchmarkDetails" class="benchmark-details">
          <div
            v-for="result in benchmarkResults.slice(-3)"
            :key="result.timestamp"
            class="benchmark-item"
          >
            <div class="benchmark-name">{{ result.testName }}</div>
            <div class="benchmark-scores">
              <span class="score-item">
                总分: {{ result.scores.overall }}/100
              </span>
              <span class="score-item">
                渲染: {{ result.scores.rendering }}/100
              </span>
              <span class="score-item">
                内存: {{ result.scores.memory }}/100
              </span>
              <span class="score-item">
                响应: {{ result.scores.responsiveness }}/100
              </span>
            </div>
          </div>
        </div>
      </div>
    </n-card>

    <!-- 性能监控触发按钮 -->
    <n-button
      v-if="!showMonitor"
      class="monitor-trigger"
      circle
      quaternary
      @click="toggleMonitor"
      :type="isMonitoring ? 'success' : 'default'"
    >
      <template #icon>
        <StatsChartOutline />
      </template>
    </n-button>

    <!-- 性能警告通知 -->
    <n-modal
      v-model:show="showPerformanceAlert"
      preset="dialog"
      title="性能警告"
      positive-text="确定"
      negative-text="取消"
      @positive-click="handlePerformanceAlert"
    >
      <div class="performance-alert">
        <div class="alert-icon">
          <WarningOutline class="w-8 h-8 text-orange-500" />
        </div>
        <div class="alert-content">
          <p>检测到性能问题：</p>
          <ul class="alert-list">
            <li v-for="issue in performanceIssues" :key="issue">{{ issue }}</li>
          </ul>
          <p>是否应用自动优化建议？</p>
        </div>
      </div>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import { useThemeVars } from 'naive-ui'
import { 
  PlayOutline, 
  PauseOutline, 
  SpeedometerOutline, 
  CloseOutline,
  FlashOutline,
  StatsChartOutline,
  WarningOutline
} from '@vicons/ionicons5'
import type { GridProConfig } from '../types/gridpro'
import { PerformanceBenchmark, createDefaultBenchmarkConfig, type BenchmarkResult } from './PerformanceBenchmark'
import { PerformanceOptimizer, type OptimizationSuggestion } from './PerformanceOptimizer'

interface Props {
  config: GridProConfig
  itemCount: number
  enabled?: boolean
}

interface Emits {
  (e: 'config-update', config: Partial<GridProConfig>): void
}

const props = withDefaults(defineProps<Props>(), {
  enabled: false
})

const emit = defineEmits<Emits>()

// 使用Naive UI主题变量
const themeVars = useThemeVars()

// 主题样式变量 - 基于Naive UI主题系统
const componentThemeVars = computed(() => ({
  '--performance-monitor-bg': themeVars.value.bodyColor,
  '--performance-monitor-border': themeVars.value.borderColor,
  '--performance-monitor-shadow': themeVars.value.boxShadow3,
  '--text-primary': themeVars.value.textColor1,
  '--text-secondary': themeVars.value.textColor2,
  '--text-tertiary': themeVars.value.textColor3,
  '--card-bg': themeVars.value.cardColor,
  '--border-color': themeVars.value.dividerColor,
  '--success-color': themeVars.value.successColor,
  '--warning-color': themeVars.value.warningColor,
  '--error-color': themeVars.value.errorColor
}))

// 监控状态
const showMonitor = ref(props.enabled)
const isMonitoring = ref(false)
const showCharts = ref(true)
const showBenchmarkDetails = ref(false)
const benchmarkRunning = ref(false)
const optimizationApplying = ref(false)

// 性能指标
const currentMetrics = reactive({
  fps: 60,
  renderTime: 0,
  memoryUsage: 0,
  itemCount: 0
})

// 历史数据
const metricsHistory = ref<Array<{
  timestamp: number
  fps: number
  memoryUsage: number
  renderTime: number
}>>([])

// 基准测试和优化
const benchmarkResults = ref<BenchmarkResult[]>([])
const optimizationSuggestions = ref<OptimizationSuggestion[]>([])
const benchmark = ref<PerformanceBenchmark | null>(null)
const optimizer = ref<PerformanceOptimizer | null>(null)

// 性能警告
const showPerformanceAlert = ref(false)
const performanceIssues = ref<string[]>([])

// 图表引用
const fpsChartRef = ref<HTMLDivElement>()
const memoryChartRef = ref<HTMLDivElement>()

// 监控定时器
let monitoringTimer: number | null = null
let fpsCounter = 0
let lastFpsTime = 0

/**
 * 初始化监控组件
 */
onMounted(() => {
  benchmark.value = new PerformanceBenchmark(createDefaultBenchmarkConfig())
  optimizer.value = new PerformanceOptimizer()
  
  if (props.enabled) {
    startMonitoring()
  }
})

/**
 * 清理资源
 */
onUnmounted(() => {
  stopMonitoring()
  if (benchmark.value) {
    benchmark.value.dispose()
  }
})

/**
 * 监听项目数量变化
 */
watch(() => props.itemCount, (newCount) => {
  currentMetrics.itemCount = newCount
  
  // 检查是否需要显示性能警告
  if (newCount > 500 && !props.config.virtualization?.enabled) {
    showPerformanceWarning(['项目数量较多，建议启用虚拟化'])
  }
})

/**
 * 切换监控显示
 */
function toggleMonitor(): void {
  showMonitor.value = !showMonitor.value
  
  if (showMonitor.value && !isMonitoring.value) {
    startMonitoring()
  }
}

/**
 * 切换监控状态
 */
function toggleMonitoring(): void {
  if (isMonitoring.value) {
    stopMonitoring()
  } else {
    startMonitoring()
  }
}

/**
 * 开始监控
 */
function startMonitoring(): void {
  if (isMonitoring.value) return
  
  isMonitoring.value = true
  lastFpsTime = performance.now()
  fpsCounter = 0
  
  // 开始FPS计数
  startFPSCounter()
  
  // 启动监控定时器
  monitoringTimer = window.setInterval(() => {
    updateMetrics()
    checkPerformanceThresholds()
  }, 1000)
}

/**
 * 停止监控
 */
function stopMonitoring(): void {
  isMonitoring.value = false
  
  if (monitoringTimer) {
    clearInterval(monitoringTimer)
    monitoringTimer = null
  }
}

/**
 * 开始FPS计数
 */
function startFPSCounter(): void {
  function countFrame(): void {
    if (!isMonitoring.value) return
    
    fpsCounter++
    requestAnimationFrame(countFrame)
  }
  
  requestAnimationFrame(countFrame)
}

/**
 * 更新性能指标
 */
function updateMetrics(): void {
  // 计算FPS
  const currentTime = performance.now()
  const elapsed = currentTime - lastFpsTime
  
  if (elapsed >= 1000) {
    currentMetrics.fps = (fpsCounter * 1000) / elapsed
    fpsCounter = 0
    lastFpsTime = currentTime
  }
  
  // 获取内存使用情况
  if ('memory' in performance) {
    const memory = (performance as any).memory
    currentMetrics.memoryUsage = memory.usedJSHeapSize
  }
  
  // 更新项目数量
  currentMetrics.itemCount = props.itemCount
  
  // 记录历史数据
  metricsHistory.value.push({
    timestamp: Date.now(),
    fps: currentMetrics.fps,
    memoryUsage: currentMetrics.memoryUsage,
    renderTime: currentMetrics.renderTime
  })
  
  // 限制历史数据数量
  if (metricsHistory.value.length > 60) {
    metricsHistory.value.shift()
  }
  
  // 更新图表
  updateCharts()
}

/**
 * 检查性能阈值
 */
function checkPerformanceThresholds(): void {
  const issues: string[] = []
  
  if (currentMetrics.fps < 45) {
    issues.push(`帧率过低: ${currentMetrics.fps.toFixed(1)}fps`)
  }
  
  if (currentMetrics.memoryUsage > 100 * 1024 * 1024) { // 100MB
    issues.push(`内存使用过高: ${(currentMetrics.memoryUsage / 1024 / 1024).toFixed(1)}MB`)
  }
  
  if (currentMetrics.renderTime > 100) {
    issues.push(`渲染时间过长: ${currentMetrics.renderTime.toFixed(1)}ms`)
  }
  
  if (issues.length > 0 && !showPerformanceAlert.value) {
    showPerformanceWarning(issues)
  }
}

/**
 * 显示性能警告
 */
function showPerformanceWarning(issues: string[]): void {
  performanceIssues.value = issues
  showPerformanceAlert.value = true
}

/**
 * 处理性能警告
 */
function handlePerformanceAlert(): void {
  // 自动应用优化建议
  applyOptimizations()
}

/**
 * 获取FPS样式类
 */
function getFpsClass(fps: number): string {
  if (fps >= 55) return 'text-green-500'
  if (fps >= 45) return 'text-orange-500'
  return 'text-red-500'
}

/**
 * 获取渲染时间样式类
 */
function getRenderTimeClass(time: number): string {
  if (time <= 50) return 'text-green-500'
  if (time <= 100) return 'text-orange-500'
  return 'text-red-500'
}

/**
 * 获取内存样式类
 */
function getMemoryClass(memory: number): string {
  const mb = memory / 1024 / 1024
  if (mb <= 50) return 'text-green-500'
  if (mb <= 100) return 'text-orange-500'
  return 'text-red-500'
}

/**
 * 获取建议图标
 */
function getSuggestionIcon(impact: 'low' | 'medium' | 'high') {
  const icons = {
    high: 'FlashOutline',
    medium: 'SpeedometerOutline',
    low: 'StatsChartOutline'
  }
  return icons[impact]
}

/**
 * 运行基准测试
 */
async function runBenchmark(): Promise<void> {
  if (!benchmark.value || benchmarkRunning.value) return
  
  benchmarkRunning.value = true
  
  try {
    const results = await benchmark.value.runBenchmarkSuite()
    benchmarkResults.value = results
    
    // 生成优化建议
    if (optimizer.value) {
      optimizationSuggestions.value = optimizer.value.analyzePerformance(results, props.config)
    }
    
    // 显示结果
    showBenchmarkDetails.value = true
    
  } catch (error) {
    console.error('基准测试失败:', error)
  } finally {
    benchmarkRunning.value = false
  }
}

/**
 * 应用所有优化建议
 */
async function applyOptimizations(): Promise<void> {
  if (!optimizer.value || optimizationApplying.value) return
  
  optimizationApplying.value = true
  
  try {
    const optimizedConfig = optimizer.value.autoOptimize(
      benchmarkResults.value,
      props.config,
      'medium'
    )
    
    emit('config-update', optimizedConfig)
    
    // 清空已应用的建议
    optimizationSuggestions.value = []
    
  } catch (error) {
    console.error('应用优化失败:', error)
  } finally {
    optimizationApplying.value = false
  }
}

/**
 * 应用单个优化建议
 */
function applySingleOptimization(suggestion: OptimizationSuggestion): void {
  emit('config-update', suggestion.configChanges)
  
  // 从建议列表中移除已应用的建议
  const index = optimizationSuggestions.value.indexOf(suggestion)
  if (index > -1) {
    optimizationSuggestions.value.splice(index, 1)
  }
}

/**
 * 更新图表
 */
function updateCharts(): void {
  // 这里可以集成真实的图表库，比如ECharts
  // 目前使用简化版本
  nextTick(() => {
    updateFPSChart()
    updateMemoryChart()
  })
}

/**
 * 更新FPS图表
 */
function updateFPSChart(): void {
  if (!fpsChartRef.value) return
  
  // 简化的图表实现
  const canvas = document.createElement('canvas')
  canvas.width = fpsChartRef.value.offsetWidth
  canvas.height = 100
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  // 清空之前的内容
  fpsChartRef.value.innerHTML = ''
  fpsChartRef.value.appendChild(canvas)
  
  // 绘制FPS曲线
  const data = metricsHistory.value.slice(-30) // 最近30个数据点
  if (data.length < 2) return
  
  ctx.strokeStyle = '#10b981'
  ctx.lineWidth = 2
  ctx.beginPath()
  
  data.forEach((point, index) => {
    const x = (index / (data.length - 1)) * canvas.width
    const y = canvas.height - (point.fps / 60) * canvas.height
    
    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })
  
  ctx.stroke()
}

/**
 * 更新内存图表
 */
function updateMemoryChart(): void {
  if (!memoryChartRef.value) return
  
  // 简化的图表实现
  const canvas = document.createElement('canvas')
  canvas.width = memoryChartRef.value.offsetWidth
  canvas.height = 100
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  // 清空之前的内容  
  memoryChartRef.value.innerHTML = ''
  memoryChartRef.value.appendChild(canvas)
  
  // 绘制内存使用曲线
  const data = metricsHistory.value.slice(-30)
  if (data.length < 2) return
  
  const maxMemory = Math.max(...data.map(d => d.memoryUsage))
  
  ctx.strokeStyle = '#3b82f6'
  ctx.lineWidth = 2
  ctx.beginPath()
  
  data.forEach((point, index) => {
    const x = (index / (data.length - 1)) * canvas.width
    const y = canvas.height - (point.memoryUsage / maxMemory) * canvas.height
    
    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })
  
  ctx.stroke()
}
</script>

<style scoped>
.performance-monitor {
  position: relative;
}

.monitor-panel {
  position: fixed;
  top: 100px;
  right: 20px;
  width: 400px;
  max-height: 80vh;
  overflow-y: auto;
  z-index: 1000;
  background: var(--performance-monitor-bg);
  border: 1px solid var(--performance-monitor-border);
  box-shadow: var(--performance-monitor-shadow);
}

.monitor-trigger {
  position: fixed;
  bottom: 100px;
  right: 20px;
  z-index: 999;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.metric-item {
  text-align: center;
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--card-bg);
}

.metric-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.metric-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.charts-container {
  margin: 16px 0;
}

.chart-item {
  margin-bottom: 16px;
}

.chart-title {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.chart {
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--card-bg);
}

.suggestions-container {
  margin-top: 16px;
}

.suggestions-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--card-bg);
}

.suggestion-icon {
  flex-shrink: 0;
  color: var(--success-color);
}

.suggestion-content {
  flex: 1;
  min-width: 0;
}

.suggestion-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.suggestion-reason {
  font-size: 11px;
  color: var(--text-tertiary);
}

.benchmark-results {
  margin-top: 16px;
}

.benchmark-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.benchmark-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.benchmark-item {
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--card-bg);
}

.benchmark-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.benchmark-scores {
  display: flex;
  gap: 8px;
  font-size: 11px;
}

.score-item {
  color: var(--text-secondary);
}

.performance-alert {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.alert-icon {
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
}

.alert-list {
  margin: 8px 0;
  padding-left: 16px;
}

.alert-list li {
  margin-bottom: 4px;
  color: var(--text-secondary);
}
</style>