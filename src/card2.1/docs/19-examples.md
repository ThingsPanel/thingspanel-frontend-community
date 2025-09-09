# 示例库 - 完整代码示例与最佳实践

本章提供Card 2.1组件开发的完整示例代码，涵盖各种常见场景和最佳实践。

## 🎯 示例分类

### 📊 基础组件示例
- **简单数据显示组件** - 最基础的数据展示
- **配置驱动组件** - 通过配置控制外观和行为
- **响应式组件** - 支持不同屏幕尺寸的组件

### 🔌 数据绑定示例
- **单数据源组件** - 使用一个数据源的组件
- **多数据源组件** - 使用多个数据源的复杂组件
- **实时数据组件** - 支持WebSocket实时更新

### 🎭 交互组件示例
- **点击交互组件** - 响应用户点击的组件
- **数据选择组件** - 支持数据选择和联动
- **状态切换组件** - 支持状态切换的组件

### 🎨 高级组件示例
- **图表组件** - 集成ECharts的图表组件
- **地图组件** - 集成地图的位置组件
- **表单组件** - 复杂表单和数据录入

## 📋 示例1：简单数据显示组件

### 功能描述
一个显示单个数据值的基础组件，支持标题、单位、颜色等配置。

### 文件结构
```
src/card2.1/components/test/simple-display/
├── index.vue           # 组件实现
├── setting.vue         # 配置面板
├── settingConfig.ts    # 配置项定义
└── definition.ts       # 组件定义
```

### 实现代码

#### definition.ts
```typescript
/**
 * 简单数据显示组件定义
 */
import type { ComponentDefinition } from '../../../core/types'
import SimpleDisplayComponent from './index.vue'
import SimpleDisplaySetting from './setting.vue'
import { simpleDisplaySettingConfig, customConfig } from './settingConfig'

const definition: ComponentDefinition = {
  // 基础信息
  type: 'simple-display',
  name: '简单数据显示',
  description: '显示单个数据值，支持标题、单位和样式配置',
  version: '1.0.0',
  author: 'ThingsPanel',
  
  // 分类信息
  mainCategory: 'test',
  subCategory: '基础组件',
  
  // UI信息
  icon: `<svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
  </svg>`,
  tags: ['数据', '显示', '基础', '测试'],
  
  // 组件实现
  component: SimpleDisplayComponent,
  configComponent: SimpleDisplaySetting,
  
  // 默认配置
  config: {
    type: 'simple-display',
    root: { transform: { rotate: 0, scale: 1 } },
    customize: customConfig
  },
  
  // 布局配置
  defaultLayout: {
    canvas: { width: 200, height: 100, x: 0, y: 0 },
    gridstack: { w: 3, h: 2, x: 0, y: 0, minW: 2, minH: 1, maxW: 6, maxH: 4 }
  },
  
  // 数据源配置
  dataSources: [{
    key: 'mainData',
    name: '数据源',
    description: '要显示的数据值',
    supportedTypes: ['static', 'api', 'websocket'],
    fieldMappings: {
      'value': {
        targetField: 'dataValue',
        type: 'value',
        required: true,
        defaultValue: 0
      },
      'unit': {
        targetField: 'dataUnit',
        type: 'value',
        required: false,
        defaultValue: ''
      },
      'status': {
        targetField: 'dataStatus',
        type: 'value',
        required: false,
        defaultValue: 'normal'
      }
    },
    required: false
  }],
  
  // 交互配置
  interaction: {
    capability: {
      supportedEvents: ['click', 'dataChange'],
      supportedActions: ['jump', 'modify'],
      defaultPermissions: {
        allowExternalControl: true,
        requirePermissionCheck: false
      },
      listenableProperties: ['dataValue', 'dataStatus', 'title']
    }
  },
  
  // 配置面板
  settingConfig: simpleDisplaySettingConfig,
  
  // 权限和特性
  permission: '不限',
  features: {
    realtime: true,
    dataBinding: true,
    themeable: true,
    responsive: true,
    configurable: true
  }
}

export default definition
```

#### settingConfig.ts
```typescript
/**
 * 简单数据显示组件配置
 */
import type { Setting } from '../../../core/types'
import { createSetting, createCustomConfig, SettingControlType } from '../../../core/setting-utils'

// 自定义配置接口
export interface SimpleDisplayCustomize {
  title: string
  showTitle: boolean
  valueColor: string
  backgroundColor: string
  fontSize: number
  fontWeight: 'normal' | 'bold'
  textAlign: 'left' | 'center' | 'right'
  borderRadius: number
  showBorder: boolean
  borderColor: string
}

// 配置项定义
export const simpleDisplaySettingConfig: Setting[] = [
  // 基础设置组
  createSetting(SettingControlType.INPUT, '标题', 'customize.title', {
    group: '基础设置',
    placeholder: '请输入标题',
    defaultValue: '数据标题',
    maxLength: 50
  }),
  
  createSetting(SettingControlType.SWITCH, '显示标题', 'customize.showTitle', {
    group: '基础设置',
    defaultValue: true
  }),
  
  createSetting(SettingControlType.SELECT, '文字对齐', 'customize.textAlign', {
    group: '基础设置',
    options: [
      { label: '左对齐', value: 'left' },
      { label: '居中', value: 'center' },
      { label: '右对齐', value: 'right' }
    ],
    defaultValue: 'center'
  }),
  
  // 样式设置组
  createSetting(SettingControlType.COLOR_PICKER, '数值颜色', 'customize.valueColor', {
    group: '样式设置',
    defaultValue: '#2080f0',
    showAlpha: true
  }),
  
  createSetting(SettingControlType.COLOR_PICKER, '背景颜色', 'customize.backgroundColor', {
    group: '样式设置',
    defaultValue: 'transparent',
    showAlpha: true
  }),
  
  createSetting(SettingControlType.INPUT_NUMBER, '字体大小', 'customize.fontSize', {
    group: '样式设置',
    min: 10,
    max: 72,
    step: 1,
    defaultValue: 24
  }),
  
  createSetting(SettingControlType.RADIO_GROUP, '字体粗细', 'customize.fontWeight', {
    group: '样式设置',
    options: [
      { label: '正常', value: 'normal' },
      { label: '加粗', value: 'bold' }
    ],
    defaultValue: 'normal'
  }),
  
  createSetting(SettingControlType.INPUT_NUMBER, '圆角', 'customize.borderRadius', {
    group: '样式设置',
    min: 0,
    max: 20,
    step: 1,
    defaultValue: 4
  }),
  
  // 边框设置组
  createSetting(SettingControlType.SWITCH, '显示边框', 'customize.showBorder', {
    group: '边框设置',
    defaultValue: false
  }),
  
  createSetting(SettingControlType.COLOR_PICKER, '边框颜色', 'customize.borderColor', {
    group: '边框设置',
    defaultValue: '#d9d9d9',
    condition: 'customize.showBorder === true'  // 条件显示
  })
]

// 默认配置
export const customConfig = createCustomConfig<SimpleDisplayCustomize>({
  title: '数据标题',
  showTitle: true,
  valueColor: '#2080f0',
  backgroundColor: 'transparent',
  fontSize: 24,
  fontWeight: 'normal',
  textAlign: 'center',
  borderRadius: 4,
  showBorder: false,
  borderColor: '#d9d9d9'
})
```

#### index.vue
```vue
<template>
  <div 
    class="simple-display-component"
    :class="componentClasses"
    :style="componentStyles"
    @click="handleClick"
  >
    <!-- 标题部分 -->
    <div v-if="showTitle" class="title">{{ title }}</div>
    
    <!-- 数值部分 -->
    <div class="value-container">
      <span class="value" :style="valueStyles">{{ formattedValue }}</span>
      <span v-if="dataUnit" class="unit">{{ dataUnit }}</span>
    </div>
    
    <!-- 状态指示器 -->
    <div v-if="showStatus" class="status-indicator" :class="statusClass"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useInteractionEmitter, usePropertyExposure } from '@/card2.1/hooks'
import type { SimpleDisplayCustomize } from './settingConfig'

// Props接口
interface Props {
  // 从配置系统传入的自定义配置
  customize?: Partial<SimpleDisplayCustomize>
  
  // 从数据源传入的数据
  dataValue?: number
  dataUnit?: string
  dataStatus?: 'normal' | 'warning' | 'error' | 'offline'
}

const props = withDefaults(defineProps<Props>(), {
  customize: () => ({}),
  dataValue: 0,
  dataUnit: '',
  dataStatus: 'normal'
})

// 交互系统初始化
const { emitEvent, emitDataChange } = useInteractionEmitter()
const { exposeProperties } = usePropertyExposure('simple-display')

// 组件内部状态
const clickCount = ref(0)
const lastUpdateTime = ref(new Date())

// 配置计算属性
const title = computed(() => props.customize?.title || '数据标题')
const showTitle = computed(() => props.customize?.showTitle !== false)
const valueColor = computed(() => props.customize?.valueColor || '#2080f0')
const backgroundColor = computed(() => props.customize?.backgroundColor || 'transparent')
const fontSize = computed(() => props.customize?.fontSize || 24)
const fontWeight = computed(() => props.customize?.fontWeight || 'normal')
const textAlign = computed(() => props.customize?.textAlign || 'center')
const borderRadius = computed(() => props.customize?.borderRadius || 4)
const showBorder = computed(() => props.customize?.showBorder || false)
const borderColor = computed(() => props.customize?.borderColor || '#d9d9d9')

// 数据计算属性
const formattedValue = computed(() => {
  if (typeof props.dataValue === 'number') {
    return props.dataValue.toLocaleString()
  }
  return props.dataValue || '--'
})

const showStatus = computed(() => props.dataStatus && props.dataStatus !== 'normal')

const statusClass = computed(() => ({
  'status-warning': props.dataStatus === 'warning',
  'status-error': props.dataStatus === 'error',
  'status-offline': props.dataStatus === 'offline'
}))

// 样式计算属性
const componentClasses = computed(() => ({
  'has-border': showBorder.value,
  'clickable': true
}))

const componentStyles = computed(() => ({
  backgroundColor: backgroundColor.value,
  borderRadius: `${borderRadius.value}px`,
  border: showBorder.value ? `1px solid ${borderColor.value}` : 'none',
  textAlign: textAlign.value
}))

const valueStyles = computed(() => ({
  color: valueColor.value,
  fontSize: `${fontSize.value}px`,
  fontWeight: fontWeight.value
}))

// 事件处理
const handleClick = () => {
  clickCount.value++
  lastUpdateTime.value = new Date()
  
  // 触发交互事件
  emitEvent('click', {
    target: 'component',
    dataValue: props.dataValue,
    clickCount: clickCount.value,
    timestamp: lastUpdateTime.value
  })
}

// 属性暴露
exposeProperties({
  title: title,
  dataValue: computed(() => props.dataValue),
  dataStatus: computed(() => props.dataStatus),
  clickCount: clickCount,
  lastUpdateTime: lastUpdateTime,
  formattedValue: formattedValue
})

// 监听数据变化
watch(() => props.dataValue, (newValue, oldValue) => {
  lastUpdateTime.value = new Date()
  
  // 触发数据变化事件
  emitDataChange({
    property: 'dataValue',
    newValue,
    oldValue,
    timestamp: lastUpdateTime.value
  })
})

watch(() => props.dataStatus, (newStatus) => {
  // 触发状态变化事件
  emitEvent('statusChange', {
    property: 'dataStatus',
    newStatus,
    timestamp: new Date()
  })
})

onMounted(() => {
  // 组件初始化完成
  console.log('SimpleDisplay component mounted')
})
</script>

<style scoped>
.simple-display-component {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 12px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
}

.simple-display-component:hover {
  transform: scale(1.02);
}

.title {
  font-size: 14px;
  color: var(--text-color-2);
  margin-bottom: 8px;
  text-align: center;
}

.value-container {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
}

.value {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  line-height: 1;
  transition: color 0.3s ease;
}

.unit {
  font-size: 14px;
  color: var(--text-color-2);
  font-weight: normal;
}

.status-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-warning {
  background-color: var(--warning-color);
}

.status-error {
  background-color: var(--error-color);
}

.status-offline {
  background-color: var(--text-color-3);
}

@keyframes pulse {
  0% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
  100% { opacity: 0.6; transform: scale(1); }
}

/* 响应式设计 */
@container (max-width: 120px) {
  .title {
    font-size: 12px;
  }
  
  .value {
    font-size: 18px !important;
  }
  
  .unit {
    font-size: 12px;
  }
}

@container (max-height: 60px) {
  .simple-display-component {
    flex-direction: row;
    gap: 8px;
  }
  
  .title {
    margin-bottom: 0;
  }
}
</style>
```

#### setting.vue
```vue
<template>
  <div class="simple-display-setting">
    <AutoFormGenerator 
      :model-value="modelValue"
      :setting-config="settingConfig"
      @update:model-value="$emit('update:modelValue', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import AutoFormGenerator from '../../../core/AutoFormGenerator.vue'
import { simpleDisplaySettingConfig } from './settingConfig'
import type { SimpleDisplayCustomize } from './settingConfig'

interface Props {
  modelValue: {
    customize: SimpleDisplayCustomize
  }
}

interface Emits {
  (e: 'update:modelValue', value: Props['modelValue']): void
}

defineProps<Props>()
defineEmits<Emits>()

const settingConfig = simpleDisplaySettingConfig
</script>

<style scoped>
.simple-display-setting {
  padding: 16px;
}
</style>
```

## 📊 示例2：双数据对比组件

### 功能描述
一个对比显示两个数据值的组件，支持差值计算、趋势显示和样式配置。

### 关键特性
- **双数据源配置** - 支持两个独立的数据源
- **自动对比计算** - 自动计算差值和趋势
- **动态样式** - 根据对比结果动态调整样式
- **交互联动** - 点击可触发其他组件更新

### 数据源配置
```typescript
// definition.ts 中的数据源配置
dataSources: [
  {
    key: 'dataSource1',
    name: '数据源1',
    description: '第一个对比数据',
    supportedTypes: ['static', 'api', 'websocket'],
    fieldMappings: {
      'value': {
        targetField: 'value1',
        type: 'value',
        required: true,
        defaultValue: 0
      },
      'label': {
        targetField: 'label1',
        type: 'value',
        required: false,
        defaultValue: '数据1'
      }
    },
    required: false
  },
  {
    key: 'dataSource2',
    name: '数据源2',
    description: '第二个对比数据',
    supportedTypes: ['static', 'api', 'websocket'],
    fieldMappings: {
      'value': {
        targetField: 'value2',
        type: 'value',
        required: true,
        defaultValue: 0
      },
      'label': {
        targetField: 'label2',
        type: 'value',
        required: false,
        defaultValue: '数据2'
      }
    },
    required: false
  }
]
```

### 核心实现逻辑
```vue
<script setup lang="ts">
// 对比计算
const difference = computed(() => {
  const val1 = Number(props.value1) || 0
  const val2 = Number(props.value2) || 0
  return val1 - val2
})

const differencePercent = computed(() => {
  const val2 = Number(props.value2) || 0
  if (val2 === 0) return 0
  return (difference.value / val2) * 100
})

const trend = computed(() => {
  if (difference.value > 0) return 'up'
  if (difference.value < 0) return 'down'
  return 'equal'
})

// 样式计算
const comparisonStyles = computed(() => {
  const baseStyle = {
    color: 'var(--text-color)',
    backgroundColor: 'transparent'
  }
  
  if (trend.value === 'up') {
    baseStyle.color = props.customize?.positiveColor || 'var(--success-color)'
  } else if (trend.value === 'down') {
    baseStyle.color = props.customize?.negativeColor || 'var(--error-color)'
  }
  
  return baseStyle
})
</script>
```

## 🎨 示例3：图表组件集成

### 功能描述
集成ECharts的图表组件，支持多种图表类型、主题切换和实时数据更新。

### 关键文件片段

#### 图表初始化和配置
```vue
<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { useThemeStore } from '@/store/modules/theme'

// 图表实例引用
const chartRef = ref<HTMLDivElement>()
const chartInstance = ref<echarts.ECharts>()

// 主题系统集成
const themeStore = useThemeStore()

// 初始化图表
const initChart = () => {
  if (chartRef.value && !chartInstance.value) {
    chartInstance.value = echarts.init(
      chartRef.value, 
      themeStore.darkMode ? 'dark' : 'light'
    )
    
    updateChartOptions()
  }
}

// 更新图表配置
const updateChartOptions = () => {
  if (!chartInstance.value) return
  
  const option = {
    title: {
      text: props.customize?.title || '图表标题',
      textStyle: {
        color: themeStore.darkMode ? '#fff' : '#333'
      }
    },
    xAxis: {
      type: 'category',
      data: chartData.value.map(item => item.name)
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      data: chartData.value.map(item => item.value),
      type: props.customize?.chartType || 'line',
      smooth: true,
      itemStyle: {
        color: props.customize?.primaryColor || '#2080f0'
      }
    }]
  }
  
  chartInstance.value.setOption(option, true)
}

// 监听主题变化
watch(() => themeStore.darkMode, () => {
  if (chartInstance.value) {
    chartInstance.value.dispose()
    chartInstance.value = null
    nextTick(() => {
      initChart()
    })
  }
})

// 监听数据变化
watch(() => props.chartData, updateChartOptions, { deep: true })

// 响应式处理
const handleResize = () => {
  chartInstance.value?.resize()
}

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance.value?.dispose()
})
</script>
```

## 🔄 示例4：实时数据组件

### 功能描述
支持WebSocket实时数据更新的组件，具备连接状态管理、数据缓冲和错误重连机制。

### WebSocket数据源配置
```typescript
// definition.ts 中的实时数据源配置
dataSources: [{
  key: 'realtimeData',
  name: '实时数据源',
  description: 'WebSocket实时数据连接',
  supportedTypes: ['websocket'],
  fieldMappings: {
    'value': {
      targetField: 'currentValue',
      type: 'value',
      required: true,
      defaultValue: 0,
      transform: `
        // 数据验证和转换
        if (typeof data.value === 'number') {
          return Math.round(data.value * 100) / 100;
        }
        const parsed = parseFloat(data.value);
        return isNaN(parsed) ? 0 : parsed;
      `
    },
    'timestamp': {
      targetField: 'dataTimestamp',
      type: 'value',
      required: false,
      defaultValue: null,
      transform: `
        return data.timestamp ? new Date(data.timestamp) : new Date();
      `
    },
    'quality': {
      targetField: 'dataQuality',
      type: 'value',
      required: false,
      defaultValue: 'good',
      transform: `
        const qualityMap = { 0: 'bad', 1: 'uncertain', 2: 'good' };
        return qualityMap[data.quality] || 'unknown';
      `
    }
  },
  required: false
}]
```

### 实时数据处理逻辑
```vue
<script setup lang="ts">
// 实时数据状态
const connectionStatus = ref<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
const dataBuffer = ref<Array<{ value: number; timestamp: Date }>>([])
const maxBufferSize = 100

// 数据处理
watch(() => props.currentValue, (newValue) => {
  if (newValue !== undefined) {
    // 添加到缓冲区
    dataBuffer.value.push({
      value: newValue,
      timestamp: props.dataTimestamp || new Date()
    })
    
    // 保持缓冲区大小
    if (dataBuffer.value.length > maxBufferSize) {
      dataBuffer.value = dataBuffer.value.slice(-maxBufferSize)
    }
    
    // 触发数据更新事件
    emitDataChange({
      value: newValue,
      timestamp: props.dataTimestamp,
      quality: props.dataQuality,
      bufferSize: dataBuffer.value.length
    })
  }
})

// 连接状态管理
const updateConnectionStatus = (status: typeof connectionStatus.value) => {
  connectionStatus.value = status
  emitEvent('statusChange', {
    property: 'connectionStatus',
    newValue: status,
    timestamp: new Date()
  })
}

// 计算属性
const isOnline = computed(() => connectionStatus.value === 'connected')
const latestData = computed(() => dataBuffer.value[dataBuffer.value.length - 1])
const averageValue = computed(() => {
  if (dataBuffer.value.length === 0) return 0
  const sum = dataBuffer.value.reduce((acc, item) => acc + item.value, 0)
  return sum / dataBuffer.value.length
})
</script>
```

## 🎛️ 示例5：高级配置组件

### 功能描述
展示复杂配置选项的组件，包括条件显示、联动配置、自定义验证等高级特性。

### 高级配置项定义
```typescript
// settingConfig.ts - 高级配置示例
export const advancedSettingConfig: Setting[] = [
  // 模式选择（影响其他配置的显示）
  createSetting(SettingControlType.SELECT, '显示模式', 'customize.displayMode', {
    group: '基础设置',
    options: [
      { label: '数值模式', value: 'numeric' },
      { label: '图表模式', value: 'chart' },
      { label: '混合模式', value: 'mixed' }
    ],
    defaultValue: 'numeric'
  }),
  
  // 数值模式专用配置
  createSetting(SettingControlType.INPUT_NUMBER, '小数位数', 'customize.decimalPlaces', {
    group: '数值设置',
    min: 0,
    max: 6,
    defaultValue: 2,
    condition: 'customize.displayMode === "numeric" || customize.displayMode === "mixed"'
  }),
  
  createSetting(SettingControlType.SWITCH, '千分位分隔符', 'customize.thousandsSeparator', {
    group: '数值设置',
    defaultValue: true,
    condition: 'customize.displayMode === "numeric" || customize.displayMode === "mixed"'
  }),
  
  // 图表模式专用配置
  createSetting(SettingControlType.SELECT, '图表类型', 'customize.chartType', {
    group: '图表设置',
    options: [
      { label: '折线图', value: 'line' },
      { label: '柱状图', value: 'bar' },
      { label: '面积图', value: 'area' }
    ],
    defaultValue: 'line',
    condition: 'customize.displayMode === "chart" || customize.displayMode === "mixed"'
  }),
  
  createSetting(SettingControlType.SWITCH, '显示数据点', 'customize.showDataPoints', {
    group: '图表设置',
    defaultValue: false,
    condition: 'customize.displayMode === "chart" && customize.chartType === "line"'
  }),
  
  // 阈值配置（动态数组）
  createSetting(SettingControlType.DYNAMIC_TAGS, '告警阈值', 'customize.alarmThresholds', {
    group: '告警设置',
    placeholder: '输入阈值后回车',
    defaultValue: ['100', '200'],
    maxTags: 5,
    validation: {
      custom: (values: string[]) => {
        for (const value of values) {
          if (isNaN(Number(value))) {
            return '阈值必须是数字'
          }
        }
        return null
      }
    }
  }),
  
  // 自定义脚本配置
  createSetting(SettingControlType.CODE_EDITOR, '数据处理脚本', 'customize.dataProcessor', {
    group: '高级设置',
    language: 'javascript',
    theme: 'vs-dark',
    height: 200,
    defaultValue: `
function processData(rawData) {
  // 在这里编写数据处理逻辑
  return {
    value: parseFloat(rawData.value) || 0,
    processed: true,
    timestamp: new Date()
  };
}
    `.trim(),
    validation: {
      custom: (code: string) => {
        try {
          // 简单的语法检查
          new Function('data', code)
          return null
        } catch (error) {
          return `脚本语法错误: ${error.message}`
        }
      }
    }
  })
]
```

### 配置联动处理
```vue
<!-- setting.vue 中的配置联动 -->
<script setup lang="ts">
import { watch, computed } from 'vue'

// 监听显示模式变化，联动更新其他配置
watch(() => props.modelValue.customize.displayMode, (newMode) => {
  const updatedConfig = { ...props.modelValue }
  
  // 根据模式自动调整相关配置
  if (newMode === 'chart') {
    updatedConfig.customize.showTitle = true
    updatedConfig.customize.backgroundColor = 'transparent'
  } else if (newMode === 'numeric') {
    updatedConfig.customize.showBorder = true
  }
  
  emit('update:modelValue', updatedConfig)
})

// 计算可用的图表类型（基于数据源特性）
const availableChartTypes = computed(() => {
  const baseTypes = [
    { label: '折线图', value: 'line' },
    { label: '柱状图', value: 'bar' }
  ]
  
  // 如果数据源支持历史数据，增加更多图表类型
  if (props.modelValue.dataSources?.some(ds => ds.supportsHistoricalData)) {
    baseTypes.push({ label: '面积图', value: 'area' })
  }
  
  return baseTypes
})
</script>
```

## ✅ 开发最佳实践总结

### 1. 组件结构规范
```
组件目录/
├── index.vue              # 主组件实现
├── setting.vue            # 配置面板（可选）
├── settingConfig.ts       # 配置项定义
├── definition.ts          # 组件定义
├── types.ts              # 类型定义（可选）
├── utils.ts              # 工具函数（可选）
└── README.md             # 组件说明文档（可选）
```

### 2. 代码质量要求
- **类型安全** - 使用TypeScript严格类型
- **国际化** - 所有用户可见文本使用i18n
- **主题适配** - 支持明暗主题切换
- **响应式** - 支持不同屏幕尺寸
- **性能优化** - 合理使用computed和watch

### 3. 交互设计原则
- **事件语义化** - 使用清晰的事件名称
- **数据完整性** - 事件数据包含足够上下文
- **错误处理** - 妥善处理异常情况
- **用户反馈** - 提供操作结果反馈

### 4. 配置系统设计
- **分组合理** - 相关配置归为同一组
- **默认合理** - 提供实用的默认值
- **验证完整** - 添加必要的验证规则
- **条件显示** - 使用条件控制配置项显示

### 5. 数据源设计
- **映射清晰** - 字段映射关系明确
- **转换安全** - 数据转换函数处理异常
- **默认值** - 设置合理的默认值
- **类型一致** - 保持数据类型稳定

## 🔗 更多示例

更多完整示例请参考：
- `/src/card2.1/components/test/` - 测试组件示例
- `/src/card2.1/examples/` - 官方示例库
- [在线示例展示](http://localhost:5002/test/panel-editor-v2) - 可视化演示

## 📚 相关文档

- [快速开始](./01-quick-start.md) - 5分钟上手指南
- [组件定义详解](./04-component-definition.md) - 深入了解组件定义
- [数据源系统](./06-data-sources.md) - 数据源配置详解
- [交互系统](./08-interaction-system.md) - 组件交互开发
- [API参考](./18-api-reference.md) - 完整API文档

---

**丰富的示例让开发更加得心应手！** 🚀