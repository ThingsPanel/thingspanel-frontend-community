# Instrument Panel 组件 Card 2.1 迁移配置

## 📊 组件概述

**组件名称**: instrument-panel (仪表盘)  
**分类**: dashboard (仪表盘)  
**功能**: 显示单个数值的圆形仪表盘，支持自定义最小值、最大值和单位  
**适用场景**: 温度、压力、速度等单一指标的可视化展示

## 🔄 当前实现分析

### 原有配置结构
```typescript
// 当前 chart-card 配置
{
  id: 'instrument-panel',
  type: 'chart',
  preset: {
    dataSource: {
      origin: 'device',
      sourceNum: 1,
      systemSource: [{}],
      deviceSource: [{}]
    },
    config: {
      unit: '',      // 单位
      min: 0,        // 最小值
      max: 200       // 最大值
    },
    iCardViewDefault: {
      w: 5, h: 3, minH: 1, minW: 2
    }
  }
}
```

### 数据获取方式
- 通过 `telemetryDataCurrentKeys` API 获取设备遥测数据
- 支持实时数据更新 (`updateData` 方法)
- 数据格式: `{ [metricsId]: value, unit?: string }`

## 🚀 Card 2.1 迁移配置

### 1. 组件定义 (definition.ts)

```typescript
import type { ComponentDefinition } from '@/card2.1/types'
import { createPropertyWhitelist } from '@/card2.1/core/PropertyExposureManager'
import InstrumentPanelComponent from './component.vue'
import InstrumentPanelSetting from './setting.vue'

export const instrumentPanelDefinition: ComponentDefinition = {
  // 🏷️ 基础信息
  type: 'instrument-panel',
  name: '📊 仪表盘',
  description: '显示单个数值的圆形仪表盘，支持自定义最小值、最大值和单位',
  icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z" /></svg>',
  version: '2.1.0',
  author: 'ThingsPanel',
  
  // 🎨 组件实现
  component: InstrumentPanelComponent,
  configComponent: InstrumentPanelSetting,
  
  // 📐 布局配置
  defaultLayout: {
    gridstack: { w: 5, h: 3, x: 0, y: 0, minW: 2, minH: 1, maxW: 8, maxH: 6 }
  },
  layout: {
    defaultSize: { width: 5, height: 3 },
    minSize: { width: 2, height: 1 },
    maxSize: { width: 8, height: 6 },
    resizable: true
  },
  
  // 🔐 权限配置
  permission: '不限',
  
  // 🏷️ 标签分类
  tags: ['仪表盘', '数值显示', '监控', 'dashboard'],
  category: 'dashboard',
  
  // ⚡ 功能特性
  features: {
    realtime: true,        // 支持实时数据
    dataBinding: true,     // 支持数据绑定
    configurable: true,    // 支持配置
    responsive: true       // 响应式布局
  },

  // 📊 数据源需求
  dataSources: [
    {
      key: 'value',
      name: '仪表盘数值',
      description: '仪表盘显示的主要数值',
      supportedTypes: ['static', 'api', 'websocket', 'mqtt'],
      required: true,
      example: 85.5
    },
    {
      key: 'unit',
      name: '数值单位',
      description: '数值的单位标识',
      supportedTypes: ['static', 'api', 'websocket'],
      required: false,
      example: '°C'
    }
  ],

  // ⚙️ 静态参数配置
  staticParams: [
    {
      key: 'min',
      name: '最小值',
      type: 'number',
      description: '仪表盘的最小刻度值',
      defaultValue: 0,
      required: false
    },
    {
      key: 'max',
      name: '最大值',
      type: 'number',
      description: '仪表盘的最大刻度值',
      defaultValue: 100,
      required: false
    },
    {
      key: 'unit',
      name: '单位',
      type: 'string',
      description: '数值单位（静态配置，优先级低于数据源）',
      defaultValue: '',
      required: false
    },
    {
      key: 'title',
      name: '标题',
      type: 'string',
      description: '仪表盘标题',
      defaultValue: '',
      required: false
    },
    {
      key: 'precision',
      name: '精度',
      type: 'number',
      description: '数值显示的小数位数',
      defaultValue: 1,
      required: false
    }
  ],

  // 🎯 交互能力声明
  interactionCapabilities: {
    supportedEvents: ['click', 'hover', 'dataChange', 'thresholdExceeded'],
    availableActions: [
      'navigateToUrl', 'updateComponentData', 'changeVisibility',
      'showNotification', 'emitEvent', 'flashColor', 'pulseEffect',
      'changeGaugeColor', 'triggerAnimation'
    ],
    watchableProperties: {
      'value': {
        type: 'number',
        description: '当前数值',
        defaultValue: 0
      },
      'percentage': {
        type: 'number',
        description: '当前百分比（基于最小值和最大值计算）',
        defaultValue: 0
      },
      'status': {
        type: 'string',
        description: '状态（normal/warning/danger）',
        defaultValue: 'normal'
      },
      'unit': {
        type: 'string',
        description: '当前单位',
        defaultValue: ''
      }
    },
    defaultInteractions: [
      {
        event: 'thresholdExceeded',
        responses: [
          {
            action: 'flashColor',
            delay: 0,
            name: '阈值超限闪烁',
            enabled: true
          },
          {
            action: 'showNotification',
            delay: 500,
            name: '阈值告警通知',
            enabled: true
          }
        ],
        enabled: true,
        name: '阈值超限告警',
        watchedProperty: 'value'
      }
    ]
  },

  // 🔒 属性暴露白名单
  propertyWhitelist: createPropertyWhitelist({
    // 核心数据属性
    value: {
      level: 'public',
      type: 'number',
      description: '仪表盘当前数值',
      defaultValue: 0,
      visibleInInteraction: true,
      visibleInDebug: true
    },
    percentage: {
      level: 'public',
      type: 'number',
      description: '当前百分比',
      defaultValue: 0,
      visibleInInteraction: true,
      visibleInDebug: true,
      readonly: true
    },
    status: {
      level: 'public',
      type: 'string',
      description: '仪表盘状态',
      defaultValue: 'normal',
      visibleInInteraction: true,
      visibleInDebug: true,
      readonly: true
    },
    
    // 配置属性
    min: {
      level: 'protected',
      type: 'number',
      description: '最小值',
      defaultValue: 0,
      visibleInDebug: true
    },
    max: {
      level: 'protected',
      type: 'number',
      description: '最大值',
      defaultValue: 100,
      visibleInDebug: true
    },
    unit: {
      level: 'public',
      type: 'string',
      description: '数值单位',
      defaultValue: '',
      visibleInInteraction: true,
      visibleInDebug: true
    },
    
    // 内部状态
    isLoading: {
      level: 'private',
      type: 'boolean',
      description: '数据加载状态',
      defaultValue: false,
      visibleInDebug: true,
      readonly: true
    }
  })
}
```

### 2. 组件配置接口

```typescript
// 组件配置类型定义
export interface InstrumentPanelConfig {
  // 数值配置
  min: number           // 最小值
  max: number           // 最大值
  unit: string          // 单位
  precision: number     // 精度
  
  // 显示配置
  title: string         // 标题
  showTitle: boolean    // 是否显示标题
  showUnit: boolean     // 是否显示单位
  
  // 样式配置
  gaugeColor: string    // 仪表盘颜色
  backgroundColor: string // 背景颜色
  textColor: string     // 文字颜色
  
  // 阈值配置
  warningThreshold?: number   // 警告阈值
  dangerThreshold?: number    // 危险阈值
  
  // 动画配置
  enableAnimation: boolean    // 启用动画
  animationDuration: number   // 动画持续时间
}

// 统一配置结构
export interface InstrumentPanelUnifiedConfig {
  base: {
    deviceId?: string
    metricsList?: MetricItem[]
    title?: string
    visible?: boolean
  }
  component: InstrumentPanelConfig
  dataSource: {
    value?: {
      sourceType: 'static' | 'api' | 'websocket' | 'mqtt'
      sourceConfig: Record<string, unknown>
      fieldMapping?: string
    }
    unit?: {
      sourceType: 'static' | 'api' | 'websocket'
      sourceConfig: Record<string, unknown>
      fieldMapping?: string
    }
  }
  interaction: {
    // 交互配置
    enableClick?: boolean
    enableHover?: boolean
    thresholdAlerts?: boolean
  }
}
```

### 3. 数据源映射

```typescript
// 数据源映射配置
export const instrumentPanelDataMapping = {
  // 主数值映射
  value: {
    // 从设备遥测数据映射
    deviceTelemetry: {
      path: 'data[0].value',
      transform: (value: any) => Number(value) || 0,
      fallback: 0
    },
    // 从API响应映射
    apiResponse: {
      path: 'value',
      transform: (value: any) => Number(value) || 0,
      fallback: 0
    },
    // WebSocket数据映射
    websocket: {
      path: 'payload.value',
      transform: (value: any) => Number(value) || 0,
      fallback: 0
    }
  },
  
  // 单位映射
  unit: {
    deviceTelemetry: {
      path: 'data[0].unit',
      transform: (unit: any) => String(unit || ''),
      fallback: ''
    },
    apiResponse: {
      path: 'unit',
      transform: (unit: any) => String(unit || ''),
      fallback: ''
    }
  }
}
```

### 4. 组件实现要点

```typescript
// Vue 组件实现关键点
export default defineComponent({
  name: 'InstrumentPanel',
  setup(props) {
    // 使用 Card 2.1 统一配置管理
    const {
      config,
      displayData,
      updateConfig,
      exposeWhitelistedProperties,
      watchProperty
    } = useCard2Props<InstrumentPanelConfig>({
      config: props.initialConfig,
      componentId: props.componentId
    })

    // 计算属性
    const currentValue = computed(() => {
      // 数据源优先级：数据源 > 静态配置
      return displayData.value?.value ?? config.value.defaultValue ?? 0
    })

    const currentUnit = computed(() => {
      return displayData.value?.unit ?? config.value.unit ?? ''
    })

    const percentage = computed(() => {
      const { min, max } = config.value
      const value = currentValue.value
      return Math.min(Math.max((value - min) / (max - min) * 100, 0), 100)
    })

    const status = computed(() => {
      const value = currentValue.value
      const { dangerThreshold, warningThreshold } = config.value
      
      if (dangerThreshold && value >= dangerThreshold) return 'danger'
      if (warningThreshold && value >= warningThreshold) return 'warning'
      return 'normal'
    })

    // 监听属性变化
    watchProperty('value', (newValue, oldValue) => {
      // 检查阈值超限
      if (config.value.dangerThreshold && newValue >= config.value.dangerThreshold) {
        // 触发阈值超限事件
        window.dispatchEvent(new CustomEvent('thresholdExceeded', {
          detail: { componentId: props.componentId, value: newValue, type: 'danger' }
        }))
      }
    })

    // 暴露属性
    exposeWhitelistedProperties({
      value: currentValue,
      percentage,
      status,
      unit: currentUnit,
      min: () => config.value.min,
      max: () => config.value.max,
      isLoading: ref(false)
    })

    return {
      currentValue,
      currentUnit,
      percentage,
      status,
      config
    }
  }
})
```

## 📋 迁移检查清单

### ✅ 功能对等性
- [x] 圆形仪表盘显示
- [x] 最小值/最大值配置
- [x] 单位显示
- [x] 实时数据更新
- [x] 响应式布局

### ✅ 新增功能
- [x] 阈值告警机制
- [x] 交互能力支持
- [x] 属性暴露白名单
- [x] 统一配置管理
- [x] 多数据源支持

### ✅ 数据兼容性
- [x] 设备遥测数据兼容
- [x] API数据源支持
- [x] WebSocket实时数据
- [x] 静态数据配置

### ✅ 配置迁移
- [x] 原有配置项映射
- [x] 新增配置项定义
- [x] 默认值设置
- [x] 验证规则定义

## 🔄 迁移步骤

1. **创建组件目录结构**
   ```
   src/card2.1/components/chart/dashboard/instrument-panel/
   ├── definition.ts      # 组件定义
   ├── index.vue         # Vue组件实现
   ├── setting.vue       # 配置组件
   ├── settingConfig.ts  # 配置定义
   └── index.ts          # 导出文件
   ```

2. **实现组件定义** - 按照上述 `definition.ts` 配置

3. **实现Vue组件** - 使用 `useCard2Props` Hook

4. **实现配置组件** - 基于 `FlexibleConfigForm`

5. **注册组件** - 添加到自动注册系统

6. **测试验证** - 功能测试和数据兼容性测试

## 📚 相关文档

- [Card 2.1 开发指南](../../../card2.1/docs/COMPREHENSIVE_DEVELOPMENT_GUIDE.md)
- [组件开发规范](../../../card2.1/docs/COMPONENT_DEVELOPMENT_GUIDE.md)
- [数据绑定系统](../../../card2.1/docs/DATA_BINDING_GUIDE.md)
- [交互系统文档](../../../card2.1/docs/INTERACTION_GUIDE.md)