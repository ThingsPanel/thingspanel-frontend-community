# 交互系统详解 - 组件间交互与事件响应

Card 2.1的交互系统让组件能够响应用户操作，并与其他组件进行数据交换和联动。本章详细介绍如何配置和使用组件交互功能。

## 🎯 系统概述

### 交互系统架构
```
用户操作 → 事件触发 → 交互引擎处理 → 响应动作执行 → 目标组件更新
```

### 核心概念
- **事件源**：触发交互的组件
- **事件类型**：用户操作的种类（点击、悬停、数据变化等）
- **响应动作**：对事件的处理方式（跳转、修改、通知等）
- **目标组件**：接收交互结果的组件

## 🎪 交互能力声明

### 在definition.ts中声明交互能力

```typescript
// definition.ts
export const componentDefinition = {
  type: 'interactive-chart',
  name: '交互式图表',
  
  // 交互系统配置
  interaction: {
    capability: {
      // 🎯 支持的事件类型
      supportedEvents: [
        'click',           // 点击事件
        'doubleClick',     // 双击事件
        'hover',           // 悬停事件
        'dataChange',      // 数据变化事件
        'statusChange',    // 状态变化事件
        'customEvent'      // 自定义事件
      ],
      
      // 🔧 支持的响应动作
      supportedActions: [
        'jump',            // 页面跳转
        'modify',          // 修改属性
        'notify',          // 发送通知
        'refresh',         // 刷新数据
        'toggle'           // 切换状态
      ],
      
      // 🛡️ 默认权限配置
      defaultPermissions: {
        allowExternalControl: true,        // 允许外部控制
        requirePermissionCheck: false      // 是否需要权限检查
      },
      
      // 📊 可监听的属性列表
      listenableProperties: [
        'selectedData',    // 选中的数据
        'chartType',       // 图表类型
        'filterValue',     // 过滤条件
        'isLoading',       // 加载状态
        'errorMessage'     // 错误信息
      ]
    }
  }
}
```

## 🎬 事件类型详解

### 1. 用户交互事件

#### 点击事件 (click)
```vue
<template>
  <div class="chart-container" @click="handleClick">
    <!-- 图表内容 -->
  </div>
</template>

<script setup lang="ts">
import { useInteractionEmitter } from '@/card2.1/hooks/useInteractionEmitter'

const { emitEvent } = useInteractionEmitter()

/**
 * 处理点击事件
 */
const handleClick = (event: MouseEvent) => {
  // 触发交互事件
  emitEvent('click', {
    clickPosition: { x: event.clientX, y: event.clientY },
    timestamp: new Date(),
    elementType: 'chart-area'
  })
}
</script>
```

#### 数据点选择事件
```vue
<script setup lang="ts">
const handleDataPointClick = (dataPoint: any) => {
  // 更新选中状态
  selectedData.value = dataPoint
  
  // 触发数据变化事件
  emitEvent('dataChange', {
    eventType: 'selection',
    selectedItem: dataPoint,
    selectionCount: 1,
    data: dataPoint
  })
}
</script>
```

### 2. 状态变化事件

#### 数据加载状态变化
```vue
<script setup lang="ts">
import { watch } from 'vue'

// 监听加载状态变化
watch(isLoading, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    emitEvent('statusChange', {
      property: 'isLoading',
      oldValue,
      newValue,
      timestamp: new Date()
    })
  }
})
</script>
```

## 🎯 响应动作类型

### 1. 页面跳转 (jump)

```typescript
// 跳转动作配置
const jumpAction = {
  action: 'jump',
  jumpConfig: {
    type: 'route',                    // 跳转类型：'route' | 'url' | 'modal'
    target: '/dashboard/detail',      // 目标路径
    params: {                        // 跳转参数
      id: '{{selectedData.id}}',     // 使用模板变量
      type: 'chart-detail'
    },
    openInNewTab: true               // 是否在新标签页打开
  }
}
```

### 2. 属性修改 (modify)

```typescript
// 属性修改动作配置
const modifyAction = {
  action: 'modify',
  modifyConfig: {
    targetComponentId: 'target-chart-123',     // 目标组件ID
    targetProperty: 'filterValue',             // 目标属性
    updateValue: '{{selectedData.category}}',  // 更新值（支持模板）
    updateMode: 'replace'                      // 更新模式：'replace' | 'merge' | 'append'
  }
}
```

### 3. 通知消息 (notify)

```typescript
// 通知动作配置
const notifyAction = {
  action: 'notify',
  notifyConfig: {
    type: 'success',                          // 通知类型
    title: '操作成功',
    message: '数据点 {{selectedData.name}} 已选中',
    duration: 3000,                          // 显示时长
    showIcon: true
  }
}
```

## 🔗 完整交互配置示例

### 数据监控面板交互配置

```typescript
// definition.ts 中的交互配置示例
export const dataMonitorDefinition = {
  type: 'data-monitor-panel',
  name: '数据监控面板',
  
  interaction: {
    capability: {
      supportedEvents: ['click', 'dataChange', 'alarm'],
      supportedActions: ['jump', 'modify', 'notify'],
      defaultPermissions: {
        allowExternalControl: true,
        requirePermissionCheck: false
      },
      listenableProperties: [
        'currentValue',
        'alarmStatus', 
        'deviceId',
        'lastUpdateTime'
      ]
    },
    
    // 预设交互示例
    examples: [
      {
        name: '点击查看详情',
        description: '点击数据面板时跳转到设备详情页',
        scenario: 'detail-navigation',
        config: {
          event: 'click',
          responses: [{
            action: 'jump',
            jumpConfig: {
              type: 'route',
              target: '/device/detail',
              params: {
                deviceId: '{{deviceId}}'
              },
              openInNewTab: false
            }
          }],
          enabled: true,
          priority: 1
        }
      },
      
      {
        name: '数据变化联动',
        description: '当数据变化时更新相关图表组件',
        scenario: 'data-sync',
        config: {
          event: 'dataChange',
          responses: [{
            action: 'modify',
            modifyConfig: {
              targetComponentId: 'related-chart-001',
              targetProperty: 'dataSource',
              updateValue: '{{currentValue}}',
              updateMode: 'replace'
            }
          }],
          enabled: true,
          priority: 2
        }
      },
      
      {
        name: '告警通知',
        description: '当检测到告警状态时发送通知',
        scenario: 'alarm-notification',
        config: {
          event: 'alarm',
          condition: 'alarmStatus === "critical"',
          responses: [{
            action: 'notify',
            notifyConfig: {
              type: 'error',
              title: '设备告警',
              message: '设备 {{deviceId}} 出现严重告警',
              duration: 0,  // 0表示不自动消失
              showIcon: true
            }
          }, {
            action: 'modify',
            modifyConfig: {
              targetComponentId: 'alarm-indicator-002',
              targetProperty: 'status',
              updateValue: 'alarm',
              updateMode: 'replace'
            }
          }],
          enabled: true,
          priority: 3
        }
      }
    ]
  }
}
```

## 🎮 交互Hook使用

### useInteractionEmitter - 事件发射器

```vue
<script setup lang="ts">
import { useInteractionEmitter } from '@/card2.1/hooks/useInteractionEmitter'

const { emitEvent, emitStatusChange, emitDataChange } = useInteractionEmitter()

// 触发通用事件
const triggerClick = () => {
  emitEvent('click', {
    target: 'button',
    action: 'confirm'
  })
}

// 触发状态变化
const updateStatus = (newStatus: string) => {
  emitStatusChange('connectionStatus', newStatus)
}

// 触发数据变化
const updateData = (newData: any) => {
  emitDataChange({
    source: 'api',
    data: newData,
    timestamp: new Date()
  })
}
</script>
```

### useInteractionListener - 事件监听器

```vue
<script setup lang="ts">
import { useInteractionListener } from '@/card2.1/hooks/useInteractionListener'

const { 
  onInteractionEvent, 
  onDataChange, 
  onStatusChange 
} = useInteractionListener()

// 监听其他组件的交互事件
onInteractionEvent('target-component-123', 'click', (eventData) => {
  console.log('收到点击事件:', eventData)
  // 处理响应逻辑
})

// 监听数据变化
onDataChange('data-source-456', (newData) => {
  // 更新本组件数据
  localData.value = newData
})

// 监听状态变化
onStatusChange('status-monitor-789', 'alarmStatus', (newStatus) => {
  if (newStatus === 'critical') {
    // 处理告警状态
    showAlarmDialog()
  }
})
</script>
```

## 🌟 高级交互特性

### 1. 条件触发

```typescript
// 带条件的交互配置
{
  event: 'dataChange',
  condition: 'value > 100 && status === "active"',  // JavaScript表达式
  responses: [
    // 响应动作...
  ]
}
```

### 2. 批量响应

```typescript
// 一个事件触发多个响应
{
  event: 'click',
  responses: [
    { action: 'notify', /* 通知配置 */ },
    { action: 'modify', /* 修改配置 */ },
    { action: 'refresh', /* 刷新配置 */ }
  ]
}
```

### 3. 延迟执行

```typescript
// 延迟响应配置
{
  action: 'modify',
  delay: 1000,  // 延迟1秒执行
  modifyConfig: {
    // 修改配置...
  }
}
```

### 4. 交互链式传播

```typescript
// 交互事件的链式传播
{
  event: 'dataChange',
  responses: [{
    action: 'modify',
    modifyConfig: {
      targetComponentId: 'chain-component-001',
      targetProperty: 'triggerValue',
      updateValue: '{{newData}}'
    }
  }],
  // 允许目标组件继续传播交互
  allowChaining: true,
  maxChainDepth: 3  // 最大链式深度
}
```

## 🎨 交互式UI组件实现

### 带交互的图表组件示例

```vue
<template>
  <div class="interactive-chart">
    <div class="chart-header">
      <h3 @click="handleTitleClick">{{ title }}</h3>
      <div class="chart-controls">
        <n-button @click="refreshData" size="small">
          <template #icon>
            <n-icon><RefreshOutline /></n-icon>
          </template>
        </n-button>
      </div>
    </div>
    
    <div 
      class="chart-content"
      @click="handleChartClick"
      @mouseover="handleChartHover"
    >
      <!-- 图表渲染区域 -->
      <canvas ref="chartCanvas"></canvas>
    </div>
    
    <div class="chart-footer" v-if="showFooter">
      <span>选中数据：{{ selectedData?.name || '无' }}</span>
      <span>更新时间：{{ lastUpdate }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RefreshOutline } from '@vicons/ionicons5'
import { useInteractionEmitter } from '@/card2.1/hooks/useInteractionEmitter'

interface Props {
  title?: string
  data?: any[]
  showFooter?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '交互式图表',
  data: () => [],
  showFooter: true
})

const emit = defineEmits<{
  dataSelect: [data: any]
  titleClick: [title: string]
  refresh: []
}>()

// 交互系统
const { emitEvent, emitDataChange, emitStatusChange } = useInteractionEmitter()

// 组件状态
const chartCanvas = ref<HTMLCanvasElement>()
const selectedData = ref<any>(null)
const isLoading = ref(false)
const lastUpdate = ref(new Date().toLocaleString())

/**
 * 处理标题点击
 */
const handleTitleClick = () => {
  emit('titleClick', props.title)
  
  // 触发交互事件
  emitEvent('click', {
    target: 'title',
    title: props.title,
    timestamp: new Date()
  })
}

/**
 * 处理图表区域点击
 */
const handleChartClick = (event: MouseEvent) => {
  const rect = chartCanvas.value?.getBoundingClientRect()
  if (!rect) return
  
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  
  // 根据坐标确定点击的数据点（示例逻辑）
  const clickedDataPoint = findDataPointAtPosition(x, y)
  
  if (clickedDataPoint) {
    selectedData.value = clickedDataPoint
    emit('dataSelect', clickedDataPoint)
    
    // 触发数据变化事件
    emitDataChange({
      eventType: 'selection',
      selectedData: clickedDataPoint,
      position: { x, y }
    })
  }
}

/**
 * 处理图表悬停
 */
const handleChartHover = (event: MouseEvent) => {
  // 触发悬停事件
  emitEvent('hover', {
    target: 'chart-area',
    timestamp: new Date()
  })
}

/**
 * 刷新数据
 */
const refreshData = async () => {
  isLoading.value = true
  emitStatusChange('isLoading', true)
  
  emit('refresh')
  
  try {
    // 模拟数据刷新
    await new Promise(resolve => setTimeout(resolve, 1000))
    lastUpdate.value = new Date().toLocaleString()
    
    // 触发数据刷新事件
    emitEvent('dataRefresh', {
      timestamp: new Date(),
      success: true
    })
  } catch (error) {
    emitEvent('error', {
      message: '数据刷新失败',
      error
    })
  } finally {
    isLoading.value = false
    emitStatusChange('isLoading', false)
  }
}

/**
 * 根据位置查找数据点（示例实现）
 */
const findDataPointAtPosition = (x: number, y: number) => {
  // 实际实现中会根据图表类型和数据结构来确定
  // 这里只是示例
  return props.data.find((item, index) => {
    const itemX = (index * 50) + 25
    const itemY = 100 - (item.value * 2)
    return Math.abs(x - itemX) < 20 && Math.abs(y - itemY) < 20
  })
}

onMounted(() => {
  // 初始化图表渲染
  initChart()
})

const initChart = () => {
  // 图表初始化逻辑
  // ...
}
</script>

<style scoped>
.interactive-chart {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 16px;
  background: var(--card-color);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.chart-header h3 {
  margin: 0;
  cursor: pointer;
  color: var(--text-color);
  transition: color 0.3s ease;
}

.chart-header h3:hover {
  color: var(--primary-color);
}

.chart-content {
  height: 200px;
  position: relative;
  cursor: pointer;
  border: 1px solid var(--border-color);
  border-radius: 4px;
}

.chart-content canvas {
  width: 100%;
  height: 100%;
}

.chart-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  font-size: 12px;
  color: var(--text-color-2);
}
</style>
```

## ✅ 交互系统最佳实践

### 1. 事件设计原则
- **语义化命名**：使用清晰、有意义的事件名
- **数据完整性**：事件数据包含足够的上下文信息
- **性能考虑**：避免高频事件触发，使用防抖和节流
- **错误处理**：妥善处理交互过程中的异常情况

### 2. 响应动作设计
- **原子操作**：每个动作专注于单一职责
- **可撤销性**：重要操作支持撤销机制
- **用户反馈**：提供操作结果的明确反馈
- **权限控制**：验证操作权限，确保安全性

### 3. 交互配置管理
- **配置复用**：将常用交互配置模板化
- **动态配置**：支持运行时修改交互规则
- **调试支持**：提供交互过程的调试信息
- **性能监控**：监控交互链的执行性能

## 🚨 常见问题解决

### 问题1: 事件不触发
**可能原因**: 事件名称拼写错误或组件未正确注册事件监听
**解决方法**: 检查事件名称和监听器配置

### 问题2: 响应动作执行失败
**可能原因**: 目标组件ID不存在或属性路径错误
**解决方法**: 验证目标组件存在性和属性路径正确性

### 问题3: 交互链死循环
**可能原因**: 交互配置形成循环依赖
**解决方法**: 设置合理的`maxChainDepth`限制和循环检测

### 问题4: 性能问题
**可能原因**: 高频事件触发或复杂响应链
**解决方法**: 使用防抖节流技术，优化响应逻辑

## 🔗 相关文档

- [属性暴露系统](./07-property-exposure.md)
- [组件定义详解](./04-component-definition.md)
- [调试工具](./15-debugging-tools.md)
- [API参考](./18-api-reference.md)

---

**通过交互系统，让组件真正"活"起来！** 🎭