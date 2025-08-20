# 数据源系统技术架构详细说明

## 🏗️ 系统架构概览

### 整体设计模式
本数据源系统采用**执行器模式 + 管理器模式 + 组件化UI**的三层架构：

```
┌─────────────────────────────────────────────────────────┐
│                    UI Layer (组件层)                      │
├─────────────────────────────────────────────────────────┤
│                 Management Layer (管理层)                │  
├─────────────────────────────────────────────────────────┤
│                 Executor Layer (执行层)                   │
└─────────────────────────────────────────────────────────┘
```

## 📊 执行层架构 (Executor Layer)

### 抽象基类设计
```typescript
// executors/DataItemExecutor.ts
abstract class DataItemExecutor {
  protected id: string
  protected config: any
  protected status: ExecutorStatus
  protected lastExecuteTime?: Date
  protected executeCount: number = 0
  
  // 抽象方法 - 子类必须实现
  abstract execute(): Promise<any>
  abstract validate(): boolean
  abstract getType(): string
  abstract cleanup(): void
  
  // 通用方法 - 基类提供
  protected updateStatus(status: ExecutorStatus): void
  protected logExecution(result: any, error?: Error): void
  public getExecutionStats(): ExecutorStats
}
```

### 具体执行器实现

#### 1. JsonItemExecutor (静态数据执行器)
**文件**: `/executors/JsonItemExecutor.ts`
**职责**: 处理静态 JSON 数据
```typescript
class JsonItemExecutor extends DataItemExecutor {
  private jsonData: any
  
  async execute(): Promise<any> {
    // 直接返回解析后的 JSON 数据
    return this.jsonData
  }
  
  validate(): boolean {
    // 验证 JSON 格式是否正确
    try {
      JSON.parse(this.config.content)
      return true
    } catch {
      return false
    }
  }
}
```

#### 2. HttpItemExecutor (HTTP 数据执行器)  
**文件**: `/executors/HttpItemExecutor.ts`
**职责**: 执行 HTTP 请求获取数据
```typescript
class HttpItemExecutor extends DataItemExecutor {
  private httpConfig: HttpDataSourceConfig
  
  async execute(): Promise<any> {
    const { url, method, headers, params } = this.httpConfig
    
    // 判断是完整URL还是相对路径
    if (this.isFullUrl(url)) {
      return this.fetchExternal(url, { method, headers, params })
    } else {
      return this.fetchInternal(url, { method, headers, params })
    }
  }
  
  private isFullUrl(url: string): boolean {
    return /^https?:\/\//.test(url)
  }
}
```

#### 3. WebSocketItemExecutor (WebSocket 数据执行器)
**文件**: `/executors/WebSocketItemExecutor.ts`  
**职责**: 管理 WebSocket 连接和实时数据
```typescript
class WebSocketItemExecutor extends DataItemExecutor {
  private ws?: WebSocket
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5
  
  async execute(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.connect()
      
      this.ws!.onmessage = (event) => {
        const data = JSON.parse(event.data)
        resolve(data)
      }
      
      // 处理连接错误和重连机制
      this.setupErrorHandling(reject)
    })
  }
  
  cleanup(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = undefined
    }
  }
}
```

## 🎯 管理层架构 (Management Layer)

### 1. DataSourceConfigurator (配置管理器)
**文件**: `/managers/DataSourceConfigurator.ts`
**职责**: 数据源配置的CRUD和验证

```typescript
class DataSourceConfigurator {
  private configurations: Map<string, DataSourceConfig> = new Map()
  
  // 配置管理
  saveConfiguration(id: string, config: DataSourceConfig): void
  loadConfiguration(id: string): DataSourceConfig | null  
  deleteConfiguration(id: string): boolean
  listConfigurations(): DataSourceConfig[]
  
  // 配置验证
  validateConfiguration(config: any): ValidationResult
  
  // 配置序列化
  exportConfiguration(id: string): string
  importConfiguration(configJson: string): string
  
  // 配置模板
  getTemplate(type: DataSourceType): DataSourceTemplate
  applyTemplate(templateId: string, customConfig: any): DataSourceConfig
}
```

### 2. DataSourceScheduler (调度管理器)
**文件**: `/managers/DataSourceScheduler.ts`  
**职责**: 执行器的生命周期管理和调度

```typescript
class DataSourceScheduler {
  private executors: Map<string, DataItemExecutor> = new Map()
  private scheduledTasks: Map<string, ScheduledTask> = new Map()
  
  // 执行器管理
  registerExecutor(id: string, executor: DataItemExecutor): void
  unregisterExecutor(id: string): void
  executeById(id: string): Promise<any>
  executeAll(): Promise<Record<string, any>>
  
  // 调度管理
  scheduleExecution(id: string, cron: string): void
  unscheduleExecution(id: string): void
  
  // 批量操作
  executeBatch(ids: string[]): Promise<any[]>
  
  // 状态监控
  getExecutorStatus(id: string): ExecutorStatus
  getAllExecutorStats(): Record<string, ExecutorStats>
}
```

### 3. DataSourceTriggerManager (触发管理器)
**文件**: `/managers/DataSourceTriggerManager.ts` ⚠️ **待实现**
**职责**: 各种触发器的管理和协调

```typescript
class DataSourceTriggerManager {
  private triggers: Map<string, Trigger> = new Map()
  
  // 定时器触发器
  setupTimerTrigger(config: TimerTriggerConfig): string {
    const trigger = new TimerTrigger(config)
    const id = this.generateTriggerId()
    this.triggers.set(id, trigger)
    return id
  }
  
  // WebSocket 事件触发器
  setupWebSocketTrigger(config: WSEventTriggerConfig): string {
    const trigger = new WebSocketEventTrigger(config)
    const id = this.generateTriggerId() 
    this.triggers.set(id, trigger)
    return id
  }
  
  // 手动触发器
  setupManualTrigger(config: ManualTriggerConfig): string {
    const trigger = new ManualTrigger(config)
    const id = this.generateTriggerId()
    this.triggers.set(id, trigger)
    return id
  }
  
  // 数据变化触发器
  setupDataChangeTrigger(config: DataChangeTriggerConfig): string {
    const trigger = new DataChangeTrigger(config)
    const id = this.generateTriggerId()
    this.triggers.set(id, trigger)  
    return id
  }
  
  // 触发器控制
  startTrigger(id: string): void
  stopTrigger(id: string): void
  cleanupTrigger(id: string): void
  cleanupAllTriggers(): void
}
```

## 🎨 UI层架构 (UI Layer)

### 组件层级结构
```
DataSourceConfigForm.vue (1200行 - 主协调组件)
├── DataSourceHeader.vue (头部信息显示)
├── DataSourceContent.vue (内容区域容器)
│   └── DataItemCard.vue (数据项卡片展示)
└── DataItemModal.vue (数据项编辑弹窗)
    ├── DataAcquisitionPanel.vue (左侧面板)
    │   ├── JsonDataInput.vue (JSON输入组件)
    │   ├── HttpDataInput.vue (HTTP配置组件)
    │   └── WebSocketDataInput.vue (WebSocket配置组件)
    ├── DataProcessingPanel.vue (右侧面板)
    │   └── JavaScriptEditor.vue (脚本编辑组件)
    └── editors/
        └── MonacoEditor.vue (代码编辑器 - 已弃用)
```

### 关键UI组件设计

#### 1. DataItemModal.vue (核心弹窗)
**设计特点**: 双栏响应式布局
```vue
<template>
  <n-modal v-model:show="visible" preset="card" class="data-item-modal">
    <n-grid :cols="2" :x-gap="16">
      <!-- 左侧：数据获取 -->
      <n-grid-item>
        <DataAcquisitionPanel 
          v-model:config="acquisitionConfig"
          @type-change="handleTypeChange"
        />
      </n-grid-item>
      
      <!-- 右侧：数据处理 -->
      <n-grid-item>
        <DataProcessingPanel
          v-model:config="processingConfig"  
          :preview-data="previewData"
          @script-change="handleScriptChange"
        />
      </n-grid-item>
    </n-grid>
  </n-modal>
</template>
```

#### 2. 数据流响应式设计
```vue
<script setup lang="ts">
// 响应式数据流
const acquisitionConfig = ref<AcquisitionConfig>({})
const processingConfig = ref<ProcessingConfig>({})
const previewData = ref<any>(null)

// 数据获取配置变化 -> 触发预览更新
watch(acquisitionConfig, async (newConfig) => {
  if (newConfig.type && newConfig.content) {
    previewData.value = await executePreview(newConfig)
  }
}, { deep: true })

// 处理脚本变化 -> 重新处理预览数据  
watch(processingConfig, async (newConfig) => {
  if (previewData.value && newConfig.script) {
    previewData.value = await processData(previewData.value, newConfig.script)
  }
}, { deep: true })
</script>
```

## 🔧 核心功能实现

### 1. JSON 格式化和错误修复
**位置**: DataAcquisitionPanel.vue 中的 JSON 处理逻辑
```typescript
/**
 * JSON 自动修复功能
 * 修复常见的 JSON 格式错误
 */
const fixCommonJsonErrors = (jsonStr: string): string => {
  return jsonStr
    // 修复中文引号
    .replace(/"/g, '"').replace(/"/g, '"')  
    .replace(/'/g, "'").replace(/'/g, "'")
    // 修复中文逗号和冒号
    .replace(/，/g, ',').replace(/：/g, ':')  
    .replace(/；/g, ';')
    // 移除尾部逗号
    .replace(/,(\s*[}\]])/g, '$1')
    // 修复单引号为双引号
    .replace(/'/g, '"')
    // 添加缺失的引号
    .replace(/(\w+):/g, '"$1":')
}

/**
 * JSON 格式化功能
 */
const formatJsonContent = () => {
  try {
    const fixed = fixCommonJsonErrors(jsonContent.value)
    const parsed = JSON.parse(fixed)
    jsonContent.value = JSON.stringify(parsed, null, 2)
    jsonValidationStatus.value = { type: 'success', text: '格式正确' }
  } catch (error) {
    jsonValidationStatus.value = { 
      type: 'error', 
      text: '格式错误', 
      detail: error.message 
    }
  }
}
```

### 2. 实时数据预览系统
**设计模式**: 观察者模式 + 防抖处理
```typescript
/**
 * 数据预览更新逻辑
 */
const updatePreviewData = useDebounceFn(async () => {
  if (!currentDataItem.value) return
  
  try {
    // 1. 获取原始数据
    const rawData = await executeDataSource(currentDataItem.value.config)
    
    // 2. 应用过滤脚本
    let processedData = rawData
    if (currentDataItem.value.filterScript?.trim()) {
      processedData = await executeFilterScript(
        rawData, 
        currentDataItem.value.filterScript
      )
    }
    
    // 3. 更新预览
    previewData.value = {
      raw: rawData,
      processed: processedData,
      timestamp: new Date(),
      success: true
    }
  } catch (error) {
    previewData.value = {
      error: error.message,
      timestamp: new Date(),
      success: false
    }
  }
}, 500) // 500ms 防抖
```

### 3. 脚本执行沙箱
**安全执行环境**: 使用 Function 构造器创建安全沙箱
```typescript
/**
 * 安全的脚本执行环境
 */
const executeFilterScript = (data: any, script: string): any => {
  try {
    // 包装脚本为函数
    const wrappedScript = `
      (function(data) {
        ${script}
      })
    `
    
    // 创建安全执行环境
    const scriptFunction = new Function('return ' + wrappedScript)()
    
    // 执行并返回结果
    const result = scriptFunction(data)
    return result !== undefined ? result : data
  } catch (error) {
    console.error('脚本执行错误:', error)
    throw new Error(`脚本执行失败: ${error.message}`)
  }
}
```

## 🚨 已知技术债务和解决方案

### 1. Monaco Editor Worker 问题 (✅ 已解决)
**问题**: Vite + Monaco Editor Worker 加载冲突
**解决方案**: 移除 Monaco Editor，使用轻量级替代方案
```typescript
// 替代方案：使用 Naive UI textarea + 语法验证
<n-input
  v-model:value="scriptContent"
  type="textarea" 
  :rows="12"
  placeholder="请输入JavaScript处理脚本"
  style="font-family: 'Courier New', monospace;"
  @input="validateScript"
/>
```

### 2. 大型组件拆分 (✅ 已解决)
**问题**: DataSourceConfigForm.vue 达到 2191 行
**解决方案**: 按功能职责拆分为 15+ 个专用组件
- 提升可维护性
- 增强代码复用性  
- 支持独立测试

### 3. 触发器系统缺失 (⚠️ 待解决)
**问题**: DataSourceTriggerManager 尚未实现
**影响**: 无法支持自动触发和定时更新
**解决方案**: 
```typescript
// 需要实现的触发器类型
type TriggerType = 'timer' | 'websocket' | 'manual' | 'data-change'

interface TriggerConfig {
  id: string
  type: TriggerType
  enabled: boolean
  config: any
  callback: (data: any) => void
}
```

## 📋 数据结构定义

### 核心数据类型
```typescript
// 数据源配置
interface DataSourceConfig {
  id: string
  name: string
  type: DataSourceType
  config: any
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}

// 数据项配置
interface DataItemConfig {
  id: string
  name: string
  dataSourceType: 'json' | 'http' | 'websocket'
  content: string // JSON 内容或 URL 等
  filterScript?: string // 数据处理脚本
  enabled: boolean
}

// 执行器状态
type ExecutorStatus = 'idle' | 'running' | 'completed' | 'error'

// 执行统计
interface ExecutorStats {
  totalExecutions: number
  successCount: number
  errorCount: number
  averageExecutionTime: number
  lastExecuteTime?: Date
  lastError?: string
}
```

### HTTP 数据源配置
```typescript
interface HttpDataSourceConfig {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  params?: Record<string, any>
  timeout?: number
  retryCount?: number
}
```

### WebSocket 数据源配置  
```typescript
interface WebSocketDataSourceConfig {
  url: string
  protocols?: string[]
  reconnect?: boolean
  reconnectInterval?: number
  maxReconnectAttempts?: number
  heartbeat?: {
    enabled: boolean
    interval: number
    message: string
  }
}
```

## 🔌 集成接口设计

### 与 Visual Editor 集成
```typescript
// Visual Editor 可以通过此接口获取数据源配置
interface VisualEditorIntegration {
  // 获取可用数据源列表
  getAvailableDataSources(): DataSourceConfig[]
  
  // 获取数据源数据
  getDataSourceData(id: string): Promise<any>
  
  // 订阅数据源更新
  subscribeDataSource(id: string, callback: (data: any) => void): string
  
  // 取消订阅
  unsubscribeDataSource(subscriptionId: string): void
}
```

### 与 Card 2.1 集成
```typescript
// Card 2.1 可以通过此接口声明数据需求
interface Card2Integration {
  // 注册组件数据需求
  registerComponentRequirement(
    componentId: string, 
    requirements: ComponentDataRequirements
  ): void
  
  // 绑定数据源到组件
  bindDataSource(
    componentId: string, 
    dataSourceId: string,
    mapping: DataFieldMapping
  ): void
  
  // 获取组件数据
  getComponentData(componentId: string): Promise<any>
}
```

## ⚡ 性能优化策略

### 1. 执行器池化
```typescript
class ExecutorPool {
  private pool: Map<string, DataItemExecutor[]> = new Map()
  private maxPoolSize: number = 5
  
  borrowExecutor(type: string): DataItemExecutor | null {
    const executors = this.pool.get(type) || []
    return executors.pop() || null
  }
  
  returnExecutor(type: string, executor: DataItemExecutor): void {
    executor.cleanup()
    const executors = this.pool.get(type) || []
    if (executors.length < this.maxPoolSize) {
      executors.push(executor)
      this.pool.set(type, executors)
    }
  }
}
```

### 2. 数据缓存策略
```typescript
class DataCache {
  private cache: Map<string, CacheEntry> = new Map()
  private ttl: number = 60000 // 1分钟TTL
  
  set(key: string, data: any, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.ttl
    })
  }
  
  get(key: string): any | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }
}
```

### 3. 批量操作优化
```typescript
class BatchProcessor {
  private batchSize: number = 10
  private processingQueue: ProcessingTask[] = []
  
  async processBatch(tasks: ProcessingTask[]): Promise<any[]> {
    const batches = this.chunkArray(tasks, this.batchSize)
    const results: any[] = []
    
    for (const batch of batches) {
      const batchResults = await Promise.allSettled(
        batch.map(task => task.execute())
      )
      results.push(...batchResults)
    }
    
    return results
  }
  
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }
}
```

---

**📝 注意**: 本文档涵盖了系统的核心技术架构，开发者应该结合 `HANDOVER_SUMMARY.md` 一起阅读，以获得完整的开发上下文。