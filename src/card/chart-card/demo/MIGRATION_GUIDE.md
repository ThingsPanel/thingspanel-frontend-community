# Demo 组件迁移指南

## 📋 组件概述

**demo** 是一个数字指示器展示组件，用于显示设备的数值类型数据，包含图标、数值、单位和名称的组合展示。与 digit-indicator 组件功能高度重复，存在约90%的代码相似度。

## 🔍 技术架构分析

### 当前实现结构
```
demo/
├── index.ts           # 组件定义
├── component.vue      # 核心显示逻辑（185 行）
├── card-config.vue    # 配置界面
├── icons.ts           # 图标配置
└── poster.png         # 组件预览图
```

### 核心功能特性
1. **数字显示**: 大字号显示数值数据
2. **图标支持**: 丰富的图标库选择和颜色配置
3. **单位显示**: 支持数值单位的动态显示
4. **响应式字体**: 根据容器大小自动调整字体
5. **多数据源**: 支持遥测数据和属性数据
6. **WebSocket 更新**: 实时数据更新支持

### 数据流程
```
设备数据源 → API 获取数据 → 数值提取 → 响应式显示 → WebSocket 更新
```

## ❗ 现有问题识别

### 1. 🚨 **与 digit-indicator 严重代码重复**
```javascript
// demo/component.vue vs digit-indicator/component.vue
// 数据获取逻辑90%相同
const setSeries: (dataSource) => void = async dataSource => {
  // 完全相同的遥测数据获取逻辑
  const metricsType = arr.deviceSource ? arr.deviceSource[0]?.metricsType : ''
  const deviceId = dataSource?.deviceSource ? (dataSource?.deviceSource[0]?.deviceId ?? '') : ''
  const metricsId = arr.deviceSource ? arr.deviceSource[0]?.metricsId : ''
  
  if (metricsType === 'telemetry') {
    // ... 相同的API调用和数据处理
  } else if (metricsType === 'attributes') {
    // ... 相同的属性数据处理
  }
}

// 完全相同的WebSocket更新逻辑
defineExpose({
  updateData: (_deviceId, metricsId, data) => {
    // 相同的数据更新处理
  }
})
```

### 2. 🎨 **布局系统硬编码问题**
```css
/* 固定的绝对定位布局 */
.iconclass {
  position: absolute;
  bottom: 20%;     /* 硬编码位置 */
  left: 4%;        /* 硬编码位置 */
  width: 25%;      /* 固定大小 */
  height: 25%;
}

.name {
  position: absolute;
  top: 15%;        /* 硬编码位置 */
  left: 8%;
  width: 45%;
}

.value-wrap {
  position: absolute;
  bottom: 20%;
  left: 50%;
  width: 45%;
}
```
**影响**: 布局固化，无法适配不同的设计需求和屏幕尺寸。

### 3. 🔧 **字体自适应算法复杂且不精确**
```javascript
// 复杂且难以理解的字体计算逻辑
const handleResize = entries => {
  let dFontSize = `${entry.contentRect.width / 20}px`
  if (entry.contentRect.width / entry.contentRect.height > 3) {
    dFontSize = `${(entry.contentRect.width + (entry.contentRect.height * entry.contentRect.width) / entry.contentRect.height / 2) / 20 / (1 + entry.contentRect.width / entry.contentRect.height / 2)}px`
  }
  fontSize.value = dFontSize
}
```
**影响**: 字体大小计算不准确，在极端宽高比下显示异常。

### 4. 🌐 **图标系统耦合度高**
```javascript
// 图标直接从配置文件导入
import { icons as iconOptions } from './icons'

// 模板中硬编码图标组件使用
<component :is="iconOptions[props?.card?.config?.iconName || 'ClipboardCode20Regular']" />
```
**影响**: 图标系统与组件紧耦合，难以扩展和维护。

### 5. 🔒 **错误处理不完善**
```javascript
// 简单的空值检查，缺少错误恢复
if (detailValue?.data?.[0]?.value) {
  detail.value = detailValue.data[0].value
}
// 没有错误状态提示或降级处理
```

### 6. 📱 **响应式设计局限**
```css
/* 依赖 ResizeObserver，但处理逻辑过于简单 */
.bt-data {
  width: 100%;
  height: 100%;
  /* 缺少对小尺寸容器的特殊处理 */
}
```

## 🎯 Card 2.1 迁移策略

### 🔄 组件合并策略

**重要**: demo组件将与 digit-indicator 组件合并为统一的 `NumericIndicator` 组件。

#### 1. 统一组件定义
```typescript
// src/card2.1/components/numeric-indicator/index.ts
import type { ComponentDefinition } from '@/card2.1/core/component-definition'

export const NumericIndicatorDefinition: ComponentDefinition = {
  type: 'numeric-indicator',
  name: '数值指示器',
  category: '数据展示',
  description: '专业的数值展示组件，支持图标、单位、样式自定义等丰富配置',
  
  // 数据需求声明
  dataRequirements: {
    numericValue: {
      type: 'number',
      description: '要显示的数值',
      required: true
    },
    
    valueMetadata: {
      type: 'object',
      description: '数值元数据',
      structure: {
        unit: { type: 'string', description: '数值单位' },
        precision: { type: 'number', description: '小数位数' },
        formatType: { type: 'string', description: '格式化类型' }
      }
    },
    
    deviceInfo: {
      type: 'object',
      description: '设备信息',
      structure: {
        deviceId: { type: 'string', description: '设备ID' },
        metricsId: { type: 'string', description: '指标ID' },
        metricsName: { type: 'string', description: '指标名称' },
        metricsType: { type: 'string', enum: ['telemetry', 'attributes'], description: '指标类型' }
      }
    }
  },
  
  // 配置结构
  config: {
    // 显示配置
    displayConfig: {
      type: 'object',
      label: '显示配置',
      structure: {
        showIcon: {
          type: 'boolean',
          label: '显示图标',
          default: true,
          description: '是否显示指标图标'
        },
        
        iconName: {
          type: 'iconSelect',
          label: '图标选择',
          default: 'numbers',
          condition: { field: 'displayConfig.showIcon', value: true },
          description: '选择要显示的图标'
        },
        
        iconColor: {
          type: 'color',
          label: '图标颜色',
          default: '#1890ff',
          condition: { field: 'displayConfig.showIcon', value: true },
          description: '图标的颜色'
        },
        
        showTitle: {
          type: 'boolean',
          label: '显示标题',
          default: true,
          description: '是否显示指标名称'
        },
        
        showUnit: {
          type: 'boolean',
          label: '显示单位',
          default: true,
          description: '是否显示数值单位'
        },
        
        customUnit: {
          type: 'string',
          label: '自定义单位',
          placeholder: '如：℃、%、kW等',
          condition: { field: 'displayConfig.showUnit', value: true },
          description: '自定义单位文本，留空使用数据源单位'
        }
      }
    },
    
    // 布局配置
    layoutConfig: {
      type: 'object',
      label: '布局配置',
      structure: {
        layoutMode: {
          type: 'select',
          label: '布局模式',
          options: [
            { label: '经典布局', value: 'classic' },
            { label: '居中布局', value: 'centered' },
            { label: '紧凑布局', value: 'compact' },
            { label: '卡片布局', value: 'card' },
            { label: '自定义布局', value: 'custom' }
          ],
          default: 'classic',
          description: '选择组件的整体布局方式'
        },
        
        iconPosition: {
          type: 'select',
          label: '图标位置',
          options: [
            { label: '左上角', value: 'top-left' },
            { label: '右上角', value: 'top-right' },
            { label: '左下角', value: 'bottom-left' },
            { label: '右下角', value: 'bottom-right' },
            { label: '居中顶部', value: 'top-center' },
            { label: '居中底部', value: 'bottom-center' }
          ],
          default: 'bottom-left',
          condition: { field: 'displayConfig.showIcon', value: true }
        },
        
        titlePosition: {
          type: 'select',
          label: '标题位置',
          options: [
            { label: '顶部', value: 'top' },
            { label: '底部', value: 'bottom' },
            { label: '左侧', value: 'left' },
            { label: '右侧', value: 'right' }
          ],
          default: 'top',
          condition: { field: 'displayConfig.showTitle', value: true }
        },
        
        valueAlignment: {
          type: 'select',
          label: '数值对齐',
          options: [
            { label: '左对齐', value: 'left' },
            { label: '居中', value: 'center' },
            { label: '右对齐', value: 'right' }
          ],
          default: 'center'
        }
      }
    },
    
    // 样式配置
    styleConfig: {
      type: 'object',
      label: '样式配置',
      structure: {
        valueSize: {
          type: 'select',
          label: '数值大小',
          options: [
            { label: '超小', value: 'xs' },
            { label: '小', value: 'sm' },
            { label: '中', value: 'md' },
            { label: '大', value: 'lg' },
            { label: '超大', value: 'xl' },
            { label: '自适应', value: 'auto' }
          ],
          default: 'auto',
          description: '数值文字的大小'
        },
        
        valueColor: {
          type: 'select',
          label: '数值颜色',
          options: [
            { label: '默认', value: 'default' },
            { label: '主色', value: 'primary' },
            { label: '成功', value: 'success' },
            { label: '警告', value: 'warning' },
            { label: '危险', value: 'danger' },
            { label: '自定义', value: 'custom' }
          ],
          default: 'default'
        },
        
        customValueColor: {
          type: 'color',
          label: '自定义数值颜色',
          default: '#333333',
          condition: { field: 'styleConfig.valueColor', value: 'custom' }
        },
        
        backgroundColor: {
          type: 'color',
          label: '背景颜色',
          default: 'transparent',
          description: '组件背景颜色'
        },
        
        borderRadius: {
          type: 'number',
          label: '圆角大小(px)',
          default: 8,
          min: 0,
          max: 50,
          description: '组件圆角大小'
        }
      }
    },
    
    // 数值格式化配置
    formatConfig: {
      type: 'object',
      label: '格式化配置',
      structure: {
        formatType: {
          type: 'select',
          label: '格式化类型',
          options: [
            { label: '原始数值', value: 'raw' },
            { label: '千分位', value: 'thousands' },
            { label: '百分比', value: 'percentage' },
            { label: '科学计数法', value: 'scientific' },
            { label: '自定义', value: 'custom' }
          ],
          default: 'raw'
        },
        
        decimalPlaces: {
          type: 'number',
          label: '小数位数',
          default: 2,
          min: 0,
          max: 10,
          condition: { 
            field: 'formatConfig.formatType', 
            operator: 'in', 
            value: ['thousands', 'percentage', 'custom'] 
          }
        },
        
        customFormat: {
          type: 'string',
          label: '自定义格式',
          placeholder: '如：{value}万元',
          condition: { field: 'formatConfig.formatType', value: 'custom' },
          description: '使用 {value} 作为数值占位符'
        },
        
        prefix: {
          type: 'string',
          label: '前缀',
          placeholder: '如：¥、+、-',
          description: '数值前显示的文字'
        },
        
        suffix: {
          type: 'string',
          label: '后缀',
          placeholder: '如：元、个、次',
          description: '数值后显示的文字'
        }
      }
    },
    
    // 高级配置
    advancedConfig: {
      type: 'object',
      label: '高级配置',
      structure: {
        animationEnabled: {
          type: 'boolean',
          label: '启用动画',
          default: true,
          description: '数值变化时的动画效果'
        },
        
        animationType: {
          type: 'select',
          label: '动画类型',
          options: [
            { label: '数字滚动', value: 'counter' },
            { label: '淡入淡出', value: 'fade' },
            { label: '缩放', value: 'scale' },
            { label: '弹跳', value: 'bounce' }
          ],
          default: 'counter',
          condition: { field: 'advancedConfig.animationEnabled', value: true }
        },
        
        thresholds: {
          type: 'array',
          label: '阈值配置',
          structure: {
            min: { type: 'number', description: '最小值' },
            max: { type: 'number', description: '最大值' },
            color: { type: 'color', description: '颜色' },
            label: { type: 'string', description: '标签' }
          },
          default: [],
          description: '根据数值范围设置不同的颜色'
        },
        
        clickAction: {
          type: 'select',
          label: '点击行为',
          options: [
            { label: '无动作', value: 'none' },
            { label: '跳转页面', value: 'navigate' },
            { label: '打开弹窗', value: 'modal' },
            { label: '复制数值', value: 'copy' }
          ],
          default: 'none'
        }
      }
    }
  },
  
  // 默认布局
  defaultLayout: {
    canvas: { width: 200, height: 120 },
    gridstack: { w: 3, h: 2, minW: 2, minH: 1 }
  }
}
```

#### 2. 统一核心组件实现
```vue
<!-- src/card2.1/components/numeric-indicator/NumericIndicator.vue -->
<script setup lang="ts">
/**
 * 数值指示器组件
 * 合并原demo和digit-indicator组件功能
 */
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { NCard, NIcon, useMessage } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/store/modules/theme'
import { useNumericFormatter } from './hooks/useNumericFormatter'
import { useIconManager } from './hooks/useIconManager'
import { useValueAnimation } from './hooks/useValueAnimation'

interface NumericIndicatorConfig {
  displayConfig?: {
    showIcon?: boolean
    iconName?: string
    iconColor?: string
    showTitle?: boolean
    showUnit?: boolean
    customUnit?: string
  }
  layoutConfig?: {
    layoutMode?: 'classic' | 'centered' | 'compact' | 'card' | 'custom'
    iconPosition?: string
    titlePosition?: string
    valueAlignment?: 'left' | 'center' | 'right'
  }
  styleConfig?: {
    valueSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'auto'
    valueColor?: string
    customValueColor?: string
    backgroundColor?: string
    borderRadius?: number
  }
  formatConfig?: {
    formatType?: 'raw' | 'thousands' | 'percentage' | 'scientific' | 'custom'
    decimalPlaces?: number
    customFormat?: string
    prefix?: string
    suffix?: string
  }
  advancedConfig?: {
    animationEnabled?: boolean
    animationType?: string
    thresholds?: Array<{
      min: number
      max: number
      color: string
      label: string
    }>
    clickAction?: string
  }
}

interface Props {
  config: NumericIndicatorConfig
  data?: {
    numericValue?: number
    valueMetadata?: {
      unit?: string
      precision?: number
      formatType?: string
    }
    deviceInfo?: {
      deviceId: string
      metricsId: string
      metricsName: string
      metricsType: string
    }
  }
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const { t } = useI18n()
const themeStore = useThemeStore()
const message = useMessage()

// 组件状态
const containerRef = ref<HTMLElement>()
const currentValue = ref(0)
const displayValue = ref('0')
const resizeObserver = ref<ResizeObserver>()

// Hooks
const { formatValue } = useNumericFormatter()
const { getIconComponent } = useIconManager()
const { animateValue } = useValueAnimation()

// 配置计算属性
const displayConfig = computed(() => ({
  showIcon: true,
  iconName: 'numbers',
  iconColor: '#1890ff',
  showTitle: true,
  showUnit: true,
  customUnit: '',
  ...props.config.displayConfig
}))

const layoutConfig = computed(() => ({
  layoutMode: 'classic' as const,
  iconPosition: 'bottom-left',
  titlePosition: 'top',
  valueAlignment: 'center' as const,
  ...props.config.layoutConfig
}))

const styleConfig = computed(() => ({
  valueSize: 'auto' as const,
  valueColor: 'default',
  customValueColor: '#333333',
  backgroundColor: 'transparent',
  borderRadius: 8,
  ...props.config.styleConfig
}))

const formatConfig = computed(() => ({
  formatType: 'raw' as const,
  decimalPlaces: 2,
  customFormat: '',
  prefix: '',
  suffix: '',
  ...props.config.formatConfig
}))

const advancedConfig = computed(() => ({
  animationEnabled: true,
  animationType: 'counter',
  thresholds: [],
  clickAction: 'none',
  ...props.config.advancedConfig
}))

// 数值处理
watch(() => props.data?.numericValue, (newValue) => {
  if (newValue !== undefined && newValue !== currentValue.value) {
    if (advancedConfig.value.animationEnabled) {
      animateValue(currentValue.value, newValue, (val) => {
        currentValue.value = val
        updateDisplayValue()
      })
    } else {
      currentValue.value = newValue
      updateDisplayValue()
    }
  }
}, { immediate: true })

// 更新显示值
const updateDisplayValue = () => {
  const formatted = formatValue(currentValue.value, {
    type: formatConfig.value.formatType,
    decimals: formatConfig.value.decimalPlaces,
    custom: formatConfig.value.customFormat,
    prefix: formatConfig.value.prefix,
    suffix: formatConfig.value.suffix
  })
  
  displayValue.value = formatted
}

// 获取实际单位
const actualUnit = computed(() => {
  return displayConfig.value.customUnit || 
         props.data?.valueMetadata?.unit || 
         ''
})

// 指标名称
const metricsName = computed(() => 
  props.data?.deviceInfo?.metricsName || t('numericIndicator.defaultTitle')
)

// 根据阈值获取颜色
const getValueColor = (): string => {
  const thresholds = advancedConfig.value.thresholds
  if (thresholds && thresholds.length > 0) {
    const value = currentValue.value
    const threshold = thresholds.find(t => value >= t.min && value <= t.max)
    if (threshold) return threshold.color
  }
  
  if (styleConfig.value.valueColor === 'custom') {
    return styleConfig.value.customValueColor
  }
  
  const colorMap = {
    default: 'var(--text-color)',
    primary: 'var(--primary-color)',
    success: 'var(--success-color)',
    warning: 'var(--warning-color)',
    danger: 'var(--error-color)'
  }
  
  return colorMap[styleConfig.value.valueColor] || colorMap.default
}

// 响应式字体大小计算
const computedFontSize = computed(() => {
  if (styleConfig.value.valueSize !== 'auto') {
    const sizeMap = {
      xs: '14px',
      sm: '18px',
      md: '24px',
      lg: '32px',
      xl: '40px'
    }
    return sizeMap[styleConfig.value.valueSize] || '24px'
  }
  
  // 自适应逻辑优化
  if (!containerRef.value) return '24px'
  
  const container = containerRef.value
  const width = container.clientWidth
  const height = container.clientHeight
  const area = width * height
  
  // 基于容器面积和文本长度的智能计算
  const textLength = displayValue.value.length + (actualUnit.value.length * 0.5)
  const baseSize = Math.sqrt(area / (textLength * 20))
  
  return `${Math.max(12, Math.min(48, baseSize))}px`
})

// 布局样式计算
const containerStyle = computed(() => ({
  backgroundColor: styleConfig.value.backgroundColor,
  borderRadius: `${styleConfig.value.borderRadius}px`,
  color: getValueColor()
}))

const layoutClass = computed(() => [
  'numeric-indicator',
  `layout-${layoutConfig.value.layoutMode}`,
  `icon-${layoutConfig.value.iconPosition}`,
  `title-${layoutConfig.value.titlePosition}`,
  `align-${layoutConfig.value.valueAlignment}`
])

// 点击处理
const handleClick = () => {
  switch (advancedConfig.value.clickAction) {
    case 'copy':
      navigator.clipboard.writeText(displayValue.value)
      message.success(t('numericIndicator.copied'))
      break
    case 'navigate':
      // 实现页面跳转逻辑
      break
    case 'modal':
      // 实现弹窗逻辑
      break
  }
}

// ResizeObserver 处理
const setupResizeObserver = () => {
  if (!containerRef.value) return
  
  resizeObserver.value = new ResizeObserver(() => {
    // 触发字体大小重新计算
    updateDisplayValue()
  })
  
  resizeObserver.value.observe(containerRef.value)
}

// 生命周期
onMounted(() => {
  setupResizeObserver()
  updateDisplayValue()
})

onBeforeUnmount(() => {
  resizeObserver.value?.disconnect()
})

// 暴露组件接口
defineExpose({
  getValue: () => currentValue.value,
  getDisplayValue: () => displayValue.value,
  updateValue: (value: number) => {
    currentValue.value = value
    updateDisplayValue()
  }
})
</script>

<template>
  <div 
    ref="containerRef"
    :class="layoutClass"
    :style="containerStyle"
    @click="handleClick"
  >
    <!-- 标题区域 -->
    <div 
      v-if="displayConfig.showTitle"
      class="indicator-title"
    >
      {{ metricsName }}
    </div>
    
    <!-- 图标区域 -->
    <div 
      v-if="displayConfig.showIcon"
      class="indicator-icon"
      :style="{ color: displayConfig.iconColor }"
    >
      <NIcon size="24">
        <component :is="getIconComponent(displayConfig.iconName)" />
      </NIcon>
    </div>
    
    <!-- 数值区域 -->
    <div class="indicator-value-container">
      <div 
        class="indicator-value"
        :style="{ 
          fontSize: computedFontSize,
          color: getValueColor()
        }"
      >
        {{ displayValue }}
      </div>
      
      <!-- 单位区域 -->
      <div 
        v-if="displayConfig.showUnit && actualUnit"
        class="indicator-unit"
      >
        {{ actualUnit }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.numeric-indicator {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  padding: var(--card-padding, 12px);
  box-sizing: border-box;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: var(--card-color);
  border-radius: var(--border-radius);
}

.numeric-indicator:hover {
  background-color: var(--hover-color);
}

/* 布局模式样式 */
.layout-classic {
  flex-direction: column;
}

.layout-centered {
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.layout-compact {
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.layout-card {
  flex-direction: column;
  background-color: var(--card-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 16px;
}

/* 标题样式 */
.indicator-title {
  font-size: 12px;
  color: var(--text-color-2);
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.title-top .indicator-title {
  order: 1;
  margin-bottom: 4px;
}

.title-bottom .indicator-title {
  order: 3;
  margin-top: 4px;
}

.title-left .indicator-title {
  position: absolute;
  left: 0;
  top: 50%;
  transform: rotate(-90deg) translateX(-50%);
  transform-origin: center;
}

.title-right .indicator-title {
  position: absolute;
  right: 0;
  top: 50%;
  transform: rotate(90deg) translateX(50%);
  transform-origin: center;
}

/* 图标样式 */
.indicator-icon {
  position: absolute;
  transition: color 0.3s ease;
}

.icon-top-left .indicator-icon {
  top: 12px;
  left: 12px;
}

.icon-top-right .indicator-icon {
  top: 12px;
  right: 12px;
}

.icon-bottom-left .indicator-icon {
  bottom: 12px;
  left: 12px;
}

.icon-bottom-right .indicator-icon {
  bottom: 12px;
  right: 12px;
}

.icon-top-center .indicator-icon {
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
}

.icon-bottom-center .indicator-icon {
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
}

/* 数值容器样式 */
.indicator-value-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  order: 2;
}

.indicator-value {
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  transition: all 0.3s ease;
}

.indicator-unit {
  font-size: 0.7em;
  margin-left: 4px;
  color: var(--text-color-2);
  align-self: flex-end;
  line-height: 1;
}

/* 对齐方式 */
.align-left .indicator-value-container {
  justify-content: flex-start;
}

.align-right .indicator-value-container {
  justify-content: flex-end;
}

/* 紧凑布局特殊样式 */
.layout-compact .indicator-title {
  flex-shrink: 0;
  margin-bottom: 0;
}

.layout-compact .indicator-value-container {
  flex: 1;
  justify-content: flex-end;
}

.layout-compact .indicator-icon {
  position: static;
  margin-right: 8px;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .numeric-indicator {
    padding: 8px;
  }
  
  .indicator-title {
    font-size: 10px;
  }
  
  .indicator-icon {
    display: none;
  }
}

/* 暗色主题适配 */
[data-theme="dark"] .numeric-indicator {
  background-color: var(--card-color-dark);
  border-color: var(--border-color-dark);
}

[data-theme="dark"] .numeric-indicator:hover {
  background-color: var(--hover-color-dark);
}
</style>
```

## 💻 具体实现步骤

### Phase 1: 组件合并分析（第1周）

1. **差异对比完成**
- ✅ 确认demo与digit-indicator组件90%代码重复
- ✅ 主要差异在布局和样式处理
- ✅ 数据获取和处理逻辑完全相同

2. **合并策略制定**
- 创建统一 `NumericIndicator` 组件
- 通过 `layoutMode` 配置区分布局风格
- 保持所有现有功能

### Phase 2: 统一组件开发（第2周）

1. **基础功能迁移**
```bash
src/card2.1/components/numeric-indicator/
├── index.ts                          # 组件定义
├── NumericIndicator.vue              # 合并后的核心组件
├── ConfigPanel.vue                   # 统一配置面板
├── hooks/
│   ├── useNumericFormatter.ts        # 数值格式化 hook
│   ├── useIconManager.ts             # 图标管理 hook
│   └── useValueAnimation.ts          # 数值动画 hook
└── utils/
    ├── layout-calculator.ts          # 布局计算工具
    └── responsive-font-size.ts       # 响应式字体计算
```

2. **功能整合和增强**
- 合并两个组件的所有功能
- 实现多种布局模式切换
- 新增动画和交互功能

### Phase 3: 配置系统完善（第3周）

1. **可视化配置界面**
- 布局模式可视化选择
- 图标和颜色实时预览
- 格式化选项动态配置

2. **样式系统优化**
- 主题系统深度集成
- 响应式字体算法优化
- 多种预设样式模板

### Phase 4: 测试和优化（第4周）

1. **功能完整性验证**
- 原demo组件功能完全兼容
- 原digit-indicator组件功能完全兼容
- 新增功能稳定性测试

2. **性能优化验证**
- 字体自适应算法优化效果
- 动画性能测试
- 大量实例渲染性能

## ✅ 测试验证方案

### 功能兼容性测试
- [ ] demo组件原有显示效果完全保持
- [ ] digit-indicator组件原有功能正常
- [ ] 数据获取和WebSocket更新功能
- [ ] 图标显示和颜色配置
- [ ] 响应式字体调整功能

### 新增功能测试
- [ ] 多种布局模式切换
- [ ] 数值格式化选项
- [ ] 动画效果和交互功能
- [ ] 阈值颜色变化
- [ ] 点击行为配置

### 性能优化测试
- [ ] 字体计算算法准确性
- [ ] 动画流畅度和性能
- [ ] ResizeObserver 优化效果
- [ ] 大量组件实例性能

## 📈 迁移收益

### 代码维护收益
- **代码减少**: 185行×2 → 约250行，减少约32%
- **维护工作量**: 双重维护 → 统一维护，减少50%工作量
- **功能统一**: 分散功能 → 统一数值显示解决方案

### 功能增强收益
- **布局选择**: 固定布局 → 5种布局模式可选
- **格式化选项**: 基础显示 → 丰富的数值格式化
- **交互能力**: 静态显示 → 动画、点击等交互功能

### 用户体验收益
- **视觉效果**: 固定样式 → 多种预设和自定义样式
- **响应适配**: 简单自适应 → 智能响应式设计
- **主题支持**: 基础主题 → 完整明暗主题系统

### 开发效率收益
- **组件选择**: 需要选择demo或digit-indicator → 一个组件满足所有需求
- **配置便利**: 分散配置 → 统一可视化配置界面
- **扩展性**: 功能固化 → 插件化架构易于扩展

---

**总结**: Demo组件通过与digit-indicator组件合并为统一的NumericIndicator组件，将显著减少代码重复，提供更丰富的布局和样式选项，同时保持所有原有功能的完整性，为数值展示提供更专业和灵活的解决方案。