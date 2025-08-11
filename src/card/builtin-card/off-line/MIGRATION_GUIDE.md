# Off-line 组件迁移指南

## 📋 组件概述

### 基本信息
- **组件ID**: `off-line`  
- **组件名称**: 离线设备数统计卡片
- **文件路径**: `src/card/builtin-card/off-line/`
- **组件类型**: 渐变背景统计卡片
- **当前状态**: ✅ 功能正常，需要合并优化

### 功能描述
展示系统当前离线设备数量的统计卡片，与on-line组件形成配对使用。通过灰色渐变背景和断线图标提供直观的离线设备监控。

## 🔧 技术分析

### 使用的API接口
**与on-line组件使用完全相同的API接口**，计算离线数 = 总数 - 在线数

### 核心配置差异
| 属性 | 值 |
|------|-----|
| **数据字段** | `device_total - device_on` (计算得出) |
| **图标** | `fa-wifi-slash` |
| **渐变色** | 灰色系 (需要确认具体颜色) |
| **国际化键** | `card.offlineDev` |

## ❌ 存在问题

### 代码重复问题
**与on-line组件结构完全相同**，造成：
1. API调用重复 (两个组件调用相同接口)
2. 权限判断逻辑重复
3. 数据处理逻辑重复

### 功能分离问题
1. **数据分散**: 在线/离线数据分别显示，用户无法快速了解整体状况
2. **缺少关联**: 两个组件没有数据关联，可能显示不一致
3. **用户体验**: 需要同时查看两个卡片才能了解完整的设备状态

## 🔄 迁移建议

### 迁移策略: 三种方案

#### 方案1: 合并为设备状态组合卡片 ⭐⭐⭐ (推荐)
```vue
<!-- 设备状态组合展示 -->
<template>
  <div class="device-status-card">
    <h3>设备状态统计</h3>
    <div class="status-overview">
      <div class="online-section">
        <div class="count">{{ onlineCount }}</div>
        <div class="label">在线</div>
      </div>
      <div class="rate-circle">{{ onlineRate }}%</div>
      <div class="offline-section">
        <div class="count">{{ offlineCount }}</div>
        <div class="label">离线</div>  
      </div>
    </div>
  </div>
</template>
```

#### 方案2: 合并到统计卡片模板 ⭐⭐
作为独立的离线设备统计卡片，但增强功能

#### 方案3: 保持独立但优化 ⭐
保持与on-line分离，但共享数据源避免重复请求

## 🚀 推荐实施: 设备状态组合卡片

### 组件定义
```typescript
// src/card2.1/components/device-status-overview/component-definition.ts
export const deviceStatusOverviewDefinition: ComponentDefinition = {
  type: 'DeviceStatusOverview',
  name: '设备状态概览',
  description: '综合显示设备在线/离线状态的组合卡片',
  category: 'device-monitoring',
  
  config: {
    displayMode: {
      type: 'select',
      options: [
        { label: '环形图', value: 'circle' },
        { label: '左右分栏', value: 'split' },
        { label: '垂直堆叠', value: 'stack' }
      ],
      default: 'circle'
    },
    showPercentage: { type: 'boolean', default: true },
    showTrend: { type: 'boolean', default: false },
    colorScheme: {
      type: 'object',
      properties: {
        online: { type: 'string', default: '#10b981' },
        offline: { type: 'string', default: '#6b7280' }
      }
    }
  }
}
```

### 预设配置
```typescript
export const deviceStatusPreset: ComponentPreset = {
  id: 'device-status-overview',
  name: '设备状态概览',
  
  config: {
    title: '设备状态统计',
    displayMode: 'circle',
    showPercentage: true,
    colorScheme: {
      online: '#865ec0',  // 保持on-line的紫色
      offline: '#6b7280'  // 灰色表示离线
    }
  },
  
  defaultLayout: {
    canvas: { width: 320, height: 200 },
    gridstack: { w: 4, h: 2, minH: 2, minW: 3 }
  }
}
```

## ✅ 迁移验证清单

### 组合方案验证
- [ ] **数据统一**: 一次API调用获取在线/离线数据
- [ ] **状态一致**: 在线+离线=总数，数据逻辑正确
- [ ] **在线率计算**: 在线率百分比计算准确
- [ ] **视觉对比**: 在线/离线状态对比清晰
- [ ] **响应式**: 不同显示模式下布局正常

### 独立方案验证  
- [ ] **离线数计算**: 总数-在线数计算正确
- [ ] **灰色主题**: 使用合适的灰色渐变表示离线状态
- [ ] **断线图标**: fa-wifi-slash图标正确显示
- [ ] **状态指示**: 离线设备过多时的视觉警告

## 🎯 预期收益

### 组合方案收益
- **信息完整**: 一个卡片显示完整的设备状态信息  
- **数据一致**: 避免两个组件数据不同步的问题
- **用户体验**: 用户一眼就能了解设备整体状况
- **API优化**: 减少50%的API调用

### 独立方案收益
- **功能专一**: 专注于离线设备监控
- **警告突出**: 离线设备过多时的明显提醒
- **灵活布局**: 可以与在线设备卡片灵活组合

**推荐使用组合方案**，将on-line和off-line合并为一个功能更强大的设备状态概览组件。