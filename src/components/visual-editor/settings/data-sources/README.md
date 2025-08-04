# 设备数据源配置系统

## 概述

新的设备数据源配置系统提供了一个完整的、分步骤的数据源配置流程，支持多种数据类型、轮询方式和数据映射配置。

## 功能特性

### 1. 分步骤配置流程
- **第一步**：选择数据类型（遥测/属性/事件/命令）
- **第二步**：选择数据模式（最新数据/历史数据）
- **第三步**：如果是历史数据，选择时间范围和聚合方式
- **第四步**：选择设备
- **第五步**：根据数据类型过滤并选择具体指标
- **第六步**：数据预览和映射配置
- **第七步**：选择轮询方式（定时器/WebSocket/MQTT）

### 2. 支持的数据类型
- **遥测数据**：设备的实时测量数据（温度、湿度、压力等）
- **属性数据**：设备的静态属性信息（设备名称、类型、固件版本等）
- **事件数据**：设备产生的事件（告警、状态变更等）
- **命令数据**：发送给设备的命令状态

### 3. 轮询方式
- **定时器**：定期轮询数据，支持自定义间隔
- **WebSocket**：实时数据推送，支持自定义URL
- **MQTT**：物联网消息队列，支持Broker和Topic配置

### 4. 数据映射
- 可视化数据字段映射配置
- 支持嵌套对象和数组数据
- 实时数据预览
- 组件数据源定义

## 组件结构

```
src/components/visual-editor/settings/data-sources/
├── DeviceDataSourceConfig.vue      # 主配置组件
├── DataMappingConfig.vue           # 数据映射配置组件
├── DeviceDataSourceExample.vue     # 使用示例
└── README.md                       # 本文档
```

## 使用方法

### 基础用法

```vue
<template>
  <DeviceDataSourceConfig
    v-model="dataSource"
    @update:modelValue="onDataSourceChange"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DeviceDataSourceConfig from './DeviceDataSourceConfig.vue'
import type { DeviceDataSource } from '../../types/data-source'
import { DataSourceType } from '../../types/data-source'

const dataSource = ref<DeviceDataSource>({
  type: DataSourceType.DEVICE,
  enabled: true,
  name: '我的设备数据源',
  deviceId: '',
  metricsType: 'telemetry',
  dataMode: 'latest',
  pollingType: 'timer',
  dataPaths: [],
  refreshInterval: 5000
})

const onDataSourceChange = (newDataSource: DeviceDataSource) => {
  console.log('数据源配置已更新:', newDataSource)
}
</script>
```

### 使用数据源管理器

```vue
<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { dataSourceManager } from '../../core/data-source-manager'
import type { DeviceDataSource, DataSourceValue } from '../../types/data-source'

const dataSource = ref<DeviceDataSource>({ /* 配置 */ })
const dataValue = ref<DataSourceValue | null>(null)
const subscriberId = ref<string | null>(null)

// 启动数据源
const startDataSource = async () => {
  subscriberId.value = dataSourceManager.subscribe(
    dataSource.value,
    (value: DataSourceValue) => {
      dataValue.value = value
      console.log('收到数据更新:', value)
    }
  )
  
  // 立即获取一次数据
  const initialValue = await dataSourceManager.getValue(dataSource.value)
  dataValue.value = initialValue
}

// 停止数据源
const stopDataSource = () => {
  if (subscriberId.value) {
    dataSourceManager.unsubscribe(subscriberId.value)
    subscriberId.value = null
  }
}

// 清理资源
onUnmounted(() => {
  stopDataSource()
})
</script>
```

## 配置选项详解

### DeviceDataSource 接口

```typescript
interface DeviceDataSource {
  type: DataSourceType.DEVICE
  enabled: boolean
  name: string
  description?: string
  deviceId?: string
  metricsType?: 'telemetry' | 'attributes' | 'event' | 'command'
  metricsId?: string
  dataMode?: 'latest' | 'history'
  timeRange?: string
  aggregateFunction?: string
  pollingType?: 'timer' | 'websocket' | 'mqtt'
  refreshInterval?: number
  websocketUrl?: string
  mqttConfig?: {
    broker: string
    topic: string
    username?: string
    password?: string
  }
  dataPaths: DataPathMapping[]
}
```

### 时间范围选项

- `5m` - 最近5分钟
- `15m` - 最近15分钟
- `30m` - 最近30分钟
- `1h` - 最近1小时
- `3h` - 最近3小时
- `6h` - 最近6小时
- `12h` - 最近12小时
- `24h` - 最近24小时
- `3d` - 最近3天
- `7d` - 最近7天
- `30d` - 最近30天

### 聚合函数选项

- `avg` - 平均值
- `max` - 最大值
- `min` - 最小值
- `sum` - 求和
- `count` - 计数

## 数据映射配置

### DataPathMapping 接口

```typescript
interface DataPathMapping {
  key: string        // 数据源中的路径，如 "data.temperature"
  target: string     // 映射到组件的数据源名称，如 "temperature"
  description?: string // 描述
}
```

### 映射示例

```typescript
// 原始数据
{
  "deviceId": "device_001",
  "telemetry": {
    "temperature": 25.5,
    "humidity": 65.2
  },
  "timestamp": "2024-01-01T12:00:00Z"
}

// 映射配置
[
  {
    key: "telemetry.temperature",
    target: "temp",
    description: "温度数据"
  },
  {
    key: "telemetry.humidity",
    target: "humidity",
    description: "湿度数据"
  },
  {
    key: "timestamp",
    target: "time",
    description: "时间戳"
  }
]

// 映射结果
{
  "temp": 25.5,
  "humidity": 65.2,
  "time": "2024-01-01T12:00:00Z"
}
```

## 轮询方式详解

### 1. 定时器轮询

```typescript
{
  pollingType: 'timer',
  refreshInterval: 5000 // 5秒间隔
}
```

- 优点：简单可靠，适合大多数场景
- 缺点：实时性较差，资源消耗相对较高
- 适用场景：历史数据查询、低频数据更新

### 2. WebSocket 轮询

```typescript
{
  pollingType: 'websocket',
  websocketUrl: 'ws://localhost:8080/device-data'
}
```

- 优点：实时性好，资源消耗低
- 缺点：需要服务器支持WebSocket
- 适用场景：实时数据监控、高频数据更新

### 3. MQTT 轮询

```typescript
{
  pollingType: 'mqtt',
  mqttConfig: {
    broker: 'mqtt://localhost:1883',
    topic: 'device/+/telemetry',
    username: 'user',
    password: 'pass'
  }
}
```

- 优点：适合物联网场景，支持消息持久化
- 缺点：需要MQTT Broker
- 适用场景：IoT设备数据采集、分布式系统

## 最佳实践

### 1. 数据类型选择

- **遥测数据**：用于实时监控和图表展示
- **属性数据**：用于设备信息显示和配置
- **事件数据**：用于告警和状态通知
- **命令数据**：用于设备控制和命令状态跟踪

### 2. 轮询方式选择

- **最新数据**：优先使用WebSocket或MQTT
- **历史数据**：只能使用定时器轮询
- **高频数据**：使用WebSocket或MQTT
- **低频数据**：使用定时器轮询

### 3. 数据映射优化

- 使用有意义的映射名称
- 避免深层嵌套路径
- 为重要字段添加描述
- 定期检查和更新映射配置

### 4. 错误处理

```typescript
// 监听数据源错误
dataSourceManager.subscribe(dataSource, (value) => {
  if (value.quality === 'bad') {
    console.error('数据质量异常:', value.error)
    // 处理错误逻辑
  }
})
```

## 扩展开发

### 添加新的轮询方式

1. 在 `PollingType` 枚举中添加新类型
2. 在 `PollingManager` 中实现对应的轮询方法
3. 在 `DeviceDataSourceConfig.vue` 中添加配置界面

### 添加新的数据类型

1. 在 `metricsTypeOptions` 中添加新选项
2. 在 `loadMetricsOptions` 中添加对应的指标选项
3. 在 `fetchSampleData` 中添加对应的示例数据

### 自定义数据映射组件

```vue
<template>
  <DataMappingConfig
    :data="sampleData"
    :mappings="config.dataPaths"
    :component-fields="customComponentFields"
    @update:mappings="updateDataPaths"
  />
</template>

<script setup lang="ts">
const customComponentFields = [
  {
    name: 'customValue',
    type: 'number',
    required: true,
    description: '自定义数值',
    defaultValue: 0
  }
]
</script>
```

## 故障排除

### 常见问题

1. **数据源无法启动**
   - 检查设备和指标是否已选择
   - 检查网络连接和API地址
   - 查看浏览器控制台错误信息

2. **数据映射不生效**
   - 检查数据路径是否正确
   - 确认原始数据格式
   - 验证映射配置语法

3. **轮询频率过高**
   - 调整 `refreshInterval` 参数
   - 考虑使用WebSocket替代定时器
   - 检查服务器负载

4. **WebSocket连接失败**
   - 检查WebSocket URL格式
   - 确认服务器支持WebSocket
   - 检查防火墙设置

### 调试技巧

1. 使用浏览器开发者工具查看网络请求
2. 在控制台输出数据源配置和接收到的数据
3. 使用数据预览功能检查原始数据格式
4. 逐步测试每个配置步骤

## 更新日志

### v1.0.0 (2024-01-01)
- 初始版本发布
- 支持基础的数据源配置功能
- 实现定时器、WebSocket、MQTT三种轮询方式
- 提供可视化数据映射配置

### 计划功能
- 支持更多数据类型
- 添加数据转换和过滤功能
- 实现数据缓存机制
- 提供更丰富的可视化配置界面 