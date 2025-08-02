# 文本信息组件 (Text Info)

## 概述

文本信息组件是一个灵活的文本显示组件，专门用于展示单个文本信息或数值。支持设备属性数据展示、自定义格式化、数据映射、动画效果等功能，提供丰富的样式配置选项。

## 主要特性

### 📊 数据展示
- **多数据源支持**：支持设备属性数据、API数据等多种数据源
- **数据格式化**：支持数值精度控制、千分位分隔符、前缀后缀
- **数据映射**：支持将原始值映射为自定义显示值和颜色
- **默认值设置**：无数据时显示预设的默认值

### 🎨 样式定制
- **字体控制**：支持字体大小、权重、颜色的独立设置
- **布局配置**：支持指标名称和单位的位置调整
- **容器样式**：支持背景色、边框、内边距、对齐方式设置
- **响应式字体**：根据容器大小自动调整字体大小

### ⚡ 动画效果
- **数值变化动画**：数值更新时的缩放动画效果
- **闪烁提醒**：数据变化时的闪烁提醒功能
- **自定义动画**：支持动画时长、缓动类型的配置

### 🔧 交互功能
- **实时更新**：支持WebSocket实时数据更新
- **错误处理**：优雅的错误状态显示
- **加载状态**：数据加载时的loading效果

## 配置选项

### 基础设置
- `title`: 组件标题

### 显示设置
- `showMetricName`: 是否显示指标名称
- `metricNamePosition`: 指标名称位置 (top/bottom/left/right)
- `customMetricName`: 自定义指标名称
- `showUnit`: 是否显示单位
- `unitPosition`: 单位位置 (after/below/above)
- `customUnit`: 自定义单位

### 样式设置
#### 值样式
- `valueFontSize`: 值字体大小
- `valueFontWeight`: 值字体权重
- `valueColor`: 值颜色

#### 指标名称样式
- `metricNameFontSize`: 指标名称字体大小
- `metricNameColor`: 指标名称颜色

#### 单位样式
- `unitFontSize`: 单位字体大小
- `unitColor`: 单位颜色

#### 容器样式
- `backgroundColor`: 背景色
- `border`: 边框设置（显示、宽度、颜色、圆角）
- `padding`: 内边距设置
- `textAlign`: 文本对齐 (left/center/right)
- `verticalAlign`: 垂直对齐 (top/middle/bottom)

### 数据设置
- `defaultValue`: 默认值
- `format`: 数据格式化配置
  - `type`: 数据类型 (string/number/boolean)
  - `precision`: 数值精度
  - `thousandsSeparator`: 千分位分隔符
  - `prefix`: 前缀
  - `suffix`: 后缀
- `mapping`: 数据映射配置
  - `enabled`: 是否启用映射
  - `rules`: 映射规则数组

### 动画设置
- `enabled`: 是否启用动画
- `valueChange`: 数值变化动画配置
  - `duration`: 动画时长
  - `easing`: 缓动类型
- `blink`: 闪烁提醒配置
  - `enabled`: 是否启用
  - `color`: 闪烁颜色
  - `count`: 闪烁次数
  - `interval`: 闪烁间隔

### 响应式设置
- `enabled`: 是否启用响应式字体
- `minFontSize`: 最小字体大小
- `maxFontSize`: 最大字体大小
- `fontScale`: 字体缩放比例

## 数据格式

### 输入数据格式
```typescript
interface TextInfoData {
  value: string | number | boolean  // 显示值
  unit?: string                     // 单位（可选）
}
```

### 设备属性数据格式
```json
{
  "value": "1.9.2",
  "unit": "版本"
}
```

### 数据映射示例
```json
{
  "mapping": {
    "enabled": true,
    "rules": [
      {
        "value": 1,
        "display": "开启",
        "color": "#52c41a"
      },
      {
        "value": 0,
        "display": "关闭",
        "color": "#ff4d4f"
      }
    ]
  }
}
```

## 使用示例

### 基础用法
```vue
<template>
  <TextInfoComponent 
    :config="textConfig"
    :data-source="dataSource"
  />
</template>

<script setup>
import { ref } from 'vue'
import TextInfoComponent from './component.vue'

const textConfig = ref({
  title: '设备版本',
  display: {
    showMetricName: true,
    metricNamePosition: 'bottom'
  },
  style: {
    valueFontSize: 36,
    valueColor: '#1890ff'
  }
})

const dataSource = ref({
  type: 'device',
  deviceSource: [{
    deviceId: 'device_001',
    metricsType: 'attributes',
    metricsId: 'firmware_version',
    metricsName: '固件版本'
  }]
})
</script>
```

### 高级配置
```vue
<template>
  <TextInfoComponent 
    :config="advancedConfig"
    :data-source="dataSource"
    @data-change="handleDataChange"
    @error="handleError"
  />
</template>

<script setup>
const advancedConfig = ref({
  title: '设备状态',
  display: {
    showMetricName: true,
    metricNamePosition: 'top',
    customMetricName: '运行状态',
    showUnit: false
  },
  style: {
    valueFontSize: 48,
    valueFontWeight: 'bold',
    backgroundColor: '#f6f6f6',
    border: {
      show: true,
      width: 2,
      color: '#d9d9d9',
      radius: 8
    },
    padding: {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20
    },
    textAlign: 'center',
    verticalAlign: 'middle'
  },
  data: {
    defaultValue: '未知',
    mapping: {
      enabled: true,
      rules: [
        {
          value: 1,
          display: '运行中',
          color: '#52c41a'
        },
        {
          value: 0,
          display: '已停止',
          color: '#ff4d4f'
        },
        {
          value: 2,
          display: '维护中',
          color: '#faad14'
        }
      ]
    }
  },
  animation: {
    enabled: true,
    valueChange: {
      duration: 500,
      easing: 'ease-out'
    },
    blink: {
      enabled: true,
      color: '#1890ff',
      count: 2,
      interval: 300
    }
  },
  responsive: {
    enabled: true,
    minFontSize: 16,
    maxFontSize: 64,
    fontScale: 0.12
  }
})

const handleDataChange = (data) => {
  console.log('数据变化:', data)
}

const handleError = (error) => {
  console.error('数据获取错误:', error)
}
</script>
```

### 数值格式化示例
```vue
<script setup>
const numberConfig = ref({
  title: '温度值',
  data: {
    format: {
      type: 'number',
      precision: 1,
      thousandsSeparator: false,
      suffix: '°C'
    }
  },
  display: {
    showUnit: true,
    unitPosition: 'after'
  }
})
</script>
```

## 事件

- `data-change`: 数据变化事件，参数：`{ value, unit, color }`
- `error`: 错误事件，参数：`Error`

## 方法

- `updateData(deviceId, metricsId, data)`: 更新数据
- `refreshData()`: 刷新数据
- `setupResponsiveFont()`: 设置响应式字体
- `animateValueChange(newValue)`: 触发数值变化动画
- `triggerBlink()`: 触发闪烁提醒

## 样式类名

- `.text-info-container`: 主容器
- `.loading-state`: 加载状态
- `.error-state`: 错误状态
- `.value-container`: 值容器
- `.value`: 主要值
- `.unit`: 单位
- `.metric-name`: 指标名称

## 注意事项

1. **响应式字体**：启用响应式字体时，组件会根据容器大小自动调整字体大小
2. **数据映射**：映射规则按顺序匹配，建议将最具体的规则放在前面
3. **动画性能**：大量组件同时启用动画可能影响性能，建议适度使用
4. **数据格式**：确保数据格式与配置的数据类型匹配
5. **颜色值**：支持十六进制、RGB、HSL等CSS颜色格式

## 兼容性

- 支持 Vue 3.x
- 兼容现代浏览器 (Chrome 80+, Firefox 78+, Safari 14+)
- 支持移动端响应式显示
- 支持ResizeObserver API（现代浏览器）

## 迁移指南

### 从旧版组件迁移

旧版配置会自动映射到新版配置：

```javascript
// 旧版配置
{
  dataSource: {
    deviceSource: [{
      metricsName: '固件版本'
    }]
  }
}

// 自动映射为新版配置
{
  display: {
    customMetricName: '固件版本'
  },
  responsive: {
    enabled: true,
    fontScale: 0.1
  }
}
```

## 更新日志

### v2.0.0
- 🎉 全新的 Card 2.0 架构
- ✨ 新增数据映射功能
- ✨ 新增动画效果支持
- ✨ 新增响应式字体功能
- ✨ 新增数据格式化选项
- 🎨 优化样式配置选项
- 🐛 修复字体大小计算问题
- 📈 提升渲染性能