# Registry Engine 快速上手指南

## 🚀 1分钟快速上手

Registry Engine 是 ThingsPanel 的统一注册管理系统，让你能够轻松管理所有组件、渲染器、数据源等资源。

### 最简单的使用方式

```typescript
import { registryEngine, RegistryItemType } from '@/iot-visualization-platform/core/registry-engine'

// 📝 注册一个组件
await registryEngine.register({
  metadata: {
    id: 'my-component',
    name: '我的组件',
    type: RegistryItemType.CARD21_COMPONENT,
    version: '1.0.0'
  },
  content: { /* 组件内容 */ }
})

// 🔍 查询组件
const component = registryEngine.get('my-component')
console.log(component?.metadata.name) // 输出: "我的组件"
```

## 📚 常用场景速查

### 场景1: 注册Card2.1组件

```typescript
import { ComponentRegistryManager } from '@/iot-visualization-platform/core/registry-engine/component-registry'

// ✅ 推荐方式：使用ComponentRegistryManager
const success = await ComponentRegistryManager.registerComponent({
  type: 'temperature-gauge',
  dataSources: [{
    key: 'temperature',
    type: 'device',
    deviceId: '{{deviceId}}',
    metric: 'temperature'
  }],
  staticParams: {
    unit: '°C',
    min: -20,
    max: 50
  }
})

if (success) {
  console.log('✅ 温度计组件注册成功')
}
```

### 场景2: 批量注册多个组件

```typescript
// 🚀 批量注册，自动处理依赖顺序
const components = [
  { type: 'humidity-sensor', dataSources: [{ key: 'humidity', type: 'device' }] },
  { type: 'temperature-sensor', dataSources: [{ key: 'temperature', type: 'device' }] },
  { type: 'weather-dashboard', dependencies: ['humidity-sensor', 'temperature-sensor'] }
]

const result = await ComponentRegistryManager.registerComponents(components)
console.log(`批量注册完成: ${result.successCount}/${components.length}`)
```

### 场景3: 智能查询组件

```typescript
// 🔍 基础查询
const weatherComponents = registryEngine.query({
  type: RegistryItemType.CARD21_COMPONENT,
  category: 'weather',
  enabled: true
})

// 🎯 高级查询
const complexQuery = registryEngine.query({
  tags: ['sensor', 'realtime'],
  filter: (item) => {
    const content = item.content as any
    return content.dataSources?.length > 0
  }
})

// 📊 统计信息
const stats = registryEngine.getStats()
console.log(`总组件数: ${stats.total}, Card2.1组件: ${stats.byType['card21-component']}`)
```

### 场景4: 依赖关系管理

```typescript
// 📊 查看组件依赖
const dependencies = registryEngine.getDependencies('weather-dashboard', true) // 递归获取
console.log('所有依赖项:', dependencies)

// 🔍 查看被依赖情况
const dependents = registryEngine.getDependents('temperature-sensor')
console.log('被依赖的组件:', dependents)

// ✅ 验证依赖完整性
const validation = ComponentRegistryManager.validateDependencies()
if (!validation.valid) {
  console.error('依赖验证失败:', validation.missingDependencies)
}
```

### 场景5: 事件监听和响应

```typescript
// 🎧 监听注册事件
registryEngine.on('register', (metadata) => {
  console.log(`新组件注册: ${metadata.name}`)
})

// 📊 监听批量操作完成
registryEngine.on('batch-register-complete', (result) => {
  console.log(`批量注册完成: 成功${result.success}个, 失败${result.failed}个`)
})

// ⚠️ 监听错误事件
registryEngine.on('error', (errorInfo) => {
  console.error('注册错误:', errorInfo.error.message)
})
```

## 🔧 高级功能

### 自定义适配器集成

```typescript
import { adapterManager } from '@/iot-visualization-platform/core/registry-engine/adapters'

// 🔄 启用所有适配器（推荐在应用启动时执行）
await adapterManager.integrateAll()

// 📊 查看集成状态
const status = adapterManager.getIntegrationStatus()
console.log('适配器集成状态:', status)
```

### 性能优化技巧

```typescript
// ✅ 使用类型索引快速查询
const card21Components = registryEngine.getByType(RegistryItemType.CARD21_COMPONENT)

// ✅ 使用分类索引
const weatherComponents = registryEngine.getByCategory('weather')

// ✅ 使用标签索引
const sensorComponents = registryEngine.getByTag('sensor')

// ❌ 避免使用复杂的filter函数进行大量查询
// const components = registryEngine.query({
//   filter: (item) => /* 复杂逻辑 */
// })
```

## 🚨 常见问题解决

### 问题1: 组件注册失败

```typescript
// 检查组件是否已存在
if (registryEngine.has('my-component')) {
  console.log('组件已存在，使用overwrite选项覆盖')
  await ComponentRegistryManager.registerComponent(definition, { overwrite: true })
}
```

### 问题2: 依赖项缺失

```typescript
// 检查依赖项是否存在
const dependencies = ['dependency1', 'dependency2']
const missing = dependencies.filter(dep => !registryEngine.has(dep))

if (missing.length > 0) {
  console.warn('缺失依赖项:', missing)
  // 先注册依赖项，再注册当前组件
}
```

### 问题3: 性能问题

```typescript
// 使用批量操作而不是逐个注册
const items = [/* 大量组件 */]
await registryEngine.registerBatch(items) // ✅ 推荐

// 而不是
// for (const item of items) {
//   await registryEngine.register(item) // ❌ 性能差
// }
```

## 🎯 最佳实践

### 1. 组件命名规范
```typescript
// ✅ 推荐的命名规范
const componentId = 'weather-temperature-gauge'  // 分类-功能-类型
const componentName = '温度计表盘'                // 中文描述性名称
```

### 2. 合理使用分类和标签
```typescript
const metadata = {
  category: 'weather',           // 主要分类
  tags: ['sensor', 'realtime', 'temperature'], // 多维度标签
  // ...
}
```

### 3. 设置合理的优先级
```typescript
const metadata = {
  priority: 10,  // 数值越大优先级越高，建议范围：1-100
  // ...
}
```

### 4. 使用语义化版本
```typescript
const metadata = {
  version: '1.2.3',  // 主版本.次版本.修订版本
  // ...
}
```

## 📞 支持和帮助

- 📖 完整API文档: [README.md](./README.md)
- 🔬 详细示例: [examples.ts](./examples.ts)
- 🧪 在线测试: [test-demo.html](./test-demo.html)
- 🐛 问题反馈: 通过项目Issue提交

## 🎉 开始使用

现在你已经掌握了Registry Engine的基本用法！选择一个最符合你需求的场景，开始集成到你的项目中吧。

记住：**先理解需求，再选择方案**，Registry Engine提供了多种使用方式来满足不同的场景需求。