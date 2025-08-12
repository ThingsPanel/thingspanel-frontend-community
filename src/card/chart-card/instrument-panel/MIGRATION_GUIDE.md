# Instrument Panel 组件迁移指南

## 📋 组件概述

**instrument-panel** 是一个基于 ECharts 仪表盘的数据可视化组件，用于以仪表盘形式展示单个设备指标的实时数值。支持自定义最值范围、单位显示和动态颜色变化。

## 🔍 技术架构分析

### 当前实现结构
```
instrument-panel/
├── index.ts            # 组件定义，国际化问题
├── component.vue       # 核心仪表盘组件（207 行）
├── card-config.vue     # 配置界面（基础配置）
└── poster.png          # 组件预览图
```

### 核心功能特性
1. **仪表盘可视化**: 基于 ECharts Gauge 图表
2. **动态范围**: 支持自定义最小值和最大值
3. **单位显示**: 自动获取或手动配置单位
4. **颜色渐变**: 根据数值比例动态调整颜色
5. **自适应布局**: 根据容器大小自动调整字体和布局
6. **实时更新**: 支持数据实时更新和 `updateData` 方法

### 数据流程
```
设备数据源 → API 获取当前值 → 计算比例 → 仪表盘渲染 → 实时更新
```

### 视觉设计
- **仪表盘形状**: 半圆形（180° 到 -45°）
- **进度显示**: 动态颜色填充，比例式显示
- **数值显示**: 中央大字号数值 + 单位
- **标题显示**: 底部显示指标名称

## ❗ 现有问题识别

### 1. 🌐 **国际化问题**
```typescript
// index.ts 中使用硬编码的翻译 key
title: 'dashboard_panel.cardName.instrumentPanel'  // ❌ 应该使用 $t()
```
**影响**: 国际化系统集成不完整。

### 2. 🎨 **主题系统集成不足**
```css
/* 硬编码颜色和样式 */
const valueColor = '#105ba8'  // ❌ 硬编码主色
.title { font-size: 16px; }   // ❌ 固定字体大小
```
**影响**: 不支持明暗主题切换，无法适配用户主题偏好。

### 3. ⚡ **性能问题**
```javascript
// 每次 watch 都重新计算整个 options 对象
const handleDataChange = () => {
  const adjustedOptions = chartOptions.value  // 引用修改，可能导致响应式问题
  // ... 直接修改 options
}
```
**影响**: 频繁的对象修改可能导致性能问题。

### 4. 🏗️ **代码结构问题**
```javascript
// 复杂的 watch 嵌套和重复逻辑
watch(() => detail.value, () => { handleDataChange() })
watch(() => props?.card?.config, () => { handleDataChange() }, { deep: true })
```
**影响**: 代码重复，维护困难。

### 5. 📱 **响应式设计不完善**
```javascript
// 字体大小计算逻辑简单
adjustedOptions.series[0].detail.fontSize = containerWidth / 10
adjustedOptions.series[0].axisLabel.fontSize = containerWidth / 16
```
**影响**: 在极端尺寸下可能显示效果不佳。

### 6. 🔧 **配置选项有限**
- 无法自定义仪表盘颜色主题
- 无法调整仪表盘形状和角度
- 无法配置显示精度和格式

## 🎯 Card 2.1 迁移策略

### 组件重新设计

#### 1. 组件定义
```typescript
// src/card2.1/components/instrument-panel/index.ts
import type { ComponentDefinition } from '@/card2.1/core/component-definition'

export const InstrumentPanelDefinition: ComponentDefinition = {
  type: 'instrument-panel',
  name: '仪表盘',
  category: '数据可视化',
  description: '以仪表盘形式显示单个数值指标，支持范围配置和实时更新',
  
  // 数据需求声明
  dataRequirements: {
    value: {
      type: 'number',
      description: '要显示的数值',
      required: true
    },
    
    unit: {
      type: 'string',
      description: '数值单位',
      required: false
    },
    
    metricsName: {
      type: 'string',
      description: '指标名称',
      required: false
    }
  },
  
  // 配置结构
  config: {
    // 数值范围配置
    min: {
      type: 'number',
      label: '最小值',
      default: 0,
      description: '仪表盘显示的最小值'
    },
    
    max: {
      type: 'number',
      label: '最大值',
      default: 100,
      description: '仪表盘显示的最大值'
    },
    
    unit: {
      type: 'string',
      label: '单位',
      default: '',
      placeholder: '温度: °C, 湿度: %',
      description: '数值单位，为空时使用数据源提供的单位'
    },
    
    // 显示精度配置
    precision: {
      type: 'number',
      label: '小数位数',
      default: 1,
      min: 0,
      max: 3,
      description: '数值显示的小数位数'
    },
    
    // 外观配置
    gaugeType: {
      type: 'select',
      label: '仪表盘类型',
      options: [
        { label: '半圆形', value: 'semicircle' },
        { label: '3/4圆形', value: 'three-quarter' },
        { label: '完整圆形', value: 'circle' }
      ],
      default: 'semicircle'
    },
    
    // 颜色主题配置
    colorScheme: {
      type: 'select',
      label: '颜色方案',
      options: [
        { label: '蓝色主题', value: 'blue' },
        { label: '绿色主题', value: 'green' },
        { label: '橙色主题', value: 'orange' },
        { label: '红色主题', value: 'red' },
        { label: '紫色主题', value: 'purple' },
        { label: '自定义', value: 'custom' }
      ],
      default: 'blue'
    },
    
    customColor: {
      type: 'color',
      label: '自定义颜色',
      default: '#105ba8',
      condition: { field: 'colorScheme', value: 'custom' }
    },
    
    // 显示配置
    showTitle: {
      type: 'boolean',
      label: '显示标题',
      default: true
    },
    
    showAxisLabels: {
      type: 'boolean',
      label: '显示刻度标签',
      default: true
    },
    
    // 危险区域配置
    warningZones: {
      type: 'array',
      label: '预警区域',
      description: '配置数值预警区域的颜色提示',
      structure: {
        min: { type: 'number', description: '区域最小值' },
        max: { type: 'number', description: '区域最大值' },
        color: { type: 'color', description: '区域颜色' },
        label: { type: 'string', description: '区域标签' }
      },
      default: []
    }
  },
  
  // 默认布局
  defaultLayout: {
    canvas: { width: 300, height: 250 },
    gridstack: { w: 5, h: 3, minW: 3, minH: 2 }
  }
}
```

#### 2. 核心组件实现
```vue
<!-- src/card2.1/components/instrument-panel/InstrumentPanel.vue -->
<script setup lang="ts">
/**
 * 仪表盘组件
 * 基于 ECharts Gauge 图表，支持多种配置和主题适配
 */
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { use } from 'echarts/core'
import { GaugeChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import type { EChartsOption } from 'echarts'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/store/modules/theme'
import { useCard2Integration } from '@/card2.1/hooks/useCard2Integration'

// 注册 ECharts 组件
use([GaugeChart, CanvasRenderer])

interface InstrumentPanelConfig {
  min?: number
  max?: number
  unit?: string
  precision?: number
  gaugeType?: 'semicircle' | 'three-quarter' | 'circle'
  colorScheme?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'custom'
  customColor?: string
  showTitle?: boolean
  showAxisLabels?: boolean
  warningZones?: Array<{
    min: number
    max: number
    color: string
    label: string
  }>
}

interface Props {
  config: InstrumentPanelConfig
  data?: {
    value?: number
    unit?: string
    metricsName?: string
  }
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const { t } = useI18n()
const themeStore = useThemeStore()
const chartRef = ref()
const containerRef = ref()

// 颜色方案映射
const colorSchemes = {
  blue: '#105ba8',
  green: '#52c41a',
  orange: '#fa8c16', 
  red: '#f5222d',
  purple: '#722ed1'
}

// 仪表盘角度配置
const angleConfigs = {
  semicircle: { startAngle: 180, endAngle: 0 },
  'three-quarter': { startAngle: 225, endAngle: -45 },
  circle: { startAngle: 90, endAngle: -270 }
}

// 当前数值
const currentValue = computed(() => props.data?.value ?? 0)

// 显示单位
const displayUnit = computed(() => 
  props.config.unit || props.data?.unit || ''
)

// 指标标题
const metricsTitle = computed(() => 
  props.data?.metricsName || t('card.instrumentPanel')
)

// 主色调
const primaryColor = computed(() => {
  if (props.config.colorScheme === 'custom') {
    return props.config.customColor || '#105ba8'
  }
  return colorSchemes[props.config.colorScheme || 'blue']
})

// 数值格式化
const formatValue = (value: number) => {
  const precision = props.config.precision ?? 1
  return value.toFixed(precision)
}

// 计算数值比例
const valueRatio = computed(() => {
  const { min = 0, max = 100 } = props.config
  const value = currentValue.value
  
  if (value >= max) return 1
  if (value <= min) return 0
  return (value - min) / (max - min)
})

// 获取当前数值的危险区域颜色
const getCurrentZoneColor = computed(() => {
  const value = currentValue.value
  const zones = props.config.warningZones || []
  
  for (const zone of zones) {
    if (value >= zone.min && value <= zone.max) {
      return zone.color
    }
  }
  
  return primaryColor.value
})

// ECharts 配置
const chartOptions = computed((): EChartsOption => {
  const { min = 0, max = 100, gaugeType = 'semicircle', showAxisLabels = true } = props.config
  const angleConfig = angleConfigs[gaugeType]
  const color = getCurrentZoneColor.value
  
  return {
    series: [
      {
        type: 'gauge',
        startAngle: angleConfig.startAngle,
        endAngle: angleConfig.endAngle,
        min,
        max,
        radius: '85%',
        center: ['50%', gaugeType === 'circle' ? '50%' : '75%'],
        
        // 轴线样式
        axisLine: {
          lineStyle: {
            width: 20,
            color: [
              [valueRatio.value, color],
              [1, themeStore.darkMode ? '#333333' : '#e6e6e6']
            ]
          }
        },
        
        // 刻度样式
        axisTick: { 
          show: showAxisLabels,
          length: 12,
          lineStyle: {
            color: themeStore.darkMode ? '#666' : '#999'
          }
        },
        
        // 刻度标签
        axisLabel: {
          show: showAxisLabels,
          fontSize: 12,
          color: themeStore.darkMode ? '#ccc' : '#666',
          distance: 25,
          formatter: (value: number) => {
            // 只显示最小值和最大值
            return value === min || value === max ? value.toString() : ''
          }
        },
        
        // 分割线
        splitLine: { 
          show: false 
        },
        
        // 指针
        pointer: { 
          show: false 
        },
        
        // 中央数值显示
        detail: {
          show: true,
          offsetCenter: [0, gaugeType === 'circle' ? '0%' : '-30%'],
          fontSize: 24,
          fontWeight: 'bold',
          color: themeStore.darkMode ? '#fff' : '#333',
          formatter: (value: number) => {
            const formattedValue = formatValue(value)
            const unit = displayUnit.value
            return unit ? `${formattedValue}\n${unit}` : formattedValue
          }
        },
        
        // 数据
        data: [
          {
            value: currentValue.value,
            detail: {
              lineHeight: 30
            }
          }
        ]
      }
    ]
  }
})

// 处理容器尺寸变化
const resizeObserver = ref<ResizeObserver>()

const handleResize = () => {
  if (chartRef.value) {
    chartRef.value.resize()
  }
}

// 暴露更新接口
defineExpose({
  updateData: (newData: any) => {
    // Card 2.1 数据绑定系统会自动处理数据更新
  },
  
  refresh: () => {
    handleResize()
  }
})

onMounted(() => {
  // 初始化尺寸监听
  resizeObserver.value = new ResizeObserver(handleResize)
  if (containerRef.value) {
    resizeObserver.value.observe(containerRef.value)
  }
})

onUnmounted(() => {
  if (resizeObserver.value) {
    resizeObserver.value.disconnect()
  }
})
</script>

<template>
  <div ref="containerRef" class="instrument-panel">
    <div class="chart-container">
      <VChart
        ref="chartRef"
        :option="chartOptions"
        :loading="loading"
        :theme="themeStore.darkMode ? 'dark' : 'light'"
        autoresize
        class="gauge-chart"
      />
    </div>
    
    <div v-if="config.showTitle" class="title-area">
      <h3 class="metrics-title">{{ metricsTitle }}</h3>
    </div>
    
    <!-- 危险区域图例 -->
    <div v-if="config.warningZones?.length" class="legend-area">
      <div 
        v-for="zone in config.warningZones"
        :key="`${zone.min}-${zone.max}`"
        class="legend-item"
      >
        <div 
          class="legend-color" 
          :style="{ backgroundColor: zone.color }"
        ></div>
        <span class="legend-label">
          {{ zone.label }} ({{ zone.min }}-{{ zone.max }})
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.instrument-panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: var(--card-padding);
  
  background-color: var(--card-color);
  border-radius: var(--border-radius);
  color: var(--text-color);
}

.chart-container {
  flex: 1;
  position: relative;
  min-height: 150px;
}

.gauge-chart {
  width: 100%;
  height: 100%;
}

.title-area {
  text-align: center;
  padding: 8px 0;
  border-top: 1px solid var(--divider-color);
}

.metrics-title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--text-color);
}

.legend-area {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 0;
  border-top: 1px solid var(--divider-color);
  font-size: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-label {
  color: var(--text-color-2);
}

/* 暗色主题适配 */
[data-theme="dark"] .instrument-panel {
  background-color: var(--card-color-dark);
  color: var(--text-color-dark);
}

/* 响应式设计 */
@media (max-width: 480px) {
  .instrument-panel {
    padding: 8px;
  }
  
  .metrics-title {
    font-size: 14px;
  }
  
  .legend-area {
    font-size: 10px;
  }
}
</style>
```

#### 3. 配置面板实现
```vue
<!-- src/card2.1/components/instrument-panel/ConfigPanel.vue -->
<script setup lang="ts">
/**
 * 仪表盘配置面板
 * 提供完整的仪表盘外观和行为配置选项
 */
import { computed } from 'vue'
import {
  NForm,
  NFormItem,
  NInputNumber,
  NInput,
  NSelect,
  NSwitch,
  NColorPicker,
  NDynamicInput,
  NCard
} from 'naive-ui'
import { useI18n } from 'vue-i18n'

interface Props {
  config: InstrumentPanelConfig
}

interface Emits {
  (e: 'update:config', config: InstrumentPanelConfig): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useI18n()

// 仪表盘类型选项
const gaugeTypeOptions = [
  { label: '半圆形', value: 'semicircle' },
  { label: '3/4圆形', value: 'three-quarter' },
  { label: '完整圆形', value: 'circle' }
]

// 颜色方案选项
const colorSchemeOptions = [
  { label: '蓝色主题', value: 'blue' },
  { label: '绿色主题', value: 'green' },
  { label: '橙色主题', value: 'orange' },
  { label: '红色主题', value: 'red' },
  { label: '紫色主题', value: 'purple' },
  { label: '自定义颜色', value: 'custom' }
]

// 是否显示自定义颜色选择器
const showCustomColor = computed(() => props.config.colorScheme === 'custom')

// 更新配置
const updateConfig = (key: keyof InstrumentPanelConfig, value: any) => {
  emit('update:config', { ...props.config, [key]: value })
}
</script>

<template>
  <div class="instrument-config">
    <NForm label-placement="left" label-width="120">
      <!-- 数值范围配置 -->
      <NCard title="数值范围" size="small" class="config-section">
        <NFormItem label="最小值">
          <NInputNumber
            :value="config.min"
            placeholder="0"
            @update:value="(value) => updateConfig('min', value)"
          />
        </NFormItem>
        
        <NFormItem label="最大值">
          <NInputNumber
            :value="config.max"
            placeholder="100"
            @update:value="(value) => updateConfig('max', value)"
          />
        </NFormItem>
        
        <NFormItem label="单位">
          <NInput
            :value="config.unit"
            placeholder="°C, %, kg/h 等"
            @update:value="(value) => updateConfig('unit', value)"
          />
        </NFormItem>
        
        <NFormItem label="小数位数">
          <NInputNumber
            :value="config.precision"
            :min="0"
            :max="3"
            @update:value="(value) => updateConfig('precision', value)"
          />
        </NFormItem>
      </NCard>
      
      <!-- 外观配置 -->
      <NCard title="外观设置" size="small" class="config-section">
        <NFormItem label="仪表盘类型">
          <NSelect
            :value="config.gaugeType"
            :options="gaugeTypeOptions"
            @update:value="(value) => updateConfig('gaugeType', value)"
          />
        </NFormItem>
        
        <NFormItem label="颜色方案">
          <NSelect
            :value="config.colorScheme"
            :options="colorSchemeOptions"
            @update:value="(value) => updateConfig('colorScheme', value)"
          />
        </NFormItem>
        
        <NFormItem v-if="showCustomColor" label="自定义颜色">
          <NColorPicker
            :value="config.customColor"
            @update:value="(value) => updateConfig('customColor', value)"
          />
        </NFormItem>
      </NCard>
      
      <!-- 显示选项 -->
      <NCard title="显示选项" size="small" class="config-section">
        <NFormItem label="显示标题">
          <NSwitch
            :value="config.showTitle"
            @update:value="(value) => updateConfig('showTitle', value)"
          />
        </NFormItem>
        
        <NFormItem label="显示刻度标签">
          <NSwitch
            :value="config.showAxisLabels"
            @update:value="(value) => updateConfig('showAxisLabels', value)"
          />
        </NFormItem>
      </NCard>
      
      <!-- 预警区域配置 -->
      <NCard title="预警区域" size="small" class="config-section">
        <NDynamicInput
          :value="config.warningZones"
          @update:value="(value) => updateConfig('warningZones', value)"
        >
          <template #create-button-default>
            添加预警区域
          </template>
          
          <template #default="{ value: zone, index }">
            <NCard size="small" class="zone-config">
              <NFormItem label="区域名称">
                <NInput
                  :value="zone.label"
                  placeholder="危险区域"
                  @update:value="(val) => zone.label = val"
                />
              </NFormItem>
              
              <div class="range-inputs">
                <NFormItem label="最小值">
                  <NInputNumber
                    :value="zone.min"
                    @update:value="(val) => zone.min = val"
                  />
                </NFormItem>
                
                <NFormItem label="最大值">
                  <NInputNumber
                    :value="zone.max"
                    @update:value="(val) => zone.max = val"
                  />
                </NFormItem>
              </div>
              
              <NFormItem label="颜色">
                <NColorPicker
                  :value="zone.color"
                  @update:value="(val) => zone.color = val"
                />
              </NFormItem>
            </NCard>
          </template>
        </NDynamicInput>
      </NCard>
    </NForm>
  </div>
</template>

<style scoped>
.instrument-config {
  padding: var(--card-padding);
  max-height: 600px;
  overflow-y: auto;
}

.config-section {
  margin-bottom: 16px;
}

.zone-config {
  background-color: var(--body-color);
}

.range-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

/* 滚动条优化 */
.instrument-config::-webkit-scrollbar {
  width: 6px;
}

.instrument-config::-webkit-scrollbar-thumb {
  background-color: var(--scrollbar-color);
  border-radius: 3px;
}
</style>
```

## 💻 具体实现步骤

### Phase 1: 基础重构（第1周）

1. **创建组件结构**
```bash
src/card2.1/components/instrument-panel/
├── index.ts                 # 组件定义
├── InstrumentPanel.vue      # 核心仪表盘组件  
├── ConfigPanel.vue          # 配置面板
├── types.ts                 # 类型定义
└── hooks/
    └── useGaugeConfig.ts    # 仪表盘配置逻辑
```

2. **修复国际化问题**
- 使用 `$t()` 替代硬编码翻译key
- 添加缺失的翻译项

3. **主题系统集成**
- 使用 CSS 变量替代硬编码颜色
- 支持明暗主题切换

### Phase 2: 功能增强（第2周）

1. **扩展配置选项**
- 多种仪表盘形状
- 颜色主题方案
- 显示精度控制

2. **危险区域功能**
- 预警区域配置
- 动态颜色提示
- 区域图例显示

### Phase 3: 性能和测试（第3周）

1. **性能优化**
- 响应式数据处理优化
- 图表渲染性能提升
- 内存使用监控

2. **测试验证**
- 配置项功能测试
- 数据更新测试
- 响应式布局测试

## ✅ 测试验证方案

### 功能测试
- [ ] 仪表盘正确显示数值和单位
- [ ] 数值范围配置生效
- [ ] 颜色主题切换正常
- [ ] 危险区域颜色提示正确
- [ ] 实时数据更新响应

### 主题测试
- [ ] 明暗主题切换适配
- [ ] 自定义颜色配置生效
- [ ] CSS变量正确应用

### 响应式测试
- [ ] 不同容器尺寸适配
- [ ] 字体大小自动调整
- [ ] 移动端显示正常

## 📈 迁移收益

### 功能增强
- **配置丰富**: 基础配置 → 完整配置系统（仪表盘类型、颜色方案、预警区域）
- **主题适配**: 固定主题 → 完整明暗主题系统
- **视觉效果**: 单一样式 → 多种仪表盘类型和颜色方案

### 代码质量
- **国际化**: 硬编码文本 → 完整国际化支持
- **类型安全**: 基础类型 → 完整 TypeScript 类型系统  
- **模块化**: 单文件实现 → 模块化架构

### 用户体验
- **配置便捷**: 有限配置 → 直观的可视化配置界面
- **视觉反馈**: 简单显示 → 预警区域和动态颜色提示
- **响应式**: 固定布局 → 自适应布局和响应式设计

---

**总结**: 仪表盘组件通过 Card 2.1 重构，将获得更强大的配置能力、更好的主题集成和预警功能，显著提升数据可视化的专业性和易用性。