# Information 组件迁移指南

## 📋 组件概述

### 基本信息
- **组件ID**: `information`
- **组件名称**: 信息展示卡片 (未实现)
- **文件路径**: `src/card/builtin-card/information/`
- **组件类型**: 静态信息展示卡片
- **当前状态**: ⚠️ 组件未实现，仅有占位图

### 功能描述
该组件目录下仅包含 `poster.png` 占位图片，没有实际的组件实现代码。根据命名推测，该组件可能设计用于展示系统信息、使用说明、帮助文档或公告通知等静态信息内容。

## 🔧 技术分析

### 当前文件结构
```
src/card/builtin-card/information/
└── poster.png        # 组件预览图 (唯一文件)
```

### 预期功能 (基于组件名称推测)
根据 `information` 命名，该组件可能用于：
1. **系统信息展示**: 显示系统版本、状态、配置信息
2. **帮助文档**: 展示操作指南、使用说明
3. **公告通知**: 显示重要通知、更新日志
4. **关于页面**: 展示产品信息、版权声明
5. **静态内容**: 展示固定的文本、图片内容

## ❌ 存在问题

### 实现缺失
1. **无组件代码**: 缺少 `component.vue` 主组件文件
2. **无配置文件**: 缺少 `index.ts` 导出配置文件
3. **无类型定义**: 缺少相关的TypeScript类型定义
4. **功能不明确**: 没有明确的功能定义和需求说明

### 设计问题
1. **定位模糊**: 组件用途不明确，与其他组件可能重叠
2. **缺乏规划**: 没有详细的功能规划和设计文档

## 🔄 迁移建议

### 迁移策略: 重新设计和实现
**建议根据实际需求重新设计和实现该组件**

#### 可能的实现方向

#### 方案1: 系统信息面板 ⭐⭐⭐ (推荐)
用于展示系统基本信息、版本、统计等
```vue
<template>
  <div class="system-info-card">
    <h3>系统信息</h3>
    <div class="info-grid">
      <div class="info-item">
        <span class="label">系统版本:</span>
        <span class="value">v2.1.0</span>
      </div>
      <div class="info-item">
        <span class="label">运行时间:</span>
        <span class="value">15天 3小时</span>
      </div>
      <!-- 更多信息... -->
    </div>
  </div>
</template>
```

#### 方案2: 富文本公告卡片 ⭐⭐
用于展示HTML格式的公告、通知
```vue
<template>
  <div class="announcement-card">
    <h3>{{ title }}</h3>
    <div v-html="content" class="content"></div>
    <div class="meta">{{ publishTime }}</div>
  </div>
</template>
```

#### 方案3: 多媒体信息卡片 ⭐
支持图文混排的信息展示
```vue
<template>
  <div class="media-info-card">
    <img v-if="image" :src="image" class="banner">
    <h3>{{ title }}</h3>
    <p class="description">{{ description }}</p>
    <div class="actions">
      <n-button v-if="actionUrl">了解更多</n-button>
    </div>
  </div>
</template>
```

## 🚀 推荐实施方案: 系统信息面板

### Phase 1: 创建Card 2.1系统信息组件

#### 1.1 组件定义
```typescript
// src/card2.1/components/system-info-panel/component-definition.ts
import type { ComponentDefinition } from '@/card2.1/core/types'

export const systemInfoPanelDefinition: ComponentDefinition = {
  type: 'SystemInfoPanel',
  name: '系统信息面板',
  description: '展示系统基本信息、版本和运行状态',
  category: 'system-info',
  
  // 数据需求
  dataRequirement: {
    fields: {
      systemInfo: {
        type: 'object',
        required: true,
        description: '系统信息',
        properties: {
          version: { type: 'string', description: '系统版本' },
          buildTime: { type: 'string', description: '构建时间' },
          uptime: { type: 'number', description: '运行时长(秒)' },
          nodeEnv: { type: 'string', description: '运行环境' },
          serverTime: { type: 'string', description: '服务器时间' },
          totalDevices: { type: 'number', description: '设备总数' },
          activeUsers: { type: 'number', description: '活跃用户数' }
        }
      }
    }
  },
  
  // 配置选项
  config: {
    title: {
      type: 'string',
      default: '系统信息',
      label: '标题'
    },
    displayItems: {
      type: 'array',
      itemType: 'string',
      default: ['version', 'uptime', 'devices', 'users'],
      label: '显示项目'
    },
    layout: {
      type: 'select',
      options: [
        { label: '网格布局', value: 'grid' },
        { label: '列表布局', value: 'list' },
        { label: '卡片布局', value: 'cards' }
      ],
      default: 'grid',
      label: '布局方式'
    },
    showIcon: {
      type: 'boolean',
      default: true,
      label: '显示图标'
    },
    autoRefresh: {
      type: 'boolean',
      default: true,
      label: '自动刷新'
    },
    refreshInterval: {
      type: 'number',
      default: 30000,
      min: 10000,
      max: 300000,
      label: '刷新间隔(毫秒)'
    }
  }
}
```

#### 1.2 组件实现
```vue
<!-- src/card2.1/components/system-info-panel/SystemInfoPanel.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/store/modules/theme'
import { useCard2DataBinding } from '@/card2.1/hooks/useCard2DataBinding'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'

dayjs.extend(duration)

interface Props {
  config: {
    title: string
    displayItems: string[]
    layout: 'grid' | 'list' | 'cards'
    showIcon: boolean
    autoRefresh: boolean
    refreshInterval: number
  }
  dataBinding?: any
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({
    title: '系统信息',
    displayItems: ['version', 'uptime', 'devices', 'users'],
    layout: 'grid',
    showIcon: true,
    autoRefresh: true,
    refreshInterval: 30000
  })
})

const { t } = useI18n()
const themeStore = useThemeStore()

// Card 2.1 数据绑定
const { data, loading, error, refresh } = useCard2DataBinding({
  componentType: 'SystemInfoPanel',
  dataBinding: props.dataBinding
})

// 自动刷新
const refreshIntervalId = ref<ReturnType<typeof setInterval> | null>(null)

// 系统信息配置
const infoItemConfigs = {
  version: {
    label: 'system.version',
    icon: 'CodeOutline',
    getValue: (data: any) => data?.systemInfo?.version || 'Unknown',
    color: '#1890ff'
  },
  buildTime: {
    label: 'system.buildTime', 
    icon: 'CalendarOutline',
    getValue: (data: any) => {
      const buildTime = data?.systemInfo?.buildTime
      return buildTime ? dayjs(buildTime).format('YYYY-MM-DD') : 'Unknown'
    },
    color: '#52c41a'
  },
  uptime: {
    label: 'system.uptime',
    icon: 'TimeOutline',
    getValue: (data: any) => {
      const uptime = data?.systemInfo?.uptime
      if (!uptime) return '未知'
      const duration = dayjs.duration(uptime, 'seconds')
      if (duration.asDays() >= 1) {
        return `${Math.floor(duration.asDays())}天 ${duration.hours()}小时`
      } else if (duration.asHours() >= 1) {
        return `${duration.hours()}小时 ${duration.minutes()}分钟`
      } else {
        return `${duration.minutes()}分钟`
      }
    },
    color: '#faad14'
  },
  environment: {
    label: 'system.environment',
    icon: 'ServerOutline',
    getValue: (data: any) => {
      const env = data?.systemInfo?.nodeEnv || 'production'
      return env === 'production' ? '生产环境' : '开发环境'
    },
    color: env => env === '生产环境' ? '#52c41a' : '#faad14'
  },
  devices: {
    label: 'system.totalDevices',
    icon: 'HardwareChipOutline',
    getValue: (data: any) => (data?.systemInfo?.totalDevices || 0).toLocaleString(),
    color: '#722ed1'
  },
  users: {
    label: 'system.activeUsers',
    icon: 'PeopleOutline', 
    getValue: (data: any) => (data?.systemInfo?.activeUsers || 0).toLocaleString(),
    color: '#eb2f96'
  },
  serverTime: {
    label: 'system.serverTime',
    icon: 'TimeOutline',
    getValue: (data: any) => {
      const serverTime = data?.systemInfo?.serverTime
      return serverTime ? dayjs(serverTime).format('YYYY-MM-DD HH:mm:ss') : dayjs().format('YYYY-MM-DD HH:mm:ss')
    },
    color: '#13c2c2'
  }
}

// 显示的信息项
const displayedItems = computed(() => {
  return props.config.displayItems
    .map(key => ({
      key,
      ...infoItemConfigs[key]
    }))
    .filter(item => item.label) // 过滤掉不存在的配置项
})

// 启动自动刷新
const startAutoRefresh = () => {
  if (refreshIntervalId.value) {
    clearInterval(refreshIntervalId.value)
  }
  
  if (props.config.autoRefresh) {
    refreshIntervalId.value = setInterval(() => {
      refresh()
    }, props.config.refreshInterval)
  }
}

// 停止自动刷新
const stopAutoRefresh = () => {
  if (refreshIntervalId.value) {
    clearInterval(refreshIntervalId.value)
    refreshIntervalId.value = null
  }
}

// 生命周期
onMounted(() => {
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<template>
  <div class="system-info-panel">
    <!-- 标题 -->
    <div class="header">
      <h3 class="title">{{ t(config.title) }}</h3>
      <n-button
        v-if="config.autoRefresh"
        size="small"
        type="primary"
        quaternary
        :loading="loading"
        @click="refresh"
      >
        <template #icon>
          <n-icon><RefreshOutline /></n-icon>
        </template>
      </n-button>
    </div>
    
    <!-- 内容区域 -->
    <div class="content">
      <!-- 错误状态 -->
      <n-alert v-if="error" type="error" :title="t('common.error')">
        {{ error.message || t('system.fetchInfoError') }}
      </n-alert>
      
      <!-- 信息展示 -->
      <div 
        v-else
        :class="[
          'info-container',
          `layout-${config.layout}`
        ]"
      >
        <div
          v-for="item in displayedItems"
          :key="item.key"
          class="info-item"
          :class="{ 'with-icon': config.showIcon }"
        >
          <!-- 图标 -->
          <div v-if="config.showIcon" class="item-icon">
            <n-icon size="20" :color="typeof item.color === 'function' ? item.color(item.getValue(data)) : item.color">
              <component :is="item.icon" />
            </n-icon>
          </div>
          
          <!-- 内容 -->
          <div class="item-content">
            <div class="item-label">{{ t(item.label) }}</div>
            <div class="item-value">
              <n-skeleton v-if="loading" text style="width: 60%" />
              <span v-else>{{ item.getValue(data) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.system-info-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
  background: var(--card-color);
  border-radius: var(--border-radius);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.content {
  flex: 1;
  overflow: hidden;
}

/* 网格布局 */
.info-container.layout-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  height: 100%;
}

/* 列表布局 */
.info-container.layout-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  overflow-y: auto;
}

.layout-list .info-item {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--body-color);
}

/* 卡片布局 */
.info-container.layout-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  height: 100%;
  overflow-y: auto;
}

.layout-cards .info-item {
  flex: 1;
  min-width: 120px;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--body-color);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 信息项 */
.info-item {
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s ease;
}

.info-item.with-icon {
  flex-direction: row;
}

.info-item:not(.with-icon) .item-content {
  text-align: center;
  width: 100%;
}

.item-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--primary-color-suppl);
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-label {
  font-size: 12px;
  color: var(--text-color-3);
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .info-container.layout-grid {
    grid-template-columns: 1fr;
  }
  
  .info-item {
    flex-direction: column;
    text-align: center;
  }
  
  .info-item.with-icon {
    flex-direction: column;
  }
}
</style>
```

### Phase 2: 数据源和预设配置

#### 2.1 数据源配置
```typescript
// src/card2.1/components/system-info-panel/data-sources/system-info.ts
import type { DataSourceConfig } from '@/card2.1/core/data-binding/types'

// 模拟系统信息API (需要后端实现)
async function getSystemInfo() {
  // 这个API需要后端提供
  return {
    version: process.env.VUE_APP_VERSION || '2.1.0',
    buildTime: new Date().toISOString(),
    uptime: Math.floor(Math.random() * 1000000), // 模拟运行时间
    nodeEnv: process.env.NODE_ENV || 'production',
    serverTime: new Date().toISOString(),
    totalDevices: Math.floor(Math.random() * 1000),
    activeUsers: Math.floor(Math.random() * 100)
  }
}

export const systemInfoDataSource: DataSourceConfig = {
  type: 'api',
  name: '系统信息',
  description: '获取系统基本信息和运行状态',
  
  config: {
    endpoint: getSystemInfo,
    
    transform: (response: any) => ({
      systemInfo: {
        version: response.version,
        buildTime: response.buildTime,
        uptime: response.uptime,
        nodeEnv: response.nodeEnv,
        serverTime: response.serverTime,
        totalDevices: response.totalDevices,
        activeUsers: response.activeUsers
      }
    }),
    
    errorHandler: (error: any) => {
      console.error('获取系统信息失败:', error)
      return {
        systemInfo: {
          version: 'Unknown',
          buildTime: new Date().toISOString(),
          uptime: 0,
          nodeEnv: 'unknown',
          serverTime: new Date().toISOString(),
          totalDevices: 0,
          activeUsers: 0
        }
      }
    }
  }
}
```

#### 2.2 预设配置
```typescript
// src/card2.1/components/system-info-panel/presets/system-information.ts
export const systemInformationPreset: ComponentPreset = {
  id: 'system-information-panel',
  name: '系统信息',
  description: '展示系统版本、运行时间、设备数量等基本信息',
  
  config: {
    title: 'system.information',
    displayItems: ['version', 'uptime', 'devices', 'users'],
    layout: 'grid',
    showIcon: true,
    autoRefresh: true,
    refreshInterval: 30000
  },
  
  dataBinding: {
    dataSources: [systemInfoDataSource],
    updateTriggers: ['mount', 'timer'],
    timerConfig: {
      interval: 30000  // 30秒刷新
    }
  },
  
  defaultLayout: {
    canvas: { width: 320, height: 200 },
    gridstack: { w: 4, h: 2, minH: 2, minW: 3 }
  }
}
```

## ✅ 迁移验证清单

### 基本功能验证
- [ ] **组件创建**: 成功创建系统信息面板组件
- [ ] **数据获取**: 正确获取和显示系统信息
- [ ] **信息格式化**: 版本、时间、数量等信息格式化正确
- [ ] **自动刷新**: 定时刷新功能正常工作

### 布局和显示验证
- [ ] **网格布局**: 网格布局下信息项排列正确
- [ ] **列表布局**: 列表布局下信息项垂直排列正确
- [ ] **卡片布局**: 卡片布局下每个信息项独立显示
- [ ] **图标显示**: 信息项图标正确显示并具有合适颜色
- [ ] **响应式**: 不同屏幕尺寸下布局适配正常

### 配置和交互验证
- [ ] **显示项配置**: 可以配置要显示的信息项
- [ ] **刷新控制**: 手动刷新和自动刷新功能正常
- [ ] **错误处理**: 数据获取失败时错误提示正确
- [ ] **加载状态**: 数据加载时骨架屏显示正常

## 🎯 预期收益

### 系统监控价值
- **状态了解**: 管理员可以快速了解系统运行状态
- **版本跟踪**: 清晰显示当前系统版本信息
- **性能感知**: 通过运行时间了解系统稳定性
- **规模概览**: 了解系统中设备和用户的规模

### 用户体验提升
- **信息集中**: 将分散的系统信息集中展示
- **可视化**: 通过图标和颜色提升信息可读性
- **实时性**: 自动刷新保证信息的实时性
- **灵活性**: 支持多种布局方式适应不同使用场景

该组件通过重新设计和实现，将从空白占位符变为实用的系统信息监控工具。