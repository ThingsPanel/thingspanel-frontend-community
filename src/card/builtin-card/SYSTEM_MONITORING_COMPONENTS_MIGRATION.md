# 系统监控组件统一迁移指南

## 📋 概述

本文档针对系统监控相关的三个组件进行统一迁移规划：
- `cpu-usage` - CPU使用率
- `memory-usage` - 内存使用率  
- `disk-usage` - 磁盘使用率

这三个组件结构**完全相同**，仅在数据字段和显示颜色上有差异，是**合并重构的最佳候选**。

## 🔍 组件分析

### 共同特征
```vue
<!-- 完全相同的结构模式 -->
<template>
  <GradientBg :start-color="color1" :end-color="color2">
    <h3>{{ $t('card.xxxUsage') }}</h3>
    <div class="flex justify-between items-center pt-30px">
      <SvgIcon :icon="iconName" />
      <CountTo 
        :end-value="value" 
        :suffix="unit" 
        :loading="loading"
      />
    </div>
  </GradientBg>
</template>
```

### 共同API
所有三个组件都调用同一个API接口：
```typescript
getSystemMetricsCurrent(): Promise<{
  data: {
    cpu_usage: number     // CPU使用率百分比
    memory_usage: number  // 内存使用率百分比  
    disk_usage: number    // 磁盘使用率百分比
  }
}>
```

### 共同逻辑
1. **30秒定时刷新**
2. **百分比显示** (单位: %)
3. **加载状态管理**
4. **错误处理和日志**
5. **生命周期清理**

### 唯一差异
| 组件 | 数据字段 | 图标 | 渐变色 | 国际化key |
|------|----------|------|--------|-----------|
| CPU | `cpu_usage` | `fa-microchip` | `#4ade80` → `#22c55e` | `card.cpuUsage` |
| Memory | `memory_usage` | `fa-memory` | `#f59e0b` → `#d97706` | `card.memoryUsage` |
| Disk | `disk_usage` | `fa-hdd` | `#6366f1` → `#4f46e5` | `card.diskUsage` |

## 🎯 合并策略

### 方案选择：通用系统指标组件
创建一个 `SystemMetricCard` 组件，通过配置支持不同的系统指标显示。

### 合并收益
- **减少代码量**: 3个组件 → 1个组件 + 3个配置
- **统一维护**: 修改一处影响所有指标
- **扩展性强**: 轻松添加新的系统指标
- **一致性**: 保证所有指标显示风格统一

## 🚀 具体实施方案

### Phase 1: 创建通用系统指标组件

#### 1.1 组件定义
```typescript
// src/card2.1/components/system-metric-card/component-definition.ts
import type { ComponentDefinition } from '@/card2.1/core/types'

export const systemMetricCardDefinition: ComponentDefinition = {
  type: 'SystemMetricCard',
  name: '系统指标卡片',
  description: '显示系统资源使用率的统计卡片',
  category: 'system-monitoring',
  
  // 数据需求
  dataRequirement: {
    fields: {
      systemMetrics: {
        type: 'object',
        required: true,
        description: '系统指标数据',
        properties: {
          cpu_usage: { type: 'number', description: 'CPU使用率' },
          memory_usage: { type: 'number', description: '内存使用率' },
          disk_usage: { type: 'number', description: '磁盘使用率' }
        }
      }
    }
  },
  
  // 配置选项
  config: {
    metricType: {
      type: 'select',
      options: [
        { label: 'CPU使用率', value: 'cpu' },
        { label: '内存使用率', value: 'memory' },
        { label: '磁盘使用率', value: 'disk' }
      ],
      default: 'cpu',
      label: '指标类型'
    },
    title: {
      type: 'string',
      default: '',
      label: '自定义标题'
    },
    icon: {
      type: 'icon-picker',
      default: '',
      label: '自定义图标'
    },
    gradientColors: {
      type: 'color-pair',
      default: ['#3b82f6', '#1d4ed8'],
      label: '渐变颜色'
    },
    refreshInterval: {
      type: 'number',
      default: 30,
      label: '刷新间隔(秒)'
    },
    warningThreshold: {
      type: 'number',
      default: 80,
      label: '警告阈值(%)'
    },
    criticalThreshold: {
      type: 'number',
      default: 90,
      label: '严重阈值(%)'
    }
  }
}
```

#### 1.2 组件实现
```vue
<!-- src/card2.1/components/system-metric-card/SystemMetricCard.vue -->
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCard2DataBinding } from '@/card2.1/hooks/useCard2DataBinding'
import { GradientBg } from '@/components/common/gradient-bg'

interface Props {
  config: {
    metricType: 'cpu' | 'memory' | 'disk'
    title?: string
    icon?: string
    gradientColors?: [string, string]
    refreshInterval?: number
    warningThreshold?: number
    criticalThreshold?: number
  }
  dataBinding?: any
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({
    metricType: 'cpu',
    refreshInterval: 30,
    warningThreshold: 80,
    criticalThreshold: 90,
    gradientColors: ['#3b82f6', '#1d4ed8']
  })
})

const { t } = useI18n()

// Card 2.1 数据绑定
const { data, loading, error } = useCard2DataBinding({
  componentType: 'SystemMetricCard',
  dataBinding: props.dataBinding
})

// 指标配置映射
const metricConfigs = {
  cpu: {
    dataKey: 'cpu_usage',
    defaultTitle: 'card.cpuUsage',
    defaultIcon: 'fa-microchip',
    defaultColors: ['#4ade80', '#22c55e'] as [string, string]
  },
  memory: {
    dataKey: 'memory_usage', 
    defaultTitle: 'card.memoryUsage',
    defaultIcon: 'fa-memory',
    defaultColors: ['#f59e0b', '#d97706'] as [string, string]
  },
  disk: {
    dataKey: 'disk_usage',
    defaultTitle: 'card.diskUsage', 
    defaultIcon: 'fa-hdd',
    defaultColors: ['#6366f1', '#4f46e5'] as [string, string]
  }
}

// 当前指标配置
const currentConfig = computed(() => metricConfigs[props.config.metricType])

// 显示数值
const displayValue = computed(() => {
  if (loading.value || error.value) return 0
  const metrics = data.value?.systemMetrics
  if (!metrics) return 0
  
  const value = metrics[currentConfig.value.dataKey]
  return typeof value === 'number' ? Math.round(value * 10) / 10 : 0
})

// 显示标题
const displayTitle = computed(() => {
  return props.config.title || t(currentConfig.value.defaultTitle)
})

// 显示图标
const displayIcon = computed(() => {
  return props.config.icon || currentConfig.value.defaultIcon
})

// 显示颜色
const displayColors = computed(() => {
  return props.config.gradientColors || currentConfig.value.defaultColors
})

// 状态判断
const status = computed(() => {
  const value = displayValue.value
  const { criticalThreshold = 90, warningThreshold = 80 } = props.config
  
  if (value >= criticalThreshold) return 'critical'
  if (value >= warningThreshold) return 'warning'
  return 'normal'
})

// 状态颜色
const statusColors = computed(() => {
  switch (status.value) {
    case 'critical':
      return ['#ef4444', '#dc2626'] as [string, string]
    case 'warning':
      return ['#f59e0b', '#d97706'] as [string, string]
    default:
      return displayColors.value
  }
})

// 动态刷新定时器
const refreshTimer = ref<number | null>(null)

const setupRefreshTimer = () => {
  if (props.config.refreshInterval && props.config.refreshInterval > 0) {
    refreshTimer.value = window.setInterval(() => {
      // 触发数据刷新
      if (props.dataBinding?.refresh) {
        props.dataBinding.refresh()
      }
    }, props.config.refreshInterval * 1000)
  }
}

const clearRefreshTimer = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
    refreshTimer.value = null
  }
}

onMounted(() => {
  setupRefreshTimer()
})

onUnmounted(() => {
  clearRefreshTimer()
})
</script>

<template>
  <GradientBg 
    class="system-metric-card"
    :start-color="statusColors[0]"
    :end-color="statusColors[1]"
  >
    <!-- 标题 -->
    <h3 class="title">{{ displayTitle }}</h3>
    
    <!-- 内容区域 -->
    <div class="content">
      <!-- 图标 -->
      <SvgIcon 
        :icon="displayIcon"
        class="metric-icon"
      />
      
      <!-- 数值显示 -->
      <div class="value-container">
        <CountTo
          v-if="!loading && !error"
          :start-value="0"
          :end-value="displayValue"
          suffix="%"
          :duration="1500"
          class="metric-value"
        />
        
        <!-- 加载状态 -->
        <div v-else-if="loading" class="loading-value">
          <n-spin size="small" />
        </div>
        
        <!-- 错误状态 -->
        <div v-else class="error-value">
          <span class="error-text">{{ t('card.noData') }}</span>
        </div>
        
        <!-- 状态指示 -->
        <div v-if="!loading && !error" class="status-indicator">
          <n-tag
            :type="status === 'critical' ? 'error' : status === 'warning' ? 'warning' : 'success'"
            size="small"
            round
          >
            {{ status === 'critical' ? t('common.critical') : 
               status === 'warning' ? t('common.warning') : t('common.normal') }}
          </n-tag>
        </div>
      </div>
    </div>
  </GradientBg>
</template>

<style scoped>
.system-metric-card {
  width: 100%;
  height: 100%;
  min-height: 120px;
  position: relative;
}

.title {
  font-size: 16px;
  font-weight: 500;
  color: white;
  margin: 0 0 20px 0;
}

.content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: calc(100% - 40px);
}

.metric-icon {
  font-size: 32px;
  color: rgba(255, 255, 255, 0.8);
}

.value-container {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.metric-value {
  font-size: 30px;
  font-weight: bold;
  color: white;
  line-height: 1;
}

.loading-value,
.error-value {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.7);
}

.error-text {
  font-size: 14px;
}

.status-indicator {
  opacity: 0.9;
}

/* 响应式适配 */
@media (max-width: 480px) {
  .content {
    flex-direction: column;
    justify-content: center;
    gap: 16px;
  }
  
  .value-container {
    align-items: center;
  }
}
</style>
```

### Phase 2: 创建预设配置

#### 2.1 CPU使用率预设
```typescript
// src/card2.1/components/system-metric-card/presets/cpu-usage.ts
import type { ComponentPreset } from '@/card2.1/core/types'
import { systemMetricsDataSource } from '../data-sources/system-metrics'

export const cpuUsagePreset: ComponentPreset = {
  id: 'cpu-usage-metric',
  name: 'CPU使用率',
  description: '显示系统CPU使用率',
  
  config: {
    metricType: 'cpu',
    gradientColors: ['#4ade80', '#22c55e'],
    refreshInterval: 30,
    warningThreshold: 75,
    criticalThreshold: 90
  },
  
  dataBinding: {
    dataSources: [systemMetricsDataSource],
    updateTriggers: ['mount', 'timer'],
    timerConfig: {
      interval: 30000
    }
  },
  
  defaultLayout: {
    canvas: { width: 300, height: 180 },
    gridstack: { w: 3, h: 2, minH: 2, minW: 2 }
  }
}
```

#### 2.2 内存使用率预设
```typescript
// src/card2.1/components/system-metric-card/presets/memory-usage.ts
export const memoryUsagePreset: ComponentPreset = {
  id: 'memory-usage-metric',
  name: '内存使用率',
  description: '显示系统内存使用率',
  
  config: {
    metricType: 'memory',
    gradientColors: ['#f59e0b', '#d97706'],
    refreshInterval: 30,
    warningThreshold: 80,
    criticalThreshold: 95
  },
  
  dataBinding: {
    dataSources: [systemMetricsDataSource],
    updateTriggers: ['mount', 'timer'],
    timerConfig: {
      interval: 30000
    }
  },
  
  defaultLayout: {
    canvas: { width: 300, height: 180 },
    gridstack: { w: 3, h: 2, minH: 2, minW: 2 }
  }
}
```

#### 2.3 磁盘使用率预设
```typescript
// src/card2.1/components/system-metric-card/presets/disk-usage.ts
export const diskUsagePreset: ComponentPreset = {
  id: 'disk-usage-metric',
  name: '磁盘使用率',
  description: '显示系统磁盘使用率',
  
  config: {
    metricType: 'disk',
    gradientColors: ['#6366f1', '#4f46e5'],
    refreshInterval: 60,  // 磁盘变化较慢，可以60秒刷新
    warningThreshold: 85,
    criticalThreshold: 95
  },
  
  dataBinding: {
    dataSources: [systemMetricsDataSource],
    updateTriggers: ['mount', 'timer'],
    timerConfig: {
      interval: 60000
    }
  },
  
  defaultLayout: {
    canvas: { width: 300, height: 180 },
    gridstack: { w: 3, h: 2, minH: 2, minW: 2 }
  }
}
```

#### 2.4 数据源配置
```typescript
// src/card2.1/components/system-metric-card/data-sources/system-metrics.ts
import { getSystemMetricsCurrent } from '@/service/api/system-data'
import type { DataSourceConfig } from '@/card2.1/core/data-binding/types'

export const systemMetricsDataSource: DataSourceConfig = {
  type: 'api',
  name: '系统指标数据',
  description: '获取CPU、内存、磁盘使用率数据',
  
  config: {
    endpoint: getSystemMetricsCurrent,
    
    // 数据转换
    transform: (response: any) => ({
      systemMetrics: {
        cpu_usage: response?.data?.cpu_usage || 0,
        memory_usage: response?.data?.memory_usage || 0,
        disk_usage: response?.data?.disk_usage || 0
      }
    }),
    
    // 错误处理
    errorHandler: (error: any) => {
      console.error('获取系统指标失败:', error)
      return {
        systemMetrics: {
          cpu_usage: 0,
          memory_usage: 0,
          disk_usage: 0
        }
      }
    },
    
    // 缓存配置
    cache: {
      enabled: true,
      ttl: 15000  // 15秒缓存，避免频繁请求
    }
  }
}
```

## ✅ 迁移验证清单

### 功能对等验证
- [ ] **CPU指标**: 数值显示正确，30秒刷新正常
- [ ] **内存指标**: 数值显示正确，30秒刷新正常  
- [ ] **磁盘指标**: 数值显示正确，60秒刷新正常
- [ ] **渐变背景**: 三种指标颜色与原组件一致
- [ ] **图标显示**: 图标类型和大小与原组件一致
- [ ] **数值动画**: CountTo动画效果正常
- [ ] **加载状态**: 数据加载时显示loading
- [ ] **错误处理**: API错误时显示降级内容
- [ ] **定时器清理**: 组件销毁时正确清理定时器

### 增强功能验证
- [ ] **阈值警告**: 超过警告/严重阈值时颜色和标签变化
- [ ] **状态指示**: 显示正常/警告/严重状态标签
- [ ] **自定义配置**: 支持自定义标题、图标、颜色
- [ ] **响应式**: 移动端显示适配良好
- [ ] **主题适配**: 明暗主题下显示正常

## 🎯 预期收益

### 代码维护
- **代码减少**: 从285行代码 → 约100行组件 + 配置
- **维护统一**: 统一的逻辑和错误处理
- **扩展简单**: 添加新指标只需新增配置

### 功能增强  
- **智能阈值**: 根据使用率自动调整显示颜色
- **状态标签**: 直观显示系统健康状况
- **灵活配置**: 支持自定义刷新间隔和阈值

### 用户体验
- **一致性**: 所有系统指标显示风格统一
- **直观性**: 颜色编码让用户快速识别问题
- **实时性**: 优化的刷新机制和缓存策略

这个合并方案将3个高度重复的组件整合为1个强大的通用组件，大幅提升了代码质量和维护效率，同时增强了功能性。