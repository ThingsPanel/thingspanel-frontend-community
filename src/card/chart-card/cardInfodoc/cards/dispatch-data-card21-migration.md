# Dispatch Data 组件 Card 2.1 迁移配置文档

## 组件概述

**组件ID**: `chart-dispatch`  
**组件类型**: `chart`  
**组件名称**: 数据分发器  
**功能描述**: 用于向设备发送数据的控制组件，支持属性、遥测和命令三种数据类型的发送

## 当前实现分析

### 1. 组件结构
```
dispatch-data/
├── index.ts              # 组件定义配置
├── component.vue         # 主组件实现
├── card-config.vue       # 配置表单
└── poster.png           # 组件预览图
```

### 2. 核心特性
- **数据发送**: 支持向设备发送属性、遥测和命令数据
- **单设备支持**: 支持 1 个设备数据源
- **自定义按钮**: 可配置按钮图标、颜色和文本
- **响应式设计**: 根据容器大小自动调整字体和图标大小
- **错误处理**: 包含发送成功/失败的消息提示
- **多数据类型**: 支持 attributes、telemetry、command 三种数据类型

### 3. 技术实现
- **图标库**: @vicons/ionicons5
- **API调用**: attributeDataPub、telemetryDataPub、commandDataPub
- **响应式**: ResizeObserver API 监听容器变化
- **消息提示**: 集成 naive-ui 消息组件

## Card 2.1 迁移配置

### 1. 组件定义 (ComponentDefinition)

```typescript
import { ComponentDefinition } from '@/card2.1/types'

export const dispatchDataDefinition: ComponentDefinition = {
  // 基础信息
  id: 'chart-dispatch',
  name: 'card.dataSent',
  type: 'chart',
  category: 'data',
  
  // 组件配置
  component: () => import('./component.vue'),
  configComponent: () => import('./config.vue'),
  
  // 布局配置
  layout: {
    defaultSize: { width: 3, height: 2 },
    minSize: { width: 2, height: 1 },
    maxSize: { width: 6, height: 4 },
    resizable: true
  },
  
  // 数据源配置
  dataSource: {
    type: 'device',
    multiple: false,
    maxCount: 1,
    required: true,
    supportedTypes: ['attribute', 'telemetry', 'command'],
    features: {
      timeRange: false,
      aggregate: false,
      realtime: false,
      writable: true  // 支持数据写入
    }
  },
  
  // 配置模式
  configSchema: {
    type: 'object',
    properties: {
      // 数据配置
      data: {
        type: 'object',
        properties: {
          dataType: {
            type: 'string',
            enum: ['attributes', 'telemetry', 'command'],
            default: 'command',
            title: '数据类型'
          },
          valueToSend: {
            type: 'string',
            default: '1',
            title: '发送值',
            description: '点击按钮时发送的数据值'
          },
          targetKey: {
            type: 'string',
            title: '目标键名',
            description: '数据发送的目标键名'
          }
        },
        required: ['dataType', 'valueToSend']
      },
      
      // 按钮样式配置
      button: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            default: '发送数据',
            title: '按钮文本'
          },
          color: {
            type: 'string',
            format: 'color',
            default: '#ff4d4f',
            title: '按钮颜色'
          },
          iconName: {
            type: 'string',
            enum: [
              'Play', 'Send', 'Power', 'Flash', 'Rocket',
              'ArrowForward', 'CheckmarkCircle', 'Settings',
              'Refresh', 'Download', 'Upload', 'Save'
            ],
            default: 'Play',
            title: '按钮图标'
          },
          iconColor: {
            type: 'string',
            format: 'color',
            default: '#ffffff',
            title: '图标颜色'
          }
        }
      },
      
      // 显示配置
      display: {
        type: 'object',
        properties: {
          showDeviceName: {
            type: 'boolean',
            default: true,
            title: '显示设备名称'
          },
          showButtonText: {
            type: 'boolean',
            default: true,
            title: '显示按钮文本'
          },
          customDeviceName: {
            type: 'string',
            title: '自定义设备名称',
            description: '留空则使用数据源中的设备名称'
          }
        }
      },
      
      // 行为配置
      behavior: {
        type: 'object',
        properties: {
          confirmBeforeSend: {
            type: 'boolean',
            default: false,
            title: '发送前确认'
          },
          cooldownTime: {
            type: 'number',
            minimum: 0,
            maximum: 60,
            default: 0,
            title: '冷却时间(秒)',
            description: '防止频繁点击的冷却时间'
          },
          showSuccessMessage: {
            type: 'boolean',
            default: true,
            title: '显示成功消息'
          },
          showErrorMessage: {
            type: 'boolean',
            default: true,
            title: '显示错误消息'
          }
        }
      }
    }
  }
}
```

### 2. 数据源映射

```typescript
// 原始数据源结构 -> Card 2.1 数据源结构
const dataSourceMapping = {
  // 设备数据源
  deviceSource: {
    type: 'device',
    config: {
      deviceId: 'string',      // 设备ID
      deviceName: 'string',    // 设备名称
      targetKey: 'string',     // 目标数据键名
      dataType: 'string'       // 数据类型: 'attributes' | 'telemetry' | 'command'
    }
  }
}
```

### 3. 实现要点

#### 数据发送逻辑
```typescript
// 数据发送函数
const sendData = async (config: DataConfig, deviceId: string) => {
  const { dataType, valueToSend, targetKey } = config
  
  const payload = {
    device_id: deviceId,
    value: valueToSend,
    key: targetKey
  }
  
  try {
    switch (dataType) {
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
        throw new Error(`Unsupported data type: ${dataType}`)
    }
    
    return { success: true }
  } catch (error) {
    console.error('Data send failed:', error)
    return { success: false, error }
  }
}

// 按钮点击处理
const handleButtonClick = async () => {
  if (!deviceId.value) {
    showError('设备ID不能为空')
    return
  }
  
  // 冷却时间检查
  if (isInCooldown.value) {
    showWarning(`请等待 ${remainingCooldown.value} 秒后再试`)
    return
  }
  
  // 发送前确认
  if (props.card.config.behavior.confirmBeforeSend) {
    const confirmed = await showConfirmDialog('确认发送数据？')
    if (!confirmed) return
  }
  
  // 设置冷却状态
  setButtonCooldown()
  
  // 发送数据
  const result = await sendData(props.card.config.data, deviceId.value)
  
  // 显示结果消息
  if (result.success) {
    if (props.card.config.behavior.showSuccessMessage) {
      showSuccess('数据发送成功')
    }
  } else {
    if (props.card.config.behavior.showErrorMessage) {
      showError('数据发送失败')
    }
  }
}
```

#### 冷却时间管理
```typescript
// 冷却时间状态
const isInCooldown = ref(false)
const remainingCooldown = ref(0)
let cooldownTimer: NodeJS.Timeout | null = null

// 设置按钮冷却
const setButtonCooldown = () => {
  const cooldownTime = props.card.config.behavior.cooldownTime || 0
  if (cooldownTime <= 0) return
  
  isInCooldown.value = true
  remainingCooldown.value = cooldownTime
  
  cooldownTimer = setInterval(() => {
    remainingCooldown.value--
    if (remainingCooldown.value <= 0) {
      clearCooldown()
    }
  }, 1000)
}

// 清除冷却状态
const clearCooldown = () => {
  isInCooldown.value = false
  remainingCooldown.value = 0
  if (cooldownTimer) {
    clearInterval(cooldownTimer)
    cooldownTimer = null
  }
}
```

#### 响应式布局
```typescript
// 响应式尺寸计算
const calculateSizes = (containerWidth: number, containerHeight: number) => {
  const minDimension = Math.min(containerWidth, containerHeight)
  
  return {
    fontSize: `${Math.max(12, minDimension / 10)}px`,
    iconSize: `${Math.max(16, minDimension / 5)}px`,
    buttonSize: {
      width: `${Math.min(containerWidth * 0.6, containerHeight * 0.4)}px`,
      height: `${Math.min(containerWidth * 0.3, containerHeight * 0.4)}px`
    }
  }
}

// ResizeObserver 监听
const setupResizeObserver = () => {
  if (!containerRef.value) return
  
  resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect
      const sizes = calculateSizes(width, height)
      
      fontSize.value = sizes.fontSize
      iconSize.value = sizes.iconSize
      buttonStyle.value = sizes.buttonSize
    }
  })
  
  resizeObserver.observe(containerRef.value)
}
```

#### 图标系统集成
```typescript
// 图标配置
import * as ionicons5 from '@vicons/ionicons5'

// 可用图标列表
const availableIcons = {
  Play: ionicons5.Play,
  Send: ionicons5.Send,
  Power: ionicons5.Power,
  Flash: ionicons5.Flash,
  Rocket: ionicons5.Rocket,
  ArrowForward: ionicons5.ArrowForward,
  CheckmarkCircle: ionicons5.CheckmarkCircle,
  Settings: ionicons5.Settings,
  Refresh: ionicons5.Refresh,
  Download: ionicons5.Download,
  Upload: ionicons5.Upload,
  Save: ionicons5.Save
}

// 动态图标组件
const IconComponent = computed(() => {
  const iconName = props.card.config.button.iconName || 'Play'
  return availableIcons[iconName] || availableIcons.Play
})
```

## 迁移检查清单

### 功能迁移
- [ ] 数据发送功能（属性、遥测、命令）
- [ ] 按钮点击处理
- [ ] 设备名称显示
- [ ] 响应式布局调整
- [ ] 错误处理和消息提示
- [ ] 冷却时间控制

### 配置迁移
- [ ] 按钮样式配置（颜色、图标、文本）
- [ ] 数据类型配置
- [ ] 发送值配置
- [ ] 显示选项配置
- [ ] 行为控制配置

### 安全性检查
- [ ] 输入验证
- [ ] 权限检查
- [ ] 频率限制
- [ ] 错误处理

## 迁移步骤

### 1. 创建组件定义
```bash
# 创建组件目录
mkdir -p src/card2.1/components/data/dispatch-data

# 创建必要文件
touch src/card2.1/components/data/dispatch-data/definition.ts
touch src/card2.1/components/data/dispatch-data/component.vue
touch src/card2.1/components/data/dispatch-data/config.vue
```

### 2. 实现核心组件
- 迁移 `component.vue` 主组件逻辑
- 适配 Card 2.1 数据源接口
- 实现冷却时间和确认机制
- 实现配置表单组件

### 3. 配置验证
- 测试数据发送功能
- 验证按钮样式配置
- 测试响应式布局
- 检查错误处理机制

### 4. 安全测试
- 验证输入数据安全性
- 测试频率限制功能
- 检查权限控制

## 数据发送流程

### 1. 数据准备
```typescript
// 构建发送数据
const buildPayload = (config: DataConfig, deviceId: string) => {
  return {
    device_id: deviceId,
    key: config.targetKey,
    value: config.valueToSend,
    timestamp: Date.now()
  }
}
```

### 2. API 调用
```typescript
// 根据数据类型选择API
const selectAPI = (dataType: string) => {
  const apiMap = {
    attributes: attributeDataPub,
    telemetry: telemetryDataPub,
    command: commandDataPub
  }
  
  return apiMap[dataType] || commandDataPub
}
```

### 3. 结果处理
```typescript
// 处理发送结果
const handleSendResult = (result: any, config: BehaviorConfig) => {
  if (result.success) {
    if (config.showSuccessMessage) {
      showSuccessNotification('数据发送成功')
    }
    
    // 触发成功事件
    emit('dataSent', { success: true, data: result.data })
  } else {
    if (config.showErrorMessage) {
      showErrorNotification('数据发送失败: ' + result.error)
    }
    
    // 触发失败事件
    emit('dataSent', { success: false, error: result.error })
  }
}
```

## 配置示例

### 基础配置
```json
{
  "data": {
    "dataType": "command",
    "valueToSend": "1",
    "targetKey": "switch"
  },
  "button": {
    "text": "开启设备",
    "color": "#52c41a",
    "iconName": "Power",
    "iconColor": "#ffffff"
  },
  "display": {
    "showDeviceName": true,
    "showButtonText": true
  },
  "behavior": {
    "confirmBeforeSend": false,
    "cooldownTime": 2,
    "showSuccessMessage": true,
    "showErrorMessage": true
  }
}
```

### 高级配置
```json
{
  "data": {
    "dataType": "telemetry",
    "valueToSend": "25.5",
    "targetKey": "temperature_setpoint"
  },
  "button": {
    "text": "设置温度",
    "color": "#1890ff",
    "iconName": "Settings",
    "iconColor": "#ffffff"
  },
  "display": {
    "showDeviceName": true,
    "showButtonText": true,
    "customDeviceName": "空调控制器"
  },
  "behavior": {
    "confirmBeforeSend": true,
    "cooldownTime": 5,
    "showSuccessMessage": true,
    "showErrorMessage": true
  }
}
```

## 使用场景

### 1. 设备控制
- 开关控制
- 模式切换
- 参数设置

### 2. 数据注入
- 测试数据发送
- 校准数据写入
- 配置参数更新

### 3. 远程操作
- 远程重启
- 远程配置
- 远程诊断

## 相关文档

- [Card 2.1 架构文档](../architecture.md)
- [数据源配置指南](../data-source-guide.md)
- [组件开发规范](../component-development.md)
- [设备控制API文档](../device-control-api.md)
- [安全性指南](../security-guide.md)