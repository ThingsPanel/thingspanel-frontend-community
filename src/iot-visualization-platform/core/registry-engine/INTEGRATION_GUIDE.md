# Registry Engine 项目集成指南

本指南将详细说明如何在ThingsPanel项目中完整集成Registry Engine，确保与现有系统的完美兼容。

## 🎯 集成目标

- ✅ **零破坏性集成** - 不影响现有功能的正常运行
- ✅ **渐进式迁移** - 逐步将现有组件迁移到统一管理
- ✅ **性能优化** - 提升组件查询和管理效率
- ✅ **开发体验** - 提供更好的类型安全和开发工具支持

## 📋 集成前检查清单

### 环境要求
- [ ] Vue 3.x + TypeScript 项目
- [ ] 已安装相关依赖包
- [ ] 确认现有组件系统正常运行

### 现有系统确认
- [ ] Card2.1 组件系统运行正常
- [ ] Visual Editor 组件系统运行正常
- [ ] 传统Card系统运行正常
- [ ] RendererManager工作正常

## 🚀 集成步骤

### 第一步：初始化Registry Engine

在应用的主入口文件中初始化Registry Engine：

```typescript
// src/main.ts 或 src/App.vue
import { registryEngine } from '@/iot-visualization-platform/core/registry-engine'
import { adapterManager } from '@/iot-visualization-platform/core/registry-engine/adapters'

// 应用启动时集成所有适配器
async function initializeRegistryEngine() {
  try {
    console.log('🚀 初始化Registry Engine...')

    // 集成所有现有系统的适配器
    await adapterManager.integrateAll()

    // 验证集成状态
    const status = adapterManager.getIntegrationStatus()
    console.log('✅ Registry Engine集成完成:', status)

    // 输出统计信息
    const stats = registryEngine.getStats()
    console.log('📊 Registry Engine统计:', stats)

  } catch (error) {
    console.error('❌ Registry Engine初始化失败:', error)
    // 注意：失败时不应影响应用正常启动
  }
}

// 在Vue应用创建后调用
const app = createApp(App)
app.mount('#app').then(() => {
  initializeRegistryEngine()
})
```

### 第二步：验证向后兼容性

确认现有系统仍能正常工作：

```typescript
// 测试Card2.1组件系统
import { ComponentRegistry } from '@/card2.1/core/component-registry'

// 现有Card2.1注册方式应该仍然有效
ComponentRegistry.register({
  type: 'test-component',
  dataSources: [{ key: 'test', type: 'static', value: 'hello' }]
})

// 验证组件是否同时在Registry Engine中可见
import { registryEngine } from '@/iot-visualization-platform/core/registry-engine'
const registeredComponent = registryEngine.get('test-component')
console.log('组件在Registry Engine中可见:', !!registeredComponent)
```

### 第三步：迁移现有组件查询逻辑

逐步将现有的组件查询逻辑迁移到Registry Engine：

```typescript
// 旧的查询方式（保留作为备用）
import { ComponentRegistry as Card21Registry } from '@/card2.1/core/component-registry'

// 新的统一查询方式
import { ComponentRegistryManager } from '@/iot-visualization-platform/core/registry-engine/component-registry'

class ComponentService {
  // 🔄 向后兼容的查询方法
  static getComponent(id: string) {
    // 首先尝试从Registry Engine查询
    const component = ComponentRegistryManager.getComponentById(id)
    if (component) {
      return component
    }

    // 备用方案：从原始系统查询
    return Card21Registry.get(id)
  }

  // 🎯 新的统一查询方法
  static queryComponents(options: {
    category?: string
    tags?: string[]
    hasDataSources?: boolean
  }) {
    return ComponentRegistryManager.queryComponents({
      category: options.category,
      tags: options.tags,
      hasDataSources: options.hasDataSources
    })
  }

  // 📊 获取组件统计信息
  static getComponentStats() {
    return ComponentRegistryManager.getComponentStats()
  }
}
```

### 第四步：实现组件自动发现

为新项目启用组件自动发现功能：

```typescript
// src/utils/component-discovery.ts
import { ComponentRegistryManager } from '@/iot-visualization-platform/core/registry-engine/component-registry'
import { RegistryItemType } from '@/iot-visualization-platform/core/registry-engine'

export class ComponentDiscovery {
  /**
   * 扫描并注册指定目录下的所有组件
   */
  static async discoverAndRegisterComponents(componentPaths: string[]) {
    const discoveredComponents = []

    for (const path of componentPaths) {
      try {
        // 动态导入组件模块
        const module = await import(path)

        // 检查是否包含组件定义
        if (module.default && this.isValidComponentDefinition(module.default)) {
          discoveredComponents.push(module.default)
        }

        // 检查命名导出
        Object.values(module).forEach(exportedValue => {
          if (this.isValidComponentDefinition(exportedValue)) {
            discoveredComponents.push(exportedValue)
          }
        })
      } catch (error) {
        console.warn(`⚠️ 无法加载组件: ${path}`, error)
      }
    }

    // 批量注册发现的组件
    const result = await ComponentRegistryManager.registerComponents(discoveredComponents)
    console.log(`🔍 组件自动发现完成: 发现${discoveredComponents.length}个, 注册成功${result.successCount}个`)

    return result
  }

  private static isValidComponentDefinition(obj: any): boolean {
    return obj &&
           typeof obj === 'object' &&
           typeof obj.type === 'string'
  }
}

// 在应用启动时使用
ComponentDiscovery.discoverAndRegisterComponents([
  '@/card2.1/components/**/*.ts',
  '@/components/custom-widgets/**/*.ts'
])
```

### 第五步：集成到可视化编辑器

将Registry Engine集成到可视化编辑器中：

```typescript
// src/components/visual-editor/hooks/useComponentRegistry.ts
import { ref, computed, onMounted } from 'vue'
import { ComponentRegistryManager } from '@/iot-visualization-platform/core/registry-engine/component-registry'
import { registryEngine } from '@/iot-visualization-platform/core/registry-engine'

export function useComponentRegistry() {
  const components = ref([])
  const loading = ref(false)

  // 📊 计算属性：按分类分组的组件
  const componentsByCategory = computed(() => {
    const grouped = {}
    components.value.forEach(comp => {
      const category = comp.category || 'uncategorized'
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(comp)
    })
    return grouped
  })

  // 🔍 搜索组件
  const searchComponents = (query: string) => {
    return ComponentRegistryManager.queryComponents({
      filter: (comp) => {
        return comp.name.toLowerCase().includes(query.toLowerCase()) ||
               comp.description?.toLowerCase().includes(query.toLowerCase())
      }
    })
  }

  // 📦 获取可用组件列表
  const loadComponents = async () => {
    loading.value = true
    try {
      components.value = ComponentRegistryManager.queryComponents({
        enabled: true
      })
    } finally {
      loading.value = false
    }
  }

  // 🎧 监听组件注册事件
  const setupComponentWatcher = () => {
    registryEngine.on('register', () => {
      loadComponents() // 重新加载组件列表
    })

    registryEngine.on('unregister', () => {
      loadComponents() // 重新加载组件列表
    })
  }

  onMounted(() => {
    loadComponents()
    setupComponentWatcher()
  })

  return {
    components: readonly(components),
    componentsByCategory,
    searchComponents,
    loadComponents,
    loading: readonly(loading)
  }
}
```

## 🔧 配置和优化

### 性能优化配置

```typescript
// src/config/registry-config.ts
export const registryConfig = {
  // 缓存配置
  cacheSettings: {
    validationCacheTTL: 5 * 60 * 1000, // 5分钟
    queryCacheTTL: 2 * 60 * 1000,      // 2分钟
  },

  // 批量操作配置
  batchSettings: {
    maxBatchSize: 50,        // 单次最大批量操作数量
    batchTimeout: 30000,     // 批量操作超时时间
  },

  // 开发模式配置
  development: {
    enableDetailedLogging: true,
    enablePerformanceMonitoring: true,
    enableValidationWarnings: true,
  }
}
```

### 自定义事件处理

```typescript
// src/services/registry-event-handler.ts
import { registryEngine } from '@/iot-visualization-platform/core/registry-engine'

export class RegistryEventHandler {
  static setup() {
    // 📊 组件注册统计
    let registrationCount = 0
    registryEngine.on('register', (metadata) => {
      registrationCount++
      console.log(`组件注册统计: ${registrationCount}`)

      // 发送到分析服务
      this.sendAnalytics('component_registered', {
        type: metadata.type,
        category: metadata.category
      })
    })

    // 🚨 错误监控
    registryEngine.on('error', (errorInfo) => {
      console.error('Registry Engine错误:', errorInfo)

      // 发送错误报告
      this.sendErrorReport(errorInfo)
    })

    // 📈 性能监控
    registryEngine.on('batch-register-complete', (result) => {
      const successRate = result.success / result.total
      if (successRate < 0.8) {
        console.warn('批量注册成功率较低:', successRate)
      }
    })
  }

  private static sendAnalytics(event: string, data: any) {
    // 实现分析数据发送逻辑
  }

  private static sendErrorReport(error: any) {
    // 实现错误报告发送逻辑
  }
}
```

## 🧪 测试和验证

### 集成测试

```typescript
// tests/registry-integration.test.ts
import { describe, it, expect, beforeAll } from 'vitest'
import { registryEngine } from '@/iot-visualization-platform/core/registry-engine'
import { adapterManager } from '@/iot-visualization-platform/core/registry-engine/adapters'

describe('Registry Engine 集成测试', () => {
  beforeAll(async () => {
    await adapterManager.integrateAll()
  })

  it('应该能够集成所有适配器', () => {
    const status = adapterManager.getIntegrationStatus()
    expect(status.integratedCount).toBeGreaterThan(0)
  })

  it('应该能够查询现有组件', () => {
    const components = registryEngine.query({})
    expect(components.length).toBeGreaterThan(0)
  })

  it('应该保持向后兼容性', async () => {
    // 测试原有注册方式仍然有效
    // ... 具体测试逻辑
  })
})
```

### 性能测试

```typescript
// tests/registry-performance.test.ts
import { performance } from 'perf_hooks'
import { registryEngine, RegistryItemType } from '@/iot-visualization-platform/core/registry-engine'

describe('Registry Engine 性能测试', () => {
  it('大量组件查询性能', () => {
    const start = performance.now()

    for (let i = 0; i < 1000; i++) {
      registryEngine.query({
        type: RegistryItemType.CARD21_COMPONENT,
        enabled: true
      })
    }

    const end = performance.now()
    const duration = end - start

    console.log(`1000次查询耗时: ${duration}ms`)
    expect(duration).toBeLessThan(100) // 期望100ms内完成
  })
})
```

## 🚨 故障排除

### 常见问题解决方案

#### 问题1: 适配器集成失败
```typescript
// 检查适配器状态
const status = adapterManager.getIntegrationStatus()
console.log('适配器状态:', status)

// 逐个测试适配器
const adapters = adapterManager.getRegisteredAdapters()
for (const adapter of adapters) {
  console.log(`${adapter.name}: ${adapter.isAvailable() ? '可用' : '不可用'}`)
}
```

#### 问题2: 组件重复注册
```typescript
// 检查重复组件
const duplicates = registryEngine.query({})
  .map(item => item.metadata.id)
  .filter((id, index, array) => array.indexOf(id) !== index)

if (duplicates.length > 0) {
  console.warn('发现重复组件:', duplicates)
}
```

#### 问题3: 性能问题
```typescript
// 启用性能监控
if (process.env.NODE_ENV === 'development') {
  registryEngine.on('query', (queryInfo) => {
    if (queryInfo.duration > 50) {
      console.warn('慢查询检测:', queryInfo)
    }
  })
}
```

## 📈 监控和维护

### 建立监控指标

```typescript
// src/monitoring/registry-metrics.ts
export class RegistryMetrics {
  static collectMetrics() {
    const stats = registryEngine.getStats()

    return {
      timestamp: Date.now(),
      totalComponents: stats.total,
      componentsByType: stats.byType,
      enabledComponents: stats.enabled,
      memoryUsage: process.memoryUsage ? process.memoryUsage() : null
    }
  }

  static startPeriodicCollection(interval = 60000) {
    setInterval(() => {
      const metrics = this.collectMetrics()
      console.log('Registry Engine指标:', metrics)

      // 发送到监控系统
      this.sendToMonitoring(metrics)
    }, interval)
  }

  private static sendToMonitoring(metrics: any) {
    // 实现监控数据发送逻辑
  }
}
```

## ✅ 集成完成检查

完成集成后，确认以下项目：

- [ ] Registry Engine正常启动并集成所有适配器
- [ ] 现有组件功能完全正常
- [ ] 新的统一查询接口工作正常
- [ ] 性能表现符合预期
- [ ] 错误处理和日志记录正常
- [ ] 测试用例全部通过

## 🎉 集成成功

恭喜！您已经成功集成了Registry Engine。现在您可以享受：

- 🎯 **统一的组件管理** - 所有组件在一个地方管理
- 🚀 **更好的性能** - 优化的查询和索引机制
- 🛡️ **类型安全** - 完整的TypeScript支持
- 📊 **依赖管理** - 智能的依赖关系处理
- 🔍 **强大查询** - 多维度的组件搜索和过滤

开始享受更高效的开发体验吧！