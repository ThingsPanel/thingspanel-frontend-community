# 数据源系统 - 多数据源配置与绑定

Card 2.1的数据源系统是组件获取外部数据的核心机制。本章详细介绍如何配置和使用单个或多个数据源。

## 🎯 系统概述

### 数据源工作流程
```
组件定义dataSources → Visual Editor生成插槽 → 用户配置数据 → 数据绑定管理器处理 → 组件接收props
```

### 支持的数据源类型
- **static**: 静态数据（JSON格式）
- **api**: HTTP API接口
- **websocket**: WebSocket实时连接
- **mqtt**: MQTT消息队列（扩展）
- **database**: 数据库查询（扩展）

## 📋 dataSources配置详解

### 1. 基础配置结构

```typescript
// 在 definition.ts 中配置
const componentDefinition = {
  dataSources: [
    {
      key: 'dataSource1',                    // 🔑 唯一标识符
      name: '主数据源',                      // 显示名称
      description: '用于显示主要数据指标',    // 详细描述
      supportedTypes: ['static', 'api'],     // 支持的数据源类型
      fieldMappings: { /* 字段映射 */ },     // 数据字段映射规则
      required: false                        // 是否必填
    }
  ]
}
```

### 2. 字段映射配置 (fieldMappings)

```typescript
fieldMappings: {
  // 简单值映射
  'value': {
    targetField: 'currentValue',          // 组件props中的字段名
    type: 'value',                        // 数据类型：'value' | 'object' | 'array'
    required: true,                       // 是否必填
    defaultValue: 0,                      // 默认值
    transform: 'parseFloat(data.value)'   // 可选：数据转换函数
  },
  
  // 对象映射
  'config': {
    targetField: 'chartConfig',
    type: 'object',
    required: false,
    defaultValue: {},
    transform: 'JSON.parse(data.config || "{}")'
  },
  
  // 数组映射
  'items': {
    targetField: 'dataList',
    type: 'array',
    required: false,
    defaultValue: [],
    transform: 'Array.isArray(data.items) ? data.items : []'
  }
}
```

## 🔌 单数据源组件示例

### 组件定义配置
```typescript
// definition.ts
export const singleDataDisplayDefinition = {
  type: 'single-data-display',
  name: '单数据显示',
  
  // 单数据源配置
  dataSources: [
    {
      key: 'mainData',
      name: '数据源',
      description: '要显示的数据',
      supportedTypes: ['static', 'api', 'websocket'],
      fieldMappings: {
        'value': {
          targetField: 'dataValue',
          type: 'value',
          required: true,
          defaultValue: 0
        },
        'unit': {
          targetField: 'dataUnit',
          type: 'value',
          required: false,
          defaultValue: ''
        },
        'label': {
          targetField: 'dataLabel',
          type: 'value',
          required: false,
          defaultValue: '数据'
        }
      },
      required: false
    }
  ]
}
```

### Vue组件使用
```vue
<template>
  <div class="single-data-display">
    <div class="label">{{ dataLabel }}</div>
    <div class="value">{{ dataValue }} {{ dataUnit }}</div>
  </div>
</template>

<script setup lang="ts">
// Props定义 - 接收数据源映射的字段
interface Props {
  dataValue?: number      // 来自 fieldMappings.value.targetField
  dataUnit?: string       // 来自 fieldMappings.unit.targetField
  dataLabel?: string      // 来自 fieldMappings.label.targetField
}

const props = withDefaults(defineProps<Props>(), {
  dataValue: 0,
  dataUnit: '',
  dataLabel: '数据'
})
</script>
```

## 🔌 多数据源组件示例

### 双数据源组件
```typescript
// definition.ts - 双数据对比组件
export const dualDataComparisonDefinition = {
  type: 'dual-data-comparison',
  name: '数据对比',
  
  dataSources: [
    // 数据源1
    {
      key: 'dataSource1',
      name: '数据源1',
      description: '第一个对比数据',
      supportedTypes: ['static', 'api', 'websocket'],
      fieldMappings: {
        'value': {
          targetField: 'value1',
          type: 'value',
          required: true,
          defaultValue: 0
        },
        'label': {
          targetField: 'label1',
          type: 'value',
          required: false,
          defaultValue: '数据1'
        }
      },
      required: false
    },
    
    // 数据源2
    {
      key: 'dataSource2',
      name: '数据源2',
      description: '第二个对比数据',
      supportedTypes: ['static', 'api', 'websocket'],
      fieldMappings: {
        'value': {
          targetField: 'value2',
          type: 'value',
          required: true,
          defaultValue: 0
        },
        'label': {
          targetField: 'label2',
          type: 'value',
          required: false,
          defaultValue: '数据2'
        }
      },
      required: false
    }
  ]
}
```

### 对应的Vue组件
```vue
<template>
  <div class="dual-data-comparison">
    <div class="data-item data-1">
      <span class="label">{{ label1 }}</span>
      <span class="value">{{ value1 }}</span>
    </div>
    <div class="comparison">
      <span class="difference" :class="differenceClass">
        {{ Math.abs(difference) }}
        <span class="trend">{{ trend }}</span>
      </span>
    </div>
    <div class="data-item data-2">
      <span class="label">{{ label2 }}</span>
      <span class="value">{{ value2 }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  value1?: number
  label1?: string
  value2?: number
  label2?: string
}

const props = withDefaults(defineProps<Props>(), {
  value1: 0,
  label1: '数据1',
  value2: 0,
  label2: '数据2'
})

// 计算对比结果
const difference = computed(() => props.value1 - props.value2)
const trend = computed(() => difference.value > 0 ? '↑' : difference.value < 0 ? '↓' : '=')
const differenceClass = computed(() => ({
  'positive': difference.value > 0,
  'negative': difference.value < 0,
  'neutral': difference.value === 0
}))
</script>
```

## 📊 复杂数据源场景

### 图表组件（多种数据格式）
```typescript
export const chartComponentDefinition = {
  dataSources: [
    {
      key: 'chartData',
      name: '图表数据',
      description: '图表的数据点集合',
      supportedTypes: ['api', 'websocket'],
      fieldMappings: {
        // 数组数据映射
        'dataPoints': {
          targetField: 'chartDataPoints',
          type: 'array',
          required: true,
          defaultValue: [],
          transform: `
            // 确保数据是数组格式
            if (Array.isArray(data.dataPoints)) {
              return data.dataPoints.map(point => ({
                x: point.timestamp || point.x,
                y: parseFloat(point.value || point.y || 0),
                label: point.label || ''
              }))
            }
            return []
          `
        },
        
        // 配置对象映射
        'chartConfig': {
          targetField: 'chartConfiguration',
          type: 'object',
          required: false,
          defaultValue: {},
          transform: `
            const config = data.chartConfig || {}
            return {
              type: config.type || 'line',
              color: config.color || '#2080f0',
              showGrid: config.showGrid !== false,
              animation: config.animation !== false
            }
          `
        }
      },
      required: false
    }
  ]
}
```

## 🔄 数据源类型详解

### 1. Static（静态数据）
```json
{
  "value": 42,
  "unit": "℃",
  "label": "温度",
  "status": "normal",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 2. API（HTTP接口）
```typescript
// API数据源配置示例
{
  "type": "api",
  "url": "https://api.example.com/sensor/data",
  "method": "GET",
  "headers": {
    "Authorization": "Bearer {{token}}"
  },
  "params": {
    "deviceId": "{{deviceId}}",
    "latest": true
  },
  "interval": 5000,  // 5秒刷新一次
  "responseMapping": {
    "value": "data.temperature",
    "unit": "data.unit",
    "label": "data.sensorName"
  }
}
```

### 3. WebSocket（实时连接）
```typescript
// WebSocket数据源配置
{
  "type": "websocket",
  "url": "ws://localhost:8080/sensor-data",
  "protocols": ["sensor-protocol"],
  "messageFormat": "json",
  "subscribeMessage": {
    "action": "subscribe",
    "deviceId": "{{deviceId}}",
    "metrics": ["temperature", "humidity"]
  },
  "responseMapping": {
    "value": "payload.temperature",
    "unit": "payload.unit"
  }
}
```

## 🛠️ 数据处理与转换

### 自定义数据转换函数
```typescript
fieldMappings: {
  'rawData': {
    targetField: 'processedData',
    type: 'value',
    required: true,
    defaultValue: null,
    transform: `
      // 自定义数据处理逻辑
      function processData(rawData) {
        if (!rawData) return null;
        
        // 数据清洗
        const cleaned = rawData.toString().replace(/[^0-9.-]/g, '');
        const number = parseFloat(cleaned);
        
        // 数据验证
        if (isNaN(number)) return 0;
        
        // 数据格式化
        return Math.round(number * 100) / 100;
      }
      
      return processData(data.rawData);
    `
  }
}
```

### 条件数据映射
```typescript
fieldMappings: {
  'status': {
    targetField: 'displayStatus',
    type: 'value',
    required: false,
    defaultValue: 'unknown',
    transform: `
      const statusMap = {
        0: 'offline',
        1: 'online', 
        2: 'maintenance',
        3: 'error'
      };
      
      return statusMap[data.status] || 'unknown';
    `
  }
}
```

## 📝 开发最佳实践

### 1. 数据源设计原则
- **单一职责**: 每个数据源有明确的用途
- **合理默认**: 提供合理的defaultValue，确保组件稳定
- **类型一致**: 保持数据类型的一致性
- **错误处理**: 在transform中处理异常情况

### 2. 性能优化建议
- **按需加载**: 只配置组件真正需要的数据源
- **合理刷新**: 设置合适的数据刷新间隔
- **数据缓存**: 对相同数据源进行缓存复用
- **批量处理**: 合并多个小请求为批量请求

### 3. 调试技巧
```typescript
// 在transform中添加调试信息
transform: `
  console.log('数据源输入:', data);
  const result = processData(data);
  console.log('处理结果:', result);
  return result;
`
```

## ✅ 验证检查清单

创建数据源配置后，确保：

- [ ] `key`值在组件内唯一
- [ ] `fieldMappings`覆盖所有需要的数据字段
- [ ] 设置了合理的`defaultValue`
- [ ] `transform`函数处理了异常情况
- [ ] 在Visual Editor中能看到对应数量的数据源插槽
- [ ] 配置不同类型的数据源都能正常工作
- [ ] 组件能正确接收和显示数据

## 🔗 相关文档

- [组件定义详解](./04-component-definition.md)
- [属性暴露系统](./07-property-exposure.md)
- [调试工具](./15-debugging-tools.md)
- [API参考](./18-api-reference.md)

---

**掌握数据源系统是构建强大组件的基础！** 🚀