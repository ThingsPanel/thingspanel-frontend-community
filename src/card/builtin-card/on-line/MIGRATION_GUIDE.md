# On-line 组件迁移指南

## 📋 组件概述

### 基本信息
- **组件ID**: `on-line`
- **组件名称**: 在线设备数统计卡片
- **文件路径**: `src/card/builtin-card/on-line/`
- **组件类型**: 渐变背景统计卡片
- **当前状态**: ✅ 功能正常，需要合并优化

### 功能描述
展示系统当前在线设备数量的统计卡片，使用紫色渐变背景和WiFi图标。与off-line组件形成配对，为设备监控提供关键的设备在线状态统计信息。

## 🔧 技术分析

### 使用的API接口
```typescript
// 根据用户权限调用不同接口 (与access组件相同)
sumData(): Promise<{     // 租户管理员
  data: {
    device_on: number    // 在线设备数
    device_total: number // 设备总数
  }
}>

totalNumber(): Promise<{ // 系统管理员  
  data: {
    device_on: number    // 在线设备数
    device_total: number // 设备总数
  }
}>
```

### 技术依赖
- **Vue 3**: Composition API, `<script setup>`
- **组件库**: 自定义 `GradientBg` 组件
- **动画**: `CountTo` 数字动画组件
- **图标**: `SvgIcon` 支持 (`fa-wifi`)
- **权限**: `useAuthStore` 权限判断
- **国际化**: `$t()` 翻译函数
- **日志**: `createLogger` 错误记录

### 组件结构
```vue
<template>
  <GradientBg> <!-- 紫色渐变背景 -->
    <h3>{{ $t('card.onlineDev') }}</h3>
    <div class="icon-items">
      <SvgIcon icon="fa-wifi" /> <!-- WiFi图标 -->
      <CountTo :end-value="value" /> <!-- 在线设备数动画 -->
    </div>
  </GradientBg>
</template>
```

### 配置信息
```typescript
const cardData = {
  id: 'amount',
  title: $t('card.onlineDev'),           // 在线设备
  value: 0,
  unit: $t('card.deviceUnit'),           // 台
  colors: ['#865ec0', '#5144b4'],        // 紫色渐变
  icon: 'fa-wifi'                        // WiFi图标
}
```

## ❌ 存在问题

### 代码重复问题
**与access、off-line等组件99%代码重复**，仅在以下几处有差异：
1. 组件名称和ID
2. 数据字段: `response.data.device_on`
3. 渐变颜色: 紫色系
4. 图标: `fa-wifi`
5. 国际化键: `card.onlineDev`

### 业务逻辑问题
1. **与offline分离**: 在线和离线设备数应该成对显示，但是分为两个独立组件
2. **权限判断重复**: 与access组件使用相同的权限判断逻辑
3. **缺少在线率计算**: 没有显示设备在线率百分比

### 用户体验问题
1. **状态感知不足**: 仅显示数量，没有在线状态的视觉指示
2. **缺少趋势信息**: 没有显示在线设备数的变化趋势
3. **缺少关联信息**: 与离线设备数据没有关联显示

## 🔄 迁移建议

### 迁移策略: 合并到统计卡片模板 + 设备状态增强
**建议与其他统计卡片合并，并专门优化设备监控功能**

#### 特殊处理: 设备状态监控套件
由于on-line和off-line组件功能高度相关，建议：
1. **合并为设备状态组件**: 同时显示在线/离线数量和在线率
2. **或保持独立但增强**: 单独显示但添加状态指示和关联信息

## 🚀 具体迁移步骤

### Phase 1: 在线设备统计预设

#### 1.1 在线设备预设配置
```typescript
// src/card2.1/components/statistic-card/presets/online-devices.ts
import type { ComponentPreset } from '@/card2.1/core/types'
import { deviceStatusDataSource } from '../data-sources/device-status'

export const onlineDevicesPreset: ComponentPreset = {
  id: 'online-devices-count',
  name: '在线设备数',
  description: '显示当前在线设备数量统计',
  
  config: {
    title: 'card.onlineDev',
    icon: 'fa-wifi',
    gradientColors: ['#865ec0', '#5144b4'], // 紫色渐变
    unit: '',
    animationDuration: 2000,
    
    // 设备状态特有配置
    showOnlineRate: true,           // 显示在线率
    showStatusIndicator: true,      // 显示状态指示器
    lowOnlineThreshold: 70,         // 在线率低于70%警告
    criticalOnlineThreshold: 50,    // 在线率低于50%严重警告
    
    // 关联显示
    showRelatedOffline: true,       // 显示关联的离线设备信息
    enableStatusAnimation: true     // 启用状态动画
  },
  
  // 数据绑定配置
  dataBinding: {
    dataSources: [deviceStatusDataSource],
    updateTriggers: ['mount', 'timer'],
    timerConfig: {
      interval: 30000  // 30秒刷新，设备状态变化较快
    }
  },
  
  // 布局配置
  defaultLayout: {
    canvas: { width: 300, height: 180 },
    gridstack: { w: 3, h: 2, minH: 2, minW: 2 }
  }
}
```

#### 1.2 设备状态数据源
```typescript
// src/card2.1/components/statistic-card/data-sources/device-status.ts
import { sumData, totalNumber } from '@/service/api'
import { useAuthStore } from '@/store/modules/auth'
import type { DataSourceConfig } from '@/card2.1/core/data-binding/types'

export const deviceStatusDataSource: DataSourceConfig = {
  type: 'api',
  name: '设备状态统计',
  description: '获取设备在线/离线状态统计',
  
  config: {
    // 动态API选择 (与access组件相同逻辑)
    endpoint: async () => {
      const authStore = useAuthStore()
      const isTenantAdmin = authStore.userInfo?.authority === 'TENANT_ADMIN'
      return isTenantAdmin ? sumData() : totalNumber()
    },
    
    // 数据转换 - 计算在线状态信息
    transform: (response: any) => {
      const data = response?.data || {}
      const onlineCount = data.device_on || 0
      const totalCount = data.device_total || 0
      const offlineCount = totalCount - onlineCount
      const onlineRate = totalCount > 0 ? Math.round((onlineCount / totalCount) * 100) : 0
      
      return {
        // 基础数据
        value: onlineCount,
        totalDevices: totalCount,
        offlineDevices: offlineCount,
        
        // 计算数据
        onlineRate: onlineRate,
        
        // 状态判断
        statusLevel: getOnlineStatusLevel(onlineRate),
        statusText: getOnlineStatusText(onlineRate),
        
        // 关联信息
        relatedInfo: {
          offline: offlineCount,
          total: totalCount
        }
      }
    },
    
    // 错误处理
    errorHandler: (error: any) => {
      console.error('获取设备状态统计失败:', error)
      return {
        value: 0,
        totalDevices: 0,
        offlineDevices: 0,
        onlineRate: 0,
        statusLevel: 'unknown',
        statusText: '无法获取',
        relatedInfo: { offline: 0, total: 0 }
      }
    }
  }
}

// 在线状态等级判断
function getOnlineStatusLevel(onlineRate: number): string {
  if (onlineRate >= 90) return 'excellent'      // 优秀
  if (onlineRate >= 80) return 'good'           // 良好
  if (onlineRate >= 70) return 'normal'         // 正常
  if (onlineRate >= 50) return 'warning'        // 警告
  return 'critical'                             // 严重
}

// 在线状态文本
function getOnlineStatusText(onlineRate: number): string {
  const level = getOnlineStatusLevel(onlineRate)
  const statusTexts = {
    'excellent': '设备在线率优秀',
    'good': '设备在线率良好', 
    'normal': '设备在线率正常',
    'warning': '设备在线率偏低',
    'critical': '设备在线率严重偏低'
  }
  return statusTexts[level] || '状态未知'
}
```

### Phase 2: 增强功能实现

#### 2.1 在线设备状态增强版本
```vue
<!-- 增强版在线设备统计卡片 -->
<script setup lang="ts">
// 在线状态颜色
const onlineStatusColors = computed(() => {
  const statusLevel = data.value?.statusLevel || 'normal'
  const colorMap = {
    'excellent': ['#10b981', '#059669'],    // 绿色 - 优秀
    'good': ['#865ec0', '#5144b4'],         // 紫色 - 良好 (原色)
    'normal': ['#3b82f6', '#1d4ed8'],       // 蓝色 - 正常  
    'warning': ['#f59e0b', '#d97706'],      // 橙色 - 警告
    'critical': ['#ef4444', '#dc2626']      // 红色 - 严重
  }
  return colorMap[statusLevel] || colorMap['normal']
})

// 在线率
const onlineRate = computed(() => data.value?.onlineRate || 0)

// 状态指示器
const statusIndicator = computed(() => {
  const level = data.value?.statusLevel || 'normal'
  return {
    level,
    color: onlineStatusColors.value[0],
    text: data.value?.statusText || '状态正常'
  }
})

// WiFi信号强度图标 (根据在线率)
const wifiIcon = computed(() => {
  const rate = onlineRate.value
  if (rate >= 80) return 'fa-wifi'           // 满信号
  if (rate >= 60) return 'fa-wifi-3'         // 强信号  
  if (rate >= 40) return 'fa-wifi-2'         // 中信号
  if (rate >= 20) return 'fa-wifi-1'         // 弱信号
  return 'fa-wifi-slash'                     // 无信号
})
</script>

<template>
  <GradientBg 
    class="online-devices-card"
    :start-color="onlineStatusColors[0]"
    :end-color="onlineStatusColors[1]"
  >
    <!-- 标题和在线率 -->
    <div class="header">
      <h3 class="title">{{ displayTitle }}</h3>
      
      <!-- 在线率显示 -->
      <div v-if="config.showOnlineRate" class="online-rate">
        <span class="rate-text">{{ onlineRate }}%</span>
      </div>
    </div>
    
    <!-- 内容区域 -->
    <div class="content">
      <!-- WiFi图标 -->
      <div class="icon-container">
        <SvgIcon 
          :icon="wifiIcon"
          class="wifi-icon"
          :class="{ 
            'signal-excellent': onlineRate >= 80,
            'signal-good': onlineRate >= 60 && onlineRate < 80,
            'signal-weak': onlineRate < 60,
            'signal-animation': config.enableStatusAnimation && onlineRate >= 80
          }"
        />
        
        <!-- 信号强度指示器 -->
        <div v-if="config.showStatusIndicator" class="signal-bars">
          <div 
            v-for="i in 4" 
            :key="i"
            class="signal-bar"
            :class="{ 
              active: onlineRate >= (i * 20),
              excellent: onlineRate >= 80,
              good: onlineRate >= 60 && onlineRate < 80,
              weak: onlineRate < 60
            }"
          ></div>
        </div>
      </div>
      
      <!-- 数值显示 -->
      <div class="value-container">
        <CountTo
          v-if="!loading && !error"
          :start-value="0"
          :end-value="displayValue"
          :duration="config.animationDuration"
          class="device-count"
        />
        
        <!-- 状态文本 -->
        <div class="status-text">
          {{ statusIndicator.text }}
        </div>
        
        <!-- 关联信息 -->
        <div v-if="config.showRelatedOffline && data?.relatedInfo" class="related-info">
          <span class="offline-count">
            {{ t('device.offline') }}: {{ data.relatedInfo.offline }}
          </span>
        </div>
      </div>
    </div>
    
    <!-- 在线率进度条 -->
    <div v-if="config.showOnlineRate" class="rate-progress">
      <div class="progress-track">
        <div 
          class="progress-fill"
          :style="{ 
            width: `${onlineRate}%`,
            background: statusIndicator.color 
          }"
        ></div>
      </div>
      <div class="progress-text">
        {{ t('device.totalDevices', { count: data?.totalDevices || 0 }) }}
      </div>
    </div>
  </GradientBg>
</template>

<style scoped>
.online-devices-card {
  position: relative;
  overflow: hidden;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.title {
  font-size: 16px;
  font-weight: 500;
  color: white;
  margin: 0;
}

.online-rate {
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 8px;
  border-radius: 12px;
}

.rate-text {
  color: white;
  font-weight: 600;
  font-size: 12px;
}

.content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.icon-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.wifi-icon {
  font-size: 32px;
  color: rgba(255, 255, 255, 0.9);
  transition: all 0.3s ease;
}

.signal-excellent { color: white; }
.signal-good { color: rgba(255, 255, 255, 0.9); }
.signal-weak { color: rgba(255, 255, 255, 0.6); }

.signal-animation {
  animation: wifiPulse 2s infinite;
}

@keyframes wifiPulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.9;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
}

/* 信号强度指示器 */
.signal-bars {
  display: flex;
  gap: 2px;
  align-items: flex-end;
}

.signal-bar {
  width: 3px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 1px;
  transition: all 0.3s ease;
}

.signal-bar:nth-child(1) { height: 6px; }
.signal-bar:nth-child(2) { height: 9px; }
.signal-bar:nth-child(3) { height: 12px; }
.signal-bar:nth-child(4) { height: 15px; }

.signal-bar.active.excellent { background: #ffffff; }
.signal-bar.active.good { background: rgba(255, 255, 255, 0.9); }
.signal-bar.active.weak { background: rgba(255, 255, 255, 0.6); }

.value-container {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.device-count {
  font-size: 30px;
  font-weight: bold;
  color: white;
  line-height: 1;
}

.status-text {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.8);
  text-align: right;
}

.related-info {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
}

/* 在线率进度条 */
.rate-progress {
  margin-top: 8px;
}

.progress-track {
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.5s ease;
}

.progress-text {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 4px;
  text-align: center;
}
</style>
```

## ✅ 迁移验证清单

### 功能对等验证
- [ ] **数据获取**: 在线设备数正确获取并显示
- [ ] **权限判断**: 根据用户权限调用对应API
- [ ] **紫色渐变**: 默认渐变颜色与原组件一致
- [ ] **WiFi图标**: 图标显示正确
- [ ] **动画效果**: CountTo动画与原组件一致

### 增强功能验证
- [ ] **在线率计算**: 正确计算并显示在线率百分比
- [ ] **智能配色**: 根据在线率自动调整卡片颜色
- [ ] **WiFi信号图标**: 根据在线率显示不同强度的WiFi图标
- [ ] **状态指示器**: 信号强度条正确显示当前在线状况
- [ ] **关联信息**: 显示离线设备数量
- [ ] **进度条**: 在线率进度条正确反映当前状态
- [ ] **状态动画**: 在线率高时WiFi图标脉冲动画

## 🎯 预期收益

### 设备监控增强
- **状态感知**: 通过颜色和图标直观显示设备在线健康状况
- **信息丰富**: 不仅显示数量，还显示在线率和状态评级
- **视觉优化**: 动态WiFi图标和信号强度指示器
- **关联展示**: 同时显示在线、离线和总设备数信息

### 运维价值提升
- **快速判断**: 管理员可以快速识别设备在线状况
- **预警机制**: 在线率低时自动变色警告
- **趋势感知**: 通过颜色变化感知设备状态趋势

该组件通过合并到StatisticCard模板获得标准化架构，同时针对设备监控场景进行了专门的功能增强，为设备管理提供更直观、更实用的监控信息。