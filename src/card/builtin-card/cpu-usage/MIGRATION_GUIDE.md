# CPU Usage 组件迁移指南

## 📋 组件概述

### 基本信息
- **组件ID**: `cpu-usage`
- **组件名称**: CPU使用率卡片
- **文件路径**: `src/card/builtin-card/cpu-usage/`
- **组件类型**: 系统监控统计卡片
- **当前状态**: ✅ 功能正常，需要优化合并

### 功能描述
展示系统CPU使用率的实时监控卡片，使用渐变背景和动画数字显示CPU使用百分比。支持30秒自动刷新，为系统管理员提供实时的CPU负载监控。

## 🔧 技术分析

### 使用的API接口
```typescript
// 主要API
getSystemMetricsCurrent(): Promise<{
  data: {
    cpu_usage: number     // CPU使用率百分比 (0-100)
    memory_usage: number  // 内存使用率百分比
    disk_usage: number    // 磁盘使用率百分比
  }
}>
```

### 技术依赖
- **Vue 3**: Composition API, `<script setup>`
- **组件库**: 自定义 `GradientBg` 组件
- **动画**: `CountTo` 数字动画组件
- **图标**: `SvgIcon` 支持 (`fa-microchip`)
- **Hook**: `useLoading` 加载状态管理
- **国际化**: `$t()` 翻译函数
- **日志**: `createLogger` 错误记录

### 组件结构
```vue
<template>
  <GradientBg> <!-- 绿色渐变背景 -->
    <h3>{{ $t('card.cpuUsage') }}</h3>
    <div class="flex justify-between items-center">
      <SvgIcon icon="fa-microchip" /> <!-- CPU图标 -->
      <CountTo :end-value="value" suffix="%" /> <!-- 百分比动画 -->
    </div>
  </GradientBg>
</template>
```

### 核心功能特性
1. **实时监控**: 30秒定时刷新CPU使用率数据
2. **百分比显示**: 显示0-100%的CPU使用率
3. **动画效果**: CountTo组件提供数字动画
4. **加载状态**: 完整的loading/error状态管理
5. **生命周期管理**: 正确清理定时器防止内存泄漏

## ❌ 存在问题

### 代码重复问题
1. **与memory-usage/disk-usage高度重复**:
   ```typescript
   // ❌ 问题: 三个组件使用完全相同的结构和逻辑
   // cpu-usage/component.vue
   // memory-usage/component.vue  
   // disk-usage/component.vue
   // 唯一差异: 数据字段、颜色、图标
   
   // ✅ 建议: 合并为通用SystemMetricCard组件
   ```

2. **重复的定时器逻辑**:
   ```typescript
   // ❌ 问题: 每个组件都有相同的30秒定时器代码
   intervalId = window.setInterval(fetchData, 30000)
   
   // ✅ 建议: 统一的数据刷新机制
   ```

### 代码质量问题
1. **国际化使用方式**:
   ```typescript
   // ❌ 问题: 直接导入$t而非使用hook
   import { $t } from '@/locales'
   
   // ✅ 建议: 使用Vue 3推荐的hook方式
   import { useI18n } from 'vue-i18n'
   const { t } = useI18n()
   ```

2. **错误处理不够完善**:
   ```typescript
   // ❌ 问题: 错误时只是设置为null，没有用户提示
   } catch (error) {
     value.value = null
   }
   
   // ✅ 建议: 更好的错误处理和用户反馈
   } catch (error) {
     value.value = 0
     showError(t('systemMonitor.loadError'))
   }
   ```

3. **缺少阈值警告**:
   ```typescript
   // ❌ 问题: 没有CPU高使用率的视觉警告
   // 当CPU > 80%时应该有视觉提示
   
   // ✅ 建议: 添加阈值警告功能
   const isHighUsage = computed(() => value.value > 80)
   ```

## 🔄 迁移建议

### 迁移策略: 合并到系统监控组件
**强烈建议与memory-usage、disk-usage合并为统一的SystemMetricCard组件**

#### 原因分析
1. **代码重复率99%**: 三个组件除了数据字段、颜色、图标外完全相同
2. **API统一**: 都调用同一个`getSystemMetricsCurrent()`接口
3. **功能相关**: 都是系统资源监控，经常一起使用
4. **维护困难**: 三个组件的任何修改都需要同步

#### 合并优势
1. **代码减少67%**: 3个组件 → 1个组件 + 3个配置
2. **功能增强**: 统一添加阈值警告、趋势显示等功能
3. **性能优化**: 一次API调用获取所有系统指标
4. **一致性保证**: 确保三个指标的显示和交互完全一致

## 🚀 具体迁移步骤

### Phase 1: 合并到SystemMetricCard

#### 1.1 CPU使用率预设配置
```typescript
// src/card2.1/components/system-metric-card/presets/cpu-usage.ts
import type { ComponentPreset } from '@/card2.1/core/types'
import { systemMetricsDataSource } from '../data-sources/system-metrics'

export const cpuUsagePreset: ComponentPreset = {
  id: 'cpu-usage-monitor',
  name: 'CPU使用率',
  description: '实时显示系统CPU使用率',
  
  config: {
    metricType: 'cpu',
    title: 'card.cpuUsage',
    icon: 'fa-microchip',
    gradientColors: ['#4ade80', '#22c55e'], // 绿色渐变
    refreshInterval: 30,
    
    // CPU特有配置
    warningThreshold: 75,   // CPU使用率超过75%显示警告
    criticalThreshold: 90,  // CPU使用率超过90%显示严重警告
    
    // 显示配置
    showTrend: false,       // 暂不显示趋势
    precision: 1            // 保留1位小数
  },
  
  // 数据绑定配置
  dataBinding: {
    dataSources: [systemMetricsDataSource],
    updateTriggers: ['mount', 'timer'],
    timerConfig: {
      interval: 30000  // 30秒刷新
    }
  },
  
  // 布局配置
  defaultLayout: {
    canvas: { width: 300, height: 180 },
    gridstack: { w: 3, h: 2, minH: 2, minW: 2 }
  }
}
```

### Phase 2: 增强功能实现

#### 2.1 智能阈值警告
```vue
<!-- SystemMetricCard中的CPU特殊处理 -->
<script setup lang="ts">
// CPU使用率状态计算
const cpuStatus = computed(() => {
  if (props.config.metricType !== 'cpu') return 'normal'
  
  const usage = displayValue.value
  const { criticalThreshold = 90, warningThreshold = 75 } = props.config
  
  if (usage >= criticalThreshold) {
    return 'critical'  // 严重: 深红色
  } else if (usage >= warningThreshold) {
    return 'warning'   // 警告: 橙色
  } else if (usage >= 50) {
    return 'moderate'  // 中等: 黄色
  } else {
    return 'normal'    // 正常: 绿色
  }
})

// CPU状态对应的颜色
const cpuStatusColors = computed(() => {
  switch (cpuStatus.value) {
    case 'critical':
      return ['#dc2626', '#991b1b'] // 深红色渐变
    case 'warning':
      return ['#f97316', '#ea580c'] // 橙色渐变
    case 'moderate':
      return ['#f59e0b', '#d97706'] // 黄色渐变
    default:
      return ['#4ade80', '#22c55e'] // 绿色渐变
  }
})

// CPU图标动画
const showCPUAnimation = computed(() => {
  return props.config.metricType === 'cpu' && displayValue.value > 80
})
</script>

<template>
  <GradientBg 
    :start-color="statusColors[0]"
    :end-color="statusColors[1]"
    class="system-metric-card"
  >
    <!-- 标题和状态 -->
    <div class="header">
      <h3 class="title">{{ displayTitle }}</h3>
      
      <!-- CPU状态标签 -->
      <n-tag 
        v-if="config.metricType === 'cpu'"
        :type="cpuStatus === 'critical' ? 'error' : 
              cpuStatus === 'warning' ? 'warning' : 
              cpuStatus === 'moderate' ? 'info' : 'success'"
        size="small"
        round
      >
        {{ getCPUStatusText(cpuStatus) }}
      </n-tag>
    </div>
    
    <!-- 内容区域 -->
    <div class="content">
      <!-- CPU图标 -->
      <div class="icon-container">
        <SvgIcon 
          :icon="displayIcon"
          class="metric-icon"
          :class="{ 
            'cpu-high-usage': showCPUAnimation,
            'cpu-normal': config.metricType === 'cpu' && !showCPUAnimation
          }"
        />
        
        <!-- 性能等级指示器 -->
        <div 
          v-if="config.metricType === 'cpu'" 
          class="performance-indicator"
        >
          <div 
            class="indicator-bar"
            :class="`level-${cpuStatus}`"
            :style="{ width: `${Math.min(displayValue, 100)}%` }"
          ></div>
        </div>
      </div>
      
      <!-- 数值显示 -->
      <div class="value-section">
        <CountTo
          v-if="!loading && !error"
          :start-value="0"
          :end-value="displayValue"
          suffix="%"
          :precision="config.precision || 1"
          :duration="1500"
          class="metric-value"
        />
        
        <!-- CPU负载描述 -->
        <div v-if="config.metricType === 'cpu'" class="cpu-load-desc">
          {{ getCPULoadDescription(displayValue) }}
        </div>
      </div>
    </div>
  </GradientBg>
</template>

<style scoped>
/* CPU特殊动画效果 */
.cpu-high-usage {
  animation: cpuPulse 2s infinite;
}

@keyframes cpuPulse {
  0%, 100% { 
    transform: scale(1);
    opacity: 0.9;
  }
  50% { 
    transform: scale(1.05);
    opacity: 1;
  }
}

.cpu-normal {
  transition: all 0.3s ease;
}

/* 性能指示器 */
.performance-indicator {
  width: 60px;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 8px;
}

.indicator-bar {
  height: 100%;
  border-radius: 2px;
  transition: all 0.5s ease;
}

.level-normal { background: #10b981; }
.level-moderate { background: #f59e0b; }
.level-warning { background: #f97316; }
.level-critical { background: #dc2626; }

.cpu-load-desc {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  margin-top: 4px;
}
</style>
```

#### 2.2 辅助函数
```typescript
// CPU状态文本
const getCPUStatusText = (status: string) => {
  const statusMap = {
    'normal': t('cpu.status.normal'),      // '正常'
    'moderate': t('cpu.status.moderate'),  // '中等'
    'warning': t('cpu.status.warning'),    // '繁忙'
    'critical': t('cpu.status.critical')   // '过载'
  }
  return statusMap[status] || status
}

// CPU负载描述
const getCPULoadDescription = (usage: number) => {
  if (usage >= 90) return t('cpu.load.critical')     // '系统过载'
  if (usage >= 75) return t('cpu.load.high')         // '负载较高'
  if (usage >= 50) return t('cpu.load.moderate')     // '正常工作'
  if (usage >= 25) return t('cpu.load.low')          // '轻度负载'
  return t('cpu.load.idle')                          // '空闲状态'
}
```

## ✅ 迁移验证清单

### 功能对等验证
- [ ] **数据获取**: CPU使用率数据正确获取和显示
- [ ] **30秒刷新**: 定时器正常工作，数据定期更新
- [ ] **百分比显示**: 数值显示格式与原组件一致
- [ ] **绿色渐变**: 默认渐变颜色与原组件相同
- [ ] **CPU图标**: fa-microchip图标正常显示
- [ ] **动画效果**: CountTo动画与原组件一致
- [ ] **加载状态**: loading状态正确显示
- [ ] **错误处理**: 错误时有适当的降级显示
- [ ] **生命周期**: 组件销毁时定时器正确清理

### 增强功能验证
- [ ] **智能配色**: 根据CPU使用率自动调整卡片颜色
- [ ] **阈值警告**: 超过75%/90%时显示警告/严重状态
- [ ] **状态标签**: 显示CPU负载状态标签
- [ ] **图标动画**: 高负载时CPU图标脉冲动画
- [ ] **性能指示器**: 显示CPU使用率进度条
- [ ] **负载描述**: 显示CPU负载的文字描述
- [ ] **响应式**: 不同屏幕尺寸下显示正常
- [ ] **主题适配**: 明暗主题切换正常

## 📚 相关资源

### 同步迁移组件
以下组件将使用相同的SystemMetricCard架构:
- `memory-usage` - 内存使用率 (橙色渐变)
- `disk-usage` - 磁盘使用率 (蓝色渐变)

### API数据格式
```typescript
// 系统指标API响应格式
interface SystemMetricsResponse {
  code: 200,
  data: {
    cpu_usage: 45.2,      // CPU使用率 (百分比)
    memory_usage: 68.7,   // 内存使用率 (百分比)
    disk_usage: 23.4,     // 磁盘使用率 (百分比)
    timestamp: "2024-01-15T10:30:00Z"
  }
}
```

### 国际化配置
```typescript
// 需要添加的CPU相关翻译
const translations = {
  'card.cpuUsage': 'CPU使用率',
  'cpu.status.normal': '正常',
  'cpu.status.moderate': '中等',
  'cpu.status.warning': '繁忙', 
  'cpu.status.critical': '过载',
  'cpu.load.idle': '空闲状态',
  'cpu.load.low': '轻度负载',
  'cpu.load.moderate': '正常工作',
  'cpu.load.high': '负载较高',
  'cpu.load.critical': '系统过载'
}
```

## 🎯 预期收益

### 合并收益
- **代码减少**: 从3个重复组件减少到1个通用组件
- **功能统一**: CPU/内存/磁盘监控功能完全一致
- **维护简化**: 修改一处影响所有系统监控组件

### 功能增强
- **智能预警**: 根据使用率自动调整视觉提示
- **状态感知**: 直观显示系统性能状态
- **视觉效果**: 高负载时的动画提醒用户注意
- **详细信息**: 提供更丰富的CPU状态描述

### 技术提升
- **类型安全**: 完整的TypeScript类型定义
- **性能优化**: 统一的数据获取和缓存策略
- **主题集成**: 完全支持明暗主题切换
- **响应式**: 优化的移动端显示效果

该组件的迁移将作为系统监控组件合并的典型案例，为内存和磁盘使用率组件的迁移提供参考模板。