# 🚀 ThingsPanel 组件开发文档

基于实际调试经验总结的组件开发最佳实践指南

## 📋 目录
1. [开发环境和基础架构](#开发环境和基础架构)
2. [组件开发标准流程](#组件开发标准流程)
3. [数据绑定系统选择](#数据绑定系统选择)
4. [关键技术规范](#关键技术规范)
5. [常见问题和解决方案](#常见问题和解决方案)
6. [调试和测试指南](#调试和测试指南)

## 🛠️ 开发环境和基础架构

### 技术栈
- **框架**: Vue 3 + TypeScript + Composition API
- **UI库**: Naive UI (强制优先使用)
- **状态管理**: Pinia
- **样式**: UnoCSS + CSS变量主题系统
- **国际化**: Vue I18n (所有文本必须国际化)

### 项目结构
```
src/
├── card2.1/                    # 新一代卡片系统 (推荐)
│   ├── components/             # Card 2.1 组件实现
│   ├── core/                   # 核心数据绑定系统 (暂未完全启用)
│   └── hooks/                  # 专用组合式函数
├── card/                       # 旧系统卡片 (维护模式)
├── components/visual-editor/   # 可视化编辑器系统
└── core/data-architecture/     # 当前主要数据架构
```

## 🔄 组件开发标准流程

### 第一步：需求分析和技术选择
```typescript
// 1. 确定组件分类
// - 数据展示组件 (如数字指示器、图表)
// - 控制组件 (如开关、按钮)
// - 容器组件 (如卡片、面板)

// 2. 选择开发位置
// ✅ 推荐：src/card2.1/components/
// ⚠️ 维护：src/card/ (仅限维护现有组件)
```

### 第二步：组件文件结构
```
components/chart/data/my-component/
├── index.ts                    # 导出文件
├── MyComponent.vue            # 主组件
├── types.ts                   # 类型定义
└── README.md                  # 组件文档
```

### 第三步：组件模板结构
```vue
<template>
  <div ref="containerRef" class="my-component-container">
    <!-- 🔥 调试区域 (开发时显示，生产时移除) -->
    <div v-if="import.meta.env.DEV" class="debug-section">
      <div class="debug-title">🔥 数据调试:</div>
      <div class="debug-content">{{ JSON.stringify(props.data) }}</div>
      <div class="debug-timestamp">{{ debugTimestamp }}</div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 使用 Naive UI 组件 -->
      <n-card>
        <n-space vertical>
          <!-- 组件具体实现 -->
        </n-space>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 组件名称和描述
 * 功能说明和使用场景
 */

import { computed, ref, watch } from 'vue'
import { useCard2Props } from '@/card2.1/hooks/useCard2Props'

// Props 接口定义
interface Props {
  config: any                    // 配置数据
  data?: Record<string, unknown> // 数据源执行结果
  componentId?: string           // 组件唯一ID
}

const props = withDefaults(defineProps<Props>(), {
  data: () => ({})
})

// 🔥 调试时间戳 (开发必备)
const debugTimestamp = ref(Date.now())

// 🔥 监听数据变化 (开发调试用)
watch(() => props.data, (newData, oldData) => {
  debugTimestamp.value = Date.now()
  if (import.meta.env.DEV) {
    console.log(`🔥 [MyComponent] props.data变化:`, {
      componentId: props.componentId,
      newData,
      oldData,
      timestamp: new Date().toISOString()
    })
  }
}, { deep: true, immediate: true })

// 🔥 使用统一配置管理
const { unifiedConfig } = useCard2Props({
  config: props.config,
  data: props.data,
  componentId: props.componentId
})

// 数据获取函数
const getDisplayValue = (field: string, defaultValue: any) => {
  // 1. 优先使用数据源数据
  if (props.data && typeof props.data === 'object' && field in props.data) {
    return String(props.data[field])
  }

  // 2. 回退到配置数据
  if (unifiedConfig.value.component?.[field] !== undefined) {
    return String(unifiedConfig.value.component[field])
  }

  // 3. 使用默认值
  return String(defaultValue)
}
</script>

<style scoped>
.my-component-container {
  width: 100%;
  height: 100%;
}

/* 调试样式 */
.debug-section {
  background: #f0f0f0;
  border: 2px solid #ff6b6b;
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 8px;
  font-size: 12px;
}

.debug-title {
  color: #ff6b6b;
  font-weight: bold;
  margin-bottom: 4px;
}

.debug-content {
  background: #fff;
  padding: 4px;
  border-radius: 2px;
  font-family: monospace;
  word-break: break-all;
}

.main-content {
  /* 使用主题变量，禁止硬编码颜色 */
  color: var(--text-color);
  background-color: var(--card-color);
}
</style>
```

## 🔌 数据绑定系统选择

### 当前推荐：使用现有DataWarehouse系统

基于实际调试经验，**当前推荐使用成熟的DataWarehouse系统**：

```typescript
// ✅ 当前稳定方案：通过Card2Wrapper获取数据
interface Props {
  config: any
  data?: Record<string, unknown>  // 来自DataWarehouse的数据
  componentId?: string
}

// 数据获取优先级：
// 1. props.data (来自DataWarehouse)
// 2. unifiedConfig.component (配置数据)
// 3. 默认值
```

### 未来规划：Card2.1 Core系统

```typescript
// 🚀 未来方案：Card2.1 Core数据绑定 (待完善)
import { dataBindingManager } from '@/card2.1/core/data-source/data-binding-manager'
import { ComponentRegistry } from '@/card2.1/core/component-registry'

// 注意：目前此系统尚未完全启用，建议暂时使用DataWarehouse方案
```

## 📏 关键技术规范

### 1. 强制使用Naive UI组件
```typescript
// ✅ 正确：优先使用Naive UI
import { NCard, NButton, NSpace, NIcon } from 'naive-ui'

// ❌ 错误：重复实现已有组件
// 自定义Button组件 (禁止)
```

### 2. 主题系统集成
```css
/* ✅ 正确：使用主题变量 */
.my-component {
  color: var(--text-color);
  background-color: var(--card-color);
  border: 1px solid var(--border-color);
}

/* ❌ 错误：硬编码颜色 */
.my-component {
  color: #333333;
  background-color: #ffffff;
}
```

### 3. 国际化必须
```typescript
// ✅ 正确：所有文本国际化
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

// 模板中使用
{{ t('components.myComponent.title') }}

// ❌ 错误：硬编码文本
{{ '我的组件' }}
```

### 4. TypeScript严格模式
```typescript
// ✅ 正确：完整类型定义
interface ComponentConfig {
  title: string
  value: number
  color: string
}

interface Props {
  config: ComponentConfig
  data?: Record<string, unknown>
  componentId?: string
}

// ❌ 错误：使用any类型
interface Props {
  config: any
  data: any
}
```

## 🛠️ 常见问题和解决方案

### 问题1：数据不响应更新
```typescript
// 🔥 解决方案：强制清除缓存
import { dataWarehouse } from '@/core/data-architecture/DataWarehouse'

const getLatestData = () => {
  // 强制清除缓存确保获取最新数据
  dataWarehouse.clearComponentMergedCache(props.componentId!)
  return dataWarehouse.getComponentData(props.componentId!)
}
```

### 问题2：Vue响应式依赖问题
```typescript
// 🔥 解决方案：简化计算属性，直接获取数据
const displayData = computed(() => {
  try {
    // 每次都清除缓存，确保获取最新数据
    if (props.componentId) {
      dataWarehouse.clearComponentMergedCache(props.componentId)
      const latestData = dataWarehouse.getComponentData(props.componentId)
      return latestData || {}
    }
    return {}
  } catch (error) {
    console.error('获取数据失败:', error)
    return {}
  }
})
```

### 问题3：ES模块导入错误
```typescript
// ✅ 正确：使用动态导入
const { configurationIntegrationBridge } = await import('@/components/visual-editor/configuration/ConfigurationIntegrationBridge')

// ❌ 错误：使用require (在ES模块中会报错)
const configurationIntegrationBridge = require('@/components/visual-editor/configuration/ConfigurationIntegrationBridge')
```

## 🔍 调试和测试指南

### 调试最佳实践

1. **添加调试区域**
```vue
<template>
  <!-- 开发时显示调试信息 -->
  <div v-if="import.meta.env.DEV" class="debug-section">
    <div class="debug-title">🔥 组件调试信息:</div>
    <div class="debug-content">
      <div>props.data: {{ JSON.stringify(props.data) }}</div>
      <div>componentId: {{ props.componentId }}</div>
      <div>更新时间: {{ debugTimestamp }}</div>
    </div>
  </div>
</template>
```

2. **关键数据变化监听**
```typescript
// 监听props.data变化
watch(() => props.data, (newData, oldData) => {
  debugTimestamp.value = Date.now()
  console.log(`🔥 [${componentName}] 数据变化:`, {
    componentId: props.componentId,
    newData,
    oldData,
    timestamp: new Date().toISOString()
  })
}, { deep: true, immediate: true })
```

3. **系统化调试方法**
```typescript
// 数据流追踪调试
const traceDataFlow = () => {
  console.log('=== 数据流追踪开始 ===')
  console.log('1. props.data:', props.data)
  console.log('2. unifiedConfig:', unifiedConfig.value)
  console.log('3. 计算结果:', getDisplayValue('value', '默认值'))
  console.log('=== 数据流追踪结束 ===')
}
```

### 测试检查清单

1. **功能测试**
   - [ ] 组件正确渲染
   - [ ] 数据源变化时组件更新
   - [ ] 配置变化时组件响应
   - [ ] 默认值正确显示

2. **集成测试**
   - [ ] 与主题系统集成正常
   - [ ] 国际化文本正确显示
   - [ ] 响应式布局适配
   - [ ] 与可视化编辑器集成

3. **性能测试**
   - [ ] 大量数据时渲染性能
   - [ ] 内存泄漏检查
   - [ ] 频繁更新时性能表现

## 📦 组件导出和注册

### 1. 组件导出文件 (index.ts)
```typescript
// src/card2.1/components/chart/data/my-component/index.ts
import MyComponent from './MyComponent.vue'
import type { ComponentConfig } from './types'

export { MyComponent, type ComponentConfig }
export default MyComponent
```

### 2. 组件注册到系统
```typescript
// src/card2.1/hooks/useComponentTree.ts
const components = [
  // ... 其他组件
  {
    type: 'my-component',
    name: '我的组件',
    category: 'data',
    component: () => import('@/card2.1/components/chart/data/my-component'),
    thumbnail: '/thumbnails/my-component.png',
    defaultConfig: {
      title: '默认标题',
      value: 0
    }
  }
]
```

## ⚡ 开发效率提升

### 1. 使用组件模板
创建组件快速启动模板，复制后修改即可。

### 2. 复用现有组件逻辑
参考 `DigitIndicator.vue` 的实现模式，特别是：
- 数据获取逻辑
- 配置管理方式
- 调试信息添加

### 3. 统一错误处理
```typescript
const handleError = (error: Error, context: string) => {
  console.error(`❌ [${componentName}] ${context}:`, error)
  // 可以添加错误上报逻辑
}
```

## 🚨 严格禁止事项

1. **禁止硬编码**
   - 颜色值、文本、配置参数

2. **禁止重复造轮子**
   - 优先使用Naive UI组件
   - 复用现有工具函数

3. **禁止跳过调试信息**
   - 必须添加开发调试区域
   - 必须监听关键数据变化

4. **禁止半成品交付**
   - 完整的错误处理
   - 完整的类型定义
   - 完整的国际化

---

## 📋 总结

基于实际调试经验，当前推荐使用**DataWarehouse + Card2Wrapper + useCard2Props**的成熟方案进行组件开发。这套方案已经过实战验证，能够稳定处理数据绑定和响应式更新。

Card2.1 Core系统虽然设计先进，但尚未完全启用，建议在系统完善后再进行迁移。

**记住核心原则：优先使用Naive UI，强制集成主题系统，必须国际化，添加调试信息，系统化测试。**