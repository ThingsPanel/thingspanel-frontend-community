<!--
  原始数据配置弹窗
  用于配置原始数据项
-->
<script setup lang="ts">
/**
 * RawDataConfigModal - 原始数据配置弹窗
 * 实现JSON/HTTP/脚本数据录入和预览
 */

import { ref, reactive, computed, watch, nextTick, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import { DataItemFetcher, type DataItem } from '@/core/data-architecture/executors'
import HttpConfigForm from '@/core/data-architecture/components/modals/HttpConfigForm.vue'
// 🔥 简洁脚本编辑器
import SimpleScriptEditor from '@/core/script-engine/components/SimpleScriptEditor.vue'
// 导入示例数据图标
import { DocumentTextOutline } from '@vicons/ionicons5'

// Props接口
interface Props {
  /** 数据源Key */
  dataSourceKey?: string
  /** 编辑数据 */
  editData?: any
  /** 是否为编辑模式 */
  isEditMode?: boolean
  /** 示例数据 */
  exampleData?: any
  /** 🔥 新增：当前组件ID，用于属性绑定 */
  componentId?: string
}

// Emits接口
interface Emits {
  (e: 'confirm', data: DataItem): void
  (e: 'close'): void
  (e: 'cancel'): void
  (e: 'method-change', method: 'json' | 'http' | 'script'): void // 新增：当录入方式改变时通知父组件
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const message = useMessage()

/**
 * 录入方式选项
 */
const inputMethods = [
  { label: 'JSON数据', value: 'json', available: true },
  { label: 'HTTP接口', value: 'http', available: true },
  { label: 'JavaScript脚本', value: 'script', available: true }
]

/**
 * 表单状态
 */
const formState = reactive({
  selectedMethod: 'http' as 'json' | 'http' | 'script' | 'websocket', // 🔥 修改默认值从 json 改为 http
  jsonData: '', // 初始为空，由watch或mounted设置
  httpUrl: 'https://api.example.com/data',
  httpMethod: 'GET' as 'GET' | 'POST' | 'PUT' | 'DELETE',
  httpHeaders: '{\n  "Authorization": "Bearer your-token",\n  "Content-Type": "application/json"\n}',
  httpBody: '{}',
  scriptCode:
    'return {\n  timestamp: new Date().toISOString(),\n  randomValue: Math.random(),\n  message: "Hello from script"\n}'
})

/**
 * HTTP配置状态 - 新版HttpConfigForm集成
 */
const httpConfig = ref({
  url: 'https://api.example.com/data',
  method: 'GET' as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  timeout: 10000,
  headers: [] as Array<{
    key: string
    value: string
    enabled: boolean
    isDynamic: boolean
    dataType: string
    variableName: string
    description: string
  }>,
  params: [] as Array<{
    key: string
    value: string
    enabled: boolean
    isDynamic: boolean
    dataType: string
    variableName: string
    description: string
  }>,
  body: '{}',
  preRequestScript: '',
  postResponseScript: ''
})

/**
 * HTTP配置更新处理 - 添加完整调试
 */
const onHttpConfigUpdate = (newConfig: typeof httpConfig.value) => {
  // 🔥 关键修复：确保响应式更新
  httpConfig.value = { ...newConfig }

  // 同步更新到旧版formState（兼容现有代码）
  formState.httpUrl = newConfig.url || ''
  formState.httpMethod = newConfig.method || 'GET'
  formState.httpHeaders = JSON.stringify(
    newConfig.headers?.filter(h => h.enabled).reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {}) || {}
  )
  formState.httpBody = newConfig.body || '{}'
}

/**
 * 预览数据状态
 */
const previewData = ref<any>(null)
const previewLoading = ref(false)

/**
 * 处理配置状态
 */
const processingState = reactive({
  jsonPath: '',
  defaultValue: '',
  scriptCode: ''
})

/**
 * 脚本模板
 */
const scriptTemplates = [
  {
    name: '提取字段',
    code: 'return {\n  value: data.temperature || data.value,\n  unit: "°C",\n  timestamp: new Date().toISOString()\n}'
  },
  {
    name: '数组转换',
    code: 'if (Array.isArray(data)) {\n  return data.map(item => ({\n    id: item.id,\n    value: item.value,\n    isOnline: item.status === "online"\n  }))\n}\nreturn data'
  },
  {
    name: '数据统计',
    code: 'if (Array.isArray(data)) {\n  return {\n    total: data.length,\n    online: data.filter(item => item.status === "online").length,\n    avgValue: data.reduce((sum, item) => sum + (item.value || 0), 0) / data.length\n  }\n}\nreturn { error: "需要数组数据" }'
  },
  {
    name: '条件过滤',
    code: 'if (Array.isArray(data)) {\n  return data.filter(item => item.status === "online")\n}\nreturn data'
  }
]

/**
 * 处理预览状态
 */
const processingPreviewData = ref<any>(null)
const processingPreviewLoading = ref(false)

/**
 * 数据获取器实例
 */
const fetcher = new DataItemFetcher()

/**
 * 辅助函数：将 HttpParameter[] 转换为 Record<string, string>
 *
 * 用途：兼容旧的 headers 格式要求，将新的HttpParameter数组格式
 * 转换为旧的Record对象格式，确保数据流兼容性
 *
 * @param params HttpParameter数组，包含key、value、enabled等属性
 * @returns Record<string, string> 转换后的键值对对象，如果没有启用的参数则返回undefined
 */
const convertHttpParametersToRecord = (
  params: Array<{
    key: string
    value: string | number | boolean
    enabled: boolean
    dataType: string
  }>
): Record<string, string> | undefined => {
  if (!params || !Array.isArray(params)) return undefined

  const enabledParams = params.filter(p => p.enabled)
  if (enabledParams.length === 0) return undefined

  return enabledParams.reduce(
    (acc, param) => {
      acc[param.key] = String(param.value)
      return acc
    },
    {} as Record<string, string>
  )
}

/**
 * 处理关闭
 */
const handleClose = () => {
  // 重置表单状态
  resetFormState()

  // 发送取消和关闭事件
  emit('cancel')
  emit('close')
}

/**
 * 获取当前数据项配置
 */
const getCurrentDataItem = (): DataItem => {
  switch (formState.selectedMethod) {
    case 'json':
      return {
        type: 'json',
        config: { jsonString: formState.jsonData }
      }
    case 'http':
      // 修复：使用新的 HttpConfig 格式，兼容 HttpConfigForm，包含脚本字段
      return {
        type: 'http',
        config: {
          url: httpConfig.value.url,
          method: httpConfig.value.method,
          timeout: httpConfig.value.timeout,
          headers: convertHttpParametersToRecord(httpConfig.value.headers),
          body: httpConfig.value.body ? JSON.parse(httpConfig.value.body) : undefined,
          // 扩展：支持新的 params 数组格式
          params: httpConfig.value.params,
          // 🔥 关键修复：包含路径参数字段
          pathParameter: httpConfig.value.pathParameter,
          // 🔥 关键修复：包含脚本字段
          preRequestScript: httpConfig.value.preRequestScript,
          postResponseScript: httpConfig.value.postResponseScript
        }
      }
    case 'script':
      return {
        type: 'script',
        config: { script: formState.scriptCode }
      }
    default:
      throw new Error(`不支持的录入方式: ${formState.selectedMethod}`)
  }
}

/**
 * 执行数据预览
 */
const executePreview = async () => {
  if (previewLoading.value) return

  previewLoading.value = true
  try {
    const dataItem = getCurrentDataItem()
    const result = await fetcher.fetchData(dataItem)
    previewData.value = result

    message.success('数据预览成功')
  } catch (error) {
    message.error('数据预览失败: ' + error.message)
    previewData.value = null
  } finally {
    previewLoading.value = false
  }
}

/**
 * 处理确认按钮
 */
const handleConfirm = async () => {
  try {
    const dataItem = getCurrentDataItem()

    // 构建完整配置，包括处理配置
    const fullConfig = {
      type: formState.selectedMethod,
      ...dataItem.config,
      // 原始数据配置
      jsonData: formState.selectedMethod === 'json' ? formState.jsonData : undefined,
      scriptCode: formState.selectedMethod === 'script' ? formState.scriptCode : undefined,
      url: formState.selectedMethod === 'http' ? formState.httpUrl : undefined,
      method: formState.selectedMethod === 'http' ? formState.httpMethod : undefined,
      headers: formState.selectedMethod === 'http' ? formState.httpHeaders : undefined,
      body: formState.selectedMethod === 'http' ? formState.httpBody : undefined,
      // 🔥 关键修复：保存新的 httpConfig 完整状态，包含所有地址类型和参数信息
      httpConfigData:
        formState.selectedMethod === 'http'
          ? {
              ...httpConfig.value,
              // 确保保存地址类型相关的关键信息
              addressType: httpConfig.value.addressType,
              selectedInternalAddress: httpConfig.value.selectedInternalAddress,
              enableParams: httpConfig.value.enableParams,
              pathParams: httpConfig.value.pathParams,
              pathParameter: httpConfig.value.pathParameter
            }
          : undefined,
      // 处理配置
      processingConfig: {
        jsonPath: processingState.jsonPath.trim() || undefined,
        defaultValue: processingState.defaultValue.trim() || undefined,
        scriptCode: processingState.scriptCode.trim() || undefined
      }
    }

    emit('confirm', fullConfig)
    message.success('原始数据配置已保存')
  } catch (error) {
    message.error('配置保存失败: ' + error.message)
  }
}

/**
 * 简单的JSONPath实现
 */
const executeJsonPath = (data: any, path: string, defaultValue: any = null): any => {
  try {
    if (!path || !path.startsWith('$.')) {
      return data
    }

    const keys = path
      .slice(2)
      .split('.')
      .filter(key => key)
    let result = data

    for (const key of keys) {
      // 处理数组索引 key[0]
      if (key.includes('[') && key.includes(']')) {
        const arrayKey = key.split('[')[0]
        const indexMatch = key.match(/\[(\d+)\]/)
        if (indexMatch) {
          const index = parseInt(indexMatch[1])
          result = result?.[arrayKey]?.[index]
        }
      } else {
        result = result?.[key]
      }

      if (result === undefined || result === null) {
        return defaultValue
      }
    }

    return result
  } catch (error) {
    return defaultValue
  }
}

/**
 * 执行数据处理
 */
const executeDataProcessing = (inputData: any): any => {
  if (!inputData) return null

  let processedData = inputData

  try {
    // 第一步: JSONPath过滤
    if (processingState.jsonPath.trim()) {
      processedData = executeJsonPath(
        processedData,
        processingState.jsonPath.trim(),
        processingState.defaultValue || null
      )
    }

    // 第二步: 脚本处理
    if (processingState.scriptCode.trim()) {
      const func = new Function('data', processingState.scriptCode)
      processedData = func(processedData)
    }

    return processedData
  } catch (error) {
    return {
      _error: '处理失败: ' + error.message,
      _originalData: inputData
    }
  }
}

/**
 * 实时处理数据
 */
const updateProcessedData = () => {
  if (!previewData.value) {
    processingPreviewData.value = null
    return
  }

  const result = executeDataProcessing(previewData.value)
  processingPreviewData.value = result
}

/**
 * 执行处理预览
 */
const executeProcessingPreview = async () => {
  if (!previewData.value || processingPreviewLoading.value) return

  processingPreviewLoading.value = true
  try {
    const result = executeDataProcessing(previewData.value)
    processingPreviewData.value = result
    message.success('数据处理预览成功')
  } catch (error) {
    message.error('处理预览失败: ' + error.message)
    processingPreviewData.value = null
  } finally {
    processingPreviewLoading.value = false
  }
}

/**
 * 自动预览开关
 */
const autoPreviewEnabled = ref(true)

/**
 * 防抖执行预览（用于自动更新）
 */
const debouncePreview = (() => {
  let timer: NodeJS.Timeout | null = null
  return (delay = 300) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      if (autoPreviewEnabled.value) {
        executePreview()
      }
    }, delay)
  }
})()

/**
 * 监听录入方式变化，自动预览并通知父组件
 */
watch(
  () => formState.selectedMethod,
  newMethod => {
    previewData.value = null
    processingPreviewData.value = null
    // 通知父组件录入方式已改变
    emit('method-change', newMethod)
  },
  { immediate: true }
)

/**
 * 🔥 智能自动更新策略
 */

// JSON数据变化 - 立即自动更新（无性能损耗）
watch(
  () => formState.jsonData,
  () => {
    if (formState.selectedMethod === 'json' && autoPreviewEnabled.value) {
      debouncePreview(300)
    }
  }
)

// Script代码变化 - 延迟自动更新（轻量计算）
watch(
  () => formState.scriptCode,
  () => {
    if (formState.selectedMethod === 'script' && autoPreviewEnabled.value) {
      debouncePreview(1000) // 脚本类型延迟1秒
    }
  }
)

// HTTP配置变化监听
watch(
  [() => formState.httpUrl, () => formState.httpMethod, () => formState.httpHeaders, () => formState.httpBody],
  () => {
    if (formState.selectedMethod === 'http') {
    }
  }
)

/**
 * 监听原始数据变化，实时处理
 */
watch(
  () => previewData.value,
  () => {
    updateProcessedData()
  }
)

/**
 * 监听处理配置变化，实时处理
 */
watch(
  [() => processingState.jsonPath, () => processingState.defaultValue, () => processingState.scriptCode],
  () => {
    updateProcessedData()
  },
  { deep: true }
)

/**
 * 🔥 修复：重置所有表单状态
 * 弹窗打开时调用，确保每次都是新的干净状态
 * 🔥 统一标准：优先使用组件示例数据，回退到通用数据
 */
const resetFormState = () => {
  // 重置表单数据
  formState.selectedMethod = 'json'

  // 如果有组件示例数据就用，否则用通用数据
  if (props.exampleData) {
    formState.jsonData = JSON.stringify(props.exampleData, null, 2)
  } else {
    formState.jsonData = JSON.stringify(
      {
        value: 45,
        unit: '%',
        metricsName: '湿度',
        timestamp: new Date().toISOString()
      },
      null,
      2
    )
  }
  formState.httpUrl = 'https://api.example.com/data'
  formState.httpMethod = 'GET'
  formState.httpHeaders = '{\n  "Authorization": "Bearer your-token",\n  "Content-Type": "application/json"\n}'
  formState.httpBody = '{}'
  formState.scriptCode =
    'return {\n  timestamp: new Date().toISOString(),\n  randomValue: Math.random(),\n  message: "Hello from script"\n}'

  // 重置预览状态
  previewData.value = null
  previewLoading.value = false
  processingPreviewData.value = null
  processingPreviewLoading.value = false

  // 重置处理配置
  processingState.jsonPath = ''
  processingState.defaultValue = ''
  processingState.scriptCode = ''
}

/**
 * 使用示例数据（仅JSON模式，用于调试）
 */
const loadExampleData = (showMessage = false) => {
  if (!props.exampleData) {
    if (showMessage) message.warning('当前组件没有提供示例数据')
    return
  }

  if (formState.selectedMethod === 'json') {
    formState.jsonData = JSON.stringify(props.exampleData, null, 2)
    if (showMessage) message.success('已加载组件示例数据')
  } else {
    if (showMessage) message.info('示例数据仅在JSON模式下可用')
  }
}

/**
 * 获取示例按钮的提示文本
 */
const getExampleButtonTitle = () => {
  return formState.selectedMethod === 'json' ? '加载组件示例数据（用于调试）' : '示例数据仅在JSON模式下可用'
}

/**
 * 🔥 修复：根据编辑数据加载状态
 * 接收来自父组件的编辑数据并填充表单
 */
const loadEditData = (editData: any) => {
  if (!editData) {
    return
  }

  // 加载基本配置
  formState.selectedMethod = editData.type || 'json'

  // 根据类型加载对应数据
  switch (editData.type) {
    case 'json':
      // 🔥 关键修复：支持多种JSON数据字段名，优先使用实际保存的字段
      if (editData.jsonData) {
        formState.jsonData = editData.jsonData
      } else if (editData.jsonString) {
        // 从config.jsonString中恢复
        formState.jsonData = editData.jsonString
      } else if (editData.config?.jsonString) {
        // 从嵌套的config.jsonString中恢复
        formState.jsonData = editData.config.jsonString
      }
      break
    case 'script':
      if (editData.scriptCode) {
        formState.scriptCode = editData.scriptCode
      }
      break
    case 'http':
      // 更新旧格式字段（保持兼容）
      if (editData.url) formState.httpUrl = editData.url
      if (editData.method) formState.httpMethod = editData.method
      if (editData.headers) formState.httpHeaders = editData.headers
      if (editData.body) formState.httpBody = editData.body

      // 🔥 关键修复：优先从 httpConfigData 完整加载，回退到基本字段
      if (editData.httpConfigData) {
        // 完整的HTTP配置数据存在，直接加载
        httpConfig.value = {
          ...httpConfig.value,
          ...editData.httpConfigData,
          // 确保关键字段有默认值
          url: editData.httpConfigData.url || editData.url || '',
          method: editData.httpConfigData.method || editData.method || 'GET',
          timeout: editData.httpConfigData.timeout || editData.timeout || 10000,
          addressType: editData.httpConfigData.addressType || 'external',
          selectedInternalAddress: editData.httpConfigData.selectedInternalAddress || '',
          enableParams: editData.httpConfigData.enableParams || false,
          pathParameter: editData.httpConfigData.pathParameter,
          // 确保数组字段不为空
          headers: editData.httpConfigData.headers || [],
          params: editData.httpConfigData.params || [],
          pathParams: editData.httpConfigData.pathParams || []
        }
      } else {
        // 没有复杂配置数据，从基本字段恢复
        httpConfig.value.url = editData.url || ''
        httpConfig.value.method = editData.method || 'GET'
        httpConfig.value.timeout = editData.timeout || 10000
        httpConfig.value.addressType = 'external' // 默认外部地址
        httpConfig.value.selectedInternalAddress = ''
        httpConfig.value.enableParams = false

        // 从旧格式恢复基础配置
        try {
          if (editData.headers && typeof editData.headers === 'string') {
            const headersObj = JSON.parse(editData.headers)
            httpConfig.value.headers = Object.entries(headersObj).map(([key, value]) => ({
              key,
              value: String(value),
              enabled: true,
              isDynamic: false,
              dataType: 'string',
              variableName: '',
              description: ''
            }))
          }
          if (editData.body) {
            httpConfig.value.body = typeof editData.body === 'string' ? editData.body : JSON.stringify(editData.body)
          }
        } catch (error) {}
      }
      break
  }

  // 加载处理配置
  if (editData.processingConfig) {
    processingState.jsonPath = editData.processingConfig.jsonPath || ''
    processingState.defaultValue = editData.processingConfig.defaultValue || ''
    processingState.scriptCode = editData.processingConfig.scriptCode || ''
  }
}

/**
 * 组件挂载时初始化
 */
onMounted(() => {
  // 🔥 关键修复：只在非编辑模式下重置状态，避免覆盖用户数据
  if (props.isEditMode && props.editData) {
    // 编辑模式：先设置基础状态，然后加载编辑数据
    formState.selectedMethod = 'json' // 基础状态
    nextTick(() => {
      loadEditData(props.editData)
    })
  } else {
    // 非编辑模式：重置为初始状态（包含示例数据）
    resetFormState()
    nextTick(() => {
      resetFormState() // 确保状态一致性
    })
  }
})

/**
 * 暴露方法和状态给父组件使用
 */
defineExpose({
  resetFormState,
  loadEditData,
  formState // 暴露表单状态，让父组件可以访问 selectedMethod
})
</script>

<template>
  <!-- 🔥 抽屉模式：直接渲染内容区域 -->
  <div class="drawer-content-wrapper">
    <!-- 左右分割布局 -->
    <div class="modal-content drawer-mode">
      <!-- 左侧区域 - 数据配置 -->
      <div class="left-panel">
        <!-- 上部分 - 录入表单 (2/3高度) -->
        <div class="input-form-section">
          <div class="form-content">
            <!-- Tag选择器录入方式 -->
            <div class="method-selector">
              <n-space>
                <n-tag
                  :type="formState.selectedMethod === 'http' ? 'primary' : 'default'"
                  :bordered="formState.selectedMethod !== 'http'"
                  checkable
                  :checked="formState.selectedMethod === 'http'"
                  class="method-tag"
                  @click="formState.selectedMethod = 'http'"
                >
                  HTTP接口
                </n-tag>
                <n-tag
                  :type="formState.selectedMethod === 'json' ? 'primary' : 'default'"
                  :bordered="formState.selectedMethod !== 'json'"
                  checkable
                  :checked="formState.selectedMethod === 'json'"
                  class="method-tag"
                  @click="formState.selectedMethod = 'json'"
                >
                  JSON数据
                </n-tag>

                <n-tag
                  :type="formState.selectedMethod === 'script' ? 'primary' : 'default'"
                  :bordered="formState.selectedMethod !== 'script'"
                  checkable
                  :checked="formState.selectedMethod === 'script'"
                  class="method-tag"
                  @click="formState.selectedMethod = 'script'"
                >
                  JavaScript脚本
                </n-tag>
              </n-space>
            </div>

            <!-- 内容区域 -->
            <div class="content-area">
              <!-- 自动预览开关 -->
              <n-space align="center" justify="space-between" style="margin-bottom: 8px">
                <n-space align="center" size="small">
                  <n-switch v-model:value="autoPreviewEnabled" size="small" />
                  <n-text style="font-size: 11px">自动预览</n-text>
                  <n-popover trigger="hover" placement="top">
                    <template #trigger>
                      <span style="color: var(--text-color-3); cursor: help; font-size: 11px">❓</span>
                    </template>
                    <div style="max-width: 200px; font-size: 12px">
                      <p>JSON/Script类型会自动更新预览</p>
                      <p>HTTP类型需要手动点击（避免频繁请求）</p>
                    </div>
                  </n-popover>
                </n-space>

                <!-- 按钮组 -->
                <n-space size="small">
                  <!-- 使用示例数据按钮 -->
                  <n-button
                    v-if="props.exampleData"
                    type="info"
                    size="small"
                    :disabled="!props.exampleData"
                    :title="getExampleButtonTitle()"
                    @click="() => loadExampleData(true)"
                  >
                    使用示例数据
                  </n-button>

                  <!-- 预览按钮 -->
                  <n-button type="primary" size="small" :loading="previewLoading" @click="executePreview">
                    预览数据
                  </n-button>
                </n-space>
              </n-space>

              <!-- JSON数据录入 -->
              <div v-if="formState.selectedMethod === 'json'" class="editor-container">
                <n-input
                  v-model:value="formState.jsonData"
                  type="textarea"
                  :rows="12"
                  placeholder="请输入JSON格式数据"
                  show-count
                  :input-props="{ style: 'font-family: Monaco, Consolas, monospace; font-size: 12px;' }"
                />
              </div>

              <!-- HTTP接口配置 -->
              <div v-if="formState.selectedMethod === 'http'" class="editor-container">
                <HttpConfigForm
                  v-model:model-value="httpConfig"
                  :component-id="componentId"
                  @update:model-value="onHttpConfigUpdate"
                />
              </div>

              <!-- 脚本录入 -->
              <div v-if="formState.selectedMethod === 'script'" class="editor-container">
                <SimpleScriptEditor
                  v-model:model-value="formState.scriptCode"
                  template-category="data-generation"
                  placeholder="请输入数据生成脚本，可通过 context 参数访问上下文..."
                  height="320px"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧区域 - 三段式布局 -->
      <div class="right-panel">
        <!-- 第一段 - 原始数据预览 -->
        <div class="right-section raw-data-section">
          <div class="compact-header">
            <span class="section-icon">📊</span>
            <span>原始数据预览</span>
          </div>
          <div class="section-content">
            <!-- 加载状态 -->
            <div v-if="previewLoading" class="preview-loading">
              <n-spin size="small" />
              <span>正在执行数据获取...</span>
            </div>
            <!-- 预览结果 -->
            <div v-else-if="previewData" class="preview-result">
              <n-code :code="JSON.stringify(previewData, null, 2)" language="json" :hljs="false" word-wrap />
            </div>
            <!-- 空状态 -->
            <div v-else class="preview-empty">
              <n-empty description="请完成左侧配置并点击预览数据获取原始数据" size="small">
                <template #icon>
                  <span style="font-size: 18px">📭</span>
                </template>
              </n-empty>
            </div>
          </div>
        </div>

        <!-- 第二段 - 数据处理配置 -->
        <div class="right-section processing-config-section">
          <div class="compact-header">
            <span class="section-icon">⚙️</span>
            <span>数据处理配置</span>
          </div>
          <div class="section-content">
            <!-- JSONPath过滤 -->
            <div class="processing-item">
              <div class="flex">
                <span class="mr-4">JSONPath 过滤:</span>
                <div class="w-[240px]">
                  <n-input
                    v-model:value="processingState.jsonPath"
                    placeholder="例如: $.temperature 或 $.sensors[0] (留空不过滤)"
                    size="small"
                  />
                </div>
                <n-popover trigger="hover" placement="top">
                  <template #trigger>
                    <span class="help-icon">❓</span>
                  </template>
                  <div>
                    <p>使用JSONPath语法提取数据片段</p>
                    <p>
                      例如:
                      <code>$.temperature</code>
                      提取温度
                    </p>
                    <p>
                      或:
                      <code>$.sensors[0]</code>
                      提取第一个传感器
                    </p>
                    <p>留空表示不过滤，使用原始数据</p>
                  </div>
                </n-popover>
              </div>
            </div>

            <!-- 脚本处理 -->
            <div class="processing-item">
              <SimpleScriptEditor
                v-model:model-value="processingState.scriptCode"
                template-category="data-processing"
                placeholder="请输入数据处理脚本，可通过 data 参数访问原始数据..."
                height="140px"
              />
            </div>
          </div>
        </div>

        <!-- 第三段 - 处理结果展示 -->
        <div class="right-section processing-result-section">
          <div class="compact-header">
            <span class="section-icon">✨</span>
            <span>处理结果展示</span>
            <span class="realtime-indicator">
              <span class="indicator-dot"></span>
              实时处理
            </span>
          </div>
          <div class="section-content">
            <!-- 处理结果 -->
            <div v-if="processingPreviewData" class="processing-result">
              <n-code :code="JSON.stringify(processingPreviewData, null, 2)" language="json" :hljs="false" word-wrap />
            </div>
            <!-- 空状态 -->
            <div v-else class="processing-empty">
              <n-empty description="配置处理规则后自动显示结果" size="small">
                <template #icon>
                  <span style="font-size: 18px">⚙️</span>
                </template>
              </n-empty>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 抽屉模式底部操作区 -->
    <div class="drawer-footer">
      <n-space justify="end">
        <n-button @click="handleClose">取消</n-button>
        <n-button type="primary" :disabled="!previewData" @click="handleConfirm">确定</n-button>
      </n-space>
    </div>
  </div>
</template>

<style scoped>
/* 🔥 抽屉模式专用包装器 */
.drawer-content-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 75vh;
}

.modal-content {
  display: flex;
  gap: 12px;
  height: 600px;
  padding: 0;
}

/* 🔥 抽屉模式下的布局调整 */
.modal-content.drawer-mode {
  flex: 1;
  height: auto;
  min-height: 0;
}

/* 🔥 抽屉底部操作区 */
.drawer-footer {
  padding: 16px;
  border-top: 1px solid var(--border-color);
  background: var(--card-color);
  flex-shrink: 0;
}

.left-panel,
.right-panel {
  flex: 4;
  min-width: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
}
.right-panel {
  flex: 3;
}
/* 面板标题 */

/* 左侧面板内部布局 */
.left-panel {
  gap: 0;
}

.input-form-section {
  flex: 2;
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid var(--border-color);
  min-height: 0;
}

.data-preview-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 子区域标题 */
.compact-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-color);
  background: var(--card-color);
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.form-content {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
}

.data-preview-content {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
}

/* 右侧区域 */
.processing-area {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 处理区域样式 */
.processing-description {
  flex-shrink: 0;
}

.processing-section {
  flex-shrink: 0;
}

.help-icon {
  font-size: 12px;
  color: var(--text-color-3);
  cursor: help;
}

.processing-content {
  margin-left: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-prefix {
  font-size: 11px;
  color: var(--text-color-2);
  width: 35px;
  display: inline-block;
}

.default-value-input {
  margin-top: 4px;
}

/* 处理预览区域 */
.processing-preview {
  height: 200px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  overflow: hidden;
}

.processing-result {
  height: 100%;
  overflow-y: auto;
  padding: 8px;
  background: var(--code-color);
}

.processing-result :deep(.n-code) {
  background: transparent !important;
  padding: 0 !important;
  font-size: 11px;
  line-height: 1.4;
}

.processing-result :deep(.n-code pre) {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.processing-empty {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--body-color);
}

/* 脚本模板下拉框样式 */
.script-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 实时处理指示器 */
.realtime-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--success-color);
}

.indicator-dot {
  width: 6px;
  height: 6px;
  background: var(--success-color);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.2);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* Tag选择器样式 */
.method-selector {
  margin-bottom: 16px;
  padding: 8px 0;
}

.method-tag {
  cursor: pointer;
  user-select: none;
  transition: all 0.2s;
}

.method-tag:not([disabled]):hover {
  transform: translateY(-1px);
}

.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.preview-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.editor-container {
  flex: 1;
}

/* 表单相关样式 */
.code-editor-container {
  width: 100%;
}

.preview-btn {
  flex-shrink: 0;
}

/* 预览区域样式 */
.preview-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 8px;
  color: var(--text-color-2);
  font-size: 12px;
}

.preview-result {
  height: 100%;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 8px;
  background: var(--code-color);
}

.preview-result :deep(.n-code) {
  background: transparent !important;
  padding: 0 !important;
  font-size: 11px;
  line-height: 1.4;
}

.preview-result :deep(.n-code pre) {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.preview-empty {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 表单项样式优化 */
:deep(.n-form-item) {
  margin-bottom: 12px;
}

:deep(.n-form-item-label) {
  font-size: 12px;
  color: var(--text-color-2);
  font-weight: 500;
}

/* 滚动条样式 */
.form-content::-webkit-scrollbar,
.data-preview-content::-webkit-scrollbar,
.processing-area::-webkit-scrollbar {
  width: 4px;
}

.form-content::-webkit-scrollbar-track,
.data-preview-content::-webkit-scrollbar-track,
.processing-area::-webkit-scrollbar-track {
  background: transparent;
}

.form-content::-webkit-scrollbar-thumb,
.data-preview-content::-webkit-scrollbar-thumb,
.processing-area::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 2px;
}

.form-content::-webkit-scrollbar-thumb:hover,
.data-preview-content::-webkit-scrollbar-thumb:hover,
.processing-area::-webkit-scrollbar-thumb:hover {
  background: var(--text-color-3);
}

/* 🔥 三段式布局增强样式 */
/* 子处理区域样式 */
.sub-processing-section {
  margin-bottom: 16px;
}

.sub-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-color-2);
  margin-bottom: 8px;
  padding: 4px 0;
  border-bottom: 1px solid var(--divider-color);
}

/* 抽屉模式下隐藏左侧的数据预览，移动到右侧 */
.drawer-mode .left-panel .data-preview-section {
  display: none;
}

/* 🔥 右侧三段式布局样式 */
.drawer-mode .right-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
}

.right-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
  min-height: 0;
}

/* 三个区域的高度分配 */
.raw-data-section {
  flex: 1.2;
  min-height: 180px;
}

.processing-config-section {
  flex: 1.8;
  min-height: 280px;
}

.processing-result-section {
  flex: 1;
  min-height: 160px;
}

.section-content {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-icon {
  font-size: 14px;
  margin-right: 6px;
}

/* 处理配置项样式 */
.processing-item {
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
}

.processing-item:last-child {
  margin-bottom: 0;
}

.processing-item-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-color-2);
  margin-bottom: 8px;
}

.mt-2 {
  margin-top: 8px;
}

/* 数据预览内容区域优化 */
.drawer-mode .data-preview-content {
  height: 180px;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 8px;
  background: var(--code-color);
}
</style>
