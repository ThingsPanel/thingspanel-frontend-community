# 属性暴露系统 - 组件交互的基础

属性暴露系统让组件能够对外提供可监听的属性，是实现组件间交互的核心机制。

## 🎯 系统概述

### 什么是属性暴露
属性暴露是指组件声明哪些内部属性可以被外部监听和交互配置使用。这些属性可以：
- 被其他组件监听变化
- 作为交互配置的数据源
- 用于组件间的数据联动

### 工作原理
```
组件定义listenableProperties → PropertyExposureManager注册 → 交互配置面板显示 → 用户配置交互规则
```

## 📋 属性声明方式

### 1. 在组件定义中声明

```typescript
// definition.ts
export const componentDefinition = {
  interaction: {
    capability: {
      listenableProperties: [
        'title',           // 简单属性名
        'dataValue',       // 数据属性
        'status',          // 状态属性
        'config.theme',    // 嵌套属性
        'items[].name'     // 数组属性
      ]
    }
  }
}
```

### 2. 自动从settingConfig推断

系统会自动从配置项推断可暴露属性：

```typescript
// settingConfig.ts
export const settingConfig = [
  createSetting(SettingControlType.INPUT, '标题', 'customize.title', {
    group: '基础设置',
    defaultValue: 'Hello'
  }),
  // 自动推断：customize.title 可被暴露
  
  createSetting(SettingControlType.COLOR_PICKER, '主题色', 'customize.themeColor', {
    group: '样式设置', 
    defaultValue: '#2080f0'
  })
  // 自动推断：customize.themeColor 可被暴露
]
```

## 🔧 属性类型系统

### 支持的属性类型

```typescript
export type PropertyDataType =
  | 'string'    // 字符串
  | 'number'    // 数字
  | 'boolean'   // 布尔值
  | 'object'    // 对象
  | 'array'     // 数组
  | 'date'      // 日期
  | 'color'     // 颜色
  | 'url'       // URL链接
```

### 属性定义接口

```typescript
export interface ListenableProperty {
  name: string                    // 属性名（程序访问用）
  label: string                   // 显示标签（用户界面用）
  description?: string            // 属性描述
  type: PropertyDataType          // 数据类型
  defaultValue?: any              // 默认值
  isCore?: boolean               // 是否核心属性（优先显示）
  group?: string                 // 属性分组
  example?: any                  // 示例值
  enum?: Array<{                 // 枚举值（用于选择类型）
    label: string
    value: any
  }>
}
```

## 💡 实际应用示例

### 示例1: 数据展示组件

```typescript
// definition.ts
export const dataDisplayDefinition = {
  type: 'data-display',
  name: '数据展示',
  
  interaction: {
    capability: {
      listenableProperties: [
        'currentValue',      // 当前数值
        'status',           // 状态信息
        'lastUpdateTime',   // 最后更新时间
        'isOnline',        // 是否在线
        'config.threshold'  // 阈值配置
      ]
    }
  }
}

// 对应的Vue组件
<script setup lang="ts">
interface Props {
  dataValue?: number
  threshold?: number
}

const props = withDefaults(defineProps<Props>(), {
  dataValue: 0,
  threshold: 100
})

// 计算属性会自动成为可暴露属性
const currentValue = computed(() => props.dataValue)
const status = computed(() => 
  props.dataValue > props.threshold ? 'warning' : 'normal'
)
const isOnline = ref(true)
const lastUpdateTime = ref(new Date())

// 这些响应式数据都可以被外部监听
</script>
```

### 示例2: 图表组件

```typescript
export const chartComponentDefinition = {
  type: 'chart-component',
  name: '图表组件',
  
  interaction: {
    capability: {
      listenableProperties: [
        'selectedDataPoint',    // 选中的数据点
        'chartType',           // 图表类型
        'dataRange.min',       // 数据范围最小值
        'dataRange.max',       // 数据范围最大值
        'isLoading',          // 加载状态
        'errorMessage'        // 错误信息
      ]
    },

    examples: [
      {
        name: '数据点选择联动',
        description: '当用户点击图表数据点时，其他组件显示详细信息',
        scenario: 'datapoint-select',
        config: {
          event: 'dataPointClick',
          responses: [{
            action: 'modify',
            modifyConfig: {
              targetComponentId: 'detail-panel',
              targetProperty: 'selectedItem',
              updateValue: '{{selectedDataPoint}}',
              updateMode: 'replace'
            }
          }],
          enabled: true
        }
      }
    ]
  }
}
```

## 🔍 属性监听机制

### 1. 自动属性检测

系统会自动检测组件的可暴露属性：

```typescript
// 自动检测逻辑
export function autoDetectComponentProperties(
  componentType: string, 
  componentDefinition: any
): ListenableProperty[] {
  const properties: ListenableProperty[] = []

  // 从配置中检测
  if (componentDefinition.config?.customize) {
    Object.entries(componentDefinition.config.customize).forEach(([key, value]) => {
      properties.push({
        name: `customize.${key}`,
        label: generatePropertyLabel(key),
        type: inferPropertyType(value),
        defaultValue: value,
        group: '组件配置'
      })
    })
  }

  // 从settingConfig检测
  if (componentDefinition.settingConfig) {
    componentDefinition.settingConfig.forEach(setting => {
      properties.push({
        name: setting.key,
        label: setting.label,
        type: inferTypeFromSetting(setting),
        defaultValue: setting.defaultValue,
        group: setting.group || '其他'
      })
    })
  }

  return properties
}
```

### 2. 手动注册属性

```typescript
import { PropertyExposureManager } from '@/card2.1/core/property-exposure'

// 手动注册组件属性
PropertyExposureManager.register({
  componentType: 'my-component',
  componentName: '我的组件',
  listenableProperties: [
    {
      name: 'customData',
      label: '自定义数据',
      type: 'object',
      description: '组件处理后的自定义数据',
      defaultValue: {},
      group: '数据输出',
      example: { value: 42, status: 'ok' }
    }
  ],
  version: '1.0.0'
})
```

## 🎛️ 属性分组和组织

### 分组策略

```typescript
const properties: ListenableProperty[] = [
  // 核心数据组
  {
    name: 'dataValue',
    label: '数据值', 
    type: 'number',
    group: '核心数据',
    isCore: true              // 标记为核心属性
  },
  
  // 状态信息组
  {
    name: 'connectionStatus',
    label: '连接状态',
    type: 'string',
    group: '状态信息',
    enum: [
      { label: '已连接', value: 'connected' },
      { label: '断开连接', value: 'disconnected' },
      { label: '连接中', value: 'connecting' }
    ]
  },
  
  // 样式配置组
  {
    name: 'themeColor',
    label: '主题颜色',
    type: 'color',
    group: '样式配置',
    defaultValue: '#2080f0'
  },
  
  // 内部状态组（较少使用）
  {
    name: 'internalCounter',
    label: '内部计数器',
    type: 'number',
    group: '内部状态',
    isCore: false
  }
]
```

### 属性优先级显示

交互配置面板会按优先级显示属性：
1. **核心属性** (`isCore: true`)
2. **常用属性** (使用频率高)
3. **其他属性** (按分组显示)

## 🔄 动态属性更新

### 1. 响应式属性暴露

```vue
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usePropertyExposure } from '@/card2.1/hooks/usePropertyExposure'

const props = defineProps<{
  dataSource?: any[]
  threshold?: number
}>()

// 响应式状态
const isProcessing = ref(false)
const processedData = ref([])
const errorMessage = ref('')

// 计算属性
const summary = computed(() => ({
  total: processedData.value.length,
  average: processedData.value.reduce((sum, item) => sum + item.value, 0) / processedData.value.length || 0
}))

// 使用属性暴露Hook
const { exposeProperties } = usePropertyExposure('my-component')

// 暴露响应式属性
exposeProperties({
  isProcessing,
  processedData,
  errorMessage,
  summary,
  'config.threshold': () => props.threshold
})

// 监听数据变化并更新暴露的属性
watch(() => props.dataSource, async (newData) => {
  isProcessing.value = true
  try {
    processedData.value = await processData(newData)
    errorMessage.value = ''
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    isProcessing.value = false
  }
})
</script>
```

### 2. 事件驱动属性更新

```vue
<script setup lang="ts">
// 用户交互触发属性变化
const selectedItem = ref(null)
const clickCount = ref(0)

const handleItemClick = (item) => {
  selectedItem.value = item
  clickCount.value += 1
  
  // 触发属性变化事件
  emit('propertyChanged', {
    selectedItem: item,
    clickCount: clickCount.value,
    timestamp: new Date()
  })
}

// 暴露交互相关属性
exposeProperties({
  selectedItem,
  clickCount,
  lastClickTime: computed(() => new Date())
})
</script>
```

## 🔧 高级用法

### 1. 条件属性暴露

```typescript
// 根据组件状态条件性暴露属性
const getConditionalProperties = (componentState) => {
  const baseProperties = [
    { name: 'title', label: '标题', type: 'string' }
  ]
  
  // 只有在图表模式下才暴露图表相关属性
  if (componentState.mode === 'chart') {
    baseProperties.push(
      { name: 'chartData', label: '图表数据', type: 'array' },
      { name: 'selectedSeries', label: '选中系列', type: 'string' }
    )
  }
  
  // 只有在表格模式下才暴露表格相关属性
  if (componentState.mode === 'table') {
    baseProperties.push(
      { name: 'selectedRows', label: '选中行', type: 'array' },
      { name: 'sortColumn', label: '排序列', type: 'string' }
    )
  }
  
  return baseProperties
}
```

### 2. 属性数据转换

```typescript
// 属性值转换器
const propertyTransformers = {
  // 数字格式化
  dataValue: (value) => {
    if (typeof value === 'number') {
      return value.toFixed(2)
    }
    return value
  },
  
  // 状态映射
  status: (value) => {
    const statusMap = {
      0: 'offline',
      1: 'online',
      2: 'warning',
      3: 'error'
    }
    return statusMap[value] || 'unknown'
  },
  
  // 数组属性处理
  selectedItems: (value) => {
    if (Array.isArray(value)) {
      return value.map(item => ({
        id: item.id,
        name: item.name,
        selected: true
      }))
    }
    return []
  }
}
```

## ✅ 最佳实践

### 1. 属性设计原则
- **语义化命名**: 使用清晰、有意义的属性名
- **类型一致性**: 保持属性类型的稳定性
- **合理分组**: 将相关属性归类到同一组
- **提供示例**: 为复杂属性提供示例值

### 2. 性能优化
- **按需暴露**: 只暴露真正需要的属性
- **避免频繁更新**: 对高频变化的属性使用防抖
- **缓存计算结果**: 缓存复杂的计算属性

### 3. 调试技巧
```typescript
// 开发环境下的属性监控
if (process.env.NODE_ENV === 'development') {
  watch(() => exposedProperties, (newProps) => {
    console.log(`[${componentType}] 属性更新:`, newProps)
  }, { deep: true })
}
```

## 🚨 常见问题

### 问题1: 属性不显示在交互配置中
**可能原因**: 属性未正确注册或类型推断失败
**解决方法**: 检查`listenableProperties`配置和属性类型定义

### 问题2: 属性值未更新
**可能原因**: 属性未使用响应式数据或缺少监听
**解决方法**: 使用`ref`、`computed`等响应式API

### 问题3: 嵌套属性无法访问
**可能原因**: 属性路径配置错误
**解决方法**: 检查属性路径语法，如`config.theme.primaryColor`

## 🔗 相关文档

- [交互系统详解](./08-interaction-system.md)
- [组件定义详解](./04-component-definition.md)
- [调试工具](./15-debugging-tools.md)

---

**属性暴露是组件交互能力的基石！** 🔗