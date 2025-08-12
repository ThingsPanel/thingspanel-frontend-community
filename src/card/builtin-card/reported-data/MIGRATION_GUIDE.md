# Reported-Data 组件迁移指南

## 📋 组件概述

### 基本信息
- **组件ID**: `reported-data`
- **组件名称**: 设备上报数据卡片
- **文件路径**: `src/card/builtin-card/reported-data/`
- **组件类型**: 实时数据监控卡片
- **当前状态**: ✅ 代码质量优秀，功能完善

### 功能描述
展示设备最新上报的遥测数据，提供实时数据监控功能。支持多设备数据展示、自动刷新、数据格式化、相对时间显示，为用户提供直观的设备数据监控界面。

## 🔧 技术分析

### 使用的API接口
```typescript
// 主要API
getLatestTelemetryData(): Promise<{
  data: DeviceData[] | null
  error: any
}>

interface DeviceData {
  device_id: string          // 设备ID
  device_name: string        // 设备名称
  is_online: number          // 在线状态 (1在线/0离线)
  last_push_time: string     // 最后推送时间
  telemetry_data: TelemetryItem[]  // 遥测数据数组
}

interface TelemetryItem {
  key: string               // 数据键名
  label: string | null      // 显示标签
  unit: string | null       // 数据单位
  value: any                // 数据值
}
```

### 技术依赖
- **Vue 3**: Composition API, `<script setup>`
- **Naive UI**: 完整的NCard、NSpin、NEmpty等组件集成
- **Vue Router**: 导航到设备管理页面
- **国际化**: `$t()` 和 `useI18n()` 混合使用
- **时间处理**: dayjs + relativeTime插件
- **自定义组件**: `BottomUpInfiniteScroller` 遥测数据滚动器

### 核心功能特性
1. **实时数据展示**: 显示设备最新遥测数据
2. **自动刷新**: 6秒间隔自动刷新数据
3. **智能格式化**: 根据数据类型和单位智能格式化显示
4. **相对时间**: 显示数据推送的相对时间
5. **在线状态**: 实时显示设备在线/离线状态
6. **数据滚动**: 双列遥测数据滚动显示
7. **刷新控制**: 支持手动启用/停止自动刷新
8. **错误处理**: 完善的错误处理和空状态显示

## ❌ 存在问题

### 代码质量问题
1. **国际化使用不一致**:
   ```typescript
   // ❌ 问题: 混合使用两种国际化方式
   import { $t } from '@/locales'        // 直接导入
   import { useI18n } from 'vue-i18n'    // Hook方式 (未使用)
   
   // ✅ 建议: 统一使用Hook方式
   const { t } = useI18n()
   ```

2. **过度的内联样式**:
   ```vue
   <!-- ❌ 问题: 大量使用内联样式影响主题适配 -->
   <div :style="{ color: 'var(--n-text-color)' }">
   
   <!-- ✅ 建议: 使用CSS类和主题变量 -->
   <div class="device-name">
   ```

3. **硬编码刷新间隔**:
   ```typescript
   // ❌ 问题: 硬编码刷新间隔
   const REFRESH_INTERVAL = 6000
   
   // ✅ 建议: 支持配置化
   const refreshInterval = computed(() => props.config.refreshInterval || 6000)
   ```

### 功能局限性
1. **设备选择**: 无法选择要监控的特定设备
2. **数据过滤**: 无法过滤或选择要显示的数据字段
3. **数据历史**: 只显示最新数据，无历史趋势
4. **告警集成**: 数据异常时没有告警提示
5. **数据导出**: 无法导出数据用于分析

### 性能考虑
1. **轮询开销**: 6秒轮询可能造成不必要的网络请求
2. **数据量**: 大量设备时可能影响性能
3. **内存泄漏**: 组件卸载时需确保清理定时器

## 🔄 迁移建议

### 迁移策略: 保持独立并增强实时监控功能
**建议保持为独立的实时数据监控组件，专注于设备数据监控功能**

#### 原因分析
1. **功能独特**: 实时数据监控具有特殊的业务价值
2. **复杂度高**: 涉及实时刷新、数据格式化、滚动展示等复杂逻辑
3. **扩展性强**: 可以发展为完整的设备监控解决方案
4. **用户需求**: 物联网场景下的核心功能

## 🚀 具体迁移步骤

### Phase 1: 创建Card 2.1实时监控组件

#### 1.1 组件定义
```typescript
// src/card2.1/components/device-telemetry-monitor/component-definition.ts
import type { ComponentDefinition } from '@/card2.1/core/types'

export const deviceTelemetryMonitorDefinition: ComponentDefinition = {
  type: 'DeviceTelemetryMonitor',
  name: '设备遥测监控',
  description: '实时监控设备上报的遥测数据',
  category: 'device-monitoring',
  
  // 数据需求
  dataRequirement: {
    fields: {
      devices: {
        type: 'array',
        arrayItemType: 'object',
        required: true,
        description: '设备遥测数据列表',
        properties: {
          device_id: { type: 'string', description: '设备ID' },
          device_name: { type: 'string', description: '设备名称' },
          is_online: { type: 'number', description: '在线状态' },
          last_push_time: { type: 'string', description: '最后推送时间' },
          telemetry_data: { 
            type: 'array', 
            description: '遥测数据',
            arrayItemType: 'object'
          }
        }
      }
    }
  },
  
  // 配置选项
  config: {
    title: {
      type: 'string',
      default: '设备上报数据',
      label: '标题'
    },
    maxDevices: {
      type: 'number',
      default: 5,
      min: 1,
      max: 20,
      label: '最大设备数'
    },
    refreshInterval: {
      type: 'number',
      default: 6000,
      min: 3000,
      max: 60000,
      label: '刷新间隔(毫秒)'
    },
    autoRefresh: {
      type: 'boolean',
      default: true,
      label: '自动刷新'
    },
    showOfflineDevices: {
      type: 'boolean',
      default: true,
      label: '显示离线设备'
    },
    dataDisplayMode: {
      type: 'select',
      options: [
        { label: '双列显示', value: 'columns' },
        { label: '单列显示', value: 'single' },
        { label: '表格显示', value: 'table' }
      ],
      default: 'columns',
      label: '数据显示模式'
    },
    highlightRecent: {
      type: 'boolean',
      default: true,
      label: '突出显示最新数据'
    },
    enableDataFilter: {
      type: 'boolean',
      default: false,
      label: '启用数据过滤'
    },
    filterKeys: {
      type: 'array',
      itemType: 'string',
      default: [],
      label: '过滤数据键'
    },
    enableAlerts: {
      type: 'boolean',
      default: false,
      label: '启用数据告警'
    },
    alertRules: {
      type: 'array',
      itemType: 'object',
      default: [],
      label: '告警规则'
    }
  }
}
```

#### 1.2 增强版组件实现
```vue
<!-- src/card2.1/components/device-telemetry-monitor/DeviceTelemetryMonitor.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/store/modules/theme'
import { useCard2DataBinding } from '@/card2.1/hooks/useCard2DataBinding'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import BottomUpInfiniteScroller from '@/components/BottomUpInfiniteScroller.vue'

dayjs.extend(relativeTime)

interface Props {
  config: {
    title: string
    maxDevices: number
    refreshInterval: number
    autoRefresh: boolean
    showOfflineDevices: boolean
    dataDisplayMode: 'columns' | 'single' | 'table'
    highlightRecent: boolean
    enableDataFilter: boolean
    filterKeys: string[]
    enableAlerts: boolean
    alertRules: Array<{
      key: string
      condition: 'gt' | 'lt' | 'eq' | 'ne'
      value: any
      message: string
    }>
  }
  dataBinding?: any
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({
    title: '设备上报数据',
    maxDevices: 5,
    refreshInterval: 6000,
    autoRefresh: true,
    showOfflineDevices: true,
    dataDisplayMode: 'columns',
    highlightRecent: true,
    enableDataFilter: false,
    filterKeys: [],
    enableAlerts: false,
    alertRules: []
  })
})

const { t } = useI18n()
const router = useRouter()
const themeStore = useThemeStore()

// Card 2.1 数据绑定
const { data, loading, error, refresh } = useCard2DataBinding({
  componentType: 'DeviceTelemetryMonitor',
  dataBinding: props.dataBinding
})

// 自动刷新控制
const isAutoRefreshing = ref(props.config.autoRefresh)
const refreshIntervalId = ref<ReturnType<typeof setInterval> | null>(null)
const isFetchingUpdate = ref(false)

// 处理设备数据
const processedDevices = computed(() => {
  const devices = data.value?.devices || []
  if (!Array.isArray(devices)) return []
  
  let filteredDevices = devices
  
  // 过滤离线设备
  if (!props.config.showOfflineDevices) {
    filteredDevices = devices.filter(device => device.is_online === 1)
  }
  
  // 限制设备数量
  filteredDevices = filteredDevices.slice(0, props.config.maxDevices)
  
  // 处理每个设备的遥测数据
  return filteredDevices.map(device => ({
    ...device,
    telemetry_data: filterTelemetryData(device.telemetry_data || []),
    hasAlerts: checkDeviceAlerts(device)
  }))
})

// 过滤遥测数据
const filterTelemetryData = (telemetryData: any[]) => {
  if (!props.config.enableDataFilter || !props.config.filterKeys.length) {
    return telemetryData
  }
  
  return telemetryData.filter(item => 
    props.config.filterKeys.includes(item.key)
  )
}

// 检查设备告警
const checkDeviceAlerts = (device: any): boolean => {
  if (!props.config.enableAlerts || !props.config.alertRules.length) {
    return false
  }
  
  return props.config.alertRules.some(rule => {
    const telemetryItem = device.telemetry_data?.find((item: any) => item.key === rule.key)
    if (!telemetryItem) return false
    
    const value = Number(telemetryItem.value)
    const threshold = Number(rule.value)
    
    switch (rule.condition) {
      case 'gt': return value > threshold
      case 'lt': return value < threshold
      case 'eq': return value === threshold
      case 'ne': return value !== threshold
      default: return false
    }
  })
}

// 双列遥测数据配对
const getPairedTelemetry = (telemetry: any[]) => {
  if (!Array.isArray(telemetry)) return []
  const paired = []
  for (let i = 0; i < telemetry.length; i += 2) {
    paired.push({
      left: telemetry[i] || null,
      right: telemetry[i + 1] || null
    })
  }
  return paired
}

// 自动刷新控制
const startAutoRefresh = () => {
  stopAutoRefresh()
  if (!isAutoRefreshing.value) return
  
  refreshIntervalId.value = setInterval(() => {
    isFetchingUpdate.value = true
    refresh().finally(() => {
      isFetchingUpdate.value = false
    })
  }, props.config.refreshInterval)
}

const stopAutoRefresh = () => {
  if (refreshIntervalId.value) {
    clearInterval(refreshIntervalId.value)
    refreshIntervalId.value = null
  }
}

const toggleAutoRefresh = () => {
  isAutoRefreshing.value = !isAutoRefreshing.value
  if (isAutoRefreshing.value) {
    refresh()
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
}

// 格式化相对时间
const formatRelativeTime = (timeStr: string): string => {
  if (!timeStr) return '-'
  const time = dayjs(timeStr)
  if (!time.isValid()) return '-'
  const now = dayjs()
  if (now.diff(time, 'minute') < 1) return t('time.justNow')
  return time.fromNow()
}

// 格式化数据值
const formatValue = (item: any): string => {
  if (!item || item.value === null || item.value === undefined) return '-'
  
  const value = item.value
  const unit = item.unit
  let displayValue = ''
  
  if (typeof value === 'boolean') {
    displayValue = value ? t('common.on') : t('common.off')
  } else if (typeof value === 'number') {
    // 温度和湿度保留一位小数
    if ((item.key === 'temperature' || item.key === 'humidity') && !Number.isInteger(value)) {
      displayValue = value.toFixed(1)
    } else {
      displayValue = String(value)
    }
  } else {
    displayValue = String(value)
  }
  
  // 添加单位
  if (unit) {
    if (['%', '°C', '°F'].includes(unit)) {
      displayValue += unit
    } else if (unit.trim()) {
      displayValue += ` ${unit.trim()}`
    }
  }
  
  return displayValue
}

// 获取设备状态样式
const getDeviceStatusClass = (device: any, index: number) => {
  const classes = ['device-item']
  
  if (props.config.highlightRecent && index === 0) {
    classes.push('is-latest')
  }
  
  if (device.is_online === 0) {
    classes.push('is-offline')
  }
  
  if (device.hasAlerts) {
    classes.push('has-alerts')
  }
  
  return classes
}

// 跳转到设备管理
const navigateToDeviceManagement = () => {
  router.push('/device/manage')
}

// 生命周期管理
onMounted(() => {
  if (isAutoRefreshing.value) {
    startAutoRefresh()
  }
})

onUnmounted(() => {
  stopAutoRefresh()
})

// 监听配置变化
watch(() => props.config.refreshInterval, () => {
  if (isAutoRefreshing.value) {
    startAutoRefresh()
  }
})
</script>

<template>
  <div class="telemetry-monitor-card">
    <!-- 标题和控制区域 -->
    <div class="header">
      <h3 class="title">{{ t(config.title) }}</h3>
      
      <div class="controls">
        <!-- 自动刷新切换 -->
        <n-button
          size="small"
          :type="isAutoRefreshing ? 'primary' : 'default'"
          :loading="isFetchingUpdate && !loading"
          @click="toggleAutoRefresh"
        >
          <template #icon>
            <n-icon>
              <component :is="isAutoRefreshing ? 'PauseOutline' : 'PlayOutline'" />
            </n-icon>
          </template>
          {{ isAutoRefreshing ? t('common.pause') : t('common.start') }}
        </n-button>
      </div>
    </div>
    
    <!-- 内容区域 -->
    <div class="content">
      <!-- 加载状态 -->
      <n-spin :show="loading || isFetchingUpdate">
        <!-- 错误状态 -->
        <n-alert v-if="error && !loading" type="error" :title="t('common.error')">
          {{ error.message || t('device.fetchDataError') }}
        </n-alert>
        
        <!-- 无数据状态 -->
        <n-empty
          v-else-if="!loading && processedDevices.length === 0"
          size="small"
          :description="t('device.noReportedData')"
        />
        
        <!-- 设备列表 -->
        <div v-else class="devices-list">
          <div
            v-for="(device, index) in processedDevices"
            :key="device.device_id"
            :class="getDeviceStatusClass(device, index)"
          >
            <!-- 设备头部 -->
            <div class="device-header">
              <div class="device-info">
                <n-icon size="16" class="device-icon">
                  <component :is="'HardwareChipOutline'" />
                </n-icon>
                <span class="device-name" :title="device.device_name">
                  {{ device.device_name }}
                </span>
                <n-tag
                  :type="device.is_online === 1 ? 'success' : 'default'"
                  size="small"
                  round
                >
                  {{ device.is_online === 1 ? t('device.online') : t('device.offline') }}
                </n-tag>
                
                <!-- 告警指示器 -->
                <n-badge v-if="device.hasAlerts" dot type="error" class="alert-indicator" />
              </div>
              
              <div class="last-update">
                <n-icon size="12" class="time-icon">
                  <component :is="'TimeOutline'" />
                </n-icon>
                {{ formatRelativeTime(device.last_push_time) }}
              </div>
            </div>
            
            <!-- 遥测数据 -->
            <div class="telemetry-container">
              <!-- 双列模式 -->
              <BottomUpInfiniteScroller
                v-if="config.dataDisplayMode === 'columns' && device.telemetry_data?.length"
                :list="getPairedTelemetry(device.telemetry_data)"
                height="76px"
                class="telemetry-scroller"
              >
                <template #default="{ item: pair }">
                  <div class="telemetry-row">
                    <!-- 左列 -->
                    <div class="telemetry-item">
                      <template v-if="pair.left">
                        <div class="telemetry-label">{{ pair.left.label || pair.left.key }}</div>
                        <div class="telemetry-value">{{ formatValue(pair.left) }}</div>
                      </template>
                    </div>
                    
                    <!-- 右列 -->
                    <div class="telemetry-item">
                      <template v-if="pair.right">
                        <div class="telemetry-label">{{ pair.right.label || pair.right.key }}</div>
                        <div class="telemetry-value">{{ formatValue(pair.right) }}</div>
                      </template>
                    </div>
                  </div>
                </template>
              </BottomUpInfiniteScroller>
              
              <!-- 无遥测数据 -->
              <div v-else-if="!device.telemetry_data?.length" class="no-telemetry">
                {{ t('device.noTelemetryData') }}
              </div>
            </div>
          </div>
        </div>
      </n-spin>
    </div>
    
    <!-- 底部链接 -->
    <div class="footer">
      <n-button text type="primary" @click="navigateToDeviceManagement">
        {{ t('device.viewAll') }} →
      </n-button>
    </div>
  </div>
</template>

<style scoped>
.telemetry-monitor-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--card-color);
  border-radius: var(--border-radius);
  overflow: hidden;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 16px 0;
  flex-shrink: 0;
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.controls {
  display: flex;
  gap: 8px;
}

.content {
  flex: 1;
  padding: 16px;
  overflow: hidden;
}

.devices-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  overflow-y: auto;
}

.device-item {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px;
  background: var(--body-color);
  transition: all 0.2s ease;
}

.device-item.is-latest {
  border-left: 4px solid var(--primary-color);
  background: var(--primary-color-suppl);
}

.device-item.is-offline {
  opacity: 0.6;
}

.device-item.has-alerts {
  border-color: var(--error-color);
  background: rgba(255, 107, 107, 0.05);
}

.device-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.device-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.device-icon {
  color: var(--primary-color);
  flex-shrink: 0;
}

.device-name {
  font-weight: 500;
  color: var(--text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.alert-indicator {
  margin-left: 4px;
}

.last-update {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-color-3);
  flex-shrink: 0;
}

.time-icon {
  color: var(--text-color-3);
}

.telemetry-container {
  min-height: 60px;
}

.telemetry-scroller {
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.telemetry-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--divider-color);
}

.telemetry-row:last-child {
  border-bottom: none;
}

.telemetry-item {
  min-height: 32px;
}

.telemetry-item:last-child {
  border-left: 1px solid var(--divider-color);
  padding-left: 12px;
}

.telemetry-label {
  font-size: 11px;
  color: var(--text-color-3);
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.telemetry-value {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.no-telemetry {
  font-size: 12px;
  color: var(--text-color-3);
  text-align: center;
  padding: 16px;
}

.footer {
  text-align: center;
  padding: 8px 16px;
  border-top: 1px solid var(--divider-color);
  flex-shrink: 0;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .device-header {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .last-update {
    align-self: flex-end;
  }
}
</style>
```

### Phase 2: 数据源和预设配置

#### 2.1 数据源配置
```typescript
// src/card2.1/components/device-telemetry-monitor/data-sources/latest-telemetry.ts
import { getLatestTelemetryData } from '@/service/api'
import type { DataSourceConfig } from '@/card2.1/core/data-binding/types'

export const latestTelemetryDataSource: DataSourceConfig = {
  type: 'api',
  name: '最新遥测数据',
  description: '获取设备最新上报的遥测数据',
  
  config: {
    endpoint: getLatestTelemetryData,
    
    // 数据转换
    transform: (response: any) => {
      const devices = Array.isArray(response?.data) ? response.data : []
      return {
        devices: devices.map((device: any) => ({
          device_id: device.device_id,
          device_name: device.device_name,
          is_online: device.is_online || 0,
          last_push_time: device.last_push_time,
          telemetry_data: Array.isArray(device.telemetry_data) ? device.telemetry_data : []
        }))
      }
    },
    
    // 错误处理
    errorHandler: (error: any) => {
      console.error('获取设备遥测数据失败:', error)
      return { devices: [] }
    }
  }
}
```

#### 2.2 预设配置
```typescript
// src/card2.1/components/device-telemetry-monitor/presets/reported-data.ts
export const reportedDataPreset: ComponentPreset = {
  id: 'device-reported-data',
  name: '设备上报数据',
  description: '实时监控设备最新上报的遥测数据',
  
  config: {
    title: 'device.reportedData.title',
    maxDevices: 3,
    refreshInterval: 6000,
    autoRefresh: true,
    showOfflineDevices: true,
    dataDisplayMode: 'columns',
    highlightRecent: true,
    enableDataFilter: false,
    filterKeys: [],
    enableAlerts: false,
    alertRules: []
  },
  
  // 数据绑定配置
  dataBinding: {
    dataSources: [latestTelemetryDataSource],
    updateTriggers: ['mount', 'timer'],
    timerConfig: {
      interval: 6000  // 6秒刷新
    }
  },
  
  // 布局配置
  defaultLayout: {
    canvas: { width: 400, height: 320 },
    gridstack: { w: 4, h: 4, minH: 3, minW: 3 }
  }
}
```

## ✅ 迁移验证清单

### 功能对等验证
- [ ] **实时数据**: 正确获取和显示设备遥测数据
- [ ] **自动刷新**: 6秒间隔自动刷新功能正常
- [ ] **数据格式化**: 温度、湿度、布尔值等特殊格式化正确
- [ ] **相对时间**: 最后推送时间的相对时间显示正确
- [ ] **在线状态**: 设备在线/离线状态标识正确
- [ ] **双列显示**: 遥测数据双列滚动显示正常
- [ ] **页面跳转**: "查看全部"链接正确跳转

### 增强功能验证
- [ ] **刷新控制**: 手动启用/停止自动刷新功能正常
- [ ] **设备过滤**: 显示/隐藏离线设备功能正常
- [ ] **数据过滤**: 按指定键值过滤遥测数据正常
- [ ] **告警检测**: 基于规则的数据告警检测正常
- [ ] **突出显示**: 最新数据设备高亮显示正常
- [ ] **多显示模式**: 双列、单列、表格显示模式切换正常

## 🎯 预期收益

### 实时监控增强
- **数据洞察**: 实时了解设备运行状态和数据变化
- **告警预警**: 及时发现数据异常和设备故障
- **操作便利**: 灵活的刷新控制和数据过滤
- **视觉优化**: 更好的数据展示和状态指示

### 技术提升
- **架构统一**: 基于Card 2.1架构获得标准化收益
- **配置灵活**: 支持多种显示模式和告警规则配置
- **性能优化**: 优化的数据更新和渲染机制
- **用户体验**: 更友好的交互和错误处理

该组件通过保持独立性并进行功能增强，从基础的数据展示升级为完整的设备遥测监控解决方案。