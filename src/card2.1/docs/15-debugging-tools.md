# 调试工具详解 - 开发调试技巧与工具使用

本章详细介绍Card 2.1组件开发过程中的调试技巧、工具使用和问题排查方法。

## 🔍 调试工具概览

### 内置调试工具
- **浏览器开发者工具** - 基础调试环境
- **Vue DevTools** - Vue应用专用调试工具
- **Card 2.1调试面板** - 组件系统专用调试界面
- **日志系统** - 结构化日志记录

### 调试模式
- **开发模式** - 详细日志和错误信息
- **调试模式** - 额外的调试信息和工具
- **性能模式** - 性能监控和分析

## 🛠️ 浏览器开发者工具

### 基础调试技巧

```javascript
// 在浏览器控制台中调试Card 2.1组件
// 查看全局调试对象
console.log(window.__CARD2_DEBUG__)

// 查看已注册组件
console.log(window.__CARD2_REGISTRY__)

// 查看组件实例状态
console.log(window.__CARD2_COMPONENT_STATES__)

// 查看数据源绑定状态
console.log(window.__CARD2_DATA_BINDINGS__)

// 查看交互配置
console.log(window.__CARD2_INTERACTIONS__)
```

### 断点调试
```javascript
// 在组件生命周期中设置断点
const MyComponent = defineComponent({
  setup(props) {
    onMounted(() => {
      debugger; // 设置断点
      console.log('组件已挂载', props);
    })
    
    watch(() => props.dataValue, (newValue) => {
      debugger; // 数据变化断点
      console.log('数据值变化:', newValue);
    })
  }
})
```

### 网络请求调试
```javascript
// 监控数据源API请求
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('API请求:', args[0]);
  return originalFetch.apply(this, args)
    .then(response => {
      console.log('API响应:', response);
      return response;
    })
    .catch(error => {
      console.error('API错误:', error);
      throw error;
    });
};
```

## 🎭 Vue DevTools调试

### Vue DevTools使用技巧

#### 1. 组件树检查
```vue
<script setup lang="ts">
// 为组件添加调试名称
defineOptions({
  name: 'MyDebugComponent'
})

// 暴露调试数据到DevTools
const debugInfo = computed(() => ({
  props: toRaw(props),
  state: toRaw(state),
  computedValues: {
    formattedValue: formattedValue.value,
    isLoading: isLoading.value
  }
}))

// 在DevTools中可见
provide('debugInfo', debugInfo)
</script>
```

#### 2. 状态监控
```typescript
// 使用Pinia DevTools监控状态
export const useComponentStore = defineStore('component', () => {
  const state = reactive({
    components: [],
    selectedComponent: null,
    isLoading: false
  })
  
  // DevTools标签
  const $state = computed(() => ({
    ...state,
    _debug: {
      timestamp: new Date().toISOString(),
      version: '2.1.0'
    }
  }))
  
  return { ...state, $state }
})
```

#### 3. 事件追踪
```vue
<script setup lang="ts">
// 追踪组件事件
const emit = defineEmits<{
  dataChange: [value: any]
  click: [event: MouseEvent]
}>()

const handleDataChange = (value: any) => {
  // DevTools事件追踪
  console.log('[Vue DevTools] 数据变化事件:', value)
  emit('dataChange', value)
}

const handleClick = (event: MouseEvent) => {
  console.log('[Vue DevTools] 点击事件:', event)
  emit('click', event)
}
</script>
```

## 🎛️ Card 2.1专用调试面板

### 调试面板组件

```vue
<template>
  <div class="card2-debug-panel" v-if="debugMode">
    <div class="debug-header">
      <h3>Card 2.1 调试面板</h3>
      <n-button @click="toggleDebug" size="small">
        {{ debugVisible ? '隐藏' : '显示' }}
      </n-button>
    </div>
    
    <div v-if="debugVisible" class="debug-content">
      <!-- 组件注册调试 -->
      <n-collapse>
        <n-collapse-item title="组件注册信息" name="registry">
          <div class="debug-section">
            <div class="debug-stats">
              <n-statistic label="已注册组件" :value="registeredComponents.length" />
              <n-statistic label="活动组件实例" :value="activeInstances.length" />
              <n-statistic label="数据源绑定" :value="dataBindings.length" />
            </div>
            
            <n-data-table
              :columns="componentColumns"
              :data="registeredComponents"
              size="small"
              :pagination="{ pageSize: 5 }"
            />
          </div>
        </n-collapse-item>
        
        <!-- 数据源调试 -->
        <n-collapse-item title="数据源状态" name="datasources">
          <div class="debug-section">
            <n-space vertical>
              <div v-for="binding in dataBindings" :key="binding.id" class="data-binding-item">
                <div class="binding-header">
                  <n-tag :type="getBindingStatus(binding).type">
                    {{ binding.componentId }} - {{ binding.dataSourceKey }}
                  </n-tag>
                  <n-button @click="refreshDataBinding(binding)" size="tiny">
                    刷新
                  </n-button>
                </div>
                
                <div class="binding-details">
                  <pre>{{ JSON.stringify(binding.data, null, 2) }}</pre>
                </div>
              </div>
            </n-space>
          </div>
        </n-collapse-item>
        
        <!-- 交互系统调试 -->
        <n-collapse-item title="交互配置" name="interactions">
          <div class="debug-section">
            <n-tree
              :data="interactionTree"
              key-field="id"
              label-field="label"
              children-field="children"
              selectable
              @update:selected-keys="handleInteractionSelect"
            />
            
            <div v-if="selectedInteraction" class="interaction-details">
              <h4>交互详情</h4>
              <pre>{{ JSON.stringify(selectedInteraction, null, 2) }}</pre>
            </div>
          </div>
        </n-collapse-item>
        
        <!-- 性能监控 -->
        <n-collapse-item title="性能监控" name="performance">
          <div class="debug-section">
            <n-grid :cols="2" :x-gap="16" :y-gap="16">
              <n-grid-item>
                <n-card title="组件渲染时间">
                  <n-progress
                    type="line"
                    :percentage="renderPerformance.percentage"
                    :color="renderPerformance.color"
                  />
                  <div>{{ renderPerformance.time }}ms</div>
                </n-card>
              </n-grid-item>
              
              <n-grid-item>
                <n-card title="内存使用">
                  <n-progress
                    type="circle"
                    :percentage="memoryUsage.percentage"
                    :color="memoryUsage.color"
                  />
                  <div>{{ memoryUsage.used }}MB / {{ memoryUsage.total }}MB</div>
                </n-card>
              </n-grid-item>
            </n-grid>
            
            <div class="performance-chart">
              <canvas ref="performanceChart" width="400" height="200"></canvas>
            </div>
          </div>
        </n-collapse-item>
        
        <!-- 日志查看器 -->
        <n-collapse-item title="系统日志" name="logs">
          <div class="debug-section">
            <div class="log-controls">
              <n-space>
                <n-select
                  v-model:value="logLevel"
                  :options="logLevelOptions"
                  size="small"
                  style="width: 120px"
                />
                <n-button @click="clearLogs" size="small">清空日志</n-button>
                <n-button @click="exportLogs" size="small">导出日志</n-button>
              </n-space>
            </div>
            
            <div class="log-viewer">
              <div
                v-for="log in filteredLogs"
                :key="log.id"
                class="log-entry"
                :class="[`log-${log.level}`]"
              >
                <span class="log-time">{{ formatTime(log.timestamp) }}</span>
                <span class="log-level">{{ log.level.toUpperCase() }}</span>
                <span class="log-message">{{ log.message }}</span>
                <pre v-if="log.data" class="log-data">{{ JSON.stringify(log.data, null, 2) }}</pre>
              </div>
            </div>
          </div>
        </n-collapse-item>
      </n-collapse>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useDebugStore } from '@/card2.1/stores/debug'

const debugStore = useDebugStore()

const debugMode = ref(import.meta.env.DEV)
const debugVisible = ref(false)
const logLevel = ref('info')
const selectedInteraction = ref(null)
const performanceChart = ref<HTMLCanvasElement>()

// 组件注册信息
const registeredComponents = computed(() => debugStore.getRegisteredComponents())
const activeInstances = computed(() => debugStore.getActiveInstances())
const dataBindings = computed(() => debugStore.getDataBindings())

// 交互配置树
const interactionTree = computed(() => debugStore.getInteractionTree())

// 日志系统
const logLevelOptions = [
  { label: '调试', value: 'debug' },
  { label: '信息', value: 'info' },
  { label: '警告', value: 'warn' },
  { label: '错误', value: 'error' }
]

const filteredLogs = computed(() => {
  return debugStore.logs.filter(log => {
    const levels = ['error', 'warn', 'info', 'debug']
    const currentLevelIndex = levels.indexOf(logLevel.value)
    const logLevelIndex = levels.indexOf(log.level)
    return logLevelIndex <= currentLevelIndex
  })
})

// 性能监控
const renderPerformance = computed(() => ({
  time: debugStore.renderTime,
  percentage: Math.min((debugStore.renderTime / 100) * 100, 100),
  color: debugStore.renderTime > 50 ? '#f56565' : '#48bb78'
}))

const memoryUsage = computed(() => ({
  used: debugStore.memoryUsed,
  total: debugStore.memoryTotal,
  percentage: (debugStore.memoryUsed / debugStore.memoryTotal) * 100,
  color: (debugStore.memoryUsed / debugStore.memoryTotal) > 0.8 ? '#f56565' : '#48bb78'
}))

// 组件表格列定义
const componentColumns = [
  { title: '组件类型', key: 'type' },
  { title: '组件名称', key: 'name' },
  { title: '实例数量', key: 'instanceCount' },
  { title: '状态', key: 'status', render: (row: any) => {
    return h(NTag, { 
      type: row.status === 'active' ? 'success' : 'warning' 
    }, row.status)
  }}
]

// 方法
const toggleDebug = () => {
  debugVisible.value = !debugVisible.value
}

const getBindingStatus = (binding: any) => {
  if (binding.error) {
    return { type: 'error', text: '错误' }
  } else if (binding.loading) {
    return { type: 'warning', text: '加载中' }
  } else if (binding.data) {
    return { type: 'success', text: '正常' }
  } else {
    return { type: 'default', text: '未知' }
  }
}

const refreshDataBinding = (binding: any) => {
  debugStore.refreshDataBinding(binding.id)
}

const handleInteractionSelect = (keys: string[]) => {
  if (keys.length > 0) {
    selectedInteraction.value = debugStore.getInteractionById(keys[0])
  }
}

const clearLogs = () => {
  debugStore.clearLogs()
}

const exportLogs = () => {
  const logs = JSON.stringify(filteredLogs.value, null, 2)
  const blob = new Blob([logs], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `card2-logs-${new Date().toISOString()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString()
}

// 初始化性能图表
const initPerformanceChart = () => {
  if (!performanceChart.value) return
  
  const ctx = performanceChart.value.getContext('2d')
  if (!ctx) return
  
  // 绘制性能图表的逻辑
  const drawChart = () => {
    ctx.clearRect(0, 0, 400, 200)
    
    // 绘制坐标轴
    ctx.strokeStyle = '#e0e0e6'
    ctx.lineWidth = 1
    
    // X轴
    ctx.beginPath()
    ctx.moveTo(40, 160)
    ctx.lineTo(380, 160)
    ctx.stroke()
    
    // Y轴
    ctx.beginPath()
    ctx.moveTo(40, 20)
    ctx.lineTo(40, 160)
    ctx.stroke()
    
    // 绘制性能数据
    const performanceData = debugStore.getPerformanceHistory()
    if (performanceData.length > 1) {
      ctx.strokeStyle = '#2080f0'
      ctx.lineWidth = 2
      ctx.beginPath()
      
      performanceData.forEach((point, index) => {
        const x = 40 + (index / (performanceData.length - 1)) * 340
        const y = 160 - (point.value / 100) * 140
        
        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })
      
      ctx.stroke()
    }
  }
  
  drawChart()
  
  // 定期更新图表
  setInterval(drawChart, 1000)
}

onMounted(() => {
  if (debugMode.value) {
    initPerformanceChart()
    
    // 启用调试模式
    window.__CARD2_DEBUG__ = true
  }
})

// 监听键盘快捷键
onMounted(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    // Ctrl+Shift+D 切换调试面板
    if (event.ctrlKey && event.shiftKey && event.key === 'D') {
      event.preventDefault()
      debugVisible.value = !debugVisible.value
    }
  }
  
  document.addEventListener('keydown', handleKeyDown)
  
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
  })
})
</script>

<style scoped>
.card2-debug-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 400px;
  height: 100vh;
  background: var(--card-color);
  border-left: 1px solid var(--border-color);
  box-shadow: var(--box-shadow-3);
  z-index: 10000;
  overflow-y: auto;
}

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--divider-color);
  background: var(--body-color);
}

.debug-header h3 {
  margin: 0;
  color: var(--text-color);
}

.debug-content {
  padding: 16px;
}

.debug-section {
  padding: 12px 0;
}

.debug-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.data-binding-item {
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: 12px;
  margin-bottom: 8px;
}

.binding-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.binding-details pre {
  background: var(--tag-color);
  padding: 8px;
  border-radius: var(--border-radius-small);
  font-size: 11px;
  max-height: 200px;
  overflow-y: auto;
}

.interaction-details {
  margin-top: 16px;
  padding: 12px;
  background: var(--tag-color);
  border-radius: var(--border-radius);
}

.performance-chart {
  margin-top: 16px;
  text-align: center;
}

.log-controls {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--divider-color);
}

.log-viewer {
  max-height: 300px;
  overflow-y: auto;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
}

.log-entry {
  padding: 4px 8px;
  border-bottom: 1px solid var(--divider-color);
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.log-time {
  color: var(--text-color-3);
  flex-shrink: 0;
}

.log-level {
  font-weight: bold;
  flex-shrink: 0;
  min-width: 50px;
}

.log-debug .log-level { color: var(--text-color-2); }
.log-info .log-level { color: var(--info-color); }
.log-warn .log-level { color: var(--warning-color); }
.log-error .log-level { color: var(--error-color); }

.log-message {
  flex: 1;
}

.log-data {
  width: 100%;
  background: var(--tag-color);
  padding: 4px;
  border-radius: 2px;
  margin-top: 4px;
  font-size: 11px;
}

/* 响应式适配 */
@media (max-width: 1024px) {
  .card2-debug-panel {
    width: 100vw;
    height: 50vh;
    top: auto;
    bottom: 0;
    right: 0;
  }
}
</style>
```

## 📊 日志系统

### 结构化日志记录
```typescript
/**
 * Card 2.1 日志系统
 */
export class Card2Logger {
  private static instance: Card2Logger
  private logs: LogEntry[] = []
  private maxLogs = 1000
  
  static getInstance(): Card2Logger {
    if (!this.instance) {
      this.instance = new Card2Logger()
    }
    return this.instance
  }
  
  /**
   * 记录调试信息
   */
  debug(message: string, data?: any, source?: string): void {
    this.addLog('debug', message, data, source)
  }
  
  /**
   * 记录普通信息
   */
  info(message: string, data?: any, source?: string): void {
    this.addLog('info', message, data, source)
  }
  
  /**
   * 记录警告信息
   */
  warn(message: string, data?: any, source?: string): void {
    this.addLog('warn', message, data, source)
  }
  
  /**
   * 记录错误信息
   */
  error(message: string, error?: Error, source?: string): void {
    this.addLog('error', message, {
      error: error?.message,
      stack: error?.stack,
      name: error?.name
    }, source)
  }
  
  /**
   * 记录组件生命周期
   */
  lifecycle(
    componentId: string, 
    lifecycle: 'created' | 'mounted' | 'updated' | 'destroyed',
    data?: any
  ): void {
    this.info(`组件生命周期: ${lifecycle}`, {
      componentId,
      lifecycle,
      ...data
    }, 'lifecycle')
  }
  
  /**
   * 记录数据源操作
   */
  dataSource(
    componentId: string,
    dataSourceKey: string,
    action: 'bind' | 'unbind' | 'refresh' | 'error',
    data?: any
  ): void {
    this.info(`数据源操作: ${action}`, {
      componentId,
      dataSourceKey,
      action,
      ...data
    }, 'datasource')
  }
  
  /**
   * 记录交互事件
   */
  interaction(
    sourceComponentId: string,
    targetComponentId: string,
    eventType: string,
    data?: any
  ): void {
    this.info('组件交互', {
      sourceComponentId,
      targetComponentId,
      eventType,
      ...data
    }, 'interaction')
  }
  
  /**
   * 记录性能指标
   */
  performance(metric: string, value: number, unit: string = 'ms'): void {
    this.info(`性能指标: ${metric}`, {
      metric,
      value,
      unit,
      timestamp: performance.now()
    }, 'performance')
  }
  
  private addLog(
    level: LogLevel,
    message: string,
    data?: any,
    source?: string
  ): void {
    const entry: LogEntry = {
      id: this.generateId(),
      level,
      message,
      data,
      source: source || 'unknown',
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }
    
    this.logs.push(entry)
    
    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }
    
    // 在控制台输出
    if (import.meta.env.DEV) {
      this.outputToConsole(entry)
    }
    
    // 存储到本地（可选）
    this.saveToStorage(entry)
  }
  
  private outputToConsole(entry: LogEntry): void {
    const prefix = `[Card2.1:${entry.source}]`
    const args = [prefix, entry.message]
    
    if (entry.data) {
      args.push(entry.data)
    }
    
    switch (entry.level) {
      case 'debug':
        console.debug(...args)
        break
      case 'info':
        console.info(...args)
        break
      case 'warn':
        console.warn(...args)
        break
      case 'error':
        console.error(...args)
        break
    }
  }
  
  private saveToStorage(entry: LogEntry): void {
    try {
      const storageKey = 'card2-logs'
      const storedLogs = JSON.parse(localStorage.getItem(storageKey) || '[]')
      storedLogs.push(entry)
      
      // 只保存最近的500条日志
      if (storedLogs.length > 500) {
        storedLogs.splice(0, storedLogs.length - 500)
      }
      
      localStorage.setItem(storageKey, JSON.stringify(storedLogs))
    } catch (error) {
      console.warn('无法保存日志到本地存储:', error)
    }
  }
  
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }
  
  /**
   * 获取日志列表
   */
  getLogs(level?: LogLevel, limit?: number): LogEntry[] {
    let filteredLogs = this.logs
    
    if (level) {
      const levels: LogLevel[] = ['error', 'warn', 'info', 'debug']
      const levelIndex = levels.indexOf(level)
      filteredLogs = this.logs.filter(log => 
        levels.indexOf(log.level) <= levelIndex
      )
    }
    
    if (limit) {
      filteredLogs = filteredLogs.slice(-limit)
    }
    
    return filteredLogs
  }
  
  /**
   * 清空日志
   */
  clearLogs(): void {
    this.logs = []
    localStorage.removeItem('card2-logs')
  }
  
  /**
   * 导出日志
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }
}

// 全局日志实例
export const logger = Card2Logger.getInstance()

// 方便使用的日志函数
export const log = {
  debug: (msg: string, data?: any, source?: string) => logger.debug(msg, data, source),
  info: (msg: string, data?: any, source?: string) => logger.info(msg, data, source),
  warn: (msg: string, data?: any, source?: string) => logger.warn(msg, data, source),
  error: (msg: string, error?: Error, source?: string) => logger.error(msg, error, source),
  lifecycle: (id: string, lifecycle: any, data?: any) => logger.lifecycle(id, lifecycle, data),
  dataSource: (id: string, key: string, action: any, data?: any) => logger.dataSource(id, key, action, data),
  interaction: (src: string, target: string, event: string, data?: any) => logger.interaction(src, target, event, data),
  performance: (metric: string, value: number, unit?: string) => logger.performance(metric, value, unit)
}
```

## 🔧 调试Hook和工具函数

### 组件调试Hook
```typescript
/**
 * 组件调试Hook
 */
export function useComponentDebug(componentId: string, componentType: string) {
  const debugInfo = ref({
    id: componentId,
    type: componentType,
    renderCount: 0,
    lastRender: 0,
    propsHistory: [] as any[],
    stateHistory: [] as any[],
    errors: [] as Error[]
  })
  
  // 渲染性能监控
  const startRender = () => {
    debugInfo.value.lastRender = performance.now()
  }
  
  const endRender = () => {
    const renderTime = performance.now() - debugInfo.value.lastRender
    debugInfo.value.renderCount++
    
    log.performance(`${componentType}渲染时间`, renderTime, 'ms')
    
    if (renderTime > 50) {
      log.warn(`${componentType}渲染时间过长`, {
        componentId,
        renderTime,
        renderCount: debugInfo.value.renderCount
      })
    }
  }
  
  // Props变化追踪
  const trackProps = (props: any) => {
    debugInfo.value.propsHistory.push({
      timestamp: Date.now(),
      props: { ...props }
    })
    
    // 只保留最近10次记录
    if (debugInfo.value.propsHistory.length > 10) {
      debugInfo.value.propsHistory = debugInfo.value.propsHistory.slice(-10)
    }
    
    log.debug(`${componentType} Props变化`, props, componentId)
  }
  
  // 状态变化追踪
  const trackState = (state: any) => {
    debugInfo.value.stateHistory.push({
      timestamp: Date.now(),
      state: { ...state }
    })
    
    if (debugInfo.value.stateHistory.length > 10) {
      debugInfo.value.stateHistory = debugInfo.value.stateHistory.slice(-10)
    }
    
    log.debug(`${componentType} 状态变化`, state, componentId)
  }
  
  // 错误捕获
  const captureError = (error: Error, context?: string) => {
    debugInfo.value.errors.push(error)
    log.error(`${componentType} 错误 ${context || ''}`, error, componentId)
  }
  
  // 生命周期追踪
  onMounted(() => {
    log.lifecycle(componentId, 'mounted', { type: componentType })
    startRender()
  })
  
  onUpdated(() => {
    log.lifecycle(componentId, 'updated', { type: componentType })
    endRender()
    startRender()
  })
  
  onUnmounted(() => {
    log.lifecycle(componentId, 'destroyed', { type: componentType })
  })
  
  // 全局错误处理
  onErrorCaptured((error, instance, info) => {
    captureError(error as Error, info)
    return false // 继续向上传播
  })
  
  return {
    debugInfo: readonly(debugInfo),
    startRender,
    endRender,
    trackProps,
    trackState,
    captureError
  }
}
```

### 数据源调试工具
```typescript
/**
 * 数据源调试工具
 */
export const DataSourceDebugger = {
  /**
   * 监控数据源请求
   */
  monitorDataSource(
    componentId: string,
    dataSourceKey: string,
    config: any
  ): () => void {
    const startTime = performance.now()
    
    log.dataSource(componentId, dataSourceKey, 'bind', {
      config: { ...config }
    })
    
    // 模拟数据源请求监控
    const cleanup = () => {
      const endTime = performance.now()
      log.performance(`数据源${dataSourceKey}绑定时间`, endTime - startTime)
    }
    
    return cleanup
  },
  
  /**
   * 验证数据源配置
   */
  validateDataSourceConfig(config: any): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    
    // 检查必需字段
    if (!config.type) {
      errors.push('缺少数据源类型')
    }
    
    if (!config.fieldMappings) {
      errors.push('缺少字段映射配置')
    }
    
    // 检查字段映射
    if (config.fieldMappings) {
      Object.entries(config.fieldMappings).forEach(([field, mapping]: [string, any]) => {
        if (!mapping.targetField) {
          errors.push(`字段 ${field} 缺少目标字段配置`)
        }
        
        if (!mapping.type) {
          warnings.push(`字段 ${field} 未指定数据类型`)
        }
      })
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  },
  
  /**
   * 数据转换测试
   */
  testDataTransform(
    rawData: any,
    fieldMappings: any,
    transformFunction?: string
  ): any {
    try {
      let transformedData = {}
      
      Object.entries(fieldMappings).forEach(([sourceField, mapping]: [string, any]) => {
        let value = rawData[sourceField]
        
        // 应用转换函数
        if (transformFunction) {
          const transform = new Function('data', transformFunction)
          value = transform(rawData)
        } else if (mapping.transform) {
          const transform = new Function('data', mapping.transform)
          value = transform(rawData)
        }
        
        transformedData[mapping.targetField] = value ?? mapping.defaultValue
      })
      
      log.debug('数据转换成功', {
        rawData,
        transformedData
      }, 'data-transform')
      
      return transformedData
    } catch (error) {
      log.error('数据转换失败', error as Error, 'data-transform')
      return null
    }
  }
}
```

## ✅ 调试最佳实践

### 1. 系统化调试方法
- **分层调试** - 从外到内逐层排查
- **对比调试** - 与正常状态对比差异
- **隔离调试** - 隔离问题组件单独测试
- **回归调试** - 确认修复后问题不再复现

### 2. 调试信息记录
- **完整上下文** - 记录足够的环境信息
- **时间序列** - 记录问题发生的时间顺序
- **用户操作** - 记录触发问题的用户操作
- **系统状态** - 记录相关系统状态信息

### 3. 性能调试技巧
- **渲染性能** - 监控组件渲染时间
- **内存使用** - 检查内存泄露问题
- **网络请求** - 优化数据源请求效率
- **用户体验** - 关注交互响应时间

### 4. 生产环境调试
- **远程调试** - 支持生产环境问题排查
- **日志聚合** - 集中收集和分析日志
- **错误监控** - 自动捕获和报告错误
- **性能监控** - 持续监控系统性能

## 🔗 相关文档

- [开发环境](./02-development-environment.md) - 开发环境配置
- [最佳实践](./17-best-practices.md) - 开发最佳实践
- [性能优化](./14-performance.md) - 性能优化方法
- [故障排除](./20-troubleshooting.md) - 常见问题解决

---

**掌握调试技巧让开发事半功倍！** 🔍