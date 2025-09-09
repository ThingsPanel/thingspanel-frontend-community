# 问题排查 - Card 2.1 故障诊断与解决方案

本章提供 Card 2.1 组件系统常见问题的诊断方法、解决方案和预防措施，帮助开发者快速定位和修复问题。

## 🚨 问题分类索引

### 📋 快速问题定位
```
组件相关问题 → [组件问题诊断](#组件问题诊断)
├── 组件加载失败 → 检查注册和路径
├── 组件显示异常 → 检查配置和数据
└── 组件交互故障 → 检查交互配置

数据相关问题 → [数据问题诊断](#数据问题诊断)  
├── 数据加载失败 → 检查数据源配置
├── 数据显示错误 → 检查字段映射
└── 数据更新异常 → 检查响应式绑定

性能相关问题 → [性能问题诊断](#性能问题诊断)
├── 加载缓慢 → 检查懒加载和缓存
├── 内存泄漏 → 检查事件监听器
└── 渲染卡顿 → 检查虚拟化和优化

系统集成问题 → [集成问题诊断](#集成问题诊断)
├── Visual Editor集成 → 检查桥接器配置
├── 主题系统异常 → 检查CSS变量
└── 国际化显示问题 → 检查语言包
```

## 🔧 诊断工具和方法

### 1. 内置诊断工具
```vue
<!-- 诊断面板组件 -->
<script setup lang="ts">
/**
 * Card 2.1 系统诊断面板
 * 提供实时的系统状态监控和问题检测
 */

import { ref, computed, onMounted } from 'vue'
import { ComponentRegistry } from '@card2/core/component-registry'
import { performanceMonitor } from '@card2/core/performance/performance-monitor'
import { cacheManager } from '@card2/core/optimization/cache-manager'

interface DiagnosticResult {
  category: string
  level: 'info' | 'warning' | 'error'
  message: string
  solution?: string
}

const diagnosticResults = ref<DiagnosticResult[]>([])
const isRunning = ref(false)

/**
 * 运行系统诊断
 */
const runSystemDiagnostic = async () => {
  isRunning.value = true
  diagnosticResults.value = []
  
  try {
    // 检查组件注册状态
    await checkComponentRegistry()
    
    // 检查数据源配置
    await checkDataSources()
    
    // 检查性能指标
    await checkPerformanceMetrics()
    
    // 检查缓存状态
    await checkCacheStatus()
    
    // 检查内存使用
    await checkMemoryUsage()
    
    // 检查错误日志
    await checkErrorLogs()
    
  } finally {
    isRunning.value = false
  }
}

/**
 * 检查组件注册状态
 */
const checkComponentRegistry = async () => {
  const registry = ComponentRegistry.getInstance()
  const registeredCount = registry.getRegisteredCount()
  const loadedCount = registry.getLoadedCount()
  
  if (registeredCount === 0) {
    diagnosticResults.value.push({
      category: '组件注册',
      level: 'error',
      message: '没有注册任何组件',
      solution: '检查组件自动注册配置，确保组件定义文件路径正确'
    })
  } else if (loadedCount / registeredCount < 0.5) {
    diagnosticResults.value.push({
      category: '组件加载',
      level: 'warning',
      message: `组件加载率低：${loadedCount}/${registeredCount}`,
      solution: '检查组件加载错误日志，修复组件定义问题'
    })
  } else {
    diagnosticResults.value.push({
      category: '组件系统',
      level: 'info',
      message: `组件系统正常：${registeredCount} 个组件已注册，${loadedCount} 个已加载`
    })
  }
}

/**
 * 检查数据源配置
 */
const checkDataSources = async () => {
  // 模拟数据源检查
  const testDataSources = [
    { type: 'api', url: '/api/test' },
    { type: 'websocket', url: 'ws://localhost:3000' }
  ]
  
  for (const ds of testDataSources) {
    try {
      if (ds.type === 'api') {
        const response = await fetch(ds.url, { method: 'HEAD' })
        if (!response.ok) {
          diagnosticResults.value.push({
            category: '数据源',
            level: 'warning',
            message: `API数据源不可达: ${ds.url}`,
            solution: '检查API服务状态，确认URL正确性'
          })
        }
      }
    } catch (error) {
      diagnosticResults.value.push({
        category: '数据源',
        level: 'error',
        message: `数据源连接失败: ${ds.url}`,
        solution: '检查网络连接和服务器状态'
      })
    }
  }
}

/**
 * 检查性能指标
 */
const checkPerformanceMetrics = async () => {
  const report = performanceMonitor.getPerformanceReport()
  
  if (report.overview.averageLoadTime > 2000) {
    diagnosticResults.value.push({
      category: '性能',
      level: 'warning',
      message: `组件加载时间过长: ${report.overview.averageLoadTime.toFixed(0)}ms`,
      solution: '启用组件懒加载，优化组件代码，使用缓存策略'
    })
  }
  
  if (report.overview.memoryUsage > 100 * 1024 * 1024) {
    diagnosticResults.value.push({
      category: '性能',
      level: 'warning',
      message: `内存使用过高: ${(report.overview.memoryUsage / 1024 / 1024).toFixed(1)}MB`,
      solution: '检查内存泄漏，清理未使用的事件监听器，优化数据结构'
    })
  }
}

/**
 * 检查缓存状态
 */
const checkCacheStatus = async () => {
  const cacheStats = cacheManager.getStats()
  
  if (cacheStats.hitRate < 0.5) {
    diagnosticResults.value.push({
      category: '缓存',
      level: 'warning',
      message: `缓存命中率低: ${(cacheStats.hitRate * 100).toFixed(1)}%`,
      solution: '优化缓存策略，增加缓存TTL，预热常用数据'
    })
  }
  
  if (cacheStats.memoryUsage > 50 * 1024 * 1024) {
    diagnosticResults.value.push({
      category: '缓存',
      level: 'warning',
      message: `缓存占用内存过多: ${(cacheStats.memoryUsage / 1024 / 1024).toFixed(1)}MB`,
      solution: '清理过期缓存，减少缓存大小限制'
    })
  }
}

/**
 * 检查内存使用
 */
const checkMemoryUsage = async () => {
  if ('memory' in performance) {
    const memInfo = (performance as any).memory
    const usedMB = memInfo.usedJSHeapSize / 1024 / 1024
    const totalMB = memInfo.totalJSHeapSize / 1024 / 1024
    
    if (usedMB / totalMB > 0.8) {
      diagnosticResults.value.push({
        category: '内存',
        level: 'error',
        message: `内存使用率过高: ${(usedMB / totalMB * 100).toFixed(1)}%`,
        solution: '执行垃圾回收，检查内存泄漏，优化数据结构'
      })
    }
  }
}

/**
 * 检查错误日志
 */
const checkErrorLogs = async () => {
  // 检查控制台错误（模拟）
  const errorCount = getErrorLogCount()
  
  if (errorCount > 0) {
    diagnosticResults.value.push({
      category: '错误日志',
      level: 'error',
      message: `发现 ${errorCount} 个错误`,
      solution: '查看浏览器控制台，修复JavaScript错误'
    })
  }
}

// 获取错误日志数量（模拟实现）
const getErrorLogCount = () => {
  // 实际实现中可以接入日志系统
  return 0
}

const errorLevelColor = {
  info: 'success',
  warning: 'warning', 
  error: 'error'
}

onMounted(() => {
  runSystemDiagnostic()
})
</script>

<template>
  <div class="diagnostic-panel">
    <n-card title="Card 2.1 系统诊断">
      <template #header-extra>
        <n-button 
          :loading="isRunning" 
          @click="runSystemDiagnostic"
        >
          重新诊断
        </n-button>
      </template>
      
      <n-space vertical>
        <!-- 诊断结果概览 -->
        <n-alert
          v-if="!isRunning && diagnosticResults.length === 0"
          type="success"
          title="系统状态良好"
        >
          未发现任何问题
        </n-alert>
        
        <!-- 诊断结果列表 -->
        <div v-for="result in diagnosticResults" :key="result.message">
          <n-alert
            :type="errorLevelColor[result.level]"
            :title="result.category"
          >
            <div>{{ result.message }}</div>
            <div v-if="result.solution" class="solution">
              <strong>解决方案：</strong>{{ result.solution }}
            </div>
          </n-alert>
        </div>
        
        <!-- 加载状态 -->
        <n-skeleton v-if="isRunning" height="200px" />
      </n-space>
    </n-card>
  </div>
</template>

<style scoped>
.diagnostic-panel {
  width: 100%;
}

.solution {
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-color-2);
}
</style>
```

### 2. 开发者工具集成
```typescript
// src/card2.1/core/debugging/dev-tools.ts
/**
 * 开发者工具集成
 * 提供调试信息和诊断功能
 */

declare global {
  interface Window {
    __CARD2_DEV_TOOLS__: {
      registry: ComponentRegistry
      performanceMonitor: typeof performanceMonitor
      cacheManager: typeof cacheManager
      diagnose: () => Promise<DiagnosticReport>
      exportLogs: () => string
    }
  }
}

export interface DiagnosticReport {
  timestamp: number
  components: ComponentDiagnostic[]
  performance: PerformanceReport
  cache: CacheReport
  errors: ErrorReport[]
}

/**
 * 初始化开发者工具
 */
export function initializeDevTools() {
  if (process.env.NODE_ENV === 'development') {
    window.__CARD2_DEV_TOOLS__ = {
      registry: ComponentRegistry.getInstance(),
      performanceMonitor,
      cacheManager,
      diagnose: runFullDiagnostic,
      exportLogs: exportDiagnosticLogs
    }
    
    console.log('Card 2.1 开发者工具已启用')
    console.log('使用 window.__CARD2_DEV_TOOLS__ 访问调试功能')
  }
}

/**
 * 运行完整诊断
 */
async function runFullDiagnostic(): Promise<DiagnosticReport> {
  const timestamp = Date.now()
  
  // 收集组件诊断信息
  const components = await collectComponentDiagnostics()
  
  // 收集性能报告
  const performance = performanceMonitor.getPerformanceReport()
  
  // 收集缓存报告
  const cache = cacheManager.getStats()
  
  // 收集错误报告
  const errors = collectErrorReports()
  
  const report: DiagnosticReport = {
    timestamp,
    components,
    performance,
    cache,
    errors
  }
  
  console.group('Card 2.1 诊断报告')
  console.log('时间戳:', new Date(timestamp).toISOString())
  console.log('组件诊断:', components)
  console.log('性能报告:', performance)
  console.log('缓存报告:', cache)
  console.log('错误报告:', errors)
  console.groupEnd()
  
  return report
}

/**
 * 收集组件诊断信息
 */
async function collectComponentDiagnostics(): Promise<ComponentDiagnostic[]> {
  const registry = ComponentRegistry.getInstance()
  const diagnostics: ComponentDiagnostic[] = []
  
  for (const [type, definition] of registry.getRegisteredComponents()) {
    const diagnostic: ComponentDiagnostic = {
      type,
      name: definition.name,
      isLoaded: registry.isLoaded(type),
      instances: registry.getInstanceCount(type),
      errors: registry.getComponentErrors(type),
      performance: performanceMonitor.getComponentMetrics(type)
    }
    
    diagnostics.push(diagnostic)
  }
  
  return diagnostics
}

/**
 * 导出诊断日志
 */
function exportDiagnosticLogs(): string {
  const logs = {
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    components: window.__CARD2_DEV_TOOLS__.registry.getAllDiagnostics(),
    performance: window.__CARD2_DEV_TOOLS__.performanceMonitor.getPerformanceReport(),
    cache: window.__CARD2_DEV_TOOLS__.cacheManager.getStats(),
    console: getConsoleHistory()
  }
  
  return JSON.stringify(logs, null, 2)
}

/**
 * 获取控制台历史记录
 */
function getConsoleHistory(): any[] {
  // 实际实现需要劫持console方法来记录历史
  return []
}
```

## 🐛 组件问题诊断

### 1. 组件加载失败
**症状**：组件无法加载，控制台报错，组件库中不显示

**诊断步骤**：
```typescript
// 诊断脚本
const diagnoseComponentLoading = (componentType: string) => {
  console.group(`诊断组件: ${componentType}`)
  
  // 1. 检查组件定义文件
  const definitionPath = `src/card2.1/components/*/*/definition.ts`
  console.log('1. 检查定义文件路径:', definitionPath)
  
  // 2. 检查组件注册状态
  const registry = ComponentRegistry.getInstance()
  const isRegistered = registry.has(componentType)
  console.log('2. 组件注册状态:', isRegistered)
  
  if (!isRegistered) {
    console.error('❌ 组件未注册，可能的原因：')
    console.log('   - definition.ts 文件不存在')
    console.log('   - 文件路径不符合规范')
    console.log('   - 组件定义格式错误')
  }
  
  // 3. 检查组件加载状态
  if (isRegistered) {
    const isLoaded = registry.isLoaded(componentType)
    console.log('3. 组件加载状态:', isLoaded)
    
    if (!isLoaded) {
      console.error('❌ 组件加载失败，可能的原因：')
      console.log('   - Vue组件文件语法错误')
      console.log('   - 依赖导入失败')
      console.log('   - TypeScript 类型错误')
    }
  }
  
  // 4. 检查组件错误日志
  const errors = registry.getComponentErrors(componentType)
  if (errors.length > 0) {
    console.error('4. 组件错误日志:', errors)
  }
  
  console.groupEnd()
}

// 使用示例
diagnoseComponentLoading('simple-display')
```

**常见解决方案**：
1. **定义文件问题**
   ```typescript
   // 确保 definition.ts 导出正确
   export const definition: ComponentDefinition = {
     type: 'component-type', // 必须匹配目录名
     name: '组件名称',
     // ... 其他配置
   }
   export default definition
   ```

2. **路径配置问题**
   ```typescript
   // 确保自动注册路径正确
   const componentFiles = import.meta.glob(
     '/src/card2.1/components/*/*/definition.ts'
   )
   ```

3. **组件代码问题**
   ```vue
   <!-- 检查Vue组件语法 -->
   <script setup lang="ts">
   // 确保没有TypeScript错误
   // 确保所有导入都正确
   </script>
   ```

### 2. 组件显示异常
**症状**：组件加载成功但显示不正确、样式错误、功能异常

**诊断清单**：
```markdown
## 显示异常诊断清单

### ✅ 基础检查
- [ ] 检查组件Props是否正确传递
- [ ] 检查数据绑定是否正常
- [ ] 检查样式是否应用
- [ ] 检查控制台是否有错误

### ✅ 数据检查  
- [ ] 数据源配置是否正确
- [ ] 字段映射是否匹配
- [ ] 数据格式是否符合预期
- [ ] 响应式绑定是否正常

### ✅ 样式检查
- [ ] CSS变量是否正确引用
- [ ] 主题系统是否正常工作
- [ ] 响应式布局是否正确
- [ ] 浏览器兼容性是否有问题

### ✅ 功能检查
- [ ] 事件监听器是否正确绑定
- [ ] 交互逻辑是否正常
- [ ] 生命周期钩子是否执行
- [ ] 外部依赖是否可用
```

### 3. 组件交互故障
**症状**：组件间交互不工作、事件不触发、响应不正确

**调试工具**：
```typescript
// 交互调试器
const debugInteraction = (sourceId: string, targetId: string) => {
  const interactionManager = InteractionManager.getInstance()
  
  console.group(`调试交互: ${sourceId} -> ${targetId}`)
  
  // 1. 检查组件是否存在
  const sourceExists = document.querySelector(`[data-component-id="${sourceId}"]`)
  const targetExists = document.querySelector(`[data-component-id="${targetId}"]`)
  
  console.log('1. 源组件存在:', !!sourceExists)
  console.log('1. 目标组件存在:', !!targetExists)
  
  // 2. 检查交互配置
  const interactions = interactionManager.getInteractions(sourceId)
  console.log('2. 交互配置:', interactions)
  
  // 3. 检查组件能力
  const sourceCap = interactionManager.getComponentCapability(sourceId)
  const targetCap = interactionManager.getComponentCapability(targetId)
  
  console.log('3. 源组件能力:', sourceCap)
  console.log('3. 目标组件能力:', targetCap)
  
  // 4. 检查事件监听器
  const listeners = interactionManager.getEventListeners(sourceId)
  console.log('4. 事件监听器:', listeners)
  
  console.groupEnd()
}
```

## 📊 数据问题诊断

### 1. 数据加载失败
**症状**：组件显示"加载中"状态、显示错误信息、数据为空

**诊断脚本**：
```typescript
const diagnoseDataLoading = async (componentId: string) => {
  console.group(`诊断数据加载: ${componentId}`)
  
  try {
    // 1. 获取组件数据源配置
    const component = getComponentInstance(componentId)
    const dataSources = component?.dataSources || []
    
    console.log('1. 数据源配置:', dataSources)
    
    // 2. 逐一测试数据源
    for (const [key, config] of Object.entries(dataSources)) {
      console.group(`测试数据源: ${key}`)
      
      try {
        // 模拟数据获取
        const result = await executeDataSource(config)
        console.log('✅ 数据获取成功:', result)
        
        // 检查字段映射
        const mappedData = applyFieldMappings(result, config.fieldMappings)
        console.log('✅ 字段映射结果:', mappedData)
        
      } catch (error) {
        console.error('❌ 数据获取失败:', error)
        
        // 详细错误分析
        if (error.name === 'TypeError') {
          console.log('   可能原因：网络连接问题、CORS问题')
        } else if (error.name === 'SyntaxError') {
          console.log('   可能原因：JSON解析失败、响应格式错误')
        } else if (error.status === 404) {
          console.log('   可能原因：API端点不存在')
        } else if (error.status === 401) {
          console.log('   可能原因：认证失败')
        }
      }
      
      console.groupEnd()
    }
    
  } catch (error) {
    console.error('诊断过程出错:', error)
  }
  
  console.groupEnd()
}
```

### 2. 数据显示错误
**症状**：数据加载成功但显示格式错误、字段缺失、类型转换问题

**字段映射验证器**：
```typescript
const validateFieldMappings = (data: any, mappings: Record<string, FieldMapping>) => {
  console.group('验证字段映射')
  
  const results = {
    success: [],
    warnings: [],
    errors: []
  }
  
  for (const [field, mapping] of Object.entries(mappings)) {
    try {
      // 检查路径是否存在
      const value = getValueByPath(data, mapping.path)
      
      if (value === undefined) {
        results.warnings.push(`字段 ${field}: 路径 ${mapping.path} 不存在`)
        continue
      }
      
      // 检查类型转换
      const convertedValue = convertType(value, mapping.type)
      
      if (convertedValue === null) {
        results.errors.push(`字段 ${field}: 无法转换为 ${mapping.type} 类型`)
      } else {
        results.success.push(`字段 ${field}: ✅ 映射成功`)
      }
      
    } catch (error) {
      results.errors.push(`字段 ${field}: 映射异常 - ${error.message}`)
    }
  }
  
  console.log('✅ 成功映射:', results.success)
  console.warn('⚠️ 警告:', results.warnings)
  console.error('❌ 错误:', results.errors)
  
  console.groupEnd()
  
  return results
}
```

## 🚀 性能问题诊断

### 1. 加载缓慢问题
**症状**：组件加载时间过长、页面响应缓慢、白屏时间长

**性能分析器**：
```typescript
const analyzePerformance = () => {
  console.group('性能分析')
  
  // 1. 组件加载时间分析
  const loadTimes = performanceMonitor.getComponentLoadTimes()
  const slowComponents = loadTimes
    .filter(item => item.time > 1000)
    .sort((a, b) => b.time - a.time)
  
  if (slowComponents.length > 0) {
    console.warn('🐌 加载缓慢的组件:')
    slowComponents.forEach(item => {
      console.log(`   ${item.component}: ${item.time}ms`)
    })
    
    console.log('优化建议:')
    console.log('   - 启用组件懒加载')
    console.log('   - 优化组件代码复杂度')
    console.log('   - 使用代码分割')
  }
  
  // 2. 内存使用分析
  if ('memory' in performance) {
    const memory = (performance as any).memory
    const used = memory.usedJSHeapSize / 1024 / 1024
    const total = memory.totalJSHeapSize / 1024 / 1024
    
    console.log(`📊 内存使用: ${used.toFixed(1)}MB / ${total.toFixed(1)}MB`)
    
    if (used / total > 0.8) {
      console.warn('⚠️ 内存使用率过高，可能存在内存泄漏')
    }
  }
  
  // 3. 缓存效率分析
  const cacheStats = cacheManager.getStats()
  console.log(`💾 缓存命中率: ${(cacheStats.hitRate * 100).toFixed(1)}%`)
  
  if (cacheStats.hitRate < 0.5) {
    console.warn('⚠️ 缓存命中率低，建议优化缓存策略')
  }
  
  console.groupEnd()
}
```

### 2. 内存泄漏检测
```typescript
const detectMemoryLeaks = () => {
  console.group('内存泄漏检测')
  
  const initialMemory = (performance as any).memory?.usedJSHeapSize
  
  return {
    start: () => {
      console.log('🔍 开始内存监控...')
    },
    
    check: () => {
      if (!initialMemory) {
        console.log('⚠️ 浏览器不支持内存监控')
        return
      }
      
      const currentMemory = (performance as any).memory.usedJSHeapSize
      const growth = currentMemory - initialMemory
      
      console.log(`📈 内存增长: ${(growth / 1024 / 1024).toFixed(2)}MB`)
      
      if (growth > 50 * 1024 * 1024) { // 50MB
        console.warn('🚨 检测到可能的内存泄漏')
        
        // 检查常见泄漏源
        console.log('检查要点:')
        console.log('   - 事件监听器是否正确移除')
        console.log('   - 定时器是否正确清理')
        console.log('   - 组件销毁时是否清理资源')
        console.log('   - 循环引用是否存在')
      }
    }
  }
}
```

## 🔗 集成问题诊断

### 1. Visual Editor 集成问题
**症状**：组件在编辑器中不显示、拖拽功能异常、配置面板打不开

**集成检查器**：
```typescript
const checkVisualEditorIntegration = () => {
  console.group('Visual Editor 集成检查')
  
  // 1. 检查桥接器状态
  const bridge = getVisualEditorBridge()
  console.log('1. 桥接器状态:', bridge ? '正常' : '未初始化')
  
  if (!bridge) {
    console.error('❌ 桥接器未初始化，可能原因:')
    console.log('   - useVisualEditorIntegration 未正确调用')
    console.log('   - 组件注册表为空')
    return
  }
  
  // 2. 检查组件转换
  const widgets = bridge.getAvailableWidgets()
  console.log('2. 可用组件数量:', widgets.length)
  
  if (widgets.length === 0) {
    console.error('❌ 无可用组件，检查:')
    console.log('   - 组件注册是否成功')
    console.log('   - 组件定义格式是否正确')
  }
  
  // 3. 检查组件结构转换
  widgets.slice(0, 3).forEach(widget => {
    console.log(`3. 组件结构 ${widget.type}:`, {
      hasDefaultLayout: !!widget.defaultLayout,
      hasCanvasLayout: !!widget.defaultLayout?.canvas,
      hasGridstackLayout: !!widget.defaultLayout?.gridstack,
      hasMetadata: !!widget.metadata
    })
  })
  
  console.groupEnd()
}
```

### 2. 主题系统问题
**症状**：主题切换不生效、颜色显示错误、CSS变量未定义

**主题检查器**：
```typescript
const checkThemeSystem = () => {
  console.group('主题系统检查')
  
  // 1. 检查主题Store状态
  const themeStore = useThemeStore()
  console.log('1. 当前主题:', themeStore.theme)
  console.log('1. 暗黑模式:', themeStore.darkMode)
  
  // 2. 检查CSS变量定义
  const testVariables = [
    '--primary-color',
    '--text-color',
    '--card-color',
    '--border-color'
  ]
  
  const missingVariables = []
  testVariables.forEach(variable => {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(variable)
    
    if (!value) {
      missingVariables.push(variable)
    } else {
      console.log(`2. ${variable}:`, value)
    }
  })
  
  if (missingVariables.length > 0) {
    console.error('❌ 缺失CSS变量:', missingVariables)
  }
  
  // 3. 检查主题文件加载
  const themeLinks = document.querySelectorAll('link[href*="theme"]')
  console.log('3. 主题文件数量:', themeLinks.length)
  
  console.groupEnd()
}
```

## 🛠️ 自动修复工具

### 1. 常见问题自动修复
```typescript
const autoFix = {
  /**
   * 修复组件注册问题
   */
  async fixComponentRegistry() {
    console.log('🔧 自动修复组件注册...')
    
    const registry = ComponentRegistry.getInstance()
    
    // 清空现有注册
    registry.clear()
    
    // 重新执行自动注册
    await registry.autoRegister()
    
    console.log('✅ 组件注册修复完成')
  },
  
  /**
   * 清理缓存
   */
  clearAllCaches() {
    console.log('🔧 清理所有缓存...')
    
    // 清理应用缓存
    cacheManager.clear()
    
    // 清理浏览器缓存
    if ('serviceWorker' in navigator) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name))
      })
    }
    
    console.log('✅ 缓存清理完成')
  },
  
  /**
   * 重置性能监控
   */
  resetPerformanceMonitoring() {
    console.log('🔧 重置性能监控...')
    
    performanceMonitor.clearMetrics()
    performanceMonitor.initialize()
    
    console.log('✅ 性能监控重置完成')
  },
  
  /**
   * 修复内存泄漏
   */
  fixMemoryLeaks() {
    console.log('🔧 尝试修复内存泄漏...')
    
    // 强制垃圾回收（仅在开发环境）
    if (window.gc) {
      window.gc()
    }
    
    // 清理全局事件监听器
    InteractionManager.getInstance().clearAllListeners()
    
    // 清理定时器
    clearAllTimers()
    
    console.log('✅ 内存清理完成')
  }
}
```

## 📋 问题报告模板

### 1. Bug报告模板
```markdown
# Bug报告

## 问题描述
简要描述遇到的问题

## 重现步骤
1. 步骤一
2. 步骤二
3. 步骤三

## 预期行为
描述预期应该发生什么

## 实际行为
描述实际发生了什么

## 环境信息
- 浏览器版本:
- 操作系统:
- Card 2.1 版本:
- 相关组件:

## 错误日志
```
粘贴控制台错误信息
```

## 诊断信息
```javascript
// 粘贴 window.__CARD2_DEV_TOOLS__.diagnose() 结果
```

## 附加信息
其他相关信息、截图等
```

### 2. 性能问题报告模板
```markdown
# 性能问题报告

## 问题描述
具体的性能问题描述

## 性能指标
- 页面加载时间:
- 组件渲染时间:
- 内存使用量:
- 缓存命中率:

## 重现场景
- 组件数量:
- 数据量大小:
- 操作频率:

## 浏览器信息
- 浏览器版本:
- 设备配置:
- 网络环境:

## 性能分析报告
```
粘贴 analyzePerformance() 结果
```
```

## 🔗 相关文档

- [调试工具](./15-debugging-tools.md) - 详细调试方法
- [性能优化](./14-performance.md) - 性能问题解决
- [测试指南](./16-testing-guide.md) - 问题预防测试
- [最佳实践](./17-best-practices.md) - 避免常见问题

---

**快速诊断和解决问题是开发效率的关键！** 🚨

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "\u521b\u5eba\u7b2c13\u7ae0\uff1a\u56fd\u9645\u5316\u7cfb\u7edf\u6587\u6863", "status": "completed", "activeForm": "\u6b63\u5728\u521b\u5eba\u7b2c13\u7ae0\uff1a\u56fd\u9645\u5316\u7cfb\u7edf\u6587\u6863"}, {"content": "\u521b\u5eba\u7b2c14\u7ae0\uff1a\u6027\u80fd\u4f18\u5316\u6587\u6863", "status": "completed", "activeForm": "\u6b63\u5728\u521b\u5eba\u7b2c14\u7ae0\uff1a\u6027\u80fd\u4f18\u5316\u6587\u6863"}, {"content": "\u521b\u5eba\u7b2c16\u7ae0\uff1a\u6d4b\u8bd5\u6307\u5357\u6587\u6863", "status": "completed", "activeForm": "\u6b63\u5728\u521b\u5eba\u7b2c16\u7ae0\uff1a\u6d4b\u8bd5\u6307\u5357\u6587\u6863"}, {"content": "\u521b\u5eba\u7b2c20\u7ae0\uff1a\u95ee\u9898\u6392\u67e5\u6587\u6863", "status": "completed", "activeForm": "\u6b63\u5728\u521b\u5eba\u7b2c20\u7ae0\uff1a\u95ee\u9898\u6392\u67e5\u6587\u6863"}]