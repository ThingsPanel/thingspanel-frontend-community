# Digit Setter 组件迁移指南

## 📋 组件概述

**digit-setter** 是一个数值设置控制器组件，使用滑块控件允许用户通过拖拽方式调节和发送数值到设备。支持范围配置、步进设置和精度控制。

## 🔍 技术架构分析

### 当前实现结构
```
digit-setter/
├── index.ts           # 组件定义
├── component.vue      # 核心控制逻辑（174 行）
├── card-config.vue    # 配置界面（42 行）
└── poster.png         # 组件预览图
```

### 核心功能特性
1. **滑块控制**: 基于 Naive UI Slider 的数值调节
2. **范围配置**: 支持最小值、最大值和步进设置
3. **精度控制**: 可配置小数位数显示
4. **实时更新**: 拖拽过程中实时发送数据到设备
5. **双向同步**: 支持 WebSocket 数据回显更新
6. **响应式设计**: 根据容器大小自动调整字体

### 数据流程
```
用户拖拽滑块 → 计算数值 → 发送到设备 → WebSocket 回传 → 更新显示
```

## ❗ 现有问题识别

### 1. 🎨 **样式系统问题**
```css
/* 硬编码样式和固定布局 */
.value {
  font-size: 2em;     /* 固定字体大小 */
  font-weight: bold;
}

.unit {
  font-size: 0.8em;   /* 相对字体大小，但基准固定 */
  margin-left: 5px;
}
```
**影响**: 无法适配主题系统，在不同主题下视觉不一致。

### 2. ⚡ **实时更新问题**
```javascript
// 每次滑动都触发 API 调用，可能造成请求过多
const updateValue = async (value: number) => {
  // 立即发送 API 请求，没有防抖处理
  await attributeDataPub(obj)
}
```
**影响**: 频繁的 API 调用可能造成性能问题和服务器压力。

### 3. 🔧 **配置选项有限**
- 只支持滑块控件，无其他输入方式选择
- 缺少数值验证和边界检查
- 没有发送确认或撤销功能
- 无法配置滑块样式和行为

### 4. 📱 **用户体验不足**
```javascript
// 缺少用户反馈机制
const updateValue = async (value: number) => {
  // 发送数据但没有成功/失败提示
  await attributeDataPub(obj)
  detail.value = value  // 直接更新，没有错误处理
}
```

### 5. 🌐 **国际化不完整**
```javascript
// 硬编码默认文本
{{ props.card?.dataSource?.deviceSource?.[0]?.metricsName || $t('generate.device') + '1' }}
```

### 6. 🔒 **缺少安全控制**
- 没有操作权限检查
- 缺少危险值警告
- 无操作日志记录

## 🎯 Card 2.1 迁移策略

### 组件重新设计

#### 1. 组件定义
```typescript
// src/card2.1/components/numeric-controller/index.ts
import type { ComponentDefinition } from '@/card2.1/core/component-definition'

export const NumericControllerDefinition: ComponentDefinition = {
  type: 'numeric-controller',
  name: '数值控制器',
  category: '设备控制',
  description: '通过滑块、输入框或旋钮控制数值参数，支持实时调节和精确设置',
  
  // 数据需求声明
  dataRequirements: {
    currentValue: {
      type: 'number',
      description: '当前数值',
      required: true
    },
    
    targetDevice: {
      type: 'object',
      description: '目标设备信息',
      required: true,
      structure: {
        deviceId: { type: 'string', description: '设备ID' },
        metricsId: { type: 'string', description: '指标ID' },
        metricsName: { type: 'string', description: '指标名称' },
        metricsType: { 
          type: 'string', 
          enum: ['telemetry', 'attributes'],
          description: '指标类型'
        }
      }
    },
    
    constraints: {
      type: 'object',
      description: '数值约束信息',
      structure: {
        min: { type: 'number', description: '最小值' },
        max: { type: 'number', description: '最大值' },
        unit: { type: 'string', description: '数值单位' }
      }
    }
  },
  
  // 配置结构
  config: {
    // 控制器类型配置
    controllerType: {
      type: 'select',
      label: '控制器类型',
      options: [
        { label: '滑块控制', value: 'slider' },
        { label: '数字输入', value: 'input' },
        { label: '旋钮控制', value: 'knob' },
        { label: '步进器', value: 'stepper' }
      ],
      default: 'slider',
      description: '选择数值控制的交互方式'
    },
    
    // 数值范围配置
    rangeConfig: {
      type: 'object',
      label: '数值范围',
      structure: {
        min: {
          type: 'number',
          label: '最小值',
          default: 0,
          description: '允许设置的最小数值'
        },
        
        max: {
          type: 'number',
          label: '最大值',
          default: 100,
          description: '允许设置的最大数值'
        },
        
        step: {
          type: 'number',
          label: '步进值',
          default: 1,
          min: 0.01,
          max: 100,
          description: '每次调节的步进大小'
        },
        
        precision: {
          type: 'number',
          label: '显示精度',
          default: 1,
          min: 0,
          max: 6,
          description: '数值显示的小数位数'
        }
      }
    },
    
    // 显示配置
    displayConfig: {
      type: 'object',
      label: '显示配置',
      structure: {
        showValue: {
          type: 'boolean',
          label: '显示数值',
          default: true,
          description: '是否显示当前数值'
        },
        
        showUnit: {
          type: 'boolean',
          label: '显示单位',
          default: true,
          description: '是否显示数值单位'
        },
        
        showRange: {
          type: 'boolean',
          label: '显示范围',
          default: true,
          description: '是否在滑块上显示最小/最大值标签'
        },
        
        showTitle: {
          type: 'boolean',
          label: '显示标题',
          default: true,
          description: '是否显示指标名称'
        },
        
        valuePosition: {
          type: 'select',
          label: '数值位置',
          options: [
            { label: '顶部', value: 'top' },
            { label: '底部', value: 'bottom' },
            { label: '左侧', value: 'left' },
            { label: '右侧', value: 'right' }
          ],
          default: 'top',
          condition: { field: 'displayConfig.showValue', value: true }
        }
      }
    },
    
    // 行为配置
    behaviorConfig: {
      type: 'object',
      label: '行为配置',
      structure: {
        updateMode: {
          type: 'select',
          label: '更新模式',
          options: [
            { label: '实时更新', value: 'realtime' },
            { label: '拖拽结束', value: 'onchange' },
            { label: '手动确认', value: 'manual' }
          ],
          default: 'onchange',
          description: '选择何时发送数值到设备'
        },
        
        debounceTime: {
          type: 'number',
          label: '防抖延迟(ms)',
          default: 300,
          min: 0,
          max: 2000,
          condition: { field: 'behaviorConfig.updateMode', value: 'realtime' },
          description: '实时模式下的防抖延迟时间'
        },
        
        confirmDangerous: {
          type: 'boolean',
          label: '危险值确认',
          default: true,
          description: '设置危险值时是否需要确认'
        },
        
        dangerZone: {
          type: 'object',
          label: '危险区域',
          condition: { field: 'behaviorConfig.confirmDangerous', value: true },
          structure: {
            enabled: { type: 'boolean', label: '启用危险区域', default: false },
            ranges: {
              type: 'array',
              label: '危险范围',
              structure: {
                min: { type: 'number', description: '范围最小值' },
                max: { type: 'number', description: '范围最大值' },
                level: { 
                  type: 'select',
                  options: ['warning', 'danger'],
                  description: '警告级别'
                },
                message: { type: 'string', description: '警告消息' }
              },
              default: []
            }
          }
        }
      }
    },
    
    // 样式配置
    styleConfig: {
      type: 'object',
      label: '样式配置',
      structure: {
        size: {
          type: 'select',
          label: '控件大小',
          options: [
            { label: '小', value: 'small' },
            { label: '中', value: 'medium' },
            { label: '大', value: 'large' }
          ],
          default: 'medium'
        },
        
        color: {
          type: 'select',
          label: '主题颜色',
          options: [
            { label: '主要', value: 'primary' },
            { label: '成功', value: 'success' },
            { label: '警告', value: 'warning' },
            { label: '危险', value: 'error' },
            { label: '自定义', value: 'custom' }
          ],
          default: 'primary'
        },
        
        customColor: {
          type: 'color',
          label: '自定义颜色',
          default: '#409eff',
          condition: { field: 'styleConfig.color', value: 'custom' }
        }
      }
    }
  },
  
  // 默认布局
  defaultLayout: {
    canvas: { width: 220, height: 120 },
    gridstack: { w: 3, h: 2, minW: 2, minH: 1 }
  }
}
```

#### 2. 核心组件实现
```vue
<!-- src/card2.1/components/numeric-controller/NumericController.vue -->
<script setup lang="ts">
/**
 * 数值控制器组件
 * 支持多种控制方式和高级配置选项
 */
import { computed, ref, watch } from 'vue'
import {
  NSlider,
  NInputNumber,
  NButton,
  NPopconfirm,
  useMessage,
  useDialog
} from 'naive-ui'
import { debounce } from 'lodash-es'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/store/modules/theme'
import type { NumericControllerAPI } from './api/numeric-controller-api'

interface NumericControllerConfig {
  controllerType?: 'slider' | 'input' | 'knob' | 'stepper'
  rangeConfig?: {
    min?: number
    max?: number
    step?: number
    precision?: number
  }
  displayConfig?: {
    showValue?: boolean
    showUnit?: boolean
    showRange?: boolean
    showTitle?: boolean
    valuePosition?: 'top' | 'bottom' | 'left' | 'right'
  }
  behaviorConfig?: {
    updateMode?: 'realtime' | 'onchange' | 'manual'
    debounceTime?: number
    confirmDangerous?: boolean
    dangerZone?: {
      enabled?: boolean
      ranges?: Array<{
        min: number
        max: number
        level: 'warning' | 'danger'
        message: string
      }>
    }
  }
  styleConfig?: {
    size?: 'small' | 'medium' | 'large'
    color?: 'primary' | 'success' | 'warning' | 'error' | 'custom'
    customColor?: string
  }
}

interface Props {
  config: NumericControllerConfig
  data?: {
    currentValue?: number
    targetDevice?: {
      deviceId: string
      metricsId: string
      metricsName: string
      metricsType: string
    }
    constraints?: {
      min?: number
      max?: number
      unit?: string
    }
  }
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const { t } = useI18n()
const themeStore = useThemeStore()
const message = useMessage()
const dialog = useDialog()

// API 集成
const api = new NumericControllerAPI()

// 组件状态
const currentValue = ref(0)
const pendingValue = ref<number | null>(null)
const isSending = ref(false)

// 配置计算属性
const rangeConfig = computed(() => ({
  min: 0,
  max: 100,
  step: 1,
  precision: 1,
  ...props.config.rangeConfig,
  // 如果有外部约束，优先使用
  ...props.data?.constraints
}))

const displayConfig = computed(() => ({
  showValue: true,
  showUnit: true,
  showRange: true,
  showTitle: true,
  valuePosition: 'top' as const,
  ...props.config.displayConfig
}))

const behaviorConfig = computed(() => ({
  updateMode: 'onchange' as const,
  debounceTime: 300,
  confirmDangerous: true,
  dangerZone: { enabled: false, ranges: [] },
  ...props.config.behaviorConfig
}))

const styleConfig = computed(() => ({
  size: 'medium' as const,
  color: 'primary' as const,
  ...props.config.styleConfig
}))

// 数据同步
watch(() => props.data?.currentValue, (newValue) => {
  if (newValue !== undefined && newValue !== currentValue.value) {
    currentValue.value = newValue
  }
}, { immediate: true })

// 格式化显示值
const formattedValue = computed(() => 
  currentValue.value.toFixed(rangeConfig.value.precision)
)

// 显示单位
const displayUnit = computed(() => 
  props.data?.constraints?.unit || ''
)

// 指标名称
const metricsName = computed(() => 
  props.data?.targetDevice?.metricsName || t('numericController.defaultName')
)

// 检查是否为危险值
const checkDangerousValue = (value: number): { isDangerous: boolean; level?: string; message?: string } => {
  if (!behaviorConfig.value.dangerZone?.enabled) {
    return { isDangerous: false }
  }
  
  const ranges = behaviorConfig.value.dangerZone.ranges || []
  for (const range of ranges) {
    if (value >= range.min && value <= range.max) {
      return {
        isDangerous: true,
        level: range.level,
        message: range.message
      }
    }
  }
  
  return { isDangerous: false }
}

// 发送数值到设备
const sendValue = async (value: number) => {
  if (!props.data?.targetDevice || isSending.value) return
  
  try {
    isSending.value = true
    
    await api.updateDeviceValue({
      deviceId: props.data.targetDevice.deviceId,
      metricsId: props.data.targetDevice.metricsId,
      metricsType: props.data.targetDevice.metricsType as any,
      value
    })
    
    currentValue.value = value
    pendingValue.value = null
    message.success(t('numericController.updateSuccess'))
    
  } catch (error) {
    console.error('Failed to update device value:', error)
    message.error(t('numericController.updateFailed'))
    // 恢复原值
    currentValue.value = props.data?.currentValue || 0
  } finally {
    isSending.value = false
  }
}

// 防抖发送函数
const debouncedSend = debounce(sendValue, behaviorConfig.value.debounceTime)

// 处理数值变化
const handleValueChange = async (value: number) => {
  // 边界检查
  const clampedValue = Math.max(
    rangeConfig.value.min,
    Math.min(rangeConfig.value.max, value)
  )
  
  if (clampedValue !== value) {
    message.warning(t('numericController.valueOutOfRange'))
    return
  }
  
  // 危险值检查
  const dangerCheck = checkDangerousValue(value)
  if (dangerCheck.isDangerous && behaviorConfig.value.confirmDangerous) {
    const confirmed = await new Promise<boolean>((resolve) => {
      dialog.warning({
        title: t('numericController.dangerousValue'),
        content: dangerCheck.message || t('numericController.confirmDangerousValue', { value }),
        positiveText: t('common.confirm'),
        negativeText: t('common.cancel'),
        onPositiveClick: () => resolve(true),
        onNegativeClick: () => resolve(false)
      })
    })
    
    if (!confirmed) {
      // 恢复原值
      currentValue.value = props.data?.currentValue || 0
      return
    }
  }
  
  // 根据更新模式处理
  switch (behaviorConfig.value.updateMode) {
    case 'realtime':
      debouncedSend(value)
      break
    case 'onchange':
      await sendValue(value)
      break
    case 'manual':
      pendingValue.value = value
      break
  }
}

// 手动确认发送
const confirmSend = async () => {
  if (pendingValue.value !== null) {
    await sendValue(pendingValue.value)
  }
}

// 取消待发送值
const cancelPending = () => {
  pendingValue.value = null
  currentValue.value = props.data?.currentValue || 0
}

// 暴露组件接口
defineExpose({
  getCurrentValue: () => currentValue.value,
  setPendingValue: (value: number) => pendingValue.value = value,
  confirmSend,
  cancelPending
})
</script>

<template>
  <div class="numeric-controller" :class="`size-${styleConfig.size}`">
    <!-- 标题区域 -->
    <div v-if="displayConfig.showTitle" class="controller-title">
      {{ metricsName }}
    </div>
    
    <!-- 数值显示区域 -->
    <div 
      v-if="displayConfig.showValue && displayConfig.valuePosition === 'top'"
      class="value-display top"
    >
      <span class="current-value">{{ formattedValue }}</span>
      <span v-if="displayConfig.showUnit && displayUnit" class="value-unit">{{ displayUnit }}</span>
      <span v-if="pendingValue !== null" class="pending-indicator">
        → {{ pendingValue.toFixed(rangeConfig.precision) }}
      </span>
    </div>
    
    <!-- 控制器主体 -->
    <div class="controller-main">
      <!-- 滑块控制 -->
      <NSlider
        v-if="config.controllerType === 'slider' || !config.controllerType"
        v-model:value="currentValue"
        :min="rangeConfig.min"
        :max="rangeConfig.max"
        :step="rangeConfig.step"
        :disabled="loading || isSending"
        class="value-slider"
        @update:value="handleValueChange"
      />
      
      <!-- 数字输入 -->
      <NInputNumber
        v-else-if="config.controllerType === 'input'"
        v-model:value="currentValue"
        :min="rangeConfig.min"
        :max="rangeConfig.max"
        :step="rangeConfig.step"
        :precision="rangeConfig.precision"
        :disabled="loading || isSending"
        class="value-input"
        @update:value="handleValueChange"
      />
    </div>
    
    <!-- 范围标签 -->
    <div v-if="displayConfig.showRange && config.controllerType === 'slider'" class="range-labels">
      <span class="min-label">{{ rangeConfig.min }}</span>
      <span class="max-label">{{ rangeConfig.max }}</span>
    </div>
    
    <!-- 底部数值显示 -->
    <div 
      v-if="displayConfig.showValue && displayConfig.valuePosition === 'bottom'"
      class="value-display bottom"
    >
      <span class="current-value">{{ formattedValue }}</span>
      <span v-if="displayConfig.showUnit && displayUnit" class="value-unit">{{ displayUnit }}</span>
    </div>
    
    <!-- 手动模式控制按钮 -->
    <div v-if="behaviorConfig.updateMode === 'manual' && pendingValue !== null" class="manual-controls">
      <NButton 
        type="primary" 
        size="small" 
        :loading="isSending"
        @click="confirmSend"
      >
        {{ t('common.confirm') }}
      </NButton>
      <NButton 
        size="small" 
        @click="cancelPending"
      >
        {{ t('common.cancel') }}
      </NButton>
    </div>
  </div>
</template>

<style scoped>
.numeric-controller {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  height: 100%;
  padding: var(--card-padding);
  
  background-color: var(--card-color);
  border-radius: var(--border-radius);
  color: var(--text-color);
}

.controller-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color-2);
  text-align: center;
  margin-bottom: 4px;
}

.value-display {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
}

.value-display.top {
  margin-bottom: 8px;
}

.value-display.bottom {
  margin-top: 8px;
}

.current-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
}

.value-unit {
  font-size: 12px;
  color: var(--text-color-2);
}

.pending-indicator {
  font-size: 14px;
  color: var(--warning-color);
  font-style: italic;
}

.controller-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 0;
}

.value-slider {
  width: 100%;
}

.value-input {
  width: 100%;
  max-width: 120px;
}

.range-labels {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-color-3);
  margin-top: 4px;
}

.manual-controls {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 8px;
}

/* 尺寸变体 */
.size-small {
  padding: 8px;
  gap: 6px;
}

.size-small .current-value {
  font-size: 16px;
}

.size-large {
  padding: 16px;
  gap: 12px;
}

.size-large .current-value {
  font-size: 22px;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .numeric-controller {
    padding: 6px;
    gap: 6px;
  }
  
  .current-value {
    font-size: 16px;
  }
}

/* 暗色主题适配 */
[data-theme="dark"] .numeric-controller {
  background-color: var(--card-color-dark);
  color: var(--text-color-dark);
}
</style>
```

## 💻 具体实现步骤

### Phase 1: 基础重构（第1-2周）

1. **创建组件结构**
```bash
src/card2.1/components/numeric-controller/
├── index.ts                          # 组件定义
├── NumericController.vue             # 核心组件
├── ConfigPanel.vue                   # 配置面板
├── types.ts                          # 类型定义
├── api/
│   └── numeric-controller-api.ts     # API 服务层
└── hooks/
    └── useNumericController.ts       # 业务逻辑 hook
```

2. **实现核心功能**
- 多种控制方式支持
- 范围和精度配置
- 实时更新机制

### Phase 2: 高级功能开发（第3周）

1. **增强用户体验**
- 危险值警告机制
- 手动确认模式
- 防抖和性能优化

2. **完善配置系统**
- 样式和布局配置
- 高级行为选项

### Phase 3: 测试和完善（第4周）

1. **功能测试**
- 各种控制模式测试
- 边界值和错误处理
- 性能压力测试

2. **用户体验优化**
- 响应式设计完善
- 无障碍访问支持

## ✅ 测试验证方案

### 功能测试
- [ ] 滑块和输入框控制正常工作
- [ ] 范围和精度配置生效
- [ ] 防抖和实时更新机制
- [ ] 危险值警告功能
- [ ] 手动确认模式

### 性能测试
- [ ] 频繁调节时的性能表现
- [ ] API 请求频率控制
- [ ] 内存使用监控

### 用户体验测试
- [ ] 不同屏幕尺寸适配
- [ ] 主题切换兼容性
- [ ] 操作反馈及时性

## 📈 迁移收益

### 功能增强
- **控制方式**: 单一滑块 → 多种控制方式（滑块、输入、旋钮等）
- **更新模式**: 实时更新 → 多种更新策略（实时、拖拽结束、手动确认）
- **安全控制**: 无 → 危险值警告和确认机制

### 性能提升
- **API 优化**: 无防抖 → 智能防抖和批量处理
- **响应性**: 基础响应式 → 完整的自适应设计
- **错误处理**: 简单处理 → 完善的错误恢复机制

### 用户体验
- **操作反馈**: 无反馈 → 丰富的状态提示和确认机制
- **配置灵活性**: 有限配置 → 完整的可视化配置系统
- **主题适配**: 固定样式 → 完整的主题系统支持

---

**总结**: 数值控制器组件通过 Card 2.1 重构，将获得更强大的控制能力、更好的安全性和用户体验，显著提升设备数值参数调节的专业性和可靠性。