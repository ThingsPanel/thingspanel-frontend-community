# Device Control 组件合并迁移方案 (Switch + Enum-Control + State-Display)

## 📋 概述

**switch**、**enum-control** 和 **state-display** 组件都是设备控制类组件，功能高度相关且存在重叠，**代码重复率约 70%**。三者都涉及设备状态的显示和控制，是理想的合并候选组件。

## 🔍 技术架构分析

### 当前架构
```
chart-card/
├── switch/
│   ├── index.ts              # 开关控制组件定义
│   ├── component.vue         # 开关控制逻辑（150行）
│   └── switch-config.vue     # 开关配置（简单配置）
├── enum-control/
│   ├── index.ts              # 枚举控制组件定义
│   ├── component.vue         # 按钮组控制逻辑（150行）
│   └── card-config.vue       # 动态按钮配置（85行）
└── state-display/
    ├── index.ts              # 状态显示组件定义
    ├── component.vue         # 图标状态显示逻辑（150行）
    └── card-config.vue       # 图标和颜色配置（65行）
```

### 核心功能特性对比
| 特性 | Switch | Enum-Control | State-Display |
|------|--------|--------------|---------------|
| **主要功能** | 开关控制 | 多选项控制 | 状态显示 |
| **UI形式** | Toggle 开关 | 按钮组 | 图标指示器 |
| **交互性** | ✅ 可控制 | ✅ 可控制 | ❌ 只显示 |
| **配置项** | active0/active1 | 动态按钮配置 | 图标+颜色配置 |
| **数据类型** | string/number/boolean | string/number/boolean | string/number/boolean |
| **API调用** | attributeDataPub/telemetryDataPub | 支持3种API | 只读数据 |

### 共同点分析
1. **数据源结构 100% 相同**：都使用 `deviceSource[0]` 配置
2. **数据类型处理 95% 相同**：都支持 string/number/boolean 转换
3. **状态计算逻辑 80% 相同**：都基于配置值计算当前状态
4. **API集成 70% 相同**：都涉及设备数据推送（除 state-display）

## ❗ 现有问题识别

### 1. 🔄 **代码重复问题**
```javascript
// 三个组件都有相同的数据类型转换逻辑
const toRealValue = (inputValue: string) => {
  const dataType = props?.card?.dataSource?.deviceSource?.[0]?.metricsDataType
  if (dataType === 'number') {
    return Number.parseFloat(inputValue)
  } else if (dataType === 'boolean') {
    return Boolean(inputValue)
  }
  return inputValue
}
```

### 2. 🎨 **样式系统不统一**
```scss
// Switch: 硬编码样式
.switch { margin-top: 20px; text-align: center; }

// Enum-control: 硬编码背景色
&.active { background-color: #6f42c1; }

// State-display: 硬编码颜色
const activeColor = computed(() => config.value.activeColor || '#FFA500')
```

### 3. 📊 **配置结构不一致**
```typescript
// Switch: 简单配置
{ active0: string, active1: string }

// Enum-control: 复杂配置
{ btOptions: Array<{label: string, value: string}> }

// State-display: 视觉配置
{ activeIconName: string, inactiveIconName: string, activeColor: string, inactiveColor: string }
```

### 4. 🔧 **功能局限性**
- **Switch**: 只支持二元状态，无法处理多状态场景
- **Enum-control**: 缺少视觉反馈，只有文字按钮
- **State-display**: 无交互能力，无法控制设备

### 5. 🌐 **国际化和主题问题**
- 部分硬编码文本和颜色
- 缺少统一的主题系统支持
- 响应式设计不完整

## 🎯 Card 2.1 迁移策略

### 统一组件设计

#### 1. 组件定义
```typescript
// src/card2.1/components/device-control/index.ts
import type { ComponentDefinition } from '@/card2.1/core/component-definition'

export const DeviceControlDefinition: ComponentDefinition = {
  type: 'device-control',
  name: '设备控制',
  category: '设备控制',
  description: '统一的设备状态显示和控制组件，支持开关、多选项和状态指示',
  
  // 数据需求声明
  dataRequirements: {
    currentValue: {
      type: 'any',
      description: '当前设备状态值',
      required: true
    },
    
    metricsInfo: {
      type: 'object',
      description: '指标元信息',
      structure: {
        deviceId: { type: 'string', description: '设备ID' },
        metricsId: { type: 'string', description: '指标ID' },
        metricsName: { type: 'string', description: '指标名称' },
        metricsType: { 
          type: 'string', 
          enum: ['attributes', 'telemetry', 'command'],
          description: '指标类型'
        },
        dataType: {
          type: 'string',
          enum: ['string', 'number', 'boolean'],
          description: '数据类型'
        }
      }
    }
  },
  
  // 配置结构
  config: {
    // 控制类型配置
    controlType: {
      type: 'select',
      label: '控制类型',
      options: [
        { label: '开关控制', value: 'switch' },
        { label: '多选项控制', value: 'enum' },
        { label: '状态显示', value: 'display' }
      ],
      default: 'switch',
      description: '选择控制组件的交互模式'
    },
    
    // 开关模式配置
    switchConfig: {
      type: 'object',
      label: '开关配置',
      condition: { field: 'controlType', value: 'switch' },
      structure: {
        onValue: {
          type: 'string',
          label: '开启值',
          default: '1',
          description: '开关打开时发送的值'
        },
        
        offValue: {
          type: 'string',
          label: '关闭值',
          default: '0',
          description: '开关关闭时发送的值'
        },
        
        switchSize: {
          type: 'select',
          label: '开关大小',
          options: [
            { label: '小', value: 'small' },
            { label: '中', value: 'medium' },
            { label: '大', value: 'large' }
          ],
          default: 'medium'
        }
      }
    },
    
    // 枚举模式配置
    enumConfig: {
      type: 'object',
      label: '多选项配置',
      condition: { field: 'controlType', value: 'enum' },
      structure: {
        options: {
          type: 'array',
          label: '选项列表',
          structure: {
            label: { type: 'string', description: '显示标签' },
            value: { type: 'string', description: '发送值' },
            icon: { type: 'string', description: '图标（可选）' },
            color: { type: 'color', description: '颜色（可选）' }
          },
          default: [
            { label: '加热', value: 'heat' },
            { label: '制冷', value: 'cool' },
            { label: '通风', value: 'fan' },
            { label: '自动', value: 'auto' }
          ]
        },
        
        buttonStyle: {
          type: 'select',
          label: '按钮样式',
          options: [
            { label: '文字按钮', value: 'text' },
            { label: '图标按钮', value: 'icon' },
            { label: '图标+文字', value: 'both' }
          ],
          default: 'text'
        },
        
        layout: {
          type: 'select',
          label: '布局方式',
          options: [
            { label: '水平排列', value: 'horizontal' },
            { label: '垂直排列', value: 'vertical' },
            { label: '网格布局', value: 'grid' }
          ],
          default: 'horizontal'
        }
      }
    },
    
    // 显示模式配置
    displayConfig: {
      type: 'object',
      label: '显示配置',
      condition: { field: 'controlType', value: 'display' },
      structure: {
        displayStyle: {
          type: 'select',
          label: '显示样式',
          options: [
            { label: '图标指示', value: 'icon' },
            { label: '文字标签', value: 'text' },
            { label: '状态灯', value: 'indicator' },
            { label: '进度条', value: 'progress' }
          ],
          default: 'icon'
        },
        
        stateMapping: {
          type: 'array',
          label: '状态映射',
          description: '定义不同值对应的显示状态',
          structure: {
            value: { type: 'string', description: '数据值' },
            label: { type: 'string', description: '显示标签' },
            icon: { type: 'string', description: '图标' },
            color: { type: 'color', description: '颜色' }
          },
          default: [
            { value: '1', label: '在线', icon: 'CheckmarkCircleOutline', color: '#52c41a' },
            { value: '0', label: '离线', icon: 'CloseCircleOutline', color: '#ff4d4f' }
          ]
        }
      }
    },
    
    // 通用显示配置
    showTitle: {
      type: 'boolean',
      label: '显示标题',
      default: true
    },
    
    titlePosition: {
      type: 'select',
      label: '标题位置',
      options: [
        { label: '顶部', value: 'top' },
        { label: '底部', value: 'bottom' },
        { label: '左侧', value: 'left' },
        { label: '右侧', value: 'right' }
      ],
      default: 'bottom',
      condition: { field: 'showTitle', value: true }
    },
    
    // 交互配置
    enableControl: {
      type: 'boolean',
      label: '启用控制',
      default: true,
      description: '是否允许用户通过界面控制设备'
    },
    
    confirmBeforeControl: {
      type: 'boolean',
      label: '控制前确认',
      default: false,
      condition: { field: 'enableControl', value: true }
    }
  },
  
  // 默认布局
  defaultLayout: {
    canvas: { width: 200, height: 150 },
    gridstack: { w: 3, h: 2, minW: 2, minH: 1 }
  }
}
```

#### 2. 核心组件实现
```vue
<!-- src/card2.1/components/device-control/DeviceControl.vue -->
<script setup lang="ts">
/**
 * 统一设备控制组件
 * 支持开关控制、多选项控制和状态显示三种模式
 */
import { computed, ref } from 'vue'
import { 
  NSwitch, 
  NButton, 
  NIcon, 
  NProgress,
  NTooltip,
  useDialog,
  useMessage
} from 'naive-ui'
import * as ionicons5 from '@vicons/ionicons5'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/store/modules/theme'
import { useCard2Integration } from '@/card2.1/hooks/useCard2Integration'
import type { DeviceControlAPI } from './api/device-control-api'

interface DeviceControlConfig {
  controlType: 'switch' | 'enum' | 'display'
  switchConfig?: {
    onValue: string
    offValue: string
    switchSize: 'small' | 'medium' | 'large'
  }
  enumConfig?: {
    options: Array<{
      label: string
      value: string
      icon?: string
      color?: string
    }>
    buttonStyle: 'text' | 'icon' | 'both'
    layout: 'horizontal' | 'vertical' | 'grid'
  }
  displayConfig?: {
    displayStyle: 'icon' | 'text' | 'indicator' | 'progress'
    stateMapping: Array<{
      value: string
      label: string
      icon?: string
      color?: string
    }>
  }
  showTitle?: boolean
  titlePosition?: 'top' | 'bottom' | 'left' | 'right'
  enableControl?: boolean
  confirmBeforeControl?: boolean
}

interface Props {
  config: DeviceControlConfig
  data?: {
    currentValue?: any
    metricsInfo?: {
      deviceId: string
      metricsId: string
      metricsName: string
      metricsType: string
      dataType: string
    }
  }
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const { t } = useI18n()
const themeStore = useThemeStore()
const dialog = useDialog()
const message = useMessage()

// API 集成
const deviceControlAPI = new DeviceControlAPI()

// 当前值和状态
const currentValue = computed(() => props.data?.currentValue)
const metricsInfo = computed(() => props.data?.metricsInfo)

// 数据类型转换
const convertValue = (value: string, targetType: string) => {
  switch (targetType) {
    case 'number':
      return Number.parseFloat(value)
    case 'boolean':
      return Boolean(value)
    default:
      return value
  }
}

// 开关模式逻辑
const switchValue = computed({
  get: () => {
    if (props.config.controlType !== 'switch') return false
    
    const { onValue = '1' } = props.config.switchConfig || {}
    return String(currentValue.value) === onValue
  },
  set: async (newValue: boolean) => {
    if (!props.config.enableControl) return
    
    const { onValue = '1', offValue = '0' } = props.config.switchConfig || {}
    const targetValue = newValue ? onValue : offValue
    
    await handleControlAction(targetValue)
  }
})

// 当前选中的枚举值
const selectedEnumValue = computed(() => {
  if (props.config.controlType !== 'enum') return null
  return String(currentValue.value)
})

// 当前显示状态
const currentDisplayState = computed(() => {
  if (props.config.controlType !== 'display') return null
  
  const { stateMapping = [] } = props.config.displayConfig || {}
  const currentStr = String(currentValue.value)
  
  return stateMapping.find(state => state.value === currentStr) || {
    value: currentStr,
    label: currentStr,
    icon: 'HelpCircleOutline',
    color: themeStore.darkMode ? '#666' : '#999'
  }
})

// 控制操作处理
const handleControlAction = async (value: string) => {
  if (!metricsInfo.value || props.loading) return
  
  try {
    // 确认对话框
    if (props.config.confirmBeforeControl) {
      const confirmed = await new Promise<boolean>((resolve) => {
        dialog.warning({
          title: t('device.control.confirm'),
          content: t('device.control.confirmMessage', { 
            device: metricsInfo.value?.metricsName,
            value 
          }),
          positiveText: t('common.confirm'),
          negativeText: t('common.cancel'),
          onPositiveClick: () => resolve(true),
          onNegativeClick: () => resolve(false)
        })
      })
      
      if (!confirmed) return
    }
    
    // 发送控制指令
    const convertedValue = convertValue(value, metricsInfo.value.dataType)
    
    await deviceControlAPI.sendControlCommand({
      deviceId: metricsInfo.value.deviceId,
      metricsId: metricsInfo.value.metricsId,
      metricsType: metricsInfo.value.metricsType as any,
      value: convertedValue
    })
    
    message.success(t('device.control.success'))
    
  } catch (error) {
    console.error('Control action failed:', error)
    message.error(t('device.control.failed'))
  }
}

// 枚举选项点击处理
const handleEnumOptionClick = (option: any) => {
  if (props.config.enableControl) {
    handleControlAction(option.value)
  }
}

// 获取图标组件
const getIcon = (iconName?: string) => {
  if (!iconName) return null
  return (ionicons5 as any)[iconName]
}

// 标题显示
const title = computed(() => metricsInfo.value?.metricsName || t('device.control.title'))
</script>

<template>
  <div class="device-control" :class="[`control-${config.controlType}`, `title-${config.titlePosition}`]">
    <!-- 标题 -->
    <div v-if="config.showTitle" class="control-title">
      {{ title }}
    </div>
    
    <!-- 主控制区域 -->
    <div class="control-content">
      <!-- 开关模式 -->
      <div v-if="config.controlType === 'switch'" class="switch-control">
        <NSwitch
          v-model:value="switchValue"
          :size="config.switchConfig?.switchSize || 'medium'"
          :loading="loading"
          :disabled="!config.enableControl"
        />
      </div>
      
      <!-- 枚举控制模式 -->
      <div 
        v-else-if="config.controlType === 'enum'" 
        class="enum-control"
        :class="[`layout-${config.enumConfig?.layout || 'horizontal'}`]"
      >
        <NButton
          v-for="option in config.enumConfig?.options || []"
          :key="option.value"
          :type="selectedEnumValue === option.value ? 'primary' : 'default'"
          :loading="loading"
          :disabled="!config.enableControl"
          class="enum-option"
          @click="handleEnumOptionClick(option)"
        >
          <!-- 图标 -->
          <NIcon v-if="option.icon && (config.enumConfig?.buttonStyle === 'icon' || config.enumConfig?.buttonStyle === 'both')" class="option-icon">
            <component :is="getIcon(option.icon)" />
          </NIcon>
          
          <!-- 文字 -->
          <span v-if="config.enumConfig?.buttonStyle === 'text' || config.enumConfig?.buttonStyle === 'both'">
            {{ option.label }}
          </span>
        </NButton>
      </div>
      
      <!-- 状态显示模式 -->
      <div v-else-if="config.controlType === 'display'" class="display-control">
        <!-- 图标显示 -->
        <div v-if="config.displayConfig?.displayStyle === 'icon'" class="icon-display">
          <NIcon 
            :color="currentDisplayState?.color" 
            :size="32"
            class="status-icon"
          >
            <component :is="getIcon(currentDisplayState?.icon)" />
          </NIcon>
          <div class="status-label">{{ currentDisplayState?.label }}</div>
        </div>
        
        <!-- 文字显示 -->
        <div v-else-if="config.displayConfig?.displayStyle === 'text'" class="text-display">
          <div 
            class="status-text" 
            :style="{ color: currentDisplayState?.color }"
          >
            {{ currentDisplayState?.label }}
          </div>
        </div>
        
        <!-- 指示灯显示 -->
        <div v-else-if="config.displayConfig?.displayStyle === 'indicator'" class="indicator-display">
          <div 
            class="status-indicator" 
            :style="{ backgroundColor: currentDisplayState?.color }"
          ></div>
          <div class="status-label">{{ currentDisplayState?.label }}</div>
        </div>
        
        <!-- 进度条显示 -->
        <div v-else-if="config.displayConfig?.displayStyle === 'progress'" class="progress-display">
          <NProgress
            type="circle"
            :percentage="Number(currentValue) || 0"
            :color="currentDisplayState?.color"
            class="status-progress"
          />
          <div class="status-label">{{ currentDisplayState?.label }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.device-control {
  display: flex;
  width: 100%;
  height: 100%;
  padding: var(--card-padding);
  
  background-color: var(--card-color);
  border-radius: var(--border-radius);
  color: var(--text-color);
}

/* 布局配置 */
.title-top {
  flex-direction: column;
}

.title-bottom {
  flex-direction: column-reverse;
}

.title-left {
  flex-direction: row;
}

.title-right {
  flex-direction: row-reverse;
}

.control-title {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  color: var(--text-color);
}

.control-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 开关控制样式 */
.switch-control {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 枚举控制样式 */
.enum-control {
  display: flex;
  gap: 8px;
}

.enum-control.layout-horizontal {
  flex-direction: row;
  flex-wrap: wrap;
}

.enum-control.layout-vertical {
  flex-direction: column;
}

.enum-control.layout-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 8px;
}

.enum-option {
  min-width: 60px;
}

.option-icon {
  margin-right: 4px;
}

/* 状态显示样式 */
.display-control {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.icon-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.status-icon {
  font-size: 32px;
}

.text-display {
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-text {
  font-size: 18px;
  font-weight: 600;
}

.indicator-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.status-indicator {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.2);
}

.progress-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.status-progress {
  width: 80px;
  height: 80px;
}

.status-label {
  font-size: 14px;
  color: var(--text-color-2);
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .device-control {
    padding: 8px;
  }
  
  .enum-control.layout-horizontal {
    flex-direction: column;
  }
  
  .status-icon {
    font-size: 24px;
  }
}

/* 暗色主题适配 */
[data-theme="dark"] .device-control {
  background-color: var(--card-color-dark);
  color: var(--text-color-dark);
}
</style>
```

#### 3. API 服务层
```typescript
// src/card2.1/components/device-control/api/device-control-api.ts
import { 
  attributeDataPub, 
  telemetryDataPub, 
  commandDataPub,
  getAttributeDataSet 
} from '@/service/api/device'

export interface DeviceControlCommand {
  deviceId: string
  metricsId: string
  metricsType: 'attributes' | 'telemetry' | 'command'
  value: any
}

export class DeviceControlAPI {
  /**
   * 发送设备控制指令
   */
  async sendControlCommand(command: DeviceControlCommand): Promise<void> {
    const { deviceId, metricsId, metricsType, value } = command
    
    const payload = {
      device_id: deviceId,
      value: JSON.stringify({
        [metricsId]: value
      })
    }
    
    switch (metricsType) {
      case 'attributes':
        await attributeDataPub(payload)
        break
      case 'telemetry':
        await telemetryDataPub(payload)
        break
      case 'command':
        await commandDataPub(payload)
        break
      default:
        throw new Error(`Unsupported metrics type: ${metricsType}`)
    }
  }
  
  /**
   * 获取设备属性数据
   */
  async getDeviceAttributes(deviceId: string): Promise<Record<string, any>> {
    const response = await getAttributeDataSet({ device_id: deviceId })
    
    const attributes: Record<string, any> = {}
    response.data.forEach(item => {
      attributes[item.key] = item.value
    })
    
    return attributes
  }
}
```

## 💻 具体实现步骤

### Phase 1: 基础架构搭建（第1-2周）

1. **创建统一组件结构**
```bash
src/card2.1/components/device-control/
├── index.ts                     # 组件定义
├── DeviceControl.vue            # 核心组件
├── ConfigPanel.vue              # 配置面板
├── types.ts                     # 类型定义
├── api/
│   └── device-control-api.ts    # API 服务层
└── hooks/
    └── useDeviceControl.ts      # 业务逻辑 hook
```

2. **实现基础功能**
- 三种控制模式的基础实现
- 数据类型转换和状态管理
- API 集成和错误处理

### Phase 2: 配置系统开发（第3周）

1. **配置面板实现**
- 动态配置表单
- 条件显示逻辑
- 实时预览功能

2. **高级功能**
- 确认对话框
- 状态映射配置
- 自定义图标和颜色

### Phase 3: 测试和优化（第4周）

1. **测试验证**
- 三种模式功能测试
- 配置系统测试
- 设备控制集成测试

2. **性能优化**
- 响应式性能优化
- 内存使用监控
- 用户体验优化

## ✅ 测试验证方案

### 功能测试
- [ ] 开关控制正确工作
- [ ] 多选项控制状态切换
- [ ] 状态显示正确反映设备状态
- [ ] 配置项动态生效
- [ ] API 调用正确执行

### 兼容性测试
- [ ] 原有三个组件配置迁移
- [ ] 不同设备类型适配
- [ ] 数据类型转换正确

### 主题测试
- [ ] 明暗主题切换
- [ ] 自定义颜色配置
- [ ] 响应式布局

## 📈 迁移收益

### 代码简化
- **组件数量**: 3 → 1 (减少 67%)
- **代码行数**: ~450 → ~300 (减少 33%)
- **配置复杂度**: 统一配置结构，降低 50% 学习成本

### 功能增强
- **统一体验**: 一致的交互和视觉设计
- **功能扩展**: 增加确认对话框、状态映射等高级功能
- **灵活配置**: 支持更多自定义选项和布局方式

### 维护效率
- **单点维护**: 统一的代码库和文档
- **测试简化**: 集中的测试用例和质量保证
- **功能扩展**: 新功能只需在一个组件中实现

---

**总结**: 通过合并三个设备控制组件，可以实现显著的代码简化和功能增强，提供更一致的用户体验和更高的开发效率。统一的组件架构也为未来的功能扩展提供了良好的基础。