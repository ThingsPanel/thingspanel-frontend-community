# ThingsPanel 脚本引擎系统

## 概述

ThingsPanel 脚本引擎是一个功能强大的 JavaScript 脚本执行系统，专为物联网数据处理场景设计。它提供了安全的沙箱环境、丰富的模板库、灵活的上下文管理和完善的执行监控功能。

### 🎯 核心特性

- **🔒 安全沙箱**：隔离执行环境，防止恶意代码攻击
- **📋 模板系统**：预制脚本模板，支持参数化配置
- **🎛️ 上下文管理**：多种执行上下文，支持变量和函数管理
- **📊 性能监控**：实时执行统计、内存使用监控
- **🔧 工具集成**：内置数据处理、时间处理、网络请求等工具
- **🚀 异步支持**：支持异步脚本执行和流式结果

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                      ScriptEngine (主引擎)                      │
├─────────────────┬─────────────────┬─────────────────┬──────────────┤
│  ScriptExecutor │ ScriptSandbox   │ TemplateManager │ ContextMgr   │
│  (脚本执行器)    │ (安全沙箱)       │ (模板管理)       │ (上下文管理)  │
├─────────────────┼─────────────────┼─────────────────┼──────────────┤
│ • 执行控制      │ • 安全检查       │ • 模板CRUD      │ • 上下文CRUD │
│ • 统计收集      │ • 沙箱隔离       │ • 代码生成      │ • 变量管理   │
│ • 错误处理      │ • 超时控制       │ • 参数验证      │ • 函数管理   │
│ • 日志收集      │ • 内置工具       │ • 分类管理      │ • 克隆合并   │
└─────────────────┴─────────────────┴─────────────────┴──────────────┘
```

## 📁 文件结构

```
src/core/script-engine/
├── index.ts                    # 主入口文件
├── types.ts                    # TypeScript 类型定义
├── script-engine.ts            # 主引擎实现
├── executor.ts                 # 脚本执行器
├── sandbox.ts                  # 安全沙箱
├── template-manager.ts         # 模板管理器
├── context-manager.ts          # 上下文管理器
├── components/                 # Vue 组件
│   └── index.ts               # 组件导出
└── templates/                  # 模板库
    └── built-in-templates.ts  # 内置模板定义
```

## 🚀 快速开始

### 基本使用

```typescript
import { defaultScriptEngine } from '@/core/script-engine'

// 1. 简单脚本执行
const result = await defaultScriptEngine.execute('return Math.random() * 100')
console.log(result.data) // 随机数结果

// 2. 带上下文执行
const contextResult = await defaultScriptEngine.execute(
  'return temperature * 1.8 + 32', // 摄氏度转华氏度
  { temperature: 25 }
)
console.log(contextResult.data) // 77

// 3. 使用模板执行
const templateResult = await defaultScriptEngine.executeTemplate(
  'random-data-generator', 
  { count: 5, fields: [{ name: 'temp', type: 'number' }] }
)
```

### 高级功能

```typescript
// 批量执行
const batchResults = await defaultScriptEngine.executeBatch([
  { code: 'return new Date().getTime()', context: {} },
  { code: 'return Math.PI * radius * radius', context: { radius: 5 } }
])

// 流式执行（实时反馈）
await defaultScriptEngine.executeStream(
  'return "Processing..." + Date.now()',
  {},
  (partialResult) => {
    console.log('进度更新:', partialResult)
  }
)

// 安全检查
const securityCheck = defaultScriptEngine.checkScriptSecurity(
  'eval("malicious code")'
)
console.log(securityCheck) // { safe: false, issues: [...] }
```

## 🔧 核心组件详解

### 1. ScriptExecutor (脚本执行器)

负责实际的脚本执行、结果处理和性能统计。

```typescript
interface IScriptExecutor {
  execute<T>(config: ScriptConfig, context?: ScriptExecutionContext): Promise<ScriptExecutionResult<T>>
  validateSyntax(code: string): { valid: boolean; error?: string }
  getExecutionStats(): ExecutionStats
}
```

**主要功能：**
- ✅ 脚本语法验证
- ✅ 安全执行控制
- ✅ 执行时间统计
- ✅ 错误处理和日志收集
- ✅ 并发执行管理

### 2. ScriptSandbox (安全沙箱)

提供隔离的执行环境，防止恶意代码攻击。

```typescript
interface IScriptSandbox {
  createSandbox(config: SandboxConfig): any
  executeInSandbox(code: string, sandbox: any, timeout?: number): Promise<any>
  destroySandbox(sandbox: any): void
  checkCodeSecurity(code: string): { safe: boolean; issues: string[] }
}
```

**安全特性：**
- 🔒 禁用危险函数 (`eval`, `Function`, `require` 等)
- 🔒 全局对象访问控制
- 🔒 原型污染防护
- 🔒 执行超时控制
- 🔒 自定义安全策略

**允许的安全全局对象：**
```typescript
allowedGlobals: [
  'Math', 'Date', 'JSON', 'Promise',
  'setTimeout', 'clearTimeout', 
  'setInterval', 'clearInterval',
  'console', 'parseInt', 'parseFloat',
  'isNaN', 'isFinite'
]
```

### 3. ScriptTemplateManager (模板管理器)

管理可重用的脚本模板，支持参数化和分类管理。

```typescript
interface IScriptTemplateManager {
  getAllTemplates(): ScriptTemplate[]
  getTemplatesByCategory(category: string): ScriptTemplate[]
  createTemplate(template: Omit<ScriptTemplate, 'id' | 'createdAt' | 'updatedAt'>): ScriptTemplate
  generateCode(templateId: string, parameters: Record<string, any>): string
}
```

**内置模板分类：**
- 📊 **数据生成** (`data-generation`)
  - 模拟设备数据
  - 随机时序数据
  - 数值范围生成
- 🔄 **数据处理** (`data-processing`)
  - 数值计算处理
  - 数组过滤排序
  - 智能对象合并
- 🌐 **API集成** (`api-integration`)
  - HTTP API调用
  - 响应处理
  - 错误重试
- ⏱️ **时序数据** (`time-series`)
  - 时间序列生成
  - 时序数据合并
  - 时间格式化
- 🛠️ **工具函数** (`utility`)
  - 数据验证
  - 性能监控
  - 格式转换

### 4. ScriptContextManager (上下文管理器)

管理脚本执行时的上下文环境，包括变量和函数。

```typescript
interface IScriptContextManager {
  createContext(name: string, variables?: Record<string, any>): ScriptExecutionContext
  updateContext(id: string, updates: Partial<ScriptExecutionContext>): boolean
  cloneContext(id: string, newName: string): ScriptExecutionContext | null
  mergeContexts(sourceId: string, targetId: string): boolean
}
```

**预设上下文：**
- 🏠 **默认上下文**：应用基础信息和通用工具
- 📊 **数据处理上下文**：数据验证和转换函数
- 🏭 **IoT设备上下文**：设备消息解析和数据生成

## 🛠️ 内置工具函数

### 数据生成工具 (`_utils.mockData`)

```javascript
// 在脚本中使用
const randomNum = _utils.mockData.randomNumber(1, 100)
const randomStr = _utils.mockData.randomString(10)
const randomBool = _utils.mockData.randomBoolean()
const randomDate = _utils.mockData.randomDate()
const randomArr = _utils.mockData.randomArray(['A', 'B', 'C'], 2)
```

### 数据处理工具 (`_utils.dataUtils`)

```javascript
// 深拷贝对象
const cloned = _utils.dataUtils.deepClone(originalObj)

// 对象属性选择/排除
const picked = _utils.dataUtils.pick(obj, ['name', 'age'])
const omitted = _utils.dataUtils.omit(obj, ['password'])

// 数组分组和排序
const grouped = _utils.dataUtils.groupBy(array, 'category')
const sorted = _utils.dataUtils.sortBy(array, 'timestamp')
```

### 时间处理工具 (`_utils.timeUtils`)

```javascript
// 时间格式化
const formatted = _utils.timeUtils.format(Date.now(), 'YYYY-MM-DD HH:mm:ss')

// 日期计算
const nextWeek = _utils.timeUtils.addDays(new Date(), 7)
const daysDiff = _utils.timeUtils.diffDays(date1, date2)
```

## 📊 性能监控

### 执行统计

```typescript
const stats = defaultScriptEngine.getExecutionStats()
console.log({
  totalExecutions: stats.executor.totalExecutions,
  successRate: stats.executor.successfulExecutions / stats.executor.totalExecutions,
  averageTime: stats.executor.averageExecutionTime,
  templates: stats.templates.total,
  contexts: stats.contexts.total
})
```

### 内存使用监控

```javascript
// 在模板中使用性能监控
const startTime = performance.now()
const memoryBefore = performance.memory?.usedJSHeapSize || 0

// ... 数据处理逻辑 ...

const endTime = performance.now()
const memoryAfter = performance.memory?.usedJSHeapSize || 0

return {
  result: processedData,
  performance: {
    duration: endTime - startTime,
    memoryUsed: memoryAfter - memoryBefore
  }
}
```

## 🔒 安全最佳实践

### 1. 代码安全检查

```typescript
// 执行前检查代码安全性
const securityCheck = defaultScriptEngine.checkScriptSecurity(userCode)
if (!securityCheck.safe) {
  console.error('安全检查失败:', securityCheck.issues)
  return
}
```

### 2. 执行超时设置

```typescript
const config: ScriptConfig = {
  code: userScript,
  timeout: 10000,        // 10秒超时
  maxMemory: 50 * 1024 * 1024,  // 50MB内存限制
  strictMode: true,      // 严格模式
  allowNetworkAccess: false     // 禁止网络访问
}
```

### 3. 沙箱配置

```typescript
const sandboxConfig: SandboxConfig = {
  enabled: true,
  allowedGlobals: ['Math', 'Date', 'JSON'],  // 只允许安全的全局对象
  blockedGlobals: ['eval', 'Function', 'window'],
  allowEval: false,
  allowFunction: false,
  allowPrototypePollution: false,
  customSecurityPolicy: (code: string) => {
    // 自定义安全检查逻辑
    return !code.includes('dangerous_pattern')
  }
}
```

## 🎯 使用场景

### 1. IoT 数据处理

```typescript
// 传感器数据处理模板
const sensorDataScript = `
const { temperature, humidity, timestamp } = data
return {
  processed: true,
  temperature: Math.round(temperature * 100) / 100,
  humidity: Math.round(humidity * 100) / 100,
  heatIndex: calculateHeatIndex(temperature, humidity),
  timestamp: timestamp,
  alert: temperature > 35 || humidity > 90
}

function calculateHeatIndex(t, h) {
  return -42.379 + 2.04901523*t + 10.14333127*h - 0.22475541*t*h
}
`
```

### 2. 数据可视化预处理

```typescript
// 图表数据格式化
const chartDataScript = `
const chartData = data.map((item, index) => ({
  x: index,
  y: item.value,
  label: item.name,
  color: item.value > 50 ? '#ff4757' : '#2ed573'
}))

return {
  type: 'line',
  data: chartData,
  options: {
    responsive: true,
    scales: {
      y: { min: 0, max: 100 }
    }
  }
}
`
```

### 3. 规则引擎

```typescript
// 设备告警规则
const alertRuleScript = `
const rules = [
  { field: 'temperature', operator: '>', threshold: 30, level: 'warning' },
  { field: 'temperature', operator: '>', threshold: 40, level: 'critical' },
  { field: 'humidity', operator: '<', threshold: 20, level: 'warning' }
]

const alerts = []
rules.forEach(rule => {
  const value = data[rule.field]
  if (value !== undefined) {
    let triggered = false
    switch (rule.operator) {
      case '>': triggered = value > rule.threshold; break
      case '<': triggered = value < rule.threshold; break
      case '>=': triggered = value >= rule.threshold; break
      case '<=': triggered = value <= rule.threshold; break
      case '==': triggered = value == rule.threshold; break
    }
    
    if (triggered) {
      alerts.push({
        field: rule.field,
        value: value,
        threshold: rule.threshold,
        level: rule.level,
        message: \`\${rule.field} 值 \${value} \${rule.operator} \${rule.threshold}\`
      })
    }
  }
})

return { alerts, hasAlerts: alerts.length > 0 }
`
```

## 🔧 配置选项

### 引擎配置

```typescript
const engineConfig: ScriptEngineConfig = {
  // 默认脚本配置
  defaultScriptConfig: {
    timeout: 5000,
    strictMode: true,
    asyncSupport: true,
    maxMemory: 50 * 1024 * 1024,
    allowNetworkAccess: false,
    allowFileSystemAccess: false
  },
  
  // 沙箱配置
  sandboxConfig: {
    enabled: true,
    allowedGlobals: ['Math', 'Date', 'JSON', 'Promise'],
    blockedGlobals: ['eval', 'Function', 'window', 'document']
  },
  
  // 缓存配置
  enableCache: true,
  cacheTTL: 5 * 60 * 1000,  // 5分钟
  
  // 并发控制
  maxConcurrentExecutions: 10,
  
  // 性能监控
  enablePerformanceMonitoring: true
}

const customEngine = new ScriptEngine(engineConfig)
```

## 📝 开发指南

### 创建自定义模板

```typescript
import { defaultScriptEngine } from '@/core/script-engine'

// 创建自定义模板
const customTemplate = defaultScriptEngine.templateManager.createTemplate({
  name: '自定义数据处理',
  description: '根据业务需求处理数据',
  category: 'custom',
  code: `
    const threshold = {{threshold}}
    const field = {{field}}
    
    if (Array.isArray(data)) {
      return data.filter(item => item[field] > threshold)
    }
    
    return data[field] > threshold ? data : null
  `,
  parameters: [
    {
      name: 'threshold',
      type: 'number',
      description: '过滤阈值',
      required: true,
      defaultValue: 0
    },
    {
      name: 'field',
      type: 'string', 
      description: '比较字段',
      required: true,
      defaultValue: 'value'
    }
  ],
  example: '// context = { threshold: 50, field: "temperature" }'
})
```

### 扩展上下文功能

```typescript
// 创建专用上下文
const deviceContext = defaultScriptEngine.contextManager.createContext(
  '设备专用上下文',
  {
    deviceType: 'sensor',
    location: 'building_a',
    protocol: 'mqtt'
  }
)

// 添加自定义函数
defaultScriptEngine.contextManager.addFunction(
  deviceContext.id,
  'parseDeviceMessage',
  (rawMessage: string) => {
    try {
      return JSON.parse(rawMessage)
    } catch {
      return { error: 'Invalid message format', raw: rawMessage }
    }
  }
)
```

### 错误处理和调试

```typescript
try {
  const result = await defaultScriptEngine.execute(userScript, context)
  
  if (!result.success) {
    console.error('脚本执行失败:', result.error?.message)
    console.log('执行日志:', result.logs)
    console.log('上下文快照:', result.contextSnapshot)
  } else {
    console.log('执行成功:', result.data)
    console.log('执行时间:', result.executionTime + 'ms')
  }
} catch (error) {
  console.error('引擎异常:', error)
}
```

## 🧪 测试和调试

### 单元测试示例

```typescript
import { ScriptEngine } from '@/core/script-engine'

describe('ScriptEngine', () => {
  let engine: ScriptEngine

  beforeEach(() => {
    engine = new ScriptEngine()
  })

  test('基本脚本执行', async () => {
    const result = await engine.execute('return 1 + 1')
    expect(result.success).toBe(true)
    expect(result.data).toBe(2)
  })

  test('模板执行', async () => {
    const result = await engine.executeTemplate('random-data-generator', {
      count: 3,
      fields: [{ name: 'test', type: 'number' }]
    })
    expect(result.success).toBe(true)
    expect(Array.isArray(result.data)).toBe(true)
    expect(result.data.length).toBe(3)
  })

  test('安全检查', () => {
    const check = engine.checkScriptSecurity('eval("malicious")')
    expect(check.safe).toBe(false)
    expect(check.issues.length).toBeGreaterThan(0)
  })
})
```

## 🚀 性能优化

### 1. 预热引擎

```typescript
// 应用启动时预热引擎
await defaultScriptEngine.warmup()
```

### 2. 缓存常用脚本

```typescript
// 使用模板而不是重复的内联脚本
const templateId = 'data-processor'
const result = await defaultScriptEngine.executeTemplate(templateId, params)
```

### 3. 批量处理

```typescript
// 批量执行而不是单个循环
const scripts = dataItems.map(item => ({
  code: 'return processItem(data)',
  context: { data: item }
}))
const results = await defaultScriptEngine.executeBatch(scripts)
```

## 📈 监控和运维

### 引擎状态导出

```typescript
// 导出引擎状态用于备份
const engineState = defaultScriptEngine.exportState()
localStorage.setItem('script-engine-backup', JSON.stringify(engineState))

// 恢复引擎状态
const savedState = JSON.parse(localStorage.getItem('script-engine-backup'))
defaultScriptEngine.importState(savedState)
```

### 性能指标监控

```typescript
// 定期收集性能指标
setInterval(() => {
  const stats = defaultScriptEngine.getExecutionStats()
  
  // 发送到监控系统
  sendMetrics({
    totalExecutions: stats.executor.totalExecutions,
    successRate: stats.executor.successfulExecutions / stats.executor.totalExecutions,
    avgExecutionTime: stats.executor.averageExecutionTime,
    currentConcurrency: stats.executor.currentConcurrentExecutions
  })
}, 60000) // 每分钟一次
```

## 🤝 贡献指南

1. **添加新模板**：在 `templates/built-in-templates.ts` 中添加
2. **扩展工具函数**：在 `sandbox.ts` 的 `createBuiltinUtils` 方法中添加
3. **增强安全检查**：在 `sandbox.ts` 的 `checkCodeSecurity` 方法中添加规则
4. **优化性能**：关注执行时间和内存使用

## 📄 许可证

本项目基于 MIT 许可证开源。

---

## 📞 技术支持

如有问题或建议，请提交 Issue 或联系开发团队。

**🌟 享受使用 ThingsPanel 脚本引擎的强大功能！**