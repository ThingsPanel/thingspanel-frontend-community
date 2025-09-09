# Memory Usage 组件迁移指南

## 📋 组件概述

### 基本信息
- **组件ID**: `memory-usage`
- **组件名称**: 内存使用率卡片
- **文件路径**: `src/card/builtin-card/memory-usage/`
- **组件类型**: 系统监控统计卡片
- **当前状态**: ✅ 功能正常，需要合并优化

### 功能描述
展示系统内存使用率的实时监控卡片，使用橙色渐变背景和动画数字显示内存使用百分比。与CPU和磁盘监控组件结构完全相同，适合合并重构。

## 🔧 技术分析

### 使用的API接口
```typescript
// 与CPU/磁盘使用相同API
getSystemMetricsCurrent(): Promise<{
  data: {
    cpu_usage: number
    memory_usage: number    // 内存使用率百分比 (0-100)
    disk_usage: number
  }
}>
```

### 核心配置差异
| 属性 | 值 |
|------|-----|
| **数据字段** | `memory_usage` |
| **图标** | `fa-memory` |
| **渐变色** | `['#f59e0b', '#d97706']` (橙色) |
| **国际化键** | `card.memoryUsage` |

## ❌ 存在问题

### 代码重复问题
**与cpu-usage和disk-usage组件99%代码重复**，仅在以下4处有差异：
1. 组件名称: `MemoryUsageCard`
2. 日志名称: `createLogger('MemoryUsageCard')`
3. 数据字段: `response.data.memory_usage`
4. 渐变颜色: 橙色系而非绿色系

## 🔄 迁移建议

### 迁移策略: 合并到SystemMetricCard
**强制要求与cpu-usage、disk-usage合并为统一组件**

#### 内存监控特殊配置
```typescript
// 内存使用率预设
export const memoryUsagePreset: ComponentPreset = {
  id: 'memory-usage-monitor',
  name: '内存使用率',
  
  config: {
    metricType: 'memory',
    gradientColors: ['#f59e0b', '#d97706'], // 橙色渐变
    icon: 'fa-memory',
    
    // 内存特有阈值
    warningThreshold: 80,   // 内存使用率超过80%警告
    criticalThreshold: 95,  // 内存使用率超过95%严重
    
    // 内存特有功能
    showSwapInfo: false,    // 暂不显示交换分区信息
    showBufferCache: false  // 暂不显示缓冲区信息
  }
}
```

#### 内存状态智能判断
```typescript
// 内存使用率状态判断 (比CPU更严格)
const getMemoryStatus = (usage: number) => {
  if (usage >= 95) return 'critical'  // 内存不足
  if (usage >= 80) return 'warning'   // 内存紧张
  if (usage >= 60) return 'moderate'  // 正常使用
  return 'normal'                     // 充足
}

// 内存状态描述
const getMemoryDescription = (usage: number) => {
  if (usage >= 95) return t('memory.status.insufficient')  // '内存不足'
  if (usage >= 80) return t('memory.status.tight')         // '内存紧张'
  if (usage >= 60) return t('memory.status.normal')        // '正常使用'
  return t('memory.status.abundant')                       // '内存充足'
}
```

## ✅ 快速迁移检查

由于与CPU使用率组件几乎完全相同，迁移验证重点关注：

### 差异化验证
- [ ] **数据字段**: 确保读取`memory_usage`而非`cpu_usage`
- [ ] **橙色渐变**: 默认颜色为橙色系 `#f59e0b → #d97706`
- [ ] **内存图标**: 显示`fa-memory`图标
- [ ] **内存阈值**: 80%警告，95%严重 (比CPU更严格)
- [ ] **状态描述**: 显示内存特有的状态文本

### 增强功能
- [ ] **内存警告**: 超过80%时橙红色警告
- [ ] **严重提醒**: 超过95%时深红色严重警告
- [ ] **内存描述**: 显示"充足/正常/紧张/不足"状态

## 🎯 预期收益

### 内存监控优化
- **精确阈值**: 根据内存特性调整警告阈值
- **状态感知**: 内存不足时的明显视觉警告
- **描述准确**: 使用内存特有的状态描述

### 合并收益
此组件合并后将与CPU和磁盘监控形成完整的系统资源监控套件，用户可以在仪表板中并排显示，形成统一的系统监控视图。

**参考**: 详细的合并方案请查看 `SYSTEM_MONITORING_COMPONENTS_MIGRATION.md` 文档。