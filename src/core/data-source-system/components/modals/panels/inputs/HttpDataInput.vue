<!--
  HTTP数据输入组件
  提供HTTP请求配置功能，包含URL、方法、请求头、请求体等配置
  从原DataSourceConfigForm拆分而来，专注于HTTP请求处理
-->
<template>
  <n-space vertical :size="6">
    <!-- 基本配置 -->
    <n-space vertical :size="3">
      <!-- URL配置 -->
      <n-form-item label="请求URL" size="small" :label-width="60">
        <n-input
          v-model:value="localConfig.url"
          placeholder="https://api.example.com/data 或 /api/data"
          clearable
          size="small"
          @input="handleConfigChange"
        >
          <template #prefix>
            <n-icon size="12" style="color: var(--text-color-3)">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="m14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </n-icon>
          </template>
        </n-input>
      </n-form-item>

      <!-- 请求方法 -->
      <n-form-item label="请求方法" size="small" :label-width="60">
        <n-select
          v-model:value="localConfig.method"
          size="small"
          :options="methodOptions"
          @update:value="handleConfigChange"
        />
      </n-form-item>
    </n-space>

    <!-- 高级配置 -->
    <n-collapse>
      <n-collapse-item title="高级配置" name="advanced">
        <n-space vertical :size="4">
          <!-- 请求头配置 -->
          <n-form-item label="请求头" size="small" style="margin-bottom: 4px">
            <template #label>
              <n-space :size="2" align="center">
                <span style="font-size: 11px">请求头 (JSON)</span>
                <n-tooltip placement="top" trigger="hover">
                  <template #trigger>
                    <n-icon size="10" style="color: var(--info-color); cursor: help">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
                        <path
                          d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                        <path
                          d="M12 17h.01"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </n-icon>
                  </template>
                  <div style="max-width: 200px; font-size: 10px">
                    示例：{"Content-Type": "application/json", "Authorization": "Bearer token"}
                  </div>
                </n-tooltip>
              </n-space>
            </template>
            <n-input
              v-model:value="localConfig.headers"
              type="textarea"
              placeholder='{"Content-Type": "application/json"}'
              :rows="3"
              size="small"
              @input="handleConfigChange"
            />
          </n-form-item>

          <!-- 请求体配置（仅POST/PUT/PATCH显示） -->
          <n-form-item v-if="showRequestBody" label="请求体" size="small" style="margin-bottom: 4px">
            <template #label>
              <n-space :size="2" align="center">
                <span style="font-size: 11px">请求体 (JSON)</span>
                <n-tooltip placement="top" trigger="hover">
                  <template #trigger>
                    <n-icon size="10" style="color: var(--info-color); cursor: help">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
                        <path
                          d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                        <path
                          d="M12 17h.01"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </n-icon>
                  </template>
                  <div style="max-width: 200px; font-size: 10px">请求体数据，通常为JSON格式</div>
                </n-tooltip>
              </n-space>
            </template>
            <n-input
              v-model:value="localConfig.body"
              type="textarea"
              placeholder='{"key": "value"}'
              :rows="4"
              size="small"
              @input="handleConfigChange"
            />
          </n-form-item>

          <!-- 超时配置 -->
          <n-form-item label="超时时间" size="small" style="margin-bottom: 0">
            <n-input-number
              v-model:value="localConfig.timeout"
              :min="1000"
              :max="60000"
              :step="1000"
              size="small"
              placeholder="5000"
              @update:value="handleConfigChange"
            >
              <template #suffix>ms</template>
            </n-input-number>
          </n-form-item>
        </n-space>
      </n-collapse-item>
    </n-collapse>

    <!-- 测试区域 -->
    <n-card size="small" :bordered="false" style="background: var(--hover-color)">
      <template #header>
        <n-space justify="space-between" align="center">
          <n-text depth="2" style="font-size: 11px">请求测试</n-text>
          <n-button size="tiny" type="primary" :loading="testing" :disabled="!isConfigValid" @click="testRequest">
            🧪 测试请求
          </n-button>
        </n-space>
      </template>

      <n-space vertical :size="2">
        <!-- 测试状态 -->
        <n-tag :type="testResult.type" size="small" style="font-size: 10px">
          {{ testResult.text }}
        </n-tag>

        <!-- 测试结果预览 -->
        <n-code
          :code="testResult.data"
          language="json"
          style="max-height: 300px; overflow-y: auto; font-size: 10px"
          :show-line-numbers="false"
        />
      </n-space>
    </n-card>
  </n-space>
</template>

<script setup lang="ts">
/**
 * HTTP数据输入组件
 * 专门处理HTTP请求的配置、测试等功能
 */

import { ref, computed, watch, nextTick } from 'vue'
import {
  NSpace,
  NFormItem,
  NInput,
  NSelect,
  NCollapse,
  NCollapseItem,
  NTooltip,
  NIcon,
  NInputNumber,
  NCard,
  NText,
  NButton,
  NTag,
  NCode
} from 'naive-ui'

// 导入请求服务 - 🔥 修复：使用项目的统一request服务
import { request } from '@/service/request'

// HTTP配置接口
interface HttpConfig {
  url: string
  method: string
  headers: string
  body?: string
  timeout?: number
}

// Props 定义
interface Props {
  value: HttpConfig
}

// Emits 定义
interface Emits {
  (e: 'update:value', value: HttpConfig): void
  (e: 'change', value: HttpConfig): void
  (e: 'validation-changed', validation: { isValid: boolean; error: string }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// ========== 响应式数据 ==========

/** 本地配置绑定 */
const localConfig = computed({
  get: () => props.value,
  set: value => {
    emit('update:value', value)
    emit('change', value)
  }
})

/** 请求方法选项 */
const methodOptions = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
  { label: 'PATCH', value: 'PATCH' },
  { label: 'HEAD', value: 'HEAD' },
  { label: 'OPTIONS', value: 'OPTIONS' }
]

/** 是否显示请求体配置 */
const showRequestBody = computed(() => {
  return ['POST', 'PUT', 'PATCH'].includes(localConfig.value.method)
})

/** 配置是否有效 */
const isConfigValid = computed(() => {
  return !!(localConfig.value.url && localConfig.value.url.trim())
})

/** 测试状态 */
const testing = ref(false)

/** 测试结果 */
const testResult = ref({
  type: 'default' as const,
  text: '待测试',
  data: '{}'
})

// ========== 监听器 ==========

/** 监听配置变化进行验证 */
watch(
  localConfig,
  newConfig => {
    validateConfig(newConfig)
  },
  { immediate: true, deep: true }
)

// ========== 方法 ==========

/**
 * 验证HTTP配置
 */
function validateConfig(config: HttpConfig): void {
  const errors: string[] = []

  // 验证URL
  if (!config.url || !config.url.trim()) {
    errors.push('请求URL不能为空')
  } else {
    const url = config.url.trim()
    // 检查URL格式
    if (!url.startsWith('http') && !url.startsWith('/')) {
      errors.push('URL格式无效，应以http://、https://或/开头')
    }
  }

  // 验证请求头
  if (config.headers && config.headers.trim()) {
    try {
      JSON.parse(config.headers)
    } catch {
      errors.push('请求头格式无效，应为有效的JSON格式')
    }
  }

  // 验证请求体
  if (config.body && config.body.trim() && showRequestBody.value) {
    try {
      JSON.parse(config.body)
    } catch {
      errors.push('请求体格式无效，应为有效的JSON格式')
    }
  }

  const isValid = errors.length === 0
  const error = errors.join('; ')

  emit('validation-changed', { isValid, error })
}

/**
 * 判断URL是否为完整路径
 */
function isFullUrl(url: string): boolean {
  return /^https?:\/\//.test(url.trim())
}

/**
 * 测试HTTP请求
 */
async function testRequest(): Promise<void> {
  if (!isConfigValid.value) {
    window.$message?.warning('请先完善配置')
    return
  }

  testing.value = true

  try {
    const config = localConfig.value
    const url = config.url.trim()
    const timeout = config.timeout || 5000

    let result: any

    console.log(`🧪 [HttpDataInput] 开始测试HTTP请求: ${config.method} ${url}`)

    // 🔥 修复：统一使用项目request服务，确保代理配置生效
    if (isFullUrl(url)) {
      // 外部API请求，使用fetch
      result = await testExternalRequest(config, timeout)
    } else {
      // 内部API请求，使用项目request服务（包含代理配置）
      console.log('🚀 [HttpDataInput] 使用项目request服务，将自动处理代理配置')
      result = await testInternalRequest(config, timeout)
    }

    testResult.value = {
      type: 'success',
      text: '请求成功',
      data: JSON.stringify(result, null, 2)
    }

    console.log('✅ [HttpDataInput] HTTP请求测试成功:', result)
    window.$message?.success('HTTP请求测试成功')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    testResult.value = {
      type: 'error',
      text: '请求失败',
      data: JSON.stringify({ error: errorMessage }, null, 2)
    }

    console.error('❌ [HttpDataInput] HTTP请求测试失败:', error)
    window.$message?.error('请求失败：' + errorMessage)
  } finally {
    testing.value = false
  }
}

/**
 * 测试外部请求
 */
async function testExternalRequest(config: HttpConfig, timeout: number): Promise<any> {
  const { url, method, headers, body } = config

  // 解析请求头
  let parsedHeaders: Record<string, string> = {}
  if (headers && headers.trim()) {
    try {
      parsedHeaders = JSON.parse(headers)
    } catch {
      throw new Error('请求头格式错误')
    }
  }

  // 构建请求配置
  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...parsedHeaders
    }
  }

  // 添加请求体（仅支持POST/PUT/PATCH）
  if (body && body.trim() && showRequestBody.value) {
    try {
      fetchOptions.body = JSON.stringify(JSON.parse(body))
    } catch {
      throw new Error('请求体格式错误')
    }
  }

  // 创建带超时的Promise
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`请求超时 (${timeout}ms)`)), timeout)
  })

  const fetchPromise = fetch(url, fetchOptions).then(async response => {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return response.json()
    } else {
      const text = await response.text()
      return { responseText: text }
    }
  })

  return Promise.race([fetchPromise, timeoutPromise])
}

/**
 * 测试内部请求
 */
async function testInternalRequest(config: HttpConfig, timeout: number): Promise<any> {
  const { url, method, headers, body } = config

  // 解析请求头
  let parsedHeaders: Record<string, string> = {}
  if (headers && headers.trim()) {
    try {
      parsedHeaders = JSON.parse(headers)
    } catch {
      throw new Error('请求头格式错误')
    }
  }

  // 构建请求配置
  const requestConfig = {
    timeout,
    headers: parsedHeaders
  }

  let requestData: any = undefined

  // 处理请求体
  if (body && body.trim() && showRequestBody.value) {
    try {
      requestData = JSON.parse(body)
    } catch {
      throw new Error('请求体格式错误')
    }
  }

  // 根据方法类型发送请求
  switch (method.toUpperCase()) {
    case 'GET':
      return request.get(url, requestConfig)
    case 'POST':
      return request.post(url, requestData, requestConfig)
    case 'PUT':
      return request.put(url, requestData, requestConfig)
    case 'DELETE':
      return request.delete(url, requestConfig)
    case 'PATCH':
      return request.patch(url, requestData, requestConfig)
    default:
      throw new Error(`不支持的请求方法: ${method}`)
  }
}

// ========== 事件处理器 ==========

/**
 * 处理配置变化
 */
function handleConfigChange(): void {
  // 配置变化已通过computed处理，会触发watch进行验证
}

// ========== 初始化 ==========

// 组件挂载时验证配置
nextTick(() => {
  validateConfig(localConfig.value)
})
</script>

<style scoped>
/* HTTP输入组件样式 */
.http-input-container {
  width: 100%;
}

/* 表单项样式优化 */
.http-form :deep(.n-form-item) {
  margin-bottom: 6px;
}

.http-form :deep(.n-form-item-label) {
  font-size: 11px;
  color: var(--text-color-2);
}

/* 折叠面板样式 */
.advanced-config :deep(.n-collapse-item__header) {
  font-size: 11px;
  padding: 6px 0;
}

.advanced-config :deep(.n-collapse-item__content-wrapper) {
  padding-top: 6px;
}

/* 测试区域样式 */
.test-area {
  background: var(--hover-color);
  border-radius: 6px;
  padding: 8px;
}

/* 输入框样式 */
.config-input :deep(.n-input) {
  font-size: 11px;
}

.config-input :deep(.n-input__input) {
  font-size: 11px;
}

/* 选择器样式 */
.method-select :deep(.n-base-selection) {
  font-size: 11px;
}

/* 工具提示样式 */
.tooltip-content {
  max-width: 250px;
  font-size: 10px;
  line-height: 1.3;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .http-form :deep(.n-form-item) {
    margin-bottom: 8px;
  }

  .http-form :deep(.n-form-item-label) {
    font-size: 12px;
  }

  .config-input :deep(.n-input) {
    font-size: 12px;
  }
}

/* 明暗主题适配 */
[data-theme='dark'] .test-area {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

[data-theme='light'] .test-area {
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.08);
}
</style>
