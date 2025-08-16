# Card2.1 组件集成模式

## 📋 核心文件分析

**主要文件**: 
- `/src/card2.1/components/dual-data-test/DualDataTest.vue`
- `/src/card2.1/core/data-binding/types.ts`

## 🎯 组件数据接收模式

### 1. 标准Props接口
组件通过标准化的props接收配置：

```typescript
interface ComponentProps {
  /** 🔥 新架构：完整的组件配置，包含四部分配置结构 */
  widgetConfiguration?: WidgetConfiguration
  
  /** 🔥 兼容性保留：原始数据源配置 */
  rawDataSources?: any
}

// 完整配置结构
interface WidgetConfiguration {
  dataSource: {
    config: {
      dataSourceBindings: {
        [dataSourceId: string]: {
          rawData: string // JSON字符串
          // 其他数据源元数据...
        }
      }
    }
  }
  // 其他配置部分...
}
```

### 2. 数据获取辅助函数
组件使用统一的数据获取模式：

```typescript
// 🔥 获取数据源配置 - 优先使用完整配置，回退到兼容性配置
const getDataSourceBinding = (key: string) => {
  // 🔥 优先使用完整配置中的数据源
  if (props.widgetConfiguration?.dataSource?.config?.dataSourceBindings?.[key]) {
    return props.widgetConfiguration.dataSource.config.dataSourceBindings[key]
  }
  
  // 🔥 回退到兼容性配置
  return props.rawDataSources?.dataSourceBindings?.[key]
}
```

### 3. 组件数据解析模式
组件自己负责解析需要的数据：

```typescript
// 🔥 组件自己解析需要的数据
const objectData = computed(() => {
  const binding = getDataSourceBinding('objectData')
  if (!binding?.rawData) return null
  
  try {
    return JSON.parse(binding.rawData)
  } catch {
    return null // 优雅的错误处理
  }
})

const arrayData = computed(() => {
  const binding = getDataSourceBinding('arrayData')
  if (!binding?.rawData) return null
  
  try {
    return JSON.parse(binding.rawData)
  } catch {
    return null
  }
})
```

## 🔧 多数据源支持模式

### 1. 命名数据源
组件可以通过不同的key获取多个数据源：

```typescript
// 示例：双数据源组件
const primaryData = computed(() => {
  return getDataSourceBinding('primaryData') // 主要数据源
})

const secondaryData = computed(() => {
  return getDataSourceBinding('secondaryData') // 次要数据源
})

const configData = computed(() => {
  return getDataSourceBinding('configData') // 配置数据源
})
```

### 2. 数据源类型区分
```typescript
// 不同结构类型的数据源
const statisticsData = computed(() => {
  // object类型：单一统计对象
  const binding = getDataSourceBinding('statistics')
  return binding ? JSON.parse(binding.rawData) : null
})

const timeSeriesData = computed(() => {
  // array类型：时间序列数组
  const binding = getDataSourceBinding('timeSeries')
  return binding ? JSON.parse(binding.rawData) : []
})
```

## 🔍 调试和监控机制

### 1. 配置变化监听
组件包含完整的调试支持：

```typescript
// 🔥 调试：监听完整配置变化
watch(
  () => props.widgetConfiguration,
  newConfig => {
    console.log('🔧 [DEBUG-Component] 组件接收到完整配置:', newConfig)
    console.log('🔧 [DEBUG-Component] 配置数据源:', newConfig?.dataSource)
  },
  { deep: true, immediate: true }
)

// 调试：监听原始数据源变化（兼容性）
watch(
  () => props.rawDataSources,
  newDataSources => {
    console.log('🔧 [DEBUG-Component] 组件接收到原始数据源:', newDataSources)
    console.log('🔧 [DEBUG-Component] 解析后的数据:', {
      objectData: objectData.value,
      arrayData: arrayData.value
    })
  },
  { deep: true, immediate: true }
)
```

### 2. 数据解析日志
```typescript
const parseDataWithLogging = (key: string, binding: any) => {
  if (!binding?.rawData) {
    console.warn(`🔧 [DEBUG-Component] 数据源 ${key} 无数据`)
    return null
  }
  
  try {
    const parsed = JSON.parse(binding.rawData)
    console.log(`🔧 [DEBUG-Component] 数据源 ${key} 解析成功:`, parsed)
    return parsed
  } catch (error) {
    console.error(`🔧 [DEBUG-Component] 数据源 ${key} 解析失败:`, error)
    return null
  }
}
```

## 🎨 组件UI模式

### 1. 数据展示模式
```typescript
// 计算属性用于UI展示
const objectDataDisplay = computed(() => {
  return objectData.value ? JSON.stringify(objectData.value, null, 2) : 'null'
})

const arrayDataDisplay = computed(() => {
  return arrayData.value ? JSON.stringify(arrayData.value, null, 2) : '[]'
})
```

### 2. 模板结构
```vue
<template>
  <div class="dual-data-test">
    <n-card title="双数据源测试组件" size="small">
      <n-space vertical size="small">
        <!-- 对象数据展示 -->
        <div>
          <n-text strong>对象数据源 (objectData):</n-text>
          <n-code
            :code="objectDataDisplay"
            language="json"
            :show-line-numbers="false"
            style="font-size: 11px; margin-top: 4px"
          />
        </div>

        <!-- 数组数据展示 -->
        <div>
          <n-text strong>数组数据源 (arrayData):</n-text>
          <n-code
            :code="arrayDataDisplay"
            language="json"
            :show-line-numbers="false"
            style="font-size: 11px; margin-top: 4px"
          />
        </div>
      </n-space>
    </n-card>
  </div>
</template>
```

## 🔑 关键设计原则

### 1. 配置与渲染分离
- 组件不关心数据如何获取，只关心数据内容
- 外部系统负责数据的获取、转换、传递
- 组件专注于数据的解析和UI渲染

### 2. 向后兼容策略
- 新配置格式优先，旧格式兜底
- 平滑的迁移路径，避免破坏性变更
- 两套API共存，逐步废弃旧API

### 3. 错误处理优雅降级
- JSON解析失败时返回null，不抛出异常
- 数据缺失时有合理的默认值
- 调试信息丰富但不影响生产环境

### 4. 响应式数据流
- 使用Vue的computed自动处理数据变化
- 深度监听配置变化，及时响应更新
- 数据解析结果自动缓存优化性能

## 🚀 在新系统中的应用

### 1. 标准化的组件接口
```typescript
// 新系统的组件props
interface StandardComponentProps {
  dataSourceConfig?: {
    [dataSourceId: string]: {
      type: 'static' | 'api' | 'websocket' | 'script'
      data: any // 解析后的数据对象
    }
  }
}
```

### 2. 简化的数据获取
```typescript
// 简化的数据获取模式
const getData = (dataSourceId: string) => {
  return props.dataSourceConfig?.[dataSourceId]?.data || null
}

const primaryData = computed(() => getData('primary'))
const secondaryData = computed(() => getData('secondary'))
```

### 3. 保留的核心价值
- **配置驱动**: 组件通过配置获取数据
- **多数据源支持**: 支持组件使用多个命名数据源
- **向后兼容**: 新旧API共存的迁移策略
- **错误处理**: 优雅的降级和错误处理机制
- **调试支持**: 完整的开发时调试能力

这种组件集成模式提供了清晰的数据契约和灵活的扩展能力，是系统架构的重要基础。