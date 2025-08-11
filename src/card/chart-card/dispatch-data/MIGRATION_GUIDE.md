# Dispatch Data 组件迁移指南

## 📋 组件概述

**dispatch-data** 是一个数据发送组件，用于向设备发送自定义数据或控制指令。支持自定义按钮样式、图标配置和多种数据类型发送。

## 🔍 技术架构分析

### 当前实现结构
```
dispatch-data/
├── index.ts           # 组件定义
├── component.vue      # 核心发送逻辑（118 行）
├── card-config.vue    # 配置界面（55 行）
└── poster.png         # 组件预览图
```

### 核心功能特性
1. **自定义按钮**: 可配置按钮图标、颜色和文本
2. **多数据类型**: 支持 attributes、telemetry、command 三种数据类型
3. **自定义数据**: 支持发送任意格式的 JSON 数据
4. **响应式设计**: 根据容器大小自动调整按钮和文字大小
5. **操作反馈**: 成功/失败消息提示

### 数据流程
```
用户点击按钮 → 读取配置数据 → 选择 API 类型 → 发送数据 → 显示反馈
```

## ❗ 现有问题识别

### 1. 🎨 **样式系统问题**
```css
/* 硬编码样式和颜色 */
.action-button {
  width: 30%;
  height: 30%;
  border-radius: 10%;  /* 固定样式 */
}

const buttonColor = computed(() => config.value.buttonColor || '#ff4d4f')  /* 硬编码默认色 */
```
**影响**: 无法适配主题系统，视觉一致性差。

### 2. 📊 **数据格式限制**
```typescript
// 只能发送简单字符串，无法发送复杂 JSON 对象
const obj = {
  device_id: deviceId.value,
  value: valueToBeSent  // 直接使用字符串
}
```
**影响**: 无法发送结构化数据和多字段指令。

### 3. 🔧 **配置选项有限**
- 无法配置按钮形状和大小
- 无法配置多个按钮
- 缺少数据验证和格式化选项
- 没有发送前确认功能

### 4. ⚡ **错误处理不完善**
```javascript
// 简单的错误处理，缺少详细信息
try {
  // API 调用
} catch (error) {
  window.$message?.error($t('card.dataSentFail'))  // 通用错误消息
}
```

### 5. 🌐 **国际化不完整**
```javascript
// 部分文本没有国际化
const deviceName = computed(() => props.card?.dataSource?.deviceSource?.[0]?.name || '设备1')
```

### 6. 📱 **响应式设计局限**
```javascript
// 简单的尺寸计算，可能在极端尺寸下显示异常
fontSize.value = `${minDimension / 10}px`
iconSize.value = `${minDimension / 5}px`
```

## 🎯 Card 2.1 迁移策略

### 组件重新设计

#### 1. 组件定义
```typescript
// src/card2.1/components/data-dispatcher/index.ts
import type { ComponentDefinition } from '@/card2.1/core/component-definition'

export const DataDispatcherDefinition: ComponentDefinition = {
  type: 'data-dispatcher',
  name: '数据发送器',
  category: '设备控制',
  description: '向设备发送自定义数据或控制指令，支持多种数据格式和样式配置',
  
  // 数据需求声明
  dataRequirements: {
    targetDevice: {
      type: 'object',
      description: '目标设备信息',
      required: true,
      structure: {
        deviceId: { type: 'string', description: '设备ID' },
        deviceName: { type: 'string', description: '设备名称' }
      }
    }
  },
  
  // 配置结构
  config: {
    // 按钮配置
    buttonConfig: {
      type: 'object',
      label: '按钮配置',
      structure: {
        text: {
          type: 'string',
          label: '按钮文本',
          default: '发送数据',
          description: '显示在按钮上的文字'
        },
        
        icon: {
          type: 'icon',
          label: '按钮图标',
          default: 'SendOutline',
          description: '按钮图标，来自 Ionicons'
        },
        
        style: {
          type: 'select',
          label: '按钮样式',
          options: [
            { label: '主要按钮', value: 'primary' },
            { label: '成功按钮', value: 'success' },
            { label: '警告按钮', value: 'warning' },
            { label: '危险按钮', value: 'error' },
            { label: '自定义', value: 'custom' }
          ],
          default: 'primary'
        },
        
        customColor: {
          type: 'color',
          label: '自定义颜色',
          default: '#409eff',
          condition: { field: 'buttonConfig.style', value: 'custom' }
        },
        
        size: {
          type: 'select',
          label: '按钮大小',
          options: [
            { label: '小', value: 'small' },
            { label: '中', value: 'medium' },
            { label: '大', value: 'large' },
            { label: '超大', value: 'huge' }
          ],
          default: 'medium'
        },
        
        shape: {
          type: 'select',
          label: '按钮形状',
          options: [
            { label: '圆角矩形', value: 'default' },
            { label: '圆形', value: 'circle' },
            { label: '椭圆', value: 'round' }
          ],
          default: 'default'
        }
      }
    },
    
    // 数据配置
    dataConfig: {
      type: 'object',
      label: '数据配置',
      structure: {
        dataType: {
          type: 'select',
          label: '数据类型',
          options: [
            { label: '属性数据 (Attributes)', value: 'attributes' },
            { label: '遥测数据 (Telemetry)', value: 'telemetry' },
            { label: '命令数据 (Command)', value: 'command' }
          ],
          default: 'telemetry',
          description: '选择发送的数据类型'
        },
        
        format: {
          type: 'select',
          label: '数据格式',
          options: [
            { label: '简单值', value: 'simple' },
            { label: 'JSON 对象', value: 'json' },
            { label: '键值对', value: 'keyvalue' }
          ],
          default: 'simple',
          description: '数据的发送格式'
        },
        
        payload: {
          type: 'dynamic',
          label: '发送内容',
          description: '要发送的数据内容',
          dynamicType: 'dataConfig.format',
          options: {
            simple: {
              type: 'string',
              label: '数据值',
              default: '1',
              placeholder: '例如: 1, true, "hello"'
            },
            json: {
              type: 'textarea',
              label: 'JSON 数据',
              default: '{\n  "key1": "value1",\n  "key2": 123\n}',
              placeholder: '输入有效的 JSON 格式数据'
            },
            keyvalue: {
              type: 'array',
              label: '键值对',
              structure: {
                key: { type: 'string', description: '键名' },
                value: { type: 'string', description: '值' },
                type: { 
                  type: 'select',
                  options: ['string', 'number', 'boolean'],
                  description: '数据类型'
                }
              },
              default: [
                { key: 'status', value: '1', type: 'number' }
              ]
            }
          }
        }
      }
    },
    
    // 行为配置
    behaviorConfig: {
      type: 'object',
      label: '行为配置',
      structure: {
        confirmBeforeSend: {
          type: 'boolean',
          label: '发送前确认',
          default: false,
          description: '点击按钮后是否显示确认对话框'
        },
        
        showDeviceName: {
          type: 'boolean',
          label: '显示设备名称',
          default: true,
          description: '是否在组件上显示目标设备名称'
        },
        
        cooldownTime: {
          type: 'number',
          label: '冷却时间 (秒)',
          default: 0,
          min: 0,
          max: 60,
          description: '按钮点击后的冷却时间，0 表示无冷却'
        },
        
        successAction: {
          type: 'select',
          label: '成功后操作',
          options: [
            { label: '显示消息', value: 'message' },
            { label: '显示通知', value: 'notification' },
            { label: '无操作', value: 'none' }
          ],
          default: 'message'
        }
      }
    },
    
    // 布局配置
    layout: {
      type: 'object',
      label: '布局配置',
      structure: {
        direction: {
          type: 'select',
          label: '布局方向',
          options: [
            { label: '垂直布局', value: 'vertical' },
            { label: '水平布局', value: 'horizontal' }
          ],
          default: 'vertical'
        },
        
        alignment: {
          type: 'select',
          label: '对齐方式',
          options: [
            { label: '居中', value: 'center' },
            { label: '左对齐', value: 'start' },
            { label: '右对齐', value: 'end' }
          ],
          default: 'center'
        }
      }
    }
  },
  
  // 默认布局
  defaultLayout: {
    canvas: { width: 200, height: 120 },
    gridstack: { w: 3, h: 2, minW: 2, minH: 1 }
  }
}
```

#### 2. 核心组件实现
```vue
<!-- src/card2.1/components/data-dispatcher/DataDispatcher.vue -->
<script setup lang="ts">
/**
 * 数据发送器组件
 * 支持向设备发送各种格式的数据和控制指令
 */
import { computed, ref } from 'vue'
import { 
  NButton, 
  NIcon, 
  NCountdown,
  useDialog,
  useMessage,
  useNotification
} from 'naive-ui'
import * as ionicons5 from '@vicons/ionicons5'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/store/modules/theme'
import type { DataDispatcherAPI } from './api/data-dispatcher-api'

interface DataDispatcherConfig {
  buttonConfig?: {
    text?: string
    icon?: string
    style?: 'primary' | 'success' | 'warning' | 'error' | 'custom'
    customColor?: string
    size?: 'small' | 'medium' | 'large' | 'huge'
    shape?: 'default' | 'circle' | 'round'
  }
  dataConfig?: {
    dataType?: 'attributes' | 'telemetry' | 'command'
    format?: 'simple' | 'json' | 'keyvalue'
    payload?: any
  }
  behaviorConfig?: {
    confirmBeforeSend?: boolean
    showDeviceName?: boolean
    cooldownTime?: number
    successAction?: 'message' | 'notification' | 'none'
  }
  layout?: {
    direction?: 'vertical' | 'horizontal'
    alignment?: 'center' | 'start' | 'end'
  }
}

interface Props {
  config: DataDispatcherConfig
  data?: {
    targetDevice?: {
      deviceId: string
      deviceName: string
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
const notification = useNotification()

// API 集成
const api = new DataDispatcherAPI()

// 组件状态
const isSending = ref(false)
const cooldownRemaining = ref(0)

// 计算属性
const targetDevice = computed(() => props.data?.targetDevice)

const buttonConfig = computed(() => ({
  text: '发送数据',
  icon: 'SendOutline',
  style: 'primary' as const,
  size: 'medium' as const,
  shape: 'default' as const,
  ...props.config.buttonConfig
}))

const dataConfig = computed(() => ({
  dataType: 'telemetry' as const,
  format: 'simple' as const,
  payload: '1',
  ...props.config.dataConfig
}))

const behaviorConfig = computed(() => ({
  confirmBeforeSend: false,
  showDeviceName: true,
  cooldownTime: 0,
  successAction: 'message' as const,
  ...props.config.behaviorConfig
}))

const layoutConfig = computed(() => ({
  direction: 'vertical' as const,
  alignment: 'center' as const,
  ...props.config.layout
}))

// 按钮是否可用
const isButtonDisabled = computed(() => 
  props.loading || isSending.value || cooldownRemaining.value > 0 || !targetDevice.value?.deviceId
)

// 按钮样式
const buttonStyle = computed(() => {
  const config = buttonConfig.value
  if (config.style === 'custom' && config.customColor) {
    return {
      backgroundColor: config.customColor,
      borderColor: config.customColor
    }
  }
  return {}
})

// 获取图标组件
const getIcon = (iconName: string) => {
  return (ionicons5 as any)[iconName]
}

// 处理数据格式化
const formatPayload = (): any => {
  const { format, payload } = dataConfig.value
  
  switch (format) {
    case 'simple':
      return payload
      
    case 'json':
      try {
        return JSON.parse(payload)
      } catch (error) {
        throw new Error(t('dataDispatcher.invalidJson'))
      }
      
    case 'keyvalue':
      const result: Record<string, any> = {}
      if (Array.isArray(payload)) {
        payload.forEach(item => {
          const { key, value, type } = item
          if (key) {
            switch (type) {
              case 'number':
                result[key] = Number(value)
                break
              case 'boolean':
                result[key] = Boolean(value)
                break
              default:
                result[key] = value
            }
          }
        })
      }
      return result
      
    default:
      return payload
  }
}

// 发送数据
const handleSendData = async () => {
  if (!targetDevice.value?.deviceId || isSending.value) return
  
  try {
    // 确认对话框
    if (behaviorConfig.value.confirmBeforeSend) {
      const confirmed = await new Promise<boolean>((resolve) => {
        dialog.warning({
          title: t('dataDispatcher.confirmTitle'),
          content: t('dataDispatcher.confirmContent', {
            device: targetDevice.value?.deviceName,
            data: JSON.stringify(formatPayload(), null, 2)
          }),
          positiveText: t('common.confirm'),
          negativeText: t('common.cancel'),
          onPositiveClick: () => resolve(true),
          onNegativeClick: () => resolve(false)
        })
      })
      
      if (!confirmed) return
    }
    
    isSending.value = true
    
    // 格式化要发送的数据
    const payload = formatPayload()
    
    // 发送数据
    await api.sendData({
      deviceId: targetDevice.value.deviceId,
      dataType: dataConfig.value.dataType,
      payload
    })
    
    // 成功反馈
    switch (behaviorConfig.value.successAction) {
      case 'message':
        message.success(t('dataDispatcher.sendSuccess'))
        break
      case 'notification':
        notification.success({
          title: t('dataDispatcher.sendSuccess'),
          content: t('dataDispatcher.sendSuccessDetail', {
            device: targetDevice.value.deviceName
          }),
          duration: 3000
        })
        break
    }
    
    // 启动冷却时间
    if (behaviorConfig.value.cooldownTime > 0) {
      cooldownRemaining.value = behaviorConfig.value.cooldownTime
      const cooldownTimer = setInterval(() => {
        cooldownRemaining.value--
        if (cooldownRemaining.value <= 0) {
          clearInterval(cooldownTimer)
        }
      }, 1000)
    }
    
  } catch (error) {
    console.error('Send data failed:', error)
    
    const errorMessage = error instanceof Error ? error.message : t('dataDispatcher.sendFailed')
    message.error(errorMessage)
    
  } finally {
    isSending.value = false
  }
}

// 暴露接口
defineExpose({
  sendData: handleSendData,
  reset: () => {
    cooldownRemaining.value = 0
    isSending.value = false
  }
})
</script>

<template>
  <div 
    class="data-dispatcher"
    :class="[
      `layout-${layoutConfig.direction}`,
      `align-${layoutConfig.alignment}`
    ]"
  >
    <!-- 设备名称 -->
    <div 
      v-if="behaviorConfig.showDeviceName && targetDevice?.deviceName" 
      class="device-name"
    >
      {{ targetDevice.deviceName }}
    </div>
    
    <!-- 发送按钮 -->
    <div class="button-container">
      <NButton
        :type="buttonConfig.style === 'custom' ? 'default' : buttonConfig.style"
        :size="buttonConfig.size"
        :disabled="isButtonDisabled"
        :loading="isSending"
        :style="buttonStyle"
        :circle="buttonConfig.shape === 'circle'"
        :round="buttonConfig.shape === 'round'"
        class="send-button"
        @click="handleSendData"
      >
        <template #icon>
          <NIcon>
            <component :is="getIcon(buttonConfig.icon)" />
          </NIcon>
        </template>
        
        <span v-if="buttonConfig.shape !== 'circle'">
          {{ buttonConfig.text }}
        </span>
      </NButton>
      
      <!-- 冷却倒计时 -->
      <div v-if="cooldownRemaining > 0" class="cooldown-indicator">
        <NCountdown 
          :duration="cooldownRemaining * 1000" 
          :active="cooldownRemaining > 0"
          :render="({ seconds }) => `${Math.ceil(seconds)}s`"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.data-dispatcher {
  display: flex;
  width: 100%;
  height: 100%;
  padding: var(--card-padding);
  gap: 12px;
  
  background-color: var(--card-color);
  border-radius: var(--border-radius);
  color: var(--text-color);
}

.layout-vertical {
  flex-direction: column;
}

.layout-horizontal {
  flex-direction: row;
}

.align-center {
  align-items: center;
  justify-content: center;
}

.align-start {
  align-items: flex-start;
  justify-content: flex-start;
}

.align-end {
  align-items: flex-end;
  justify-content: flex-end;
}

.device-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color-2);
  text-align: center;
}

.button-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.send-button {
  min-width: 60px;
  transition: all 0.3s ease;
}

.cooldown-indicator {
  font-size: 12px;
  color: var(--warning-color);
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .data-dispatcher {
    padding: 8px;
    gap: 8px;
  }
  
  .device-name {
    font-size: 12px;
  }
}

/* 暗色主题适配 */
[data-theme="dark"] .data-dispatcher {
  background-color: var(--card-color-dark);
  color: var(--text-color-dark);
}
</style>
```

#### 3. API 服务层
```typescript
// src/card2.1/components/data-dispatcher/api/data-dispatcher-api.ts
import { 
  attributeDataPub, 
  telemetryDataPub, 
  commandDataPub 
} from '@/service/api/device'

export interface SendDataRequest {
  deviceId: string
  dataType: 'attributes' | 'telemetry' | 'command'
  payload: any
}

export class DataDispatcherAPI {
  /**
   * 发送数据到设备
   */
  async sendData(request: SendDataRequest): Promise<void> {
    const { deviceId, dataType, payload } = request
    
    // 构建请求对象
    const apiRequest = {
      device_id: deviceId,
      value: typeof payload === 'string' ? payload : JSON.stringify(payload)
    }
    
    // 根据数据类型选择 API
    switch (dataType) {
      case 'attributes':
        await attributeDataPub(apiRequest)
        break
      case 'telemetry':
        await telemetryDataPub(apiRequest)
        break
      case 'command':
        await commandDataPub(apiRequest)
        break
      default:
        throw new Error(`Unsupported data type: ${dataType}`)
    }
  }
  
  /**
   * 验证 JSON 数据格式
   */
  validateJsonPayload(jsonString: string): boolean {
    try {
      JSON.parse(jsonString)
      return true
    } catch {
      return false
    }
  }
  
  /**
   * 格式化显示数据
   */
  formatDisplayData(data: any): string {
    if (typeof data === 'string') {
      return data
    }
    
    try {
      return JSON.stringify(data, null, 2)
    } catch {
      return String(data)
    }
  }
}
```

## 💻 具体实现步骤

### Phase 1: 基础重构（第1周）

1. **创建组件结构**
```bash
src/card2.1/components/data-dispatcher/
├── index.ts                     # 组件定义
├── DataDispatcher.vue           # 核心组件
├── ConfigPanel.vue              # 配置面板
├── types.ts                     # 类型定义
├── api/
│   └── data-dispatcher-api.ts   # API 服务层
└── hooks/
    └── useDataDispatcher.ts     # 业务逻辑 hook
```

2. **实现核心功能**
- 多种数据格式支持
- 按钮样式和交互
- API 集成

### Phase 2: 高级功能开发（第2周）

1. **增强配置选项**
- 复杂数据格式配置
- 按钮样式自定义
- 行为配置选项

2. **用户体验优化**
- 确认对话框
- 冷却时间机制
- 成功/失败反馈

### Phase 3: 测试和完善（第3周）

1. **功能测试**
- 各种数据格式发送测试
- 配置选项验证
- 错误处理测试

2. **性能和安全**
- 数据验证和安全检查
- 性能优化
- 用户权限控制

## ✅ 测试验证方案

### 功能测试
- [ ] 简单值、JSON、键值对格式数据正确发送
- [ ] 三种数据类型 API 正确调用
- [ ] 按钮样式和配置生效
- [ ] 确认对话框正常工作
- [ ] 冷却时间机制正确

### 数据验证测试
- [ ] JSON 格式验证正确
- [ ] 数据类型转换准确
- [ ] 错误数据被正确拒绝

### 用户体验测试
- [ ] 响应式布局适配
- [ ] 主题切换正常
- [ ] 操作反馈及时准确

## 📈 迁移收益

### 功能增强
- **数据格式支持**: 简单字符串 → 多种复杂数据格式
- **用户体验**: 基础按钮 → 完整的交互体验系统
- **配置选项**: 有限配置 → 丰富的自定义选项

### 安全改进
- **数据验证**: 无验证 → 完整的数据格式验证
- **操作确认**: 直接发送 → 可选的确认机制
- **错误处理**: 简单提示 → 详细的错误信息和处理

### 维护性提升
- **代码结构**: 单文件 → 模块化架构
- **类型安全**: 基础类型 → 完整 TypeScript 类型系统
- **测试覆盖**: 手工测试 → 自动化测试用例

---

**总结**: 数据发送器组件通过 Card 2.1 重构，将获得更强大的数据处理能力、更丰富的配置选项和更好的用户体验，显著提升设备控制的专业性和可靠性。