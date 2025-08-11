# Chart 组件合并迁移方案 (Bar + Curve)

## 📋 概述

**bar** 和 **curve** 组件功能高度相似，**代码重复率达到 95%**，是理想的合并候选组件。两者都基于 ECharts 实现数据可视化，具有相同的数据源配置、时间范围支持、聚合功能等。

## 🔍 技术架构分析

### 当前架构
```
chart-card/
├── bar/
│   ├── index.ts          # 组件定义（几乎相同）
│   ├── component.vue     # 包装组件（99% 相同）
│   ├── card-config.vue   # 配置界面（90% 相同，缺少曲线宽度）
│   ├── theme.ts          # 主题配色（曲线版本缺少 line 颜色）
│   └── modules/bar-chart.vue  # 核心图表（95% 相同）
└── curve/
    ├── index.ts          # 组件定义（几乎相同）
    ├── component.vue     # 包装组件（99% 相同，多了 curveWidth）
    ├── card-config.vue   # 配置界面（90% 相同，有曲线宽度设置）
    ├── theme.ts          # 主题配色（柱状版本多了 line 颜色）
    └── modules/line-chart.vue  # 核心图表（95% 相同）
```

### 核心差异分析
| 特性 | Bar 组件 | Curve 组件 | 差异说明 |
|------|----------|------------|----------|
| **图表类型** | `type: 'bar'` | `type: 'line'` | ECharts 配置差异 |
| **曲线宽度** | ❌ 不支持 | ✅ `curveWidth` 参数 | 仅影响线条样式 |
| **主题配色** | 缺少 `line` 颜色 | 包含完整颜色配置 | 主题结构差异 |
| **配置界面** | 无宽度设置 | 有曲线宽度设置 | 配置项差异 |
| **其他功能** | 100% 相同 | 100% 相同 | 数据源、时间、聚合等 |

## ❗ 现有问题识别

### 1. 代码重复问题
- **核心逻辑 95% 重复**：数据处理、API 调用、事件监听等
- **配置结构 90% 重复**：数据源、时间范围、聚合等配置
- **样式系统重复**：主题色彩、响应式布局等

### 2. 主题系统不一致
```typescript
// Bar 主题（缺少 line 颜色）
{ name: 'Sky Reflection', top: '#2563EB', bottom: '#2563EB' }

// Curve 主题（完整颜色配置）  
{ name: 'Sky Reflection', line: 'rgb(0, 128, 255)', top: 'rgb(102, 153, 255)', bottom: 'rgb(157, 236, 255)' }
```

### 3. 配置标准化缺失
- Bar 组件配置项不完整
- 默认参数设置不一致
- 类型定义重复且不统一

### 4. 维护成本问题
- 功能更新需要同步两个组件
- Bug 修复需要双重处理
- 性能优化工作量翻倍

## 🎯 Card 2.1 迁移策略

### 合并方案设计

#### 1. 组件结构设计
```typescript
/**
 * 统一图表组件定义
 * 支持柱状图和曲线图的切换显示
 */
interface UnifiedChartConfig {
  // 图表类型配置
  chartType: 'bar' | 'line'
  
  // 通用配置
  name?: string
  
  // 样式配置
  colorGroups?: {
    colorGroup: Array<{
      name: string
      line: string    // 线条颜色（柱状图也保留，用于边框）
      top: string     // 渐变起始色
      bottom: string  // 渐变结束色
    }>
  }
  selectedTheme?: 'colorGroups' | 'colorGroups2'
  
  // 曲线特定配置
  curveWidth?: number // 默认 1，仅在 chartType='line' 时生效
}
```

#### 2. Card 2.1 组件实现
```typescript
// src/card2.1/components/unified-chart/index.ts
import type { ComponentDefinition } from '@/card2.1/core/component-definition'

export const UnifiedChartDefinition: ComponentDefinition = {
  type: 'unified-chart',
  name: '统一图表',
  category: '数据可视化',
  description: '支持柱状图和曲线图的统一图表组件',
  
  // 数据需求声明
  dataRequirements: {
    // 支持多个数据系列（最多 9 个）
    timeSeries: {
      type: 'array',
      description: '时间序列数据',
      structure: {
        timestamp: { type: 'number', description: '时间戳' },
        value: { type: 'number', description: '数值' }
      }
    }
  },
  
  // 配置结构
  config: {
    chartType: {
      type: 'select',
      label: '图表类型',
      options: [
        { label: '柱状图', value: 'bar' },
        { label: '曲线图', value: 'line' }
      ],
      default: 'line'
    },
    
    colorTheme: {
      type: 'color-theme-selector',
      label: '主题色彩',
      default: 'colorGroups'
    },
    
    curveWidth: {
      type: 'number',
      label: '曲线宽度',
      min: 1,
      max: 10,
      step: 1,
      default: 1,
      // 条件显示：仅在图表类型为 line 时显示
      condition: { field: 'chartType', value: 'line' }
    }
  },
  
  // 默认样式
  defaultLayout: {
    canvas: { width: 400, height: 300 },
    gridstack: { w: 6, h: 5, minW: 3, minH: 3 }
  }
}
```

#### 3. 核心组件实现
```vue
<!-- src/card2.1/components/unified-chart/UnifiedChart.vue -->
<script setup lang="ts">
/**
 * 统一图表组件
 * 根据配置动态切换柱状图和曲线图显示
 */
import { computed, ref, onMounted } from 'vue'
import { use } from 'echarts/core'
import { LineChart, BarChart } from 'echarts/charts'
import VChart from 'vue-echarts'
import type { EChartsOption } from 'echarts'
import { useCard2Integration } from '@/card2.1/hooks/useCard2Integration'
import { useThemeStore } from '@/store/modules/theme'

// 注册 ECharts 组件
use([LineChart, BarChart, ...otherComponents])

interface Props {
  config: UnifiedChartConfig
  data?: any
}

const props = defineProps<Props>()
const themeStore = useThemeStore()

// 图表引用
const chartRef = ref()

// 计算图表选项
const chartOptions = computed((): EChartsOption => {
  const { chartType = 'line', colorGroups, curveWidth = 1 } = props.config
  
  return {
    // 基础配置
    tooltip: {
      trigger: 'axis',
      backgroundColor: themeStore.darkMode ? '#333' : '#fff',
      textStyle: {
        color: themeStore.darkMode ? '#fff' : '#333'
      }
    },
    
    // 网格配置
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    
    // 数据系列配置
    series: props.data?.series?.map((serie, index) => ({
      name: serie.name,
      type: chartType, // 根据配置动态设置图表类型
      data: serie.data,
      
      // 样式配置
      ...(chartType === 'line' ? {
        // 曲线特定配置
        lineStyle: {
          width: curveWidth,
          color: colorGroups?.colorGroup?.[index]?.line || '#2563EB'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: colorGroups?.colorGroup?.[index]?.top || '#2563EB' },
              { offset: 1, color: colorGroups?.colorGroup?.[index]?.bottom || '#2563EB' }
            ]
          }
        }
      } : {
        // 柱状图特定配置
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: colorGroups?.colorGroup?.[index]?.top || '#2563EB' },
              { offset: 1, color: colorGroups?.colorGroup?.[index]?.bottom || '#2563EB' }
            ]
          },
          borderColor: colorGroups?.colorGroup?.[index]?.line || '#2563EB',
          borderWidth: 1
        }
      })
    })) || []
  }
})

// 主题适配
const chartTheme = computed(() => themeStore.darkMode ? 'dark' : 'light')

// 暴露更新方法供外部调用
defineExpose({
  updateData: (data: any) => {
    // 数据更新逻辑
  },
  
  refresh: () => {
    chartRef.value?.refresh()
  }
})
</script>

<template>
  <div class="unified-chart">
    <VChart
      ref="chartRef"
      :option="chartOptions"
      :theme="chartTheme"
      autoresize
      class="chart-container"
    />
  </div>
</template>

<style scoped>
.unified-chart {
  width: 100%;
  height: 100%;
  
  /* 适配主题系统 */
  background-color: var(--card-color);
  border-radius: var(--border-radius);
}

.chart-container {
  width: 100%;
  height: 100%;
  min-height: 200px;
}

/* 暗色主题适配 */
[data-theme="dark"] .unified-chart {
  background-color: var(--card-color-dark);
}
</style>
```

#### 4. 配置界面实现
```vue
<!-- src/card2.1/components/unified-chart/ConfigPanel.vue -->
<script setup lang="ts">
/**
 * 统一图表配置面板
 * 支持图表类型切换和动态配置显示
 */
import { computed } from 'vue'
import { NFormItem, NSelect, NInputNumber } from 'naive-ui'
import { ColorThemeSelector } from '@/card2.1/components/common'
import { useI18n } from 'vue-i18n'

interface Props {
  config: UnifiedChartConfig
}

interface Emits {
  (e: 'update:config', config: UnifiedChartConfig): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useI18n()

// 图表类型选项
const chartTypeOptions = [
  { label: t('card.barChart'), value: 'bar' },
  { label: t('card.curve'), value: 'line' }
]

// 是否显示曲线宽度配置
const showCurveWidth = computed(() => props.config.chartType === 'line')

// 更新配置
const updateConfig = (key: keyof UnifiedChartConfig, value: any) => {
  emit('update:config', { ...props.config, [key]: value })
}
</script>

<template>
  <div class="unified-chart-config">
    <!-- 图表类型选择 -->
    <NFormItem :label="t('card.chartType')">
      <NSelect
        :value="config.chartType"
        :options="chartTypeOptions"
        @update:value="(value) => updateConfig('chartType', value)"
      />
    </NFormItem>
    
    <!-- 主题色彩选择 -->
    <NFormItem :label="t('card.colorTheme')">
      <ColorThemeSelector
        :value="config.selectedTheme"
        :color-groups="config.colorGroups"
        @update:value="(value) => updateConfig('selectedTheme', value)"
        @update:color-groups="(value) => updateConfig('colorGroups', value)"
      />
    </NFormItem>
    
    <!-- 曲线宽度设置（仅在曲线图模式显示） -->
    <NFormItem v-if="showCurveWidth" :label="t('generate.curveWidth')">
      <NInputNumber
        :value="config.curveWidth"
        :min="1"
        :max="10"
        :step="1"
        @update:value="(value) => updateConfig('curveWidth', value)"
      />
    </NFormItem>
  </div>
</template>

<style scoped>
.unified-chart-config {
  padding: var(--card-padding);
}
</style>
```

### 数据绑定集成

#### 数据需求声明
```typescript
// 组件向 Card 2.1 系统声明数据需求
const dataRequirements = {
  // 时间序列数据（支持多个系列）
  timeSeriesData: {
    type: 'array',
    description: '时间序列数据，支持多个数据系列',
    maxItems: 9, // 最多支持 9 个数据系列
    structure: {
      seriesName: { type: 'string', description: '数据系列名称' },
      data: {
        type: 'array',
        description: '时间-数值对数组',
        structure: {
          timestamp: { type: 'number', description: '时间戳' },
          value: { type: 'number', description: '数值' }
        }
      }
    }
  },
  
  // 数据源配置
  dataSourceConfig: {
    type: 'object',
    description: '数据源配置信息',
    structure: {
      deviceId: { type: 'string', description: '设备ID' },
      metricsIds: { type: 'array', description: '指标ID列表' },
      timeRange: { type: 'object', description: '时间范围配置' },
      aggregateType: { type: 'string', description: '聚合类型' }
    }
  }
}
```

#### 响应式数据更新
```typescript
// 利用 Card 2.1 响应式系统实现实时数据更新
const useChartData = () => {
  const { 
    subscribeToDataUpdates, 
    requestDataRefresh 
  } = useCard2Integration()
  
  // 订阅数据更新
  const unsubscribe = subscribeToDataUpdates(
    'timeSeriesData',
    (newData) => {
      // 更新图表数据
      updateChartData(newData)
    }
  )
  
  // 定时刷新数据
  const refreshInterval = setInterval(() => {
    requestDataRefresh()
  }, 30000) // 30 秒刷新一次
  
  // 清理函数
  onUnmounted(() => {
    unsubscribe()
    clearInterval(refreshInterval)
  })
}
```

## 💻 具体实现步骤

### Phase 1: 基础框架搭建（第1周）

1. **创建统一组件结构**
```bash
src/card2.1/components/unified-chart/
├── index.ts              # 组件定义和导出
├── UnifiedChart.vue      # 核心图表组件
├── ConfigPanel.vue       # 配置面板
├── types.ts             # 类型定义
├── hooks/
│   └── useChartOptions.ts  # 图表配置逻辑
└── themes/
    └── unified-theme.ts  # 统一主题配置
```

2. **整合主题系统**
```typescript
// 统一并扩展主题配置
const UnifiedChartTheme = {
  colorGroups: [
    {
      name: 'Sky Reflection',
      line: 'rgb(0, 128, 255)',     // 曲线/边框颜色
      top: 'rgb(102, 153, 255)',    // 渐变起始
      bottom: 'rgb(157, 236, 255)'  // 渐变结束
    }
    // ... 其他主题
  ],
  colorGroups2: [
    // ... 第二套主题
  ]
}
```

3. **实现核心功能**
- ECharts 初始化和配置
- 响应式数据绑定
- 主题系统集成

### Phase 2: 数据集成（第2周）

1. **数据源适配器**
```typescript
// src/card2.1/components/unified-chart/adapters/data-adapter.ts
export class ChartDataAdapter {
  /**
   * 转换原始设备数据为图表数据格式
   */
  transformDeviceData(rawData: any[], config: UnifiedChartConfig) {
    return rawData.map(item => ({
      name: item.metricsName || 'Unknown',
      data: item.data?.map(point => [point.ts, point.value]) || []
    }))
  }
  
  /**
   * 处理时间范围和聚合
   */
  applyTimeRangeAndAggregate(data: any[], timeRange: TimeRange, aggregateType: string) {
    // 实现时间筛选和数据聚合逻辑
  }
}
```

2. **API 集成**
```typescript
// 复用现有 API，统一数据获取逻辑
const useChartDataApi = (config: UnifiedChartConfig) => {
  const { 
    telemetryDataHistoryList,
    telemetryDataCurrentKeys
  } = useDeviceApi()
  
  const fetchChartData = async () => {
    if (config.isSupportTimeRange && config.dateRange) {
      return await telemetryDataHistoryList({
        deviceId: config.deviceId,
        keys: config.metricsIds,
        startTime: config.dateRange[0],
        endTime: config.dateRange[1]
      })
    } else {
      return await telemetryDataCurrentKeys({
        deviceId: config.deviceId,
        keys: config.metricsIds
      })
    }
  }
  
  return { fetchChartData }
}
```

### Phase 3: 配置和优化（第3周）

1. **配置界面完善**
- 动态配置项显示/隐藏
- 配置验证和默认值处理
- 用户体验优化

2. **性能优化**
```typescript
// 数据更新防抖
const debouncedUpdate = debounce((data: any) => {
  updateChartOptions(data)
}, 300)

// 图表尺寸自适应
const useChartResize = () => {
  const resizeObserver = new ResizeObserver(entries => {
    entries.forEach(entry => {
      chartRef.value?.resize()
    })
  })
  
  onMounted(() => {
    if (chartContainer.value) {
      resizeObserver.observe(chartContainer.value)
    }
  })
  
  onUnmounted(() => {
    resizeObserver.disconnect()
  })
}
```

3. **主题系统完善**
- 明暗主题自动切换
- 自定义颜色支持
- 主题预览功能

### Phase 4: 测试和文档（第4周）

1. **单元测试**
```typescript
// tests/unified-chart.test.ts
describe('UnifiedChart', () => {
  test('should render bar chart correctly', () => {
    // 测试柱状图渲染
  })
  
  test('should render line chart correctly', () => {
    // 测试曲线图渲染
  })
  
  test('should switch chart type dynamically', () => {
    // 测试动态切换图表类型
  })
})
```

2. **集成测试**
- Visual Editor 集成测试
- 数据源配置测试
- 主题切换测试

3. **迁移脚本**
```typescript
// 自动迁移现有 bar 和 curve 组件配置
export const migrateChartConfig = (oldConfig: any, chartType: 'bar' | 'line') => {
  return {
    chartType,
    name: oldConfig.name || '图表',
    colorGroups: oldConfig.colorGroups,
    selectedTheme: oldConfig.selectedTheme || 'colorGroups',
    curveWidth: chartType === 'line' ? (oldConfig.curveWidth || 1) : 1
  }
}
```

## ✅ 测试验证方案

### 1. 功能测试
- [ ] 柱状图和曲线图正确渲染
- [ ] 图表类型动态切换
- [ ] 数据实时更新
- [ ] 时间范围和聚合功能
- [ ] 主题色彩系统

### 2. 兼容性测试
- [ ] 原有配置自动迁移
- [ ] Visual Editor 集成
- [ ] 多设备响应式显示
- [ ] 明暗主题切换

### 3. 性能测试
- [ ] 大数据量渲染性能
- [ ] 内存使用优化
- [ ] 动画流畅度
- [ ] 数据更新响应时间

## 📈 迁移收益

### 代码减少
- **组件数量**: 2 → 1 (减少 50%)
- **代码行数**: ~2000 → ~1200 (减少 40%)
- **维护文件**: 10 → 6 (减少 40%)

### 开发效率
- **新功能开发**: 单点实现，效率提升 2x
- **Bug 修复**: 统一修复，效率提升 2x
- **测试覆盖**: 集中测试，质量提升

### 用户体验
- **配置简化**: 统一界面，学习成本降低
- **功能增强**: 动态切换，使用灵活性提升
- **性能优化**: 统一优化，响应速度提升

---

**总结**: 通过合并 bar 和 curve 组件，可以实现显著的代码简化和维护成本降低，同时提供更好的用户体验和开发效率。