# 自动检测数组模式功能说明

## 问题背景

在数据源配置中，当API返回数组格式的数据时，用户需要手动指定 `[0]` 来获取第一个元素进行数据映射。这增加了配置复杂度，用户需要了解数组索引语法，并且容易出错。

### 示例场景

```json
// API返回的数组数据
[
  {
    "deviceName": "温度传感器01",
    "deviceId": "temp_sensor_001",
    "status": "online"
  },
  {
    "deviceName": "湿度传感器01", 
    "deviceId": "humidity_sensor_001",
    "status": "offline"
  }
]
```

传统方式需要手动配置：
- `deviceName` → `[0].deviceName`
- `deviceId` → `[0].deviceId`
- `status` → `[0].status`

## 解决方案

引入**自动检测数组模式**功能，系统会自动检测数据类型并智能处理数组数据，用户无需手动选择模式。

### 功能特点

1. **自动检测**：系统自动检测数据类型，无需用户手动选择
2. **智能映射**：自动识别数组数据并使用第一个元素进行映射
3. **手动路径支持**：支持用户手动输入复杂路径，如 `data.items[0].value`
4. **类型感知**：组件能够知道最终数据是数组还是非数组
5. **向后兼容**：不影响现有的数据映射配置

## 实现架构

### 1. 类型定义扩展

```typescript
// 数据路径映射配置
export interface DataPathMapping {
  key: string // 数据源中的路径，如 "data.temperature" 或 "data[0].temperature"
  target: string // 映射到组件的数据源名称，如 "temperature"
  description?: string // 描述
  isArray?: boolean // 标记此映射是否指向数组数据
  arrayIndex?: number // 数组索引，默认为0
}

// 数据映射配置
export interface DataMappingConfig {
  mappings: DataPathMapping[]
  autoDetectArray?: boolean // 是否自动检测数组类型，默认为true
  defaultArrayIndex?: number // 默认数组索引，默认为0
}
```

### 2. 数据路径解析器增强

```typescript
// 增强的解析方法
resolve(data: any, path?: string, options?: { 
  autoDetectArray?: boolean
  defaultArrayIndex?: number
}): any {
  // 解析路径
  const result = parsePath(data, path)
  
  // 自动检测数组类型：如果结果仍然是数组且启用了自动检测
  if (options?.autoDetectArray && Array.isArray(result) && result.length > 0) {
    const index = options.defaultArrayIndex || 0
    return result[index]
  }
  
  return result
}

// 新增数据类型检测方法
detectDataType(data: any, path?: string): {
  isArray: boolean
  arrayLength?: number
  type: string
  sampleValue?: any
}

// 新增智能路径建议方法
suggestPath(data: any, targetField: string): string
```

### 3. 数据源管理器支持

```typescript
// 在数据源管理器中应用自动检测
const autoDetectArray = dataSource.dataMapping?.autoDetectArray ?? true
const defaultArrayIndex = dataSource.dataMapping?.defaultArrayIndex ?? 0

dataSource.dataPaths.forEach(mapping => {
  const arrayIndex = mapping.arrayIndex ?? defaultArrayIndex
  const resolvedValue = dataPathResolver.resolve(rawData, mapping.key, { 
    autoDetectArray: mapping.isArray ? true : autoDetectArray,
    defaultArrayIndex: arrayIndex
  })
  values[mapping.target] = resolvedValue
})
```

## 使用方法

### 1. 在数据映射配置组件中

```vue
<DataMappingConfig
  :data="sampleData"
  :mappings="dataMappings"
  @update:mappings="updateMappings"
/>
```

### 2. 自动检测配置

```typescript
const updateMappings = (mappings: DataPathMapping[]) => {
  // 自动检测每个映射的数据类型
  const processedMappings = mappings.map(mapping => {
    if (mapping.key) {
      const dataTypeInfo = dataPathResolver.detectDataType(data, mapping.key)
      return {
        ...mapping,
        isArray: dataTypeInfo.isArray,
        arrayIndex: dataTypeInfo.isArray ? 0 : undefined
      }
    }
    return mapping
  })
  
  emit('update:mappings', processedMappings)
}
```

### 3. 数据源配置示例

```typescript
const dataSource: DeviceDataSource = {
  type: DataSourceType.DEVICE,
  enabled: true,
  name: '设备数据源',
  dataPaths: [
    { key: 'deviceName', target: 'name', isArray: true, arrayIndex: 0 },
    { key: 'deviceId', target: 'id', isArray: true, arrayIndex: 0 },
    { key: 'status', target: 'status', isArray: true, arrayIndex: 0 }
  ],
  dataMapping: {
    mappings: [],
    autoDetectArray: true,
    defaultArrayIndex: 0
  }
}
```

## UI界面

### 数据类型检测显示

在数据映射配置组件中显示数据类型信息：

```vue
<div v-if="mapping.key" class="mapping-info">
  <n-text depth="3" size="small">
    <span v-if="getDataTypeInfo(mapping.key).isArray">
      类型: <n-tag size="small" type="info">数组 ({{ getDataTypeInfo(mapping.key).arrayLength }}个元素)</n-tag>
      <span v-if="getDataTypeInfo(mapping.key).sampleValue">
        • 示例: <code>{{ JSON.stringify(getDataTypeInfo(mapping.key).sampleValue) }}</code>
      </span>
    </span>
    <span v-else>
      类型: <n-tag size="small" type="success">{{ getDataTypeInfo(mapping.key).type }}</n-tag>
      <span v-if="getDataTypeInfo(mapping.key).sampleValue !== undefined">
        • 值: <code>{{ JSON.stringify(getDataTypeInfo(mapping.key).sampleValue) }}</code>
      </span>
    </span>
  </n-text>
</div>
```

### 手动路径输入

支持用户手动输入复杂路径：

```vue
<div class="mapping-manual">
  <n-input
    v-model:value="mapping.key"
    placeholder="或手动输入路径，如: data.items[0].value"
    size="small"
    @update:value="updateMappings"
  />
</div>
```

### 智能建议功能

提供智能路径建议：

```vue
<n-button
  size="small"
  type="info"
  ghost
  @click="suggestPaths"
  :disabled="!data || Object.keys(data).length === 0"
>
  智能建议
</n-button>
```

## 使用场景

### 1. 简单数组数据

```json
// API返回
[
  { "deviceName": "传感器01", "status": "online" },
  { "deviceName": "传感器02", "status": "offline" }
]

// 自动映射到第一个设备
{ "deviceName": "传感器01", "status": "online" }
```

### 2. 嵌套数组数据

```json
// API返回
{
  "response": {
    "code": 200,
    "data": [
      { "deviceName": "传感器01", "status": "online" },
      { "deviceName": "传感器02", "status": "offline" }
    ]
  }
}

// 手动路径: response.data
// 自动映射到第一个设备
{ "deviceName": "传感器01", "status": "online" }
```

### 3. 复杂嵌套结构

```json
// API返回
{
  "api_response": {
    "results": [
      {
        "page": 1,
        "items": [
          { "id": 1, "name": "设备A", "value": 100 },
          { "id": 2, "name": "设备B", "value": 200 }
        ]
      }
    ]
  }
}

// 手动路径: api_response.results[0].items
// 自动映射到第一个设备
{ "id": 1, "name": "设备A", "value": 100 }
```

## 手动路径支持

### 支持的路径格式

1. **简单属性**: `deviceName`, `status`
2. **嵌套属性**: `data.deviceName`, `response.data.status`
3. **数组索引**: `[0]`, `data[0]`, `response.data[0]`
4. **混合路径**: `data.items[0].value`, `response.results[1].items[0].name`

### 路径示例

```typescript
// 简单数组
"[0].deviceName"  // 获取数组第一个元素的deviceName

// 嵌套结构
"response.data[0].deviceName"  // 获取response.data数组第一个元素的deviceName

// 复杂嵌套
"api_response.results[0].items[1].name"  // 获取第一页第二个设备的名称

// 混合数据
"devices[0].name"  // 获取设备列表第一个设备的名称
"summary.total"    // 获取汇总数据中的总数
```

## 兼容性说明

### 向后兼容

- 现有的数据映射配置不受影响
- 未配置 `isArray` 的映射会自动检测数据类型
- 手动配置的 `[0]` 路径仍然有效

### 迁移指南

1. **现有配置**：无需修改，继续正常工作
2. **新配置**：系统会自动检测数据类型
3. **混合使用**：可以在同一个数据源中混合使用自动检测和手动路径

## 测试示例

参考 `AutoDetectArrayExample.vue` 组件，该组件提供了完整的测试场景：

- 简单数组数据
- 嵌套数组数据 (response.data)
- 复杂嵌套结构 (api_response.results[0].items)
- 混合数据类型

可以通过切换不同的数据类型来测试自动检测的效果，并支持手动路径测试。

## 技术细节

### 性能考虑

- 数据类型检测是轻量级的，不会影响性能
- 只在数据路径解析时进行数组检测
- 缓存机制确保重复解析的效率

### 错误处理

- 空数组时返回 `undefined`
- 无效路径时返回 `undefined`
- 提供详细的错误日志用于调试

### 扩展性

- 支持嵌套数组的处理
- 可以扩展支持其他数组索引（如 `[1]`, `[-1]` 等）
- 预留了更复杂的数组处理选项接口

## 组件类型感知

### 数据类型传递

组件可以通过映射配置了解最终数据的类型：

```typescript
interface DataPathMapping {
  key: string
  target: string
  isArray?: boolean      // 标记是否为数组数据
  arrayIndex?: number    // 数组索引
}
```

### 组件使用示例

```vue
<template>
  <div>
    <!-- 根据数据类型渲染不同的UI -->
    <div v-if="dataSource.isArray">
      <!-- 数组数据渲染 -->
      <div v-for="(item, index) in dataSource.value" :key="index">
        {{ item.name }}
      </div>
    </div>
    <div v-else>
      <!-- 单个数据渲染 -->
      {{ dataSource.value.name }}
    </div>
  </div>
</template>
```

这样，组件就能够根据数据类型智能地渲染不同的UI，提供更好的用户体验。 