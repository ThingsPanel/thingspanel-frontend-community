# 数字指示器组件迁移指南

## 📋 组件基本信息

| 项目 | 内容 |
|------|------|
| **组件名称** | 数字指示器 (digit-indicator) |
| **组件类型** | 数据展示组件 |
| **原始路径** | `/src/card/chart-card/digit-indicator/` |
| **目标路径** | `/src/card2.1/components/digit-indicator/` |
| **迁移状态** | ✅ 已完成 |

## 🔌 API接口分析

### 使用的API接口

| API名称 | 用途 | 参数 | 触发条件 |
|---------|------|------|----------|
| `telemetryDataCurrentKeys` | 获取遥测当前值 | `device_id`, `keys` | `metricsType === 'telemetry'` |
| `getAttributeDataSet` | 获取属性数据集 | `device_id` | `metricsType === 'attributes'` |

### 代码片段分析
```typescript
// 原始代码 (chart-card/digit-indicator/component.vue)
if (metricsType === 'telemetry' && deviceId && metricsId) {
  const detailValue = await telemetryDataCurrentKeys({
    device_id: deviceId,
    keys: metricsId
  })
  unit.value = detailValue?.data?.[0]?.unit ?? '%'
  detail.value = detailValue?.data?.[0]?.value ?? ''
} else if (metricsType === 'attributes' && deviceId && metricsId) {
  const res = await getAttributeDataSet({ device_id: deviceId })
  const attributeData = res.data.find(item => item.key === metricsId)
  detail.value = attributeData?.value ?? ''
  unit.value = attributeData?.unit ?? '%'
}
```

## 📊 数据源配置

| 属性 | 类型 | 描述 |
|------|------|------|
| **数据源类型** | `device` | 设备数据源 |
| **主要API** | `telemetryDataCurrentKeys` | 获取遥测当前值 |
| **备选API** | `getAttributeDatasKey` | 获取指定属性值 |
| **轮询支持** | ✅ 是 | 需要实时更新数值 |
| **控制组件** | ❌ 否 | 只读显示组件 |

### 自动配置
```typescript
// 组件API配置 (component-api-config.ts)
'digit-indicator': {
  apiType: 'telemetryDataCurrentKeys',
  fallbackApiType: 'getAttributeDatasKey', 
  dataSourceType: 'device',
  requiresPolling: true,
  isControlComponent: false,
  supportedMetricsTypes: ['telemetry', 'attributes']
}
```

## 🎛️ 表单配置

### 配置面板结构
- ✅ **有配置表单** (`DigitIndicatorConfig.vue`)
- 📝 **主要配置项**:
  - 标题 (title)
  - 单位 (unit) 
  - 颜色 (color)
  - 字体大小 (fontSize)
  - 图标 (iconName)

### 表单代码示例
```vue
<!-- DigitIndicatorConfig.vue -->
<template>
  <div class="config-form">
    <n-form-item label="标题">
      <n-input v-model:value="config.title" />
    </n-form-item>
    <n-form-item label="单位">
      <n-input v-model:value="config.unit" />
    </n-form-item>
    <!-- 更多配置项... -->
  </div>
</template>
```

## 🌐 国际化配置

### 国际化Key列表

| Key | 中文 | 英文 | 用途 |
|-----|------|------|------|
| `card.digitalIndicator` | 数字指示器 | Digital Indicator | 组件名称 |

### 使用示例
```typescript
// index.ts
title: `${$t('card.digitalIndicator')}2`
```

### 国际化文件位置
- `/src/locales/langs/zh-cn/card.json`
- `/src/locales/langs/en-us/card.json`

## 📋 功能需求描述

### 核心功能
1. **数值显示**: 显示设备的当前数值（遥测或属性数据）
2. **单位显示**: 显示数值对应的单位
3. **图标显示**: 支持自定义图标显示
4. **标题显示**: 显示指标名称或自定义标题
5. **响应式布局**: 根据容器大小自动调整字体大小

### 数据流程
```
设备数据 → API请求 → 数据解析 → 界面显示
    ↓
遥测数据: telemetryDataCurrentKeys({device_id, keys})
属性数据: getAttributeDataSet({device_id}) → 筛选指定key
```

### 显示逻辑
- **优先级**: 数据源数据 > 属性配置 > 默认值
- **数值**: `dataSourceValue.values.value || properties.value || 0`
- **单位**: `dataSourceValue.values.unit || properties.unit || ''`
- **标题**: `dataSourceValue.values.title || properties.title || '数值'`

## ✅ 迁移清单

### 已完成项目
- [x] 组件基础结构迁移
- [x] 数据源系统集成
- [x] API配置自动化
- [x] 响应式布局保持
- [x] 图标系统兼容
- [x] 配置面板实现
- [x] 国际化支持

### 关键改进点
1. **数据源系统**: 从手动API调用改为通用数据源管理器
2. **配置简化**: 用户只需选择设备和指标，API自动选择
3. **类型安全**: 完整的TypeScript类型定义
4. **错误处理**: 更好的错误处理和日志记录

## 🔧 技术细节

### 数据源集成
```typescript
// 新系统 (DigitIndicatorCard.vue)
const handleDataSource = (dataSource: DataSource | undefined) => {
  if (dataSource && dataSource.enabled) {
    unsubscribeDataSource = universalDataSourceManager.subscribe(dataSource, value => {
      dataSourceValue.value = value
    })
  }
}
```

### 组件定义
```typescript
// index.ts
const digitIndicatorDefinition: ComponentDefinition = {
  type: 'digit-indicator',
  name: '数字指示器', 
  component: DigitIndicatorCard,
  configComponent: DigitIndicatorConfig,
  dataSourceDefinitions: [
    {
      name: 'mainData',
      type: 'object',
      mappingKeys: ['value', 'unit', 'title']
    }
  ]
}
```

## 🚨 注意事项

1. **API自动选择**: 系统根据组件类型自动选择`telemetryDataCurrentKeys`作为主要API
2. **数据映射**: 确保数据源正确映射到`value`、`unit`、`title`三个字段
3. **轮询配置**: 组件默认启用轮询以获取实时数据更新
4. **向后兼容**: 支持旧配置格式的自动转换

## 📖 使用示例

```vue
<!-- 在面板中使用 -->
<DigitIndicatorCard
  :properties="{ 
    title: '温度',
    unit: '°C',
    color: '#1890ff',
    fontSize: 24
  }"
  :metadata="{
    dataSource: {
      type: 'device',
      enabled: true,
      // 系统会自动配置API为 telemetryDataCurrentKeys
    }
  }"
/>
```