# Card 2.1 开发指南

## 📋 目录
- [系统概述](#系统概述)
- [快速开始](#快速开始)
- [系统架构](#系统架构)
- [组件开发](#组件开发)
- [权限系统](#权限系统)
- [数据绑定](#数据绑定)
- [集成指南](#集成指南)
- [最佳实践](#最佳实践)
- [故障排除](#故障排除)

## 🎯 系统概述

Card 2.1 是一个现代化的组件系统，专为 ThingsPanel 前端设计。它提供了：

- 🚀 **自动注册系统** - 支持目录扫描和动态加载
- 🔐 **权限控制** - 基于用户角色的组件访问控制
- 📊 **数据绑定** - 灵活的数据源集成
- 🎨 **可视化编辑器集成** - 与 Visual Editor 无缝对接
- 🌍 **国际化支持** - 多语言组件支持

### 核心特性

| 特性 | 描述 | 状态 |
|------|------|------|
| 自动注册 | 目录扫描自动发现组件 | ✅ 完成 |
| 权限过滤 | 基于用户权限显示组件 | ✅ 完成 |
| 注册控制 | 可控制组件是否在组件库中显示 | ✅ 完成 |
| 数据绑定 | 支持多种数据源类型 | ✅ 完成 |
| 树形分类 | 自动生成组件分类树 | ✅ 完成 |
| 类型安全 | 完整的 TypeScript 支持 | ✅ 完成 |

## 🚀 快速开始

### 1. 系统初始化

```typescript
import { initializeCard2System, getComponentTree } from '@/card2.1'

// 初始化系统
await initializeCard2System()

// 获取组件树
const tree = getComponentTree()
console.log('组件分类:', tree.categories)
console.log('组件总数:', tree.totalCount)
```

### 2. 获取组件

```typescript
import { getComponentsByCategory, getComponentRegistry } from '@/card2.1'

// 按分类获取组件
const displayComponents = getComponentsByCategory('系统')
const chartComponents = getComponentsByCategory('曲线')

// 获取特定组件
const registry = getComponentRegistry()
const component = registry.get('version-info')
```

### 3. 与 Visual Editor 集成

```typescript
import { useVisualEditorIntegration } from '@/card2.1/hooks'

// 在 Vue 组件中使用
const { availableWidgets, getWidgetsByCategory } = useVisualEditorIntegration({
  autoInit: true,
  enableI18n: true
})
```

## 🏗️ 系统架构

### 目录结构

```
src/card2.1/
├── core/                    # 核心模块
│   ├── types.ts            # 类型定义
│   ├── registry.ts         # 组件注册表
│   ├── auto-registry.ts    # 自动注册系统
│   ├── component-loader.ts # 组件加载器
│   ├── permission-utils.ts # 权限工具
│   └── data-binding/       # 数据绑定系统
├── components/             # 组件目录
│   └── simple-card/        # 示例组件
├── hooks/                  # Vue Composition API Hooks
│   ├── useVisualEditorIntegration.ts
│   └── useComponentTree.ts
└── index.ts               # 系统入口
```

### 核心模块说明

#### 1. 类型系统 (`core/types.ts`)

```typescript
// 组件权限类型
export type ComponentPermission = '不限' | 'TENANT_ADMIN' | 'TENANT_USER' | 'SYS_ADMIN'

// 组件定义接口
export interface ComponentDefinition {
  type: string                    // 组件类型标识
  name: string                    // 组件名称
  description: string             // 组件描述
  category: string                // 组件分类
  subCategory?: string           // 子分类
  mainCategory?: string          // 主分类
  icon: string                   // 图标（SVG字符串）
  component: Component           // Vue组件
  configComponent?: Component    // 配置组件
  permission?: ComponentPermission // 权限要求
  isRegistered?: boolean         // 是否注册到组件库（默认true）
  // ... 更多字段
}
```

#### 2. 自动注册系统 (`core/auto-registry.ts`)

负责：
- 扫描组件目录
- 自动分类管理
- 权限过滤
- 树形结构生成

#### 3. 组件加载器 (`core/component-loader.ts`)

负责：
- 动态导入组件模块
- 路径解析
- 组件验证

#### 4. 权限系统 (`core/permission-utils.ts`)

负责：
- 用户权限检查
- 组件权限过滤
- 权限等级管理

## 🧩 组件开发

### 组件开发规范

#### 1. 目录结构

```
components/
└── your-component/
    ├── index.ts          # 组件定义（必需）
    ├── YourComponent.vue # Vue组件（必需）
    ├── ConfigPanel.vue   # 配置面板（可选）
    └── README.md         # 组件文档（推荐）
```

#### 2. 组件定义文件 (`index.ts`)

```typescript
import type { ComponentDefinition } from '@/card2.1/core/types'
import YourComponent from './YourComponent.vue'
import ConfigPanel from './ConfigPanel.vue'

const definition: ComponentDefinition = {
  // 基本信息
  type: 'your-component',
  name: 'Your Component',
  description: '这是一个示例组件',
  
  // 分类信息
  category: 'display',
  subCategory: 'basic',
  mainCategory: '系统',
  
  // 组件和配置
  component: YourComponent,
  configComponent: ConfigPanel,
  
  // 权限设置
  permission: 'TENANT_USER',
  
  // 注册设置 - 控制组件是否在组件库中显示
  isRegistered: true,
  
  // 图标（SVG字符串）
  icon: `<svg>...</svg>`,
  
  // 默认配置
  config: {
    title: '默认标题',
    showBorder: true
  },
  
  // 属性定义
  properties: {
    title: {
      type: 'string',
      default: '默认标题',
      description: '组件标题',
      label: '标题'
    },
    showBorder: {
      type: 'boolean',
      default: true,
      description: '是否显示边框',
      label: '显示边框'
    }
  },
  
  // 支持的数据源
  supportedDataSources: ['static', 'api', 'websocket'],
  
  // 示例配置
  examples: [
    {
      name: '基础示例',
      description: '最简单的使用方式',
      config: {
        title: '示例标题',
        showBorder: false
      }
    }
  ]
}

export default definition
```

#### 3. Vue 组件开发

```vue
<template>
  <div class="your-component" :class="{ 'with-border': showBorder }">
    <h3>{{ title }}</h3>
    <div class="content">
      <!-- 组件内容 -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import type { ComponentProps } from '@/card2.1/core/types'

// 定义组件属性
interface Props {
  title?: string
  showBorder?: boolean
  dataSource?: any
}

const props = withDefaults(defineProps<Props>(), {
  title: '默认标题',
  showBorder: true
})

// 组件逻辑
const isLoading = ref(false)
const data = ref(null)

// 数据绑定
const processData = computed(() => {
  if (!data.value) return null
  // 数据处理逻辑
  return data.value
})

// 生命周期
onMounted(() => {
  // 初始化逻辑
})
</script>

<style scoped>
.your-component {
  padding: 16px;
  border-radius: 8px;
  background: white;
}

.your-component.with-border {
  border: 1px solid #e0e0e0;
}
</style>
```

#### 4. 配置面板开发

```vue
<template>
  <div class="config-panel">
    <el-form :model="config" label-width="80px">
      <el-form-item label="标题">
        <el-input v-model="config.title" placeholder="请输入标题" />
      </el-form-item>
      
      <el-form-item label="显示边框">
        <el-switch v-model="config.showBorder" />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Config {
  title: string
  showBorder: boolean
}

const config = ref<Config>({
  title: '默认标题',
  showBorder: true
})

// 监听配置变化
watch(config, (newConfig) => {
  // 触发配置更新事件
  emit('update:config', newConfig)
}, { deep: true })

const emit = defineEmits<{
  'update:config': [config: Config]
}>()
</script>
```

### 组件开发最佳实践

#### 1. 命名规范

- **组件类型**: 使用 kebab-case，如 `version-info`
- **组件名称**: 使用中文，如 `版本信息`
- **文件命名**: 使用 PascalCase，如 `VersionInfo.vue`

#### 2. 权限设置

```typescript
// 根据组件功能设置合适的权限
const definition: ComponentDefinition = {
  // 基础显示组件 - 所有用户可访问
  permission: '不限',
  
  // 管理功能组件 - 管理员可访问
  permission: 'TENANT_ADMIN',
  
  // 系统级组件 - 系统管理员可访问
  permission: 'SYS_ADMIN'
}
```

#### 3. 注册控制

```typescript
// 控制组件是否在组件库中注册和显示
const definition: ComponentDefinition = {
  // 正常注册 - 在组件库中可见（默认行为）
  isRegistered: true,
  
  // 隐藏组件 - 不在组件库中显示，但仍可通过代码使用
  isRegistered: false,
  
  // 不设置 - 默认为 true，正常注册
  // isRegistered: undefined
}
```

**使用场景**：
- `isRegistered: true` - 正常组件，在组件库中可见
- `isRegistered: false` - 隐藏组件，适用于：
  - 内部测试组件
  - 废弃但需要保持兼容的组件
  - 特殊用途的组件（如容器组件）
  - 依赖其他组件的基础组件

#### 4. 数据绑定

```typescript
// 支持多种数据源
supportedDataSources: ['static', 'api', 'websocket', 'mqtt'],

// 数据源定义
dataSourceDefinitions: [
  {
    type: 'api',
    name: 'API数据源',
    description: '从API获取数据',
    config: {
      url: { type: 'string', required: true },
      method: { type: 'select', options: ['GET', 'POST'] },
      headers: { type: 'object' }
    }
  }
]
```

## 🔐 权限系统

### 权限等级

| 权限等级 | 描述 | 数值 |
|----------|------|------|
| 不限 | 所有用户可访问 | 1 |
| TENANT_USER | 租户用户 | 2 |
| TENANT_ADMIN | 租户管理员 | 3 |
| SYS_ADMIN | 系统管理员 | 4 |

### 权限检查逻辑

```typescript
// 权限检查示例
const checkPermission = (componentPermission: ComponentPermission, userAuthority: string): boolean => {
  const permissionLevels = {
    'SYS_ADMIN': 4,
    'TENANT_ADMIN': 3,
    'TENANT_USER': 2,
    '不限': 1
  }
  
  const componentLevel = permissionLevels[componentPermission] || 0
  const userLevel = permissionLevels[userAuthority] || 0
  
  return userLevel >= componentLevel
}
```

### 权限工具函数

```typescript
import { filterComponentsByPermission, getUserAuthorityFromStorage } from '@/card2.1/core/permission-utils'

// 获取用户权限
const userAuthority = getUserAuthorityFromStorage()

// 过滤组件
const filteredComponents = filterComponentsByPermission(components, userAuthority)

// 重新应用权限过滤
reapplyPermissionFilter()
```

## 📊 数据绑定

### 数据源类型

#### 1. 静态数据

```typescript
{
  type: 'static',
  data: {
    value: 100,
    unit: '个'
  }
}
```

#### 2. API数据

```typescript
{
  type: 'api',
  config: {
    url: '/api/metrics',
    method: 'GET',
    interval: 5000 // 轮询间隔
  }
}
```

#### 3. WebSocket数据

```typescript
{
  type: 'websocket',
  config: {
    url: 'ws://localhost:8080/ws',
    topics: ['metrics', 'alerts']
  }
}
```

### 数据绑定实现

```vue
<template>
  <div class="data-component">
    <div v-if="isLoading" class="loading">加载中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="content">
      {{ displayValue }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface DataSource {
  type: string
  config?: any
  data?: any
}

const props = defineProps<{
  dataSource?: DataSource
}>()

const isLoading = ref(false)
const error = ref<string | null>(null)
const data = ref<any>(null)

// 处理数据源
const processDataSource = async () => {
  if (!props.dataSource) return
  
  isLoading.value = true
  error.value = null
  
  try {
    switch (props.dataSource.type) {
      case 'static':
        data.value = props.dataSource.data
        break
      case 'api':
        await fetchApiData()
        break
      case 'websocket':
        connectWebSocket()
        break
      default:
        throw new Error(`不支持的数据源类型: ${props.dataSource.type}`)
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '数据加载失败'
  } finally {
    isLoading.value = false
  }
}

// 显示值计算
const displayValue = computed(() => {
  if (!data.value) return '暂无数据'
  return data.value.value || data.value
})

onMounted(() => {
  processDataSource()
})
</script>
```

## 🔗 集成指南

### 与 Visual Editor 集成

#### 1. 使用集成 Hook

```vue
<template>
  <div class="visual-editor">
    <component-panel :widgets="availableWidgets" />
    <canvas-area />
  </div>
</template>

<script setup lang="ts">
import { useVisualEditorIntegration } from '@/card2.1/hooks'

const {
  availableWidgets,
  getWidgetsByCategory,
  searchWidgets,
  isInitialized,
  initializationError
} = useVisualEditorIntegration({
  autoInit: true,
  enableI18n: true,
  componentFilter: (definition) => {
    // 自定义组件过滤逻辑
    return definition.category === 'display'
  }
})
</script>
```

#### 2. 手动集成

```typescript
import { initializeCard2System, getComponentTree } from '@/card2.1'

// 初始化系统
await initializeCard2System()

// 获取组件树
const tree = getComponentTree()

// 转换为 Visual Editor Widget
const widgets = tree.components.map(component => ({
  type: component.type,
  name: component.name,
  category: component.category,
  icon: component.icon,
  component: component.component,
  configComponent: component.configComponent
}))
```

### 与现有系统集成

#### 1. 渐进式迁移

```typescript
// 1. 初始化 Card 2.1 系统
await initializeCard2System()

// 2. 获取现有组件
const existingComponents = getExistingComponents()

// 3. 注册到 Card 2.1
existingComponents.forEach(component => {
  componentRegistry.register(component.id, {
    type: component.id,
    name: component.name,
    component: component.component,
    // ... 其他属性
  })
})
```

#### 2. 权限集成

```typescript
// 与现有权限系统集成
import { setUserAuthority } from '@/card2.1/core/permission-utils'

// 当用户登录时
setUserAuthority(user.role)

// 当权限变化时
reapplyPermissionFilter()
```

## 🎯 最佳实践

### 1. 组件设计原则

- **单一职责**: 每个组件只负责一个功能
- **可配置性**: 提供丰富的配置选项
- **可复用性**: 设计通用的组件接口
- **性能优化**: 合理使用计算属性和缓存

### 2. 错误处理

```typescript
// 组件错误边界
const handleError = (error: Error) => {
  console.error('组件错误:', error)
  // 显示用户友好的错误信息
  showErrorMessage('组件加载失败，请稍后重试')
}

// 数据加载错误处理
const loadData = async () => {
  try {
    isLoading.value = true
    const result = await fetchData()
    data.value = result
  } catch (error) {
    error.value = error instanceof Error ? error.message : '数据加载失败'
  } finally {
    isLoading.value = false
  }
}
```

### 3. 性能优化

```typescript
// 使用 computed 缓存计算结果
const processedData = computed(() => {
  if (!data.value) return null
  return expensiveCalculation(data.value)
})

// 使用 watchEffect 响应式更新
watchEffect(() => {
  if (props.dataSource) {
    processDataSource()
  }
})

// 组件懒加载
const LazyComponent = defineAsyncComponent(() => import('./HeavyComponent.vue'))
```

### 4. 测试策略

```typescript
// 组件单元测试
import { mount } from '@vue/test-utils'
import YourComponent from './YourComponent.vue'

describe('YourComponent', () => {
  it('应该正确显示标题', () => {
    const wrapper = mount(YourComponent, {
      props: { title: '测试标题' }
    })
    expect(wrapper.text()).toContain('测试标题')
  })
  
  it('应该处理数据源变化', async () => {
    const wrapper = mount(YourComponent, {
      props: { dataSource: { type: 'static', data: { value: 100 } } }
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('100')
  })
})
```

## 🔧 故障排除

### 常见问题

#### 1. 组件未注册

**问题**: 组件在系统中找不到

**解决方案**:
```typescript
// 检查组件定义是否正确
const definition: ComponentDefinition = {
  type: 'your-component', // 确保类型唯一
  name: 'Your Component',
  component: YourComponent, // 确保组件正确导入
  // ...
}

// 检查文件路径
// 确保组件在 components/ 目录下
// 确保有 index.ts 文件

// 检查注册设置
const definition: ComponentDefinition = {
  // 确保组件设置为可注册
  isRegistered: true, // 或省略此字段（默认为true）
  // ...
}
```

#### 2. 权限问题

**问题**: 组件不显示或提示权限不足

**解决方案**:
```typescript
// 检查用户权限
const userAuthority = getUserAuthorityFromStorage()
console.log('当前用户权限:', userAuthority)

// 检查组件权限设置
const component = registry.get('your-component')
console.log('组件权限要求:', component?.permission)

// 重新应用权限过滤
reapplyPermissionFilter()
```

#### 3. 数据绑定失败

**问题**: 组件无法获取数据

**解决方案**:
```typescript
// 检查数据源配置
const dataSource = {
  type: 'api',
  config: {
    url: '/api/data', // 确保URL正确
    method: 'GET'
  }
}

// 添加错误处理
try {
  const response = await fetch(dataSource.config.url)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  const data = await response.json()
} catch (error) {
  console.error('数据获取失败:', error)
  // 显示错误信息给用户
}
```

#### 4. 初始化失败

**问题**: 系统初始化失败

**解决方案**:
```typescript
// 检查初始化状态
import { initializeCard2System } from '@/card2.1'

try {
  await initializeCard2System()
  console.log('系统初始化成功')
} catch (error) {
  console.error('系统初始化失败:', error)
  
  // 检查依赖
  // 确保所有必需的模块都已加载
  
  // 检查权限
  // 确保有足够的权限访问组件目录
}
```

### 调试技巧

#### 1. 启用调试模式

```typescript
// 在开发环境中启用详细日志
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 [Card2.1] 调试模式已启用')
  
  // 获取所有组件（包括无权限的）
  const allComponents = getAllComponents()
  console.log('所有组件:', allComponents)
}
```

#### 2. 组件状态检查

```typescript
// 检查组件注册状态
const registry = getComponentRegistry()
const componentIds = registry.getAll().map(c => c.type)
console.log('已注册的组件:', componentIds)

// 检查组件树
const tree = getComponentTree()
console.log('组件分类:', tree.categories)
console.log('组件总数:', tree.totalCount)

// 检查组件注册设置
const allComponents = getAllComponents() // 包括未注册的组件
const registeredComponents = allComponents.filter(c => c.isRegistered !== false)
const hiddenComponents = allComponents.filter(c => c.isRegistered === false)

console.log('可见组件数:', registeredComponents.length)
console.log('隐藏组件数:', hiddenComponents.length)
console.log('隐藏的组件:', hiddenComponents.map(c => c.type))
```

#### 3. 权限调试

```typescript
// 权限调试工具
import { getUserAuthorityFromStorage, filterComponentsByPermission } from '@/card2.1/core/permission-utils'

const userAuthority = getUserAuthorityFromStorage()
console.log('用户权限:', userAuthority)

const allComponents = getAllComponents()
const filteredComponents = filterComponentsByPermission(allComponents, userAuthority)
console.log('权限过滤前:', allComponents.length)
console.log('权限过滤后:', filteredComponents.length)
```

## 📚 参考资源

### 相关文档

- [Vue 3 官方文档](https://vuejs.org/)
- [TypeScript 官方文档](https://www.typescriptlang.org/)
- [Vite 官方文档](https://vitejs.dev/)

### 示例项目

- `components/simple-card/` - 基础组件示例
- `hooks/useVisualEditorIntegration.ts` - 集成示例
- `core/auto-registry.ts` - 自动注册示例

### 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

---

**最后更新**: 2024年12月
**版本**: 2.1.0
**维护者**: ThingsPanel 团队 