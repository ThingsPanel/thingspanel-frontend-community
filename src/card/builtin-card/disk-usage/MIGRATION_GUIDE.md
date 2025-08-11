# Disk Usage 组件迁移指南

## 📋 组件概述

### 基本信息
- **组件ID**: `disk-usage`
- **组件名称**: 磁盘使用率卡片
- **文件路径**: `src/card/builtin-card/disk-usage/`
- **组件类型**: 系统监控统计卡片
- **当前状态**: ✅ 功能正常，需要合并优化

### 功能描述
展示系统磁盘使用率的监控卡片，使用蓝紫色渐变背景和动画数字显示磁盘使用百分比。与CPU和内存监控组件结构完全相同，是系统监控三件套的重要组成部分。

## 🔧 技术分析

### 使用的API接口
```typescript
// 与CPU/内存使用相同API
getSystemMetricsCurrent(): Promise<{
  data: {
    cpu_usage: number
    memory_usage: number
    disk_usage: number      // 磁盘使用率百分比 (0-100)
  }
}>
```

### 核心配置差异
| 属性 | 值 |
|------|-----|
| **数据字段** | `disk_usage` |
| **图标** | `fa-hdd` |
| **渐变色** | `['#6366f1', '#4f46e5']` (蓝紫色) |
| **国际化键** | `card.diskUsage` |
| **刷新频率** | 60秒 (磁盘变化较慢) |

## ❌ 存在问题

### 代码重复问题
**与cpu-usage和memory-usage组件99%代码重复**，仅在以下4处有差异：
1. 组件名称: `DiskUsageCard`
2. 日志名称: `createLogger('DiskUsageCard')`
3. 数据字段: `response.data.disk_usage`
4. 渐变颜色: 蓝紫色系

### 磁盘监控特殊需求
1. **更新频率**: 磁盘使用率变化较慢，可以60秒刷新而非30秒
2. **阈值设置**: 磁盘使用率的警告阈值应该更高 (85%/95%)
3. **容量信息**: 理想情况下应该显示实际容量信息

## 🔄 迁移建议

### 迁移策略: 合并到SystemMetricCard
**强制要求与cpu-usage、memory-usage合并为统一组件**

#### 磁盘监控特殊配置
```typescript
// 磁盘使用率预设
export const diskUsagePreset: ComponentPreset = {
  id: 'disk-usage-monitor',
  name: '磁盘使用率',
  
  config: {
    metricType: 'disk',
    gradientColors: ['#6366f1', '#4f46e5'], // 蓝紫色渐变
    icon: 'fa-hdd',
    refreshInterval: 60, // 60秒刷新 (磁盘变化较慢)
    
    // 磁盘特有阈值 (比CPU/内存更宽松)
    warningThreshold: 85,   // 磁盘使用率超过85%警告
    criticalThreshold: 95,  // 磁盘使用率超过95%严重
    
    // 磁盘特有功能
    showCapacity: false,    // 暂不显示总容量
    showFreeSpace: false,   // 暂不显示剩余空间
    alertOnLowSpace: true   // 磁盘空间不足时警告
  }
}
```

#### 磁盘状态智能判断
```typescript
// 磁盘使用率状态判断
const getDiskStatus = (usage: number) => {
  if (usage >= 95) return 'critical'  // 磁盘几乎满
  if (usage >= 85) return 'warning'   // 磁盘空间不足
  if (usage >= 70) return 'moderate'  // 正常使用
  return 'normal'                     // 充足空间
}

// 磁盘状态描述
const getDiskDescription = (usage: number) => {
  if (usage >= 95) return t('disk.status.almostFull')    // '磁盘几乎满'
  if (usage >= 85) return t('disk.status.lowSpace')      // '空间不足'
  if (usage >= 70) return t('disk.status.normal')        // '正常使用'
  return t('disk.status.abundant')                       // '空间充足'
}

// 磁盘空间警告
const getDiskSpaceWarning = (usage: number) => {
  if (usage >= 95) {
    return {
      level: 'error',
      message: t('disk.warning.cleanupRequired'), // '需要清理磁盘空间'
      action: t('disk.action.cleanup')             // '清理空间'
    }
  } else if (usage >= 85) {
    return {
      level: 'warning', 
      message: t('disk.warning.spaceRunningLow'), // '磁盘空间即将不足'
      action: t('disk.action.monitor')            // '密切监控'
    }
  }
  return null
}
```

#### 磁盘监控增强功能
```vue
<!-- 磁盘特有的UI增强 -->
<template>
  <SystemMetricCard v-bind="diskProps">
    <template #additional-info>
      <!-- 磁盘空间警告 -->
      <div v-if="diskSpaceWarning" class="disk-warning">
        <n-alert 
          :type="diskSpaceWarning.level"
          :title="diskSpaceWarning.message"
          size="small"
          show-icon
        >
          <template #action>
            <n-button size="tiny" quaternary>
              {{ diskSpaceWarning.action }}
            </n-button>
          </template>
        </n-alert>
      </div>
      
      <!-- 磁盘状态指示器 -->
      <div class="disk-status-bar">
        <div class="status-segments">
          <div 
            class="segment safe"
            :class="{ active: diskUsage <= 70 }"
          ></div>
          <div 
            class="segment moderate" 
            :class="{ active: diskUsage > 70 && diskUsage <= 85 }"
          ></div>
          <div 
            class="segment warning"
            :class="{ active: diskUsage > 85 && diskUsage <= 95 }"
          ></div>
          <div 
            class="segment critical"
            :class="{ active: diskUsage > 95 }"
          ></div>
        </div>
        <div class="usage-pointer" :style="{ left: `${diskUsage}%` }"></div>
      </div>
    </template>
  </SystemMetricCard>
</template>

<style scoped>
.disk-warning {
  margin-top: 8px;
}

.disk-status-bar {
  width: 100%;
  height: 8px;
  position: relative;
  margin-top: 8px;
  border-radius: 4px;
  overflow: hidden;
}

.status-segments {
  display: flex;
  height: 100%;
}

.segment {
  flex: 1;
  opacity: 0.3;
  transition: all 0.3s ease;
}

.segment.active {
  opacity: 1;
}

.segment.safe { background: #10b981; }
.segment.moderate { background: #f59e0b; }
.segment.warning { background: #f97316; }
.segment.critical { background: #dc2626; }

.usage-pointer {
  position: absolute;
  top: -2px;
  width: 2px;
  height: calc(100% + 4px);
  background: white;
  border-radius: 1px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  transition: left 0.5s ease;
}
</style>
```

## ✅ 快速迁移检查

### 差异化验证
- [ ] **数据字段**: 确保读取`disk_usage`而非其他字段
- [ ] **蓝紫渐变**: 默认颜色为蓝紫色系 `#6366f1 → #4f46e5`
- [ ] **磁盘图标**: 显示`fa-hdd`图标
- [ ] **60秒刷新**: 刷新间隔为60秒而非30秒
- [ ] **磁盘阈值**: 85%警告，95%严重
- [ ] **状态描述**: 显示磁盘特有的状态文本

### 增强功能验证
- [ ] **空间警告**: 磁盘空间不足时的明显警告
- [ ] **状态指示器**: 显示磁盘使用状态的分段指示条
- [ ] **使用指针**: 显示当前使用率在状态条中的位置
- [ ] **清理建议**: 磁盘空间不足时提供操作建议

## 🎯 预期收益

### 磁盘监控优化
- **合理阈值**: 根据磁盘特性设置85%/95%阈值
- **视觉增强**: 分段状态指示器更直观显示磁盘健康状况
- **操作指导**: 磁盘空间不足时提供清理建议
- **更新优化**: 60秒刷新减少不必要的API调用

### 系统监控完整性
与CPU和内存监控合并后，形成完整的系统资源监控套件：
- **CPU使用率** (绿色) - 处理器性能
- **内存使用率** (橙色) - 内存压力
- **磁盘使用率** (蓝色) - 存储空间

用户可以在仪表板中并排显示三个监控卡片，快速了解系统整体健康状况。

**参考**: 完整的三组件合并方案请查看 `SYSTEM_MONITORING_COMPONENTS_MIGRATION.md` 文档。