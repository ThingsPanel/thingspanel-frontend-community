# 组件API配置系统测试

## 测试目的
验证组件API配置自动化系统是否正常工作，确保根据组件类型能正确选择API配置。

## 测试用例

### 1. 数字指示器 (digit-indicator)
```javascript
import { getComponentApiConfig, selectApiForComponent } from './component-api-config'

// 测试获取组件配置
const config = getComponentApiConfig('digit-indicator')
console.log('digit-indicator 配置:', config)

// 预期结果:
// {
//   apiType: 'telemetryDataCurrentKeys',
//   fallbackApiType: 'getAttributeDatasKey',
//   dataSourceType: 'device',
//   requiresPolling: true,
//   isControlComponent: false,
//   description: '数字指示器，显示设备的当前数值（遥测或属性）',
//   supportedMetricsTypes: ['telemetry', 'attributes']
// }

// 测试根据指标类型选择API
const telemetryApi = selectApiForComponent('digit-indicator', 'telemetry')
const attributesApi = selectApiForComponent('digit-indicator', 'attributes')

console.log('遥测API:', telemetryApi) // 预期: 'telemetryDataCurrentKeys'
console.log('属性API:', attributesApi) // 预期: 'getAttributeDataSet'
```

### 2. 曲线图 (curve)
```javascript
const curveConfig = getComponentApiConfig('curve')
console.log('curve 配置:', curveConfig)

// 预期结果:
// {
//   apiType: 'telemetryDataHistoryList',
//   dataSourceType: 'device',
//   requiresPolling: false,
//   isControlComponent: false,
//   supportedMetricsTypes: ['telemetry'],
//   defaultParameters: {
//     time_range: 'last_1h',
//     aggregate_function: 'avg', 
//     aggregate_window: '1m'
//   }
// }
```

### 3. 数字设置器 (digit-setter)
```javascript
const setterConfig = getComponentApiConfig('digit-setter')
console.log('digit-setter 配置:', setterConfig)

// 预期结果:
// {
//   apiType: 'telemetryDataPub',
//   fallbackApiType: 'attributeDataPub',
//   isControlComponent: true,
//   requiresPolling: false,
//   supportedMetricsTypes: ['telemetry', 'attributes']
// }
```

## DeviceDataSourceConfigNew 组件测试

### 自动API配置测试
```vue
<template>
  <div class="test-container">
    <h3>数字指示器自动配置测试</h3>
    <DeviceDataSourceConfigNew 
      component-type="digit-indicator"
      v-model="digitConfig"
    />
    
    <h3>曲线图自动配置测试</h3>
    <DeviceDataSourceConfigNew 
      component-type="curve"
      v-model="curveConfig"
    />
    
    <h3>手动配置测试（不传 component-type）</h3>
    <DeviceDataSourceConfigNew 
      v-model="manualConfig"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import DeviceDataSourceConfigNew from '../settings/data-sources/DeviceDataSourceConfigNew.vue'

const digitConfig = ref({})
const curveConfig = ref({})
const manualConfig = ref({})

// 监听配置变化
watch(digitConfig, (newVal) => {
  console.log('数字指示器配置变化:', newVal)
  // 预期: apiType 自动设置为 'telemetryDataCurrentKeys'
})

watch(curveConfig, (newVal) => {
  console.log('曲线图配置变化:', newVal)
  // 预期: apiType 自动设置为 'telemetryDataHistoryList'
})
</script>
```

## 预期行为验证

### 1. 数字指示器场景
- [x] 自动设置 `apiType = 'telemetryDataCurrentKeys'`
- [x] 显示组件描述信息
- [x] 启用轮询配置
- [x] 不显示API选择器
- [x] 支持遥测和属性指标类型

### 2. 曲线图场景  
- [x] 自动设置 `apiType = 'telemetryDataHistoryList'`
- [x] 设置默认参数 (time_range, aggregate_function, aggregate_window)
- [x] 不启用轮询（历史数据不需要实时更新）
- [x] 只支持遥测指标类型

### 3. 手动配置场景
- [x] 显示API选择器
- [x] 不显示组件配置信息
- [x] 用户可以手动选择API类型

## 错误处理测试

### 1. 无效组件类型
```javascript
const invalidConfig = getComponentApiConfig('invalid-component')
console.log('无效组件配置:', invalidConfig) // 预期: null
```

### 2. 不支持的指标类型
```javascript
const unsupportedApi = selectApiForComponent('digit-indicator', 'command')
console.log('不支持的指标类型:', unsupportedApi) // 预期: null + 警告信息
```

## 控制台输出验证

在浏览器控制台中应该能看到：

```
🔧 DeviceDataSourceConfigNew - 根据组件类型自动配置API: {
  componentType: "digit-indicator",
  apiType: "telemetryDataCurrentKeys",
  description: "数字指示器，显示设备的当前数值（遥测或属性）"
}
```

## 测试步骤

1. **准备工作**
   - 启动开发服务器: `pnpm dev`
   - 打开浏览器开发者工具

2. **组件测试**
   - 创建数字指示器组件实例
   - 打开数据源配置面板
   - 验证API是否自动选择

3. **API选择验证**
   - 检查是否隐藏了API选择器
   - 确认显示了组件配置信息
   - 验证配置详情的准确性

4. **参数表单测试**
   - 选择设备后验证指标自动加载
   - 确认参数表单的复杂度正确
   - 测试API测试功能

5. **轮询配置检查**
   - 验证需要轮询的组件自动启用轮询
   - 确认不需要轮询的组件不启用轮询

## 通过标准

- [x] 所有预期的API配置正确设置
- [x] 用户界面根据组件类型正确显示/隐藏
- [x] 自动配置不影响手动配置功能
- [x] 错误处理机制正常工作
- [x] 控制台输出信息准确无误