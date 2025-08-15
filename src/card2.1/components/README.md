# Card 2.1 组件开发指南

本指南基于实际开发经验，涵盖从创建组件到集成系统的完整流程。

## 🚨 重要架构说明

### Card2 标准数据绑定模式

**所有 Card 2.1 组件必须使用统一的数据绑定架构，否则组件无法接收到数据！**

#### ✅ 正确的数据绑定方式：

```typescript
interface Props {
  rawDataSources?: any // 🔥 必须：接收原始数据源配置
  // 其他配置属性...
}

// 🔥 组件自己解析数据源
const objectData = computed(() => {
  const binding = props.rawDataSources?.dataSourceBindings?.objectData
  if (!binding?.rawData) return null
  try {
    return JSON.parse(binding.rawData)
  } catch {
    return null
  }
})
```

#### ❌ 错误的数据绑定方式：

```typescript
// ❌ 这样写组件永远收不到数据！
interface Props {
  userInfo?: UserData    // 不要直接定义业务数据 props
  objectData?: any       // 不要直接定义业务数据 props
}
```

#### 为什么必须这样做？

1. **Card2Wrapper 只传递 `rawDataSources`**：系统架构决定了只会传递原始数据源配置
2. **组件自己负责解析**：每个组件根据自己的 `dataSources` 定义解析需要的数据
3. **数据源 key 映射**：`dataSourceBindings.objectData` 对应 `dataSources[0].key: 'objectData'`
4. **JSON 解析**：配置系统传递的是 JSON 字符串，需要组件自己解析

**记住：如果组件接收不到数据，99% 的问题都是 Props 接口定义错误！**

## 📋 目录结构

每个组件都必须按以下结构创建：

```
src/card2.1/components/[组件名]/
├── [组件名].vue          # Vue 组件文件
└── index.ts              # 组件定义文件（重要！）
```

**⚠️ 注意事项**：
- 组件目录名使用 kebab-case（如：`user-info-card`）
- Vue 组件文件名使用 PascalCase（如：`UserInfoCard.vue`）
- `index.ts` 文件必须存在，否则自动注册系统无法发现组件

## 🔧 1. 创建 Vue 组件文件

### 基本模板

```vue
<template>
  <div class="your-component-name">
    <!-- 组件内容 -->
    <div class="header">
      <h3>{{ title || '默认标题' }}</h3>
    </div>
    
    <!-- 数据展示区域 -->
    <div class="content">
      <div v-if="!hasData" class="empty-state">暂无数据</div>
      <div v-else>
        <!-- 你的数据展示逻辑 -->
      </div>
    </div>
    
    <!-- 调试信息（可选） -->
    <div v-if="showDebug" class="debug-info">
      <n-collapse size="small">
        <n-collapse-item title="调试信息" name="debug">
          <n-code :code="debugInfo" language="json" />
        </n-collapse-item>
      </n-collapse>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 组件说明
 * 描述组件的功能和用途
 */

import { computed, watch } from 'vue'
import { NCollapse, NCollapseItem, NCode } from 'naive-ui'

// 🚨 重要：Props 接口必须使用 Card2 标准数据绑定模式
interface Props {
  rawDataSources?: any // 🔥 必须：接收原始数据源配置
  title?: string
  showDebug?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  rawDataSources: null,
  title: '',
  showDebug: false
})

// 🔥 关键：组件自己解析需要的数据
const objectData = computed(() => {
  const binding = props.rawDataSources?.dataSourceBindings?.objectData
  if (!binding?.rawData) return null
  try {
    return JSON.parse(binding.rawData)
  } catch {
    return null
  }
})

const arrayData = computed(() => {
  const binding = props.rawDataSources?.dataSourceBindings?.arrayData
  if (!binding?.rawData) return null
  try {
    return JSON.parse(binding.rawData)
  } catch {
    return null
  }
})

// 计算属性
const hasData = computed(() => {
  return objectData.value || (arrayData.value && arrayData.value.length > 0)
})

const debugInfo = computed(() => {
  return JSON.stringify({
    objectData: objectData.value,
    arrayData: arrayData.value,
    hasObjectData: !!objectData.value,
    arrayLength: arrayData.value?.length || 0,
    rawDataSources: props.rawDataSources,
    propsKeys: Object.keys(props)
  }, null, 2)
})

// 🔥 监听原始数据源变化（调试用）
watch(() => props.rawDataSources, (newRawDataSources) => {
  console.log('🔧 [DEBUG-YourComponent] 接收到新的rawDataSources:', {
    rawDataSources: newRawDataSources,
    hasDataSourceBindings: !!newRawDataSources?.dataSourceBindings,
    dataSourceKeys: newRawDataSources?.dataSourceBindings ? Object.keys(newRawDataSources.dataSourceBindings) : []
  })
}, { deep: true, immediate: true })

// 🔥 监听解析后的数据变化
watch(() => [objectData.value, arrayData.value], ([newObjectData, newArrayData]) => {
  console.log('🔧 [DEBUG-YourComponent] 解析后数据变化:', {
    objectData: newObjectData,
    arrayData: newArrayData,
    hasData: !!(newObjectData || newArrayData?.length)
  })
}, { deep: true })
</script>

<style scoped>
.your-component-name {
  padding: 16px;
  background: var(--card-color);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.header h3 {
  margin: 0;
  color: var(--text-color);
  font-size: 16px;
  font-weight: 600;
}

.content {
  margin-bottom: 16px;
}

.empty-state {
  text-align: center;
  color: var(--text-color-3);
  padding: 32px 16px;
  font-size: 14px;
}

.debug-info {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

/* 响应式设计 */
@media (max-width: 480px) {
  .your-component-name {
    padding: 12px;
  }
}

/* 暗主题适配 */
[data-theme="dark"] .your-component-name {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}
</style>
```

### 🎨 样式规范

#### 必须遵守的规则：
1. **使用 CSS 变量**：`var(--text-color)`、`var(--card-color)` 等
2. **禁止硬编码颜色**：❌ `color: #333`
3. **支持主题切换**：使用 `[data-theme="dark"]` 选择器
4. **响应式设计**：使用媒体查询适配移动端

#### 常用 CSS 变量：
```css
var(--primary-color)      /* 主色 */
var(--text-color)         /* 主文本色 */
var(--text-color-2)       /* 次要文本色 */
var(--text-color-3)       /* 辅助文本色 */
var(--card-color)         /* 卡片背景色 */
var(--border-color)       /* 边框色 */
var(--success-color)      /* 成功色 */
var(--warning-color)      /* 警告色 */
var(--error-color)        /* 错误色 */
```

## 📝 2. 创建组件定义文件 (index.ts)

这是**最关键**的文件，决定组件能否被系统识别和使用：

```typescript
/**
 * 组件定义文件
 * 描述组件的元数据、数据源需求和配置信息
 */

import YourComponent from './YourComponent.vue'
import type { ComponentDefinition } from '../../core/types'

const yourComponentDefinition: ComponentDefinition = {
  // 基本信息
  type: 'your-component',              // 🚨 必须：唯一标识符
  name: '组件显示名称',                  // 🚨 必须：在组件库中显示的名称
  description: '组件功能描述',           // 🚨 必须：组件说明
  version: '1.0.0',                   // 🚨 必须：版本号
  component: YourComponent,            // 🚨 必须：Vue 组件引用
  
  // 分类信息（影响组件库展示）
  category: 'display',                // 🚨 必须：主分类（display/chart/form/etc）
  mainCategory: '展示',               // 🚨 必须：中文主分类
  subCategory: '数据展示',            // 🚨 必须：子分类
  icon: 'chart-bar',                  // 🚨 必须：图标名称
  author: 'Your Name',                // 🚨 必须：作者
  permission: '不限',                 // 🚨 必须：权限要求
  tags: ['数据', '展示', '图表'],       // 可选：标签
  
  // 数据源定义（核心功能）
  dataSources: [
    {
      key: 'objectData',              // 🚨 数据源唯一标识
      name: '对象数据源',             // 🚨 数据源显示名称
      description: '对象类型的数据',   // 🚨 数据源说明
      supportedTypes: ['static', 'api'], // 🚨 支持的数据源类型
      required: false,                // 🚨 是否必需
      fieldMappings: {                // 🚨 字段映射定义
        objectData: {                 // 映射字段名（与Vue组件props对应）
          targetField: 'objectData',  // 目标字段
          type: 'object',             // 数据类型
          required: false,            // 是否必需
          description: '对象数据',     // 字段说明
          defaultValue: {             // 🔥 示例数据（重要！）
            id: 'example-001',
            name: '示例名称',
            status: 'active',
            value: 0
          }
        }
      }
    },
    {
      key: 'arrayData',
      name: '数组数据源',
      description: '数组类型的数据',
      supportedTypes: ['static', 'api'],
      required: false,
      fieldMappings: {
        arrayData: {
          targetField: 'arrayData',
          type: 'array',
          required: false,
          description: '数组数据列表',
          defaultValue: [
            { id: 1, name: '示例项目', value: 0, status: 'active' }
          ]
        }
      }
    }
  ],
  
  // 组件配置
  config: {
    width: 400,                       // 默认宽度
    height: 300                       // 默认高度
  }
}

// 🚨 必须：默认导出
export default yourComponentDefinition
```

### 🔍 数据源配置详解

#### 单数据源示例：
```typescript
dataSources: [
  {
    key: 'userData',
    name: '用户数据',
    description: '用户基本信息',
    supportedTypes: ['static', 'api'],
    required: true,
    fieldMappings: {
      userData: {
        targetField: 'userData',  // 对应 Vue 组件的 props.userData
        type: 'object',
        required: true,
        description: '用户信息对象',
        defaultValue: {
          id: 'user-001',
          name: '张三',
          email: 'zhangsan@example.com'
        }
      }
    }
  }
]
```

#### 双数据源示例：
```typescript
dataSources: [
  {
    key: 'summary',
    name: '汇总数据',
    // ... 对象数据源配置
  },
  {
    key: 'details', 
    name: '详细列表',
    // ... 数组数据源配置
  }
]
```

## 🚀 3. 开发流程

### 步骤 1：创建目录结构
```bash
mkdir src/card2.1/components/your-component
touch src/card2.1/components/your-component/YourComponent.vue
touch src/card2.1/components/your-component/index.ts
```

### 步骤 2：编写 Vue 组件
- 定义清晰的 Props 接口
- 实现数据展示逻辑
- 添加样式（使用 CSS 变量）
- 添加调试信息（可选）

### 步骤 3：编写组件定义
- 配置基本信息和分类
- 定义数据源需求
- 设置示例数据

### 步骤 4：测试组件
1. 启动开发服务器：`pnpm dev`
2. 检查组件是否出现在组件库中
3. 拖拽组件到画布
4. 测试数据源配置功能
5. 验证主题切换效果

## 🔧 4. 调试技巧

### 控制台调试
```vue
<script setup lang="ts">
// 监听 props 变化
watch(() => props, (newProps) => {
  console.log('🔧 [DEBUG-YourComponent] Props变化:', newProps)
}, { deep: true, immediate: true })

// 监听特定数据变化
watch(() => props.objectData, (newData) => {
  console.log('🔧 [DEBUG-YourComponent] 对象数据变化:', newData)
}, { deep: true })
</script>
```

### 可视化调试
```vue
<template>
  <div class="debug-panel" v-if="showDebug">
    <h4>调试信息</h4>
    <pre>{{ JSON.stringify(props, null, 2) }}</pre>
  </div>
</template>
```

## ❌ 常见错误

### 1. 组件未在组件库中显示
**原因**：
- 缺少 `index.ts` 文件
- `index.ts` 中缺少 `component` 字段
- 缺少必需的分类字段

**解决**：
```typescript
// 确保这些字段都存在
const definition: ComponentDefinition = {
  component: YourComponent,    // ← 必须有这个
  category: 'display',         // ← 必须有这个  
  mainCategory: '展示',        // ← 必须有这个
  subCategory: '数据',         // ← 必须有这个
  icon: 'chart',              // ← 必须有这个
  // ...
}
```

### 2. 组件接收不到数据（最常见）
**原因**：
- 🚨 **Props 接口错误**：没有使用 `rawDataSources` 
- 🚨 **数据解析错误**：没有正确解析 `dataSourceBindings`
- `fieldMappings` 中的 `targetField` 与数据源 key 不匹配

**解决**：
```typescript
// ❌ 错误：直接定义业务数据 props
interface Props {
  userData?: UserData
  objectData?: any
}

// ✅ 正确：使用 rawDataSources
interface Props {
  rawDataSources?: any  // 🔥 必须这样写
}

// ✅ 正确：组件自己解析数据
const userData = computed(() => {
  const binding = props.rawDataSources?.dataSourceBindings?.userData
  return binding?.rawData ? JSON.parse(binding.rawData) : null
})
```

### 3. 主题适配不正确
**原因**：
- 使用了硬编码颜色
- 没有使用 CSS 变量

**解决**：
```css
/* ❌ 错误 */
.component {
  color: #333333;
  background: white;
}

/* ✅ 正确 */
.component {
  color: var(--text-color);
  background: var(--card-color);
}
```

## 📚 5. 最佳实践

### 数据处理
```vue
<script setup lang="ts">
// 1. 安全的数据访问
const safeData = computed(() => {
  return props.objectData || {}
})

// 2. 数组长度检查
const hasItems = computed(() => {
  return Array.isArray(props.arrayData) && props.arrayData.length > 0
})

// 3. 空值处理
const displayValue = computed(() => {
  return props.objectData?.value ?? '暂无数据'
})
</script>
```

### 错误边界
```vue
<template>
  <div class="component">
    <div v-if="error" class="error-state">
      {{ error }}
    </div>
    <div v-else-if="loading" class="loading-state">
      加载中...
    </div>
    <div v-else-if="!hasData" class="empty-state">
      暂无数据
    </div>
    <div v-else class="content">
      <!-- 正常内容 -->
    </div>
  </div>
</template>
```

### 性能优化
```vue
<script setup lang="ts">
// 1. 使用 computed 而不是 methods
const processedData = computed(() => {
  return props.arrayData?.map(item => ({
    ...item,
    displayName: item.name || '未命名'
  })) || []
})

// 2. 避免在模板中进行复杂计算
const expensiveData = computed(() => {
  return props.rawData ? processExpensiveData(props.rawData) : []
})
</script>
```

## 📖 6. 参考示例

查看现有组件了解最佳实践：
- `src/card2.1/components/dual-data-test/` - 基础双数据源示例
- `src/card2.1/components/user-info-card/` - 复杂UI组件示例

## 🆘 故障排除

如果遇到问题：
1. 检查浏览器控制台错误信息
2. 确认组件定义格式正确
3. 验证数据源配置与 props 匹配
4. 测试主题切换功能
5. 查看网络请求是否正常

**获取帮助**：
- 查看现有组件代码
- 检查 `ComponentDefinition` 类型定义
- 参考自动注册系统的日志输出

---

**🎉 现在你已经掌握了完整的 Card 2.1 组件开发流程！开始创建你的第一个组件吧！**