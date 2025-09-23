# Demo 组件 Card 2.1 迁移配置文档

## 组件概述

**组件ID**: `chart-demo`  
**组件类型**: `chart`  
**组件名称**: 演示数字指示器  
**功能描述**: 带图标的数字指示器演示组件，支持设备遥测和属性数据显示，具有响应式字体大小调整功能

## 当前实现分析

### 1. 组件结构
```
demo/
├── index.ts              # 组件定义配置
├── component.vue         # 主组件实现
├── card-config.vue       # 配置表单
├── poster.png           # 组件预览图
└── icons.ts             # 图标配置
```

### 2. 核心特性
- **单数据源**: 支持 1 个设备数据源
- **数据类型**: 支持遥测数据和属性数据
- **图标系统**: 集成 Fluent UI 图标库，100+ 图标可选
- **响应式设计**: 根据容器大小自动调整字体大小
- **实时更新**: 支持 WebSocket 实时数据更新
- **自定义配置**: 支持图标、颜色、单位自定义

### 3. 技术实现
- **图标库**: @vicons/fluent (Fluent UI 图标)
- **响应式**: ResizeObserver API 监听容器变化
- **数据获取**: 支持遥测和属性两种数据类型
- **样式布局**: 绝对定位布局，支持响应式调整

## Card 2.1 迁移配置

### 1. 组件定义 (ComponentDefinition)

```typescript
import { ComponentDefinition } from '@/card2.1/types'

export const demoDefinition: ComponentDefinition = {
  // 基础信息
  id: 'chart-demo',
  name: 'demo.digitalIndicator',
  type: 'chart',
  category: 'demo',
  
  // 组件配置
  component: () => import('./component.vue'),
  configComponent: () => import('./config.vue'),
  
  // 布局配置
  layout: {
    defaultSize: { width: 5, height: 3 },
    minSize: { width: 2, height: 1 },
    maxSize: { width: 12, height: 12 },
    resizable: true
  },
  
  // 数据源配置
  dataSource: {
    type: 'device',
    multiple: false,
    maxCount: 1,
    required: true,
    supportedTypes: ['telemetry', 'attribute'],
    features: {
      timeRange: false,
      aggregate: false,
      realtime: true
    }
  },
  
  // 配置模式
  configSchema: {
    type: 'object',
    properties: {
      // 显示配置
      display: {
        type: 'object',
        properties: {
          title: { type: 'string', default: '' },
          showIcon: { type: 'boolean', default: true },
          showUnit: { type: 'boolean', default: true },
          showName: { type: 'boolean', default: true }
        }
      },
      
      // 样式配置
      style: {
        type: 'object',
        properties: {
          iconName: { 
            type: 'string', 
            enum: [
              'ClipboardCode20Regular', 'Accessibility20Regular', 'Add20Regular',
              'Alert20Regular', 'ArrowDown20Regular', 'ArrowUp20Regular',
              'Camera20Regular', 'Chat20Regular', 'Clock20Regular',
              'Cloud20Regular', 'Document20Regular', 'Edit20Regular',
              'Heart20Regular', 'Home20Regular', 'Info20Regular',
              'Location20Regular', 'Mail20Regular', 'Person20Regular',
              'Phone20Regular', 'Settings20Regular', 'Star20Regular'
              // ... 更多图标选项
            ],
            default: 'ClipboardCode20Regular' 
          },
          iconColor: { 
            type: 'string', 
            format: 'color',
            default: '#000000' 
          },
          fontSize: {
            type: 'object',
            properties: {
              auto: { type: 'boolean', default: true },
              base: { type: 'number', minimum: 8, maximum: 72, default: 14 },
              ratio: { type: 'number', minimum: 0.1, maximum: 2, default: 1 }
            }
          },
          textColor: { 
            type: 'string', 
            format: 'color',
            default: '#000000' 
          },
          backgroundColor: { 
            type: 'string', 
            format: 'color',
            default: 'transparent' 
          }
        }
      },
      
      // 数据配置
      data: {
        type: 'object',
        properties: {
          unit: { type: 'string', default: '' },
          precision: { 
            type: 'number', 
            minimum: 0, 
            maximum: 10, 
            default: 2 
          },
          defaultValue: { type: 'string', default: '8' },
          format: {
            type: 'object',
            properties: {
              type: { 
                type: 'string', 
                enum: ['number', 'text', 'boolean'],
                default: 'number' 
              },
              thousandSeparator: { type: 'boolean', default: false },
              prefix: { type: 'string', default: '' },
              suffix: { type: 'string', default: '' }
            }
          }
        }
      },
      
      // 布局配置
      layout: {
        type: 'object',
        properties: {
          iconPosition: {
            type: 'object',
            properties: {
              left: { type: 'string', default: '4%' },
              bottom: { type: 'string', default: '20%' },
              width: { type: 'string', default: '25%' },
              height: { type: 'string', default: '25%' }
            }
          },
          namePosition: {
            type: 'object',
            properties: {
              top: { type: 'string', default: '15%' },
              left: { type: 'string', default: '8%' },
              width: { type: 'string', default: '45%' }
            }
          },
          valuePosition: {
            type: 'object',
            properties: {
              bottom: { type: 'string', default: '20%' },
              left: { type: 'string', default: '50%' },
              width: { type: 'string', default: '45%' }
            }
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
      metricKey: 'string',     // 指标键名
      metricName: 'string',    // 指标显示名称
      metricType: 'string',    // 指标类型: 'telemetry' | 'attribute'
      unit: 'string'           // 单位
    }
  }
}
```

### 3. 实现要点

#### 数据获取逻辑
```typescript
// 数据获取函数
const fetchData = async (dataSource: DataSourceConfig) => {
  const { deviceId, metricKey, metricType } = dataSource
  
  if (metricType === 'telemetry') {
    // 获取遥测数据
    const response = await telemetryDataCurrentKeys({
      device_id: deviceId,
      keys: metricKey
    })
    
    if (response?.data?.[0]) {
      return {
        value: response.data[0].value,
        unit: response.data[0].unit
      }
    }
  } else if (metricType === 'attribute') {
    // 获取属性数据
    const response = await getAttributeDataSet({ 
      device_id: deviceId 
    })
    
    const attributeData = response.data.find(item => item.key === metricKey)
    if (attributeData) {
      return {
        value: attributeData.value,
        unit: attributeData.unit
      }
    }
  }
  
  return { value: null, unit: '' }
}

// 实时数据更新
const updateData = (deviceId: string, metricKey: string, data: any) => {
  if (!metricKey || data[metricKey] === undefined || data[metricKey] === null || data[metricKey] === '') {
    logger.warn(`No data returned from websocket for ${metricKey}`)
    return
  }
  
  // 更新显示值
  displayValue.value = data[metricKey]
}
```

#### 响应式字体大小
```typescript
// 响应式字体大小计算
const calculateFontSize = (containerWidth: number, containerHeight: number, config: StyleConfig) => {
  if (!config.fontSize.auto) {
    return `${config.fontSize.base}px`
  }
  
  let fontSize = containerWidth / 20 // 基础计算
  
  // 宽高比调整
  const aspectRatio = containerWidth / containerHeight
  if (aspectRatio > 3) {
    fontSize = (containerWidth + (containerHeight * containerWidth) / containerHeight / 2) / 20 / (1 + aspectRatio / 2)
  }
  
  // 应用比例系数
  fontSize *= config.fontSize.ratio
  
  // 限制最小最大值
  fontSize = Math.max(8, Math.min(72, fontSize))
  
  return `${fontSize}px`
}

// ResizeObserver 监听
const setupResizeObserver = () => {
  if (!containerRef.value) return
  
  resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect
      fontSize.value = calculateFontSize(width, height, props.card.config.style)
    }
  })
  
  resizeObserver.observe(containerRef.value)
}
```

#### 图标系统集成
```typescript
// 图标配置
import { icons } from './icons'

// 动态图标组件
const IconComponent = computed(() => {
  const iconName = props.card.config.style.iconName || 'ClipboardCode20Regular'
  return icons[iconName] || icons.ClipboardCode20Regular
})

// 图标样式
const iconStyle = computed(() => ({
  color: props.card.config.style.iconColor || '#000000',
  position: 'absolute',
  ...props.card.config.layout.iconPosition
}))
```

#### 数据格式化
```typescript
// 数据格式化函数
const formatValue = (value: any, config: DataConfig) => {
  if (value === null || value === undefined || value === '') {
    return config.defaultValue || '8'
  }
  
  const { format } = config
  
  switch (format.type) {
    case 'number':
      const numValue = Number(value)
      if (isNaN(numValue)) return value
      
      let formatted = numValue.toFixed(config.precision)
      
      if (format.thousandSeparator) {
        formatted = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      }
      
      return `${format.prefix}${formatted}${format.suffix}`
      
    case 'boolean':
      return value ? '是' : '否'
      
    case 'text':
    default:
      return `${format.prefix}${value}${format.suffix}`
  }
}
```

## 迁移检查清单

### 功能迁移
- [ ] 单数据源支持
- [ ] 遥测数据获取
- [ ] 属性数据获取
- [ ] 实时数据更新
- [ ] 图标显示功能
- [ ] 响应式字体调整
- [ ] 数据格式化显示

### 配置迁移
- [ ] 图标选择配置
- [ ] 颜色配置
- [ ] 字体大小配置
- [ ] 单位配置
- [ ] 布局位置配置
- [ ] 数据格式配置

### 性能优化
- [ ] ResizeObserver 内存管理
- [ ] 图标懒加载
- [ ] 数据更新防抖
- [ ] 组件卸载清理

## 迁移步骤

### 1. 创建组件定义
```bash
# 创建组件目录
mkdir -p src/card2.1/components/demo/digital-indicator

# 创建必要文件
touch src/card2.1/components/demo/digital-indicator/definition.ts
touch src/card2.1/components/demo/digital-indicator/component.vue
touch src/card2.1/components/demo/digital-indicator/config.vue
touch src/card2.1/components/demo/digital-indicator/icons.ts
```

### 2. 实现核心组件
- 迁移 `component.vue` 主组件逻辑
- 迁移图标系统和响应式逻辑
- 适配 Card 2.1 数据源接口
- 实现配置表单组件

### 3. 配置验证
- 测试数据源配置
- 验证图标显示功能
- 测试响应式调整
- 检查实时更新效果

### 4. 性能测试
- 响应式性能测试
- 内存泄漏检查
- 图标加载性能

## 图标系统

### 可用图标列表
```typescript
// 常用图标分类
const iconCategories = {
  // 基础图标
  basic: [
    'Add20Regular', 'Delete20Regular', 'Edit20Regular', 'Save20Regular',
    'Copy20Regular', 'Cut20Regular', 'Search20Regular', 'Filter20Regular'
  ],
  
  // 状态图标
  status: [
    'Alert20Regular', 'ErrorCircle20Regular', 'Checkmark20Regular',
    'CircleOff20Regular', 'Info20Regular', 'Prohibited20Regular'
  ],
  
  // 设备图标
  device: [
    'Camera20Regular', 'Phone20Regular', 'Laptop20Regular',
    'Tv20Regular', 'Video20Regular', 'WifiOff20Regular'
  ],
  
  // 导航图标
  navigation: [
    'Home20Regular', 'Location20Regular', 'Map20Regular',
    'ArrowUp20Regular', 'ArrowDown20Regular', 'Target20Regular'
  ],
  
  // 通信图标
  communication: [
    'Mail20Regular', 'Chat20Regular', 'Call20Regular',
    'Share20Regular', 'Link20Regular', 'Globe20Regular'
  ]
}
```

## 配置示例

### 基础配置
```json
{
  "display": {
    "title": "温度传感器",
    "showIcon": true,
    "showUnit": true,
    "showName": true
  },
  "style": {
    "iconName": "Clock20Regular",
    "iconColor": "#1890ff",
    "fontSize": {
      "auto": true,
      "base": 14,
      "ratio": 1.2
    },
    "textColor": "#000000"
  },
  "data": {
    "unit": "°C",
    "precision": 1,
    "defaultValue": "0",
    "format": {
      "type": "number",
      "thousandSeparator": false
    }
  }
}
```

### 高级配置
```json
{
  "display": {
    "title": "设备状态",
    "showIcon": true,
    "showUnit": false,
    "showName": true
  },
  "style": {
    "iconName": "Alert20Regular",
    "iconColor": "#ff4d4f",
    "fontSize": {
      "auto": false,
      "base": 16
    },
    "textColor": "#ff4d4f",
    "backgroundColor": "#fff2f0"
  },
  "data": {
    "precision": 0,
    "defaultValue": "离线",
    "format": {
      "type": "text",
      "prefix": "状态: ",
      "suffix": ""
    }
  },
  "layout": {
    "iconPosition": {
      "left": "10%",
      "bottom": "30%",
      "width": "20%",
      "height": "20%"
    },
    "valuePosition": {
      "bottom": "30%",
      "left": "40%",
      "width": "50%"
    }
  }
}
```

## 使用场景

### 1. 设备状态监控
- 设备在线状态显示
- 关键指标实时监控
- 告警状态提示

### 2. 数据大屏展示
- KPI 指标展示
- 实时数据监控
- 状态概览面板

### 3. 演示和教学
- 组件功能演示
- 开发示例参考
- 快速原型构建

## 相关文档

- [Card 2.1 架构文档](../architecture.md)
- [数据源配置指南](../data-source-guide.md)
- [组件开发规范](../component-development.md)
- [图标系统文档](../icon-system.md)
- [响应式设计指南](../responsive-design.md)