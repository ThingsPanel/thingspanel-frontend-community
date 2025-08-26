# 数据源系统配置管理指南

## 概述

数据源系统提供了完整的配置管理功能，包括：
- 统一的配置存储和检索
- 配置验证和错误处理
- 配置模板和预设
- 配置搜索和统计
- 配置导入导出
- 配置版本管理（可选）
- 配置缓存机制

## 核心组件

### 1. EnhancedConfigManager - 增强版配置管理器

提供完整的配置生命周期管理，集成错误处理和缓存机制。

```typescript
import { enhancedConfigManager } from '@/core/data-source-system'

// 创建配置（带错误处理）
const result = await enhancedConfigManager.createConfigSafe({
  name: '用户设备数据源',
  description: '获取用户设备列表和状态信息',
  type: 'api',
  sourceConfig: {
    url: 'https://api.example.com/devices',
    method: 'GET',
    headers: [
      { key: 'Authorization', value: 'Bearer token' },
      { key: 'Content-Type', value: 'application/json' }
    ]
  },
  triggers: [
    {
      type: 'timer',
      config: {
        interval: 30000,
        immediate: true
      }
    }
  ]
})

if (result.success) {
  console.log('配置创建成功:', result.data)
} else {
  console.error('配置创建失败:', result.error?.userMessage)
}
```

### 2. DataSourceConfigManager - 基础配置管理器

提供基本的CRUD操作和验证功能。

```typescript
import { DataSourceConfigManager } from '@/core/data-source-system'

const configManager = new DataSourceConfigManager()

// 创建配置
const newConfig = await configManager.createConfig({
  name: 'API数据源',
  type: 'api',
  sourceConfig: {
    url: 'https://api.example.com/data',
    method: 'GET'
  }
})

// 获取配置
const config = await configManager.getConfig(newConfig.id)

// 更新配置
const updatedConfig = await configManager.updateConfig(newConfig.id, {
  description: '更新描述信息'
})

// 删除配置
const deleted = await configManager.deleteConfig(newConfig.id)
```

## 配置类型

### 基本配置结构

```typescript
interface ComponentDataSourceConfig {
  /** 配置唯一标识 */
  id: string
  
  /** 配置名称 */
  name: string
  
  /** 配置描述 */
  description?: string
  
  /** 数据源类型 */
  type: 'static' | 'api' | 'websocket' | 'script'
  
  /** 数据源配置 */
  sourceConfig: any
  
  /** 触发器配置 */
  triggers?: TriggerConfiguration[]
  
  /** 数据处理器 */
  processors?: DataProcessor[]
  
  /** 元数据 */
  metadata?: {
    createdAt: number
    updatedAt: number
    version: string
    tags?: string[]
    author?: string
  }
}
```

### HTTP数据源配置

```typescript
const httpConfig = {
  name: 'HTTP API数据源',
  type: 'api' as const,
  sourceConfig: {
    method: 'POST' as HttpMethod,
    url: 'https://api.example.com/data',
    headers: [
      { key: 'Content-Type', value: 'application/json', isDynamic: false },
      { key: 'X-API-Key', value: '{{API_KEY}}', isDynamic: true }
    ],
    params: [
      { key: 'limit', value: '10', isDynamic: false },
      { key: 'userId', value: '{{USER_ID}}', isDynamic: true }
    ],
    body: {
      query: 'SELECT * FROM devices',
      filters: {
        active: true
      }
    },
    bodyType: 'json' as HttpBodyType,
    timeout: 10000,
    retryCount: 3,
    retryDelay: 1000
  }
}
```

### WebSocket数据源配置

```typescript
const wsConfig = {
  name: 'WebSocket数据源',
  type: 'websocket' as const,
  sourceConfig: {
    url: 'wss://api.example.com/realtime',
    protocols: ['protocol1'],
    auth: {
      type: 'bearer' as const,
      token: '{{WS_TOKEN}}'
    },
    reconnect: {
      enabled: true,
      maxAttempts: 5,
      delay: 2000,
      backoff: 'exponential' as const
    },
    messageFilter: {
      messageType: ['device_update', 'device_status'],
      jsonPath: '$.data[?(@.type=="device")]'
    }
  }
}
```

## 配置操作

### 1. 批量操作

```typescript
const batchResult = await enhancedConfigManager.batchOperateConfigs([
  {
    type: 'create',
    config: httpConfig
  },
  {
    type: 'create', 
    config: wsConfig
  },
  {
    type: 'update',
    id: 'existing-config-id',
    config: { description: '更新描述' }
  }
])

console.log('批量操作结果:', batchResult)
```

### 2. 高级搜索

```typescript
const searchResult = await enhancedConfigManager.advancedSearchConfigs({
  keyword: '设备',
  fields: ['name', 'description'],
  types: ['api', 'websocket'],
  tags: ['生产环境'],
  sortBy: 'updatedAt',
  sortOrder: 'desc',
  pagination: {
    page: 1,
    pageSize: 20
  },
  // 高级搜索选项
  fullTextSearch: true,
  fuzzyThreshold: 0.8,
  weights: {
    name: 2.0,
    description: 1.5,
    tags: 1.2,
    type: 1.0
  }
})

if (searchResult.success) {
  console.log(`找到 ${searchResult.data.total} 个匹配的配置`)
  searchResult.data.configs.forEach(config => {
    console.log(`- ${config.name}: ${config.description}`)
  })
}
```

### 3. 配置导入导出

```typescript
// 导出配置
const exportResult = await enhancedConfigManager.exportConfigs(
  ['config-1', 'config-2'], // 可选：特定配置ID
  {
    format: 'json',
    includeMetadata: true,
    compress: false,
    filter: {
      types: ['api'],
      tags: ['生产环境']
    }
  }
)

// 导入配置
const importedConfigs = await enhancedConfigManager.importConfigs(
  exportedJsonString,
  {
    format: 'json'
  }
)

console.log(`成功导入 ${importedConfigs.length} 个配置`)
```

### 4. 配置验证

```typescript
const validation = enhancedConfigManager.validateConfig(config)

if (!validation.valid) {
  console.log('配置验证失败:')
  validation.errors.forEach(error => {
    console.log(`- ${error.field}: ${error.message}`)
  })
}

if (validation.warnings.length > 0) {
  console.log('配置警告:')
  validation.warnings.forEach(warning => {
    console.log(`- ${warning.field}: ${warning.message}`)
  })
}
```

## 配置模板和预设

### 1. 使用配置模板

```typescript
// 获取可用模板
const templates = await enhancedConfigManager.getTemplates()

// 从模板创建配置
const templateConfig = await enhancedConfigManager.createFromTemplate(
  'http-api-template',
  {
    name: '我的API配置',
    url: 'https://my-api.com/data',
    apiKey: 'my-secret-key'
  }
)
```

### 2. 创建自定义模板

```typescript
const customTemplate = {
  id: 'custom-device-api',
  name: '设备API模板',
  description: '用于获取设备数据的标准API模板',
  category: 'custom' as const,
  sourceType: 'api' as const,
  template: {
    type: 'api',
    sourceConfig: {
      method: 'GET',
      headers: [
        { key: 'Authorization', value: '{{API_TOKEN}}', isDynamic: true }
      ],
      timeout: 10000
    }
  },
  parameters: [
    {
      name: 'API_TOKEN',
      label: 'API令牌',
      type: 'string' as const,
      required: true,
      description: '访问API所需的认证令牌'
    }
  ]
}

await enhancedConfigManager.saveTemplate(customTemplate)
```

## 配置监听和事件

### 1. 配置变更监听

```typescript
// 监听配置创建事件
const unsubscribeCreate = enhancedConfigManager.on('config:created', ({ config }) => {
  console.log('新配置创建:', config.name)
  
  // 发送通知
  showNotification(`配置 "${config.name}" 创建成功`, 'success')
})

// 监听配置更新事件  
const unsubscribeUpdate = enhancedConfigManager.on('config:updated', ({ id, newConfig }) => {
  console.log('配置更新:', newConfig.name)
  
  // 刷新相关组件
  refreshComponentsUsingConfig(id)
})

// 监听配置删除事件
const unsubscribeDelete = enhancedConfigManager.on('config:deleted', ({ id, config }) => {
  console.log('配置删除:', config.name)
  
  // 清理相关资源
  cleanupConfigResources(id)
})

// 清理监听器
const cleanup = () => {
  unsubscribeCreate()
  unsubscribeUpdate()
  unsubscribeDelete()
}
```

### 2. 配置健康检查

```typescript
const healthCheck = await enhancedConfigManager.performHealthCheck()

if (healthCheck.success) {
  const health = healthCheck.data
  
  console.log('配置健康状态:')
  console.log(`- 总配置数: ${health.totalConfigs}`)
  console.log(`- 有效配置: ${health.validConfigs}`)
  console.log(`- 无效配置: ${health.invalidConfigs}`)
  console.log(`- 缓存命中率: ${(health.cacheHitRate * 100).toFixed(2)}%`)
  
  if (health.issues.length > 0) {
    console.log('发现的问题:')
    health.issues.forEach(issue => {
      console.log(`- ${issue.configId}: ${issue.message} (${issue.severity})`)
    })
  }
}
```

## 在Vue组件中使用

### 1. 配置管理组合式函数

```typescript
// composables/useConfigManager.ts
import { ref, reactive, computed } from 'vue'
import { enhancedConfigManager } from '@/core/data-source-system'
import type { ComponentDataSourceConfig } from '@/core/data-source-system/types'

export function useConfigManager() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const configs = ref<ComponentDataSourceConfig[]>([])
  
  const statistics = reactive({
    total: 0,
    byType: {} as Record<string, number>,
    recentlyCreated: [] as ComponentDataSourceConfig[]
  })

  const createConfig = async (config: any) => {
    loading.value = true
    error.value = null

    try {
      const result = await enhancedConfigManager.createConfigSafe(config)
      
      if (result.success) {
        configs.value.push(result.data)
        return result.data
      } else {
        error.value = result.error?.userMessage || '创建失败'
        return null
      }
    } catch (err) {
      error.value = '创建配置时发生错误'
      return null
    } finally {
      loading.value = false
    }
  }

  const loadConfigs = async () => {
    loading.value = true
    
    try {
      const allConfigs = await enhancedConfigManager.getAllConfigs()
      configs.value = allConfigs
      
      const stats = await enhancedConfigManager.getStatistics()
      Object.assign(statistics, stats)
    } catch (err) {
      error.value = '加载配置失败'
    } finally {
      loading.value = false
    }
  }

  const deleteConfig = async (id: string) => {
    const result = await enhancedConfigManager.deleteConfigSafe(id)
    
    if (result.success) {
      const index = configs.value.findIndex(config => config.id === id)
      if (index !== -1) {
        configs.value.splice(index, 1)
      }
      return true
    } else {
      error.value = result.error?.userMessage || '删除失败'
      return false
    }
  }

  return {
    loading,
    error,
    configs,
    statistics,
    createConfig,
    loadConfigs,
    deleteConfig
  }
}
```

### 2. 配置管理页面组件

```vue
<template>
  <div class="config-manager">
    <!-- 配置统计卡片 -->
    <n-space vertical :size="16">
      <n-card title="配置统计" size="small">
        <n-statistic-group>
          <n-statistic label="总配置数" :value="statistics.total" />
          <n-statistic 
            label="API配置" 
            :value="statistics.byType.api || 0" 
            class="text-blue-500"
          />
          <n-statistic 
            label="WebSocket配置" 
            :value="statistics.byType.websocket || 0" 
            class="text-green-500"
          />
        </n-statistic-group>
      </n-card>

      <!-- 配置列表 -->
      <n-card title="配置管理">
        <template #header-extra>
          <n-space>
            <n-button type="primary" @click="showCreateModal = true">
              <n-icon><AddOutline /></n-icon>
              新建配置
            </n-button>
            <n-button @click="performHealthCheck">
              <n-icon><CheckmarkCircleOutline /></n-icon>
              健康检查
            </n-button>
          </n-space>
        </template>

        <n-data-table
          :columns="tableColumns"
          :data="configs"
          :loading="loading"
          :pagination="{
            pageSize: 10,
            showSizePicker: true
          }"
        />
      </n-card>
    </n-space>

    <!-- 创建配置对话框 -->
    <n-modal v-model:show="showCreateModal" title="创建配置">
      <n-card style="width: 600px" title="新建数据源配置">
        <ConfigForm @save="handleSaveConfig" @cancel="showCreateModal = false" />
      </n-card>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useConfigManager } from '@/composables/useConfigManager'
import { AddOutline, CheckmarkCircleOutline } from '@vicons/ionicons5'

const {
  loading,
  error,
  configs,
  statistics,
  createConfig,
  loadConfigs,
  deleteConfig
} = useConfigManager()

const showCreateModal = ref(false)

const tableColumns = computed(() => [
  {
    title: '名称',
    key: 'name',
    sorter: 'default'
  },
  {
    title: '类型',
    key: 'type',
    render: (row: any) => {
      const typeMap = {
        api: 'API',
        websocket: 'WebSocket',
        static: '静态数据',
        script: '脚本'
      }
      return typeMap[row.type as keyof typeof typeMap] || row.type
    }
  },
  {
    title: '描述',
    key: 'description',
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: '更新时间',
    key: 'metadata.updatedAt',
    render: (row: any) => {
      return row.metadata?.updatedAt 
        ? new Date(row.metadata.updatedAt).toLocaleString()
        : '-'
    }
  },
  {
    title: '操作',
    key: 'actions',
    render: (row: any) => h('div', [
      h(NButton, {
        size: 'small',
        type: 'primary',
        style: 'margin-right: 8px',
        onClick: () => handleEditConfig(row)
      }, { default: () => '编辑' }),
      
      h(NButton, {
        size: 'small',
        type: 'error',
        onClick: () => handleDeleteConfig(row.id)
      }, { default: () => '删除' })
    ])
  }
])

const handleSaveConfig = async (configData: any) => {
  const newConfig = await createConfig(configData)
  if (newConfig) {
    showCreateModal.value = false
    $message.success('配置创建成功')
  }
}

const handleEditConfig = (config: any) => {
  // TODO: 实现编辑功能
  console.log('编辑配置:', config)
}

const handleDeleteConfig = async (id: string) => {
  const confirmed = await $dialog.warning({
    title: '确认删除',
    content: '确定要删除这个配置吗？此操作不可恢复。',
    positiveText: '删除',
    negativeText: '取消'
  })

  if (confirmed) {
    const success = await deleteConfig(id)
    if (success) {
      $message.success('配置删除成功')
    }
  }
}

const performHealthCheck = async () => {
  // TODO: 实现健康检查UI
  console.log('执行健康检查')
}

onMounted(() => {
  loadConfigs()
})
</script>
```

## 最佳实践

### 1. 配置命名规范

```typescript
// 推荐的配置命名格式
const configNaming = {
  // 基础格式：[业务域]-[数据类型]-[数据源类型]
  good: [
    'user-profile-api',
    'device-telemetry-websocket', 
    'system-settings-static',
    'report-data-script'
  ],
  
  // 避免的命名
  bad: [
    'config1',
    'api',
    'test',
    'untitled'
  ]
}
```

### 2. 配置组织结构

```typescript
// 使用标签进行分类
const organizationTags = {
  environment: ['开发环境', '测试环境', '生产环境'],
  business: ['用户管理', '设备管理', '数据分析', '系统监控'],
  dataType: ['实时数据', '历史数据', '配置数据', '日志数据'],
  priority: ['高优先级', '中优先级', '低优先级']
}
```

### 3. 错误处理策略

```typescript
// 统一错误处理模式
const handleConfigOperation = async (operation: () => Promise<any>) => {
  try {
    const result = await operation()
    
    if (result.success) {
      return result.data
    } else {
      // 显示用户友好的错误消息
      showErrorNotification(result.error?.userMessage)
      
      // 记录详细错误信息用于调试
      console.error('配置操作失败:', result.error)
      
      return null
    }
  } catch (error) {
    // 处理意外错误
    showErrorNotification('操作失败，请稍后重试')
    console.error('配置操作异常:', error)
    return null
  }
}
```

### 4. 性能优化

```typescript
// 启用缓存和批量操作
const optimizedConfigManager = new EnhancedConfigManager({
  cacheTTL: 10 * 60 * 1000, // 10分钟缓存
  enableBackup: true,
  enableVersioning: false // 根据需要启用
})

// 批量加载配置
const loadConfigsInBatches = async (configIds: string[]) => {
  const batchSize = 10
  const results = []
  
  for (let i = 0; i < configIds.length; i += batchSize) {
    const batch = configIds.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(id => optimizedConfigManager.getConfigSafe(id))
    )
    results.push(...batchResults)
  }
  
  return results
}
```