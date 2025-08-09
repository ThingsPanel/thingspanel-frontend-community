# 🎉 新的设备API配置系统使用指南

## 📋 概述

新的设备API配置系统完全重构了原有的设备数据源配置，提供了更强大、更灵活的功能。

## ✨ 新功能特性

### 🎯 18种API接口支持
- **遥测数据** (4种)：当前值、历史值、发布、日志
- **属性数据** (4种)：数据集、指定键值、发布、日志  
- **事件数据** (1种)：事件数据集
- **命令数据** (3种)：发布命令、日志、自定义命令
- **设备信息** (4种)：详情、连接信息、告警状态、告警历史
- **模拟数据** (2种)：获取、发送

### 🔧 智能表单系统
- **动态表单显示**：根据选择的API类型自动显示对应的表单
- **参数验证**：每种API都有完整的参数验证规则
- **实时反馈**：表单状态实时更新，错误提示清晰

### ⚡ 轮询配置系统
- **智能轮询**：只有获取数据的API支持轮询，发布类API不支持
- **灵活配置**：支持1秒到1小时的轮询间隔
- **状态监控**：实时显示轮询状态、请求次数、最后更新时间

### 📊 数据映射功能
- **数据预览**：JSON格式显示API返回数据
- **映射配置**：支持配置数据路径映射到组件属性
- **复制功能**：一键复制数据到剪贴板

## 🚀 快速开始

### 1. 访问测试页面
访问 `/test` 页面，选择 "🎉 新设备API配置系统" 标签页。

### 2. 基本操作流程
1. **选择API接口类型**：从18种API中选择需要的接口
2. **选择设备**：从设备列表中选择目标设备
3. **配置参数**：根据API类型填写相应的参数
4. **轮询配置**：可选择启用轮询，自动定时获取数据
5. **数据映射**：配置API返回数据的映射关系
6. **保存配置**：保存完整的配置信息

### 3. 使用示例

#### 遥测数据 - 当前值
```typescript
// 配置示例
const config = {
  deviceId: 'device_123',
  apiType: 'telemetry_current',
  parameters: {
    keys: 'temperature,humidity,pressure'
  },
  polling: {
    enabled: true,
    interval: 5000
  }
}
```

#### 属性数据 - 数据集
```typescript
// 配置示例
const config = {
  deviceId: 'device_123',
  apiType: 'attributes_dataset',
  parameters: {},
  polling: {
    enabled: true,
    interval: 10000
  }
}
```

## 🔄 兼容性

### 完全兼容原有格式
新的配置系统完全兼容原有的 `DeviceDataSource` 格式：

```typescript
// 新的API配置
const apiConfig = {
  deviceId: 'device_123',
  apiType: 'telemetry_current',
  parameters: { keys: 'temperature' },
  polling: { enabled: true, interval: 5000 }
}

// 自动转换为原有格式
const deviceDataSource = {
  type: 'device',
  deviceId: 'device_123',
  metricsType: 'telemetry',
  dataMode: 'latest',
  metricsId: 'temperature',
  pollingType: 'timer',
  refreshInterval: 5000
}
```

## 📁 文件结构

```
device-apis/
├── README.md                    # 详细文档
├── USAGE_GUIDE.md              # 使用指南（本文件）
├── IMPLEMENTATION_PLAN.md       # 实现计划
├── index.ts                     # 主配置文件
├── components/                  # 组件目录
│   ├── DeviceSelector.vue       # 设备选择器
│   ├── BaseApiForm.vue          # 基础表单组件
│   ├── PollingConfig.vue        # 轮询配置组件
│   ├── TelemetryApiForm.vue     # 遥测数据表单
│   ├── AttributesApiForm.vue    # 属性数据表单
│   ├── EventApiForm.vue         # 事件数据表单
│   ├── CommandApiForm.vue       # 命令数据表单
│   ├── DeviceInfoApiForm.vue    # 设备信息表单
│   ├── SimulationApiForm.vue    # 模拟数据表单
│   ├── DeviceApiConfig.vue      # 主配置组件
│   ├── DeviceApiExample.vue     # 示例组件
│   └── DeviceApiDemo.vue        # 演示组件
├── types/                       # 类型定义
│   └── api-types.ts             # API相关类型
└── utils/                       # 工具函数
    └── api-helpers.ts           # API辅助函数
```

## 🎯 使用方法

### 在Vue组件中使用

```vue
<template>
  <div>
    <!-- 使用新的设备API配置系统 -->
    <DeviceApiConfig
      v-model="apiConfig"
      @config-saved="handleConfigSaved"
      @config-tested="handleConfigTested"
    />
  </div>
</template>

<script setup lang="ts">
import { DeviceApiConfig } from '@/components/visual-editor/settings/data-sources/device-apis'

const apiConfig = ref({
  deviceId: '',
  apiType: 'telemetry_current',
  parameters: {},
  polling: { enabled: false, interval: 5000 },
  dataPaths: []
})

const handleConfigSaved = (config: any) => {
  console.log('配置已保存:', config)
}

const handleConfigTested = (result: any) => {
  console.log('测试结果:', result)
}
</script>
```

### 替换原有组件

```vue
<!-- 原来的组件 -->
<DeviceDataSourceConfig v-model="oldConfig" />

<!-- 新的组件 -->
<DeviceDataSourceConfigNew v-model="oldConfig" />
```

## 🔧 开发指南

### 添加新的API类型

1. 在 `types/api-types.ts` 中添加新的API类型枚举
2. 在 `utils/api-helpers.ts` 中添加表单配置
3. 创建对应的表单组件
4. 在 `index.ts` 中导出新组件

### 自定义表单组件

```vue
<template>
  <BaseApiForm
    v-model="formData"
    :rules="formRules"
    @submit="handleSubmit"
  >
    <template #form-content="{ formData, updateForm }">
      <!-- 自定义表单内容 -->
    </template>
  </BaseApiForm>
</template>
```

## 🐛 故障排除

### 常见问题

1. **API调用失败**
   - 检查设备ID是否正确
   - 确认API参数格式
   - 查看网络连接状态

2. **轮询不工作**
   - 确认API类型支持轮询
   - 检查轮询间隔设置
   - 查看浏览器控制台错误

3. **数据映射问题**
   - 确认API返回数据格式
   - 检查映射路径是否正确
   - 验证数据类型匹配

### 调试技巧

1. 使用浏览器开发者工具查看网络请求
2. 检查控制台日志输出
3. 使用数据预览功能查看API返回数据

## 📞 支持

如果您在使用过程中遇到问题，请：

1. 查看本文档的故障排除部分
2. 检查浏览器控制台错误信息
3. 确认API参数和配置是否正确
4. 联系开发团队获取支持

---

**�� 享受使用新的设备API配置系统！** 