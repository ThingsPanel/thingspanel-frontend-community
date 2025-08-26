# 数据源系统错误处理指南

## 概述

数据源系统提供了完整的错误处理机制，包括：
- 统一的错误类型定义
- 系统级错误管理器
- 数据源专用错误处理器
- 错误恢复策略
- 错误监听和统计

## 核心组件

### 1. SystemErrorManager - 系统错误管理器

负责全局错误处理、监听和统计。

```typescript
import { systemErrorManager, SystemErrorType } from '@/core/data-source-system'

// 创建系统错误
const error = SystemErrorManager.createError(
  SystemErrorType.VALIDATION,
  'CONFIG_INVALID',
  '配置验证失败',
  { validationErrors: ['URL不能为空'] },
  { componentId: 'chart-001', dataSourceType: 'http' }
)

// 处理错误
const result = await systemErrorManager.handleError(error, {
  type: 'retry',
  maxRetries: 3,
  retryDelay: 1000
})
```

### 2. DataSourceErrorHandler - 数据源错误处理器

专门处理数据源相关的错误场景。

```typescript
import { dataSourceErrorHandler } from '@/core/data-source-system'

// 处理HTTP配置错误
const httpResult = await dataSourceErrorHandler.handleHttpConfigError(
  httpConfig,
  ['URL格式不正确', '请求头缺少必要字段'],
  {
    dataSourceId: 'http-001',
    componentId: 'chart-001'
  }
)

// 处理HTTP请求错误
try {
  const response = await axios.get(url)
} catch (error) {
  const errorResult = await dataSourceErrorHandler.handleHttpRequestError(
    error,
    httpConfig,
    { dataSourceId: 'http-001' }
  )
}
```

## 错误类型

### 系统错误类型 (SystemErrorType)

- **配置相关**: `VALIDATION`, `MISSING_CONFIG`, `INVALID_CONFIG`
- **网络相关**: `NETWORK`, `TIMEOUT`, `ABORT`, `CONNECTION_FAILED`
- **认证相关**: `AUTH`, `PERMISSION`
- **数据处理**: `PARSE`, `TRANSFORM`, `SCRIPT`
- **系统相关**: `SYSTEM`, `UNKNOWN`

### 数据源错误类型 (DataSourceErrorType)

- **HTTP相关**: `HTTP_CONFIG_INVALID`, `HTTP_REQUEST_FAILED`, `HTTP_RESPONSE_INVALID`
- **WebSocket相关**: `WS_CONNECTION_FAILED`, `WS_MESSAGE_INVALID`, `WS_AUTH_FAILED`
- **数据处理**: `DATA_TRANSFORM_FAILED`, `DATA_VALIDATION_FAILED`, `FIELD_MAPPING_FAILED`
- **脚本执行**: `SCRIPT_SYNTAX_ERROR`, `SCRIPT_RUNTIME_ERROR`, `SCRIPT_SECURITY_ERROR`

## 错误恢复策略

### 1. 重试策略 (retry)

```typescript
const recoveryStrategy = {
  type: 'retry' as const,
  maxRetries: 3,
  retryDelay: 1000
}
```

### 2. 降级策略 (fallback)

```typescript
const recoveryStrategy = {
  type: 'fallback' as const,
  fallbackData: { status: 'offline', data: [] }
}
```

### 3. 忽略策略 (ignore)

```typescript
const recoveryStrategy = {
  type: 'ignore' as const
}
```

### 4. 失败策略 (fail)

```typescript
const recoveryStrategy = {
  type: 'fail' as const
}
```

## 错误监听

### 添加错误监听器

```typescript
import { systemErrorManager, SystemErrorType } from '@/core/data-source-system'

// 添加全局错误监听器
systemErrorManager.addListener({
  id: 'global-error-handler',
  callback: async (error) => {
    console.error('捕获到系统错误:', error)
    
    // 发送错误报告到服务器
    if (error.type === SystemErrorType.SYSTEM) {
      await sendErrorReport(error)
    }
    
    // 显示用户友好提示
    if (error.userMessage) {
      showNotification(error.userMessage, 'error')
    }
  }
})

// 添加特定类型错误监听器
systemErrorManager.addListener({
  id: 'network-error-handler',
  errorTypes: [SystemErrorType.NETWORK, SystemErrorType.TIMEOUT],
  callback: async (error) => {
    console.warn('网络错误:', error)
    
    // 显示网络状态提示
    showNetworkStatus('网络连接不稳定，正在重试...')
  }
})
```

### 移除错误监听器

```typescript
systemErrorManager.removeListener('global-error-handler')
```

## 错误统计

### 获取错误统计

```typescript
const errorStats = systemErrorManager.getErrorStats()
console.log('错误统计:', errorStats)
// 输出: { network: 5, validation: 2, timeout: 1 }
```

### 清除错误统计

```typescript
systemErrorManager.clearErrorStats()
```

## 在组件中使用

### Vue组合式函数示例

```typescript
// useHttpDataSource.ts
import { ref, reactive } from 'vue'
import { dataSourceErrorHandler } from '@/core/data-source-system'
import type { HttpConfiguration } from '@/core/data-source-system/types'

export function useHttpDataSource() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const data = ref(null)

  const executeRequest = async (config: HttpConfiguration) => {
    loading.value = true
    error.value = null

    try {
      // 执行HTTP请求
      const response = await fetch(config.url, {
        method: config.method,
        headers: config.headers.reduce((acc, h) => ({
          ...acc,
          [h.key]: h.value
        }), {}),
        body: config.body
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      data.value = await response.json()
    } catch (requestError) {
      // 使用数据源错误处理器
      const errorResult = await dataSourceErrorHandler.handleHttpRequestError(
        requestError,
        config,
        { dataSourceId: 'user-http-request' }
      )

      error.value = errorResult.error?.userMessage || '请求失败'
      
      // 根据错误处理结果决定是否重试
      if (errorResult.retryCount !== undefined && errorResult.retryCount < 3) {
        // 延迟后重试
        setTimeout(() => {
          executeRequest(config)
        }, 2000)
      }
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    data,
    executeRequest
  }
}
```

### 在执行器中集成

```typescript
// HttpDataExecutor.ts 中的错误处理示例
export class HttpDataExecutor implements DataExecutor {
  async execute(config: ExecutionConfig, context?: SimpleParamContext): Promise<ExecutionResult> {
    try {
      // 配置验证
      const validation = this.validateConfig(httpConfig.config)
      if (!validation.valid) {
        return await dataSourceErrorHandler.handleHttpConfigError(
          httpConfig.config,
          validation.errors,
          {
            dataSourceId: httpConfig.id,
            executorType: 'http'
          }
        )
      }

      // 执行请求
      const result = await this.performHttpRequest(httpConfig.config)
      return result

    } catch (error) {
      // 使用专用错误处理器
      return await dataSourceErrorHandler.handleHttpRequestError(
        error,
        httpConfig.config,
        {
          dataSourceId: httpConfig.id,
          executorType: 'http'
        }
      )
    }
  }
}
```

## 最佳实践

### 1. 错误分类

- 明确区分可重试和不可重试的错误
- 配置类错误（验证失败）通常不可重试
- 网络类错误（超时、连接失败）通常可重试

### 2. 敏感信息脱敏

```typescript
// 错误处理器会自动脱敏敏感信息
const error = await dataSourceErrorHandler.handleHttpConfigError(
  {
    url: 'https://api.example.com/data',
    headers: [
      { key: 'Authorization', value: 'Bearer secret-token' },
      { key: 'Content-Type', value: 'application/json' }
    ]
  },
  ['URL格式不正确'],
  context
)

// 日志中Authorization头会显示为 '***'
```

### 3. 用户友好的错误消息

```typescript
// 系统会自动生成用户友好的错误消息
const error = SystemErrorManager.createError(
  SystemErrorType.NETWORK,
  'CONNECTION_FAILED',
  'ECONNREFUSED: Connection refused'
)

console.log(error.userMessage) // "网络连接出现问题，请检查网络状态"
```

### 4. 错误监听和上报

```typescript
// 生产环境错误上报
systemErrorManager.addListener({
  id: 'error-reporter',
  callback: async (error) => {
    if (process.env.NODE_ENV === 'production') {
      await fetch('/api/error-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: error.type,
          code: error.code,
          message: error.message,
          context: error.context,
          timestamp: error.timestamp,
          userAgent: navigator.userAgent
        })
      })
    }
  }
})
```

## 调试和诊断

### 启用详细日志

```typescript
systemErrorManager.setVerboseLogging(true)
```

### 查看错误统计

```typescript
// 定期检查错误统计
setInterval(() => {
  const stats = systemErrorManager.getErrorStats()
  console.log('错误统计报告:', stats)
}, 60000) // 每分钟检查一次
```

### 测试错误处理

```typescript
// 模拟网络错误测试
const mockNetworkError = new Error('Network Error')
mockNetworkError.code = 'NETWORK_ERROR'

const result = await dataSourceErrorHandler.handleHttpRequestError(
  mockNetworkError,
  httpConfig,
  { dataSourceId: 'test' }
)

console.log('错误处理结果:', result)
```