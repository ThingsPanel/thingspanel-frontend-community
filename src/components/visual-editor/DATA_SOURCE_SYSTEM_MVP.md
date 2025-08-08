# 数据源配置系统 MVP 使用指南

## 📋 概述

数据源配置系统 MVP 基于现有的 Card 2.1 数据绑定系统和 Visual Editor 架构，提供了统一的数据源管理、验证和集成功能。

## 🏗️ 系统架构

### 核心组件

1. **统一类型系统** (`data-source-types.ts`)
   - 提供标准化的数据源配置接口
   - 支持多种数据源类型：静态、API、WebSocket、脚本、设备等

2. **数据源验证器** (`data-source-validator.ts`)  
   - 配置验证和错误处理
   - 连接测试和安全检查

3. **Card 2.1 适配器** (`card2-data-binding-adapter.ts`)
   - 与现有 Card 2.1 数据绑定系统集成
   - 自动推断组件数据需求

4. **增强的数据源管理器** (`universal-data-source-manager.ts`)
   - 扩展现有管理器功能
   - 添加性能监控和错误处理

5. **Vue Composition API Hooks** (`useDataSourceSystem.ts`)
   - 便捷的组合式函数
   - 响应式数据源管理

## 🚀 快速开始

### 1. 基础使用

```vue
<template>
  <div>
    <n-alert v-if="error" type="error">
      {{ error.message }}
    </n-alert>
    
    <n-spin :show="loading">
      <div v-if="data">
        数据: {{ JSON.stringify(data, null, 2) }}
      </div>
      
      <div v-else>
        暂无数据
      </div>
    </n-spin>

    <n-space>
      <n-button @click="refresh" :loading="loading">刷新</n-button>
      <n-button @click="testConnection">测试连接</n-button>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDataSource } from '@/components/visual-editor/hooks'
import type { DataSourceConfiguration } from '@/components/visual-editor/configuration/types'

// 数据源配置
const config = ref<DataSourceConfiguration>({
  type: 'static',
  config: {
    data: { 
      temperature: 25.5,
      humidity: 60,
      timestamp: Date.now() 
    }
  },
  refreshInterval: 30,
  enableCache: true
})

// 使用数据源Hook
const {
  loading,
  data,
  error,
  connected,
  refresh,
  testConnection,
  start,
  stop
} = useDataSource(config, {
  autoStart: true,
  autoValidate: true
})
</script>
```

### 2. 配置验证

```vue
<template>
  <div>
    <n-form-item label="配置状态">
      <n-tag :type="isValid ? 'success' : 'error'">
        {{ isValid ? '有效' : '无效' }}
      </n-tag>
    </n-form-item>

    <div v-if="errors.length > 0">
      <n-alert type="error" title="配置错误">
        <ul>
          <li v-for="error in errors" :key="error">{{ error }}</li>
        </ul>
      </n-alert>
    </div>

    <div v-if="warnings.length > 0">
      <n-alert type="warning" title="配置警告">
        <ul>
          <li v-for="warning in warnings" :key="warning">{{ warning }}</li>
        </ul>
      </n-alert>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDataSourceValidation } from '@/components/visual-editor/hooks'

const config = ref({
  type: 'api',
  config: {
    url: 'https://api.example.com/data',
    method: 'GET'
  }
})

const {
  isValidating,
  isValid,
  errors,
  warnings,
  validate
} = useDataSourceValidation(config)
</script>
```

### 3. Card 2.1 集成

```vue
<template>
  <div>
    <!-- 组件数据需求信息 -->
    <n-card v-if="hasRequirement" title="组件需求">
      <p>{{ requirementSummary }}</p>
    </n-card>

    <!-- 数据绑定状态 -->
    <n-form-item label="绑定状态">
      <n-tag :type="hasBinding ? 'success' : 'default'">
        {{ hasBinding ? '已绑定' : '未绑定' }}
      </n-tag>
    </n-form-item>

    <!-- 操作按钮 -->
    <n-space>
      <n-button @click="initialize" :loading="isInitializing">
        初始化集成
      </n-button>
      
      <n-button 
        @click="createBinding" 
        :disabled="!isInitialized"
        type="primary"
      >
        创建绑定
      </n-button>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCard2Integration } from '@/components/visual-editor/hooks'

const componentId = 'TextWidget'
const config = ref({
  type: 'device',
  config: {
    deviceId: 'device_123',
    apiType: 'telemetryDataCurrentKeys',
    parameters: {
      device_id: 'device_123',
      keys: 'temperature,humidity'
    }
  }
})

const {
  isInitializing,
  isInitialized,
  hasRequirement,
  hasBinding,
  requirementSummary,
  initialize,
  createBinding,
  removeBinding
} = useCard2Integration(componentId, config, {
  autoInit: true
})
</script>
```

## 📝 配置表单增强

新的 `DataSourceConfigForm` 组件提供了增强的配置界面：

```vue
<template>
  <data-source-config-form
    v-model="dataSourceConfig"
    :widget="widgetInstance"
    :show-advanced="true"
    @validate="handleValidation"
    @change="handleConfigChange"
  />
</template>

<script setup lang="ts">
import DataSourceConfigForm from '@/components/visual-editor/configuration/forms/DataSourceConfigForm.vue'

const dataSourceConfig = ref(null)
const widgetInstance = ref({
  id: 'widget_123',
  type: 'TextWidget'
})

const handleValidation = (result) => {
  console.log('验证结果:', result)
}

const handleConfigChange = (newConfig, oldConfig) => {
  console.log('配置变化:', { newConfig, oldConfig })
}
</script>
```

## 🛠️ API 参考

### 数据源类型

```typescript
// 支持的数据源类型
enum DataSourceType {
  STATIC = 'static',
  API = 'api',
  HTTP = 'http', 
  WEBSOCKET = 'websocket',
  SCRIPT = 'script',
  DEVICE = 'device',
  DATABASE = 'database'
}

// 统一配置接口
interface DataSourceConfig {
  type: DataSourceType
  name: string
  description?: string
  enabled?: boolean
  // ... 类型特定配置
}
```

### Hook 接口

```typescript
// useDataSource Hook
interface DataSourceState {
  loading: boolean
  data: any
  error: Error | null
  connected: boolean
  lastUpdated: number | null
}

interface DataSourceActions {
  refresh: () => Promise<void>
  testConnection: () => Promise<boolean>
  validateConfig: () => Promise<ValidationResult>
  start: () => Promise<void>
  stop: () => Promise<void>
}
```

### 验证结果

```typescript
interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}
```

## 🔧 扩展开发

### 添加新的数据源类型

1. **扩展类型定义**：
```typescript
// 在 data-source-types.ts 中添加新类型
export interface CustomDataSourceConfig extends BaseDataSourceConfig {
  type: DataSourceType.CUSTOM
  customOption: string
}
```

2. **添加验证规则**：
```typescript
// 在 data-source-validator.ts 中添加验证规则
this.validationRules.set(DataSourceType.CUSTOM, [
  {
    name: 'custom_required',
    validator: (config) => !!config.customOption,
    message: '自定义选项不能为空',
    required: true
  }
])
```

3. **扩展数据源管理器**：
```typescript
// 在 universal-data-source-manager.ts 中添加处理逻辑
case DataSourceType.CUSTOM:
  return await this.getCustomValue(dataSource as CustomDataSource)
```

### 自定义组件需求

```typescript
// 注册自定义组件的数据需求
card2DataBindingAdapter.registerComponentRequirement('CustomWidget', {
  fields: {
    value: {
      type: 'value',
      valueType: 'number',
      required: true,
      description: '数值'
    },
    label: {
      type: 'value', 
      valueType: 'string',
      required: false,
      description: '标签'
    }
  },
  version: '1.0.0',
  description: '自定义组件数据需求'
})
```

## 🐛 故障排除

### 常见问题

1. **配置验证失败**
   - 检查数据源类型是否正确
   - 验证必填字段是否完整
   - 查看控制台错误信息

2. **连接测试失败**
   - 检查网络连接
   - 验证URL和认证信息
   - 查看CORS设置

3. **Card 2.1集成问题**
   - 确保适配器已初始化
   - 检查组件需求是否匹配
   - 验证数据映射配置

### 调试模式

```typescript
// 启用详细日志
localStorage.setItem('DEBUG_DATA_SOURCE', 'true')

// 查看适配器状态
console.log(card2DataBindingAdapter.getState())

// 查看管理器指标
console.log(dataSourceManager.getGlobalMetrics())
```

## 📈 性能优化

1. **缓存策略**：启用数据缓存减少重复请求
2. **连接复用**：合理设置连接池大小
3. **数据映射**：优化数据路径解析
4. **错误处理**：实现指数退避重试机制

## 🔐 安全考虑

1. **脚本安全**：脚本数据源禁用危险API
2. **连接验证**：严格验证外部连接
3. **数据清理**：过滤和验证输入数据
4. **权限控制**：基于角色的配置访问

## 📚 更多资源

- [Card 2.1 数据绑定系统文档](../card2.1/DATA_BINDING_SYSTEM_SUMMARY.md)
- [Visual Editor 架构指南](./ARCHITECTURE_GUIDE.md)
- [API 接口文档](./core/component-api-config.ts)
- [测试页面](../../views/test/data-binding-system-integration/)

---

**注意**：这是MVP版本，主要面向快速集成和验证。后续版本将添加更多高级功能如智能缓存、高级监控等。