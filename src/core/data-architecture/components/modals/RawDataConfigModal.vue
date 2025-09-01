<!--
  原始数据配置弹窗
  用于配置原始数据项
-->
<script setup lang="ts">
/**
 * RawDataConfigModal - 原始数据配置弹窗
 * 实现JSON/HTTP/脚本数据录入和预览
 */

import { ref, reactive, computed, watch, nextTick } from 'vue'
import { useMessage } from 'naive-ui'
import { DataItemFetcher, type DataItem } from '../../executors'
import HttpConfigForm from './HttpConfigForm.vue'
// 🔥 简洁脚本编辑器
import SimpleScriptEditor from '@/core/script-engine/components/SimpleScriptEditor.vue'
// 🔥 导入HTTP配置模板
import { HTTP_CONFIG_TEMPLATES } from '../../templates/http-templates'

// Props接口
interface Props {
  /** 弹窗显示状态 */
  show: boolean
  /** 数据源Key */
  dataSourceKey?: string
  /** 🔥 新增：编辑数据 */
  editData?: any
  /** 🔥 新增：是否为编辑模式 */
  isEditMode?: boolean
}

// Emits接口
interface Emits {
  (e: 'update:show', value: boolean): void
  (e: 'confirm', data: DataItem): void
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
  selectedMethod: 'json' as 'json' | 'http' | 'script' | 'websocket',
  jsonData: JSON.stringify(
    {
      temperature: 25.6,
      humidity: 68.3,
      pressure: 1013.25,
      timestamp: new Date().toISOString(),
      location: {
        building: 'A座',
        floor: 3,
        room: '301'
      },
      sensors: [
        { id: 'temp_001', value: 25.6, status: 'online' },
        { id: 'humi_001', value: 68.3, status: 'online' },
        { id: 'press_001', value: 1013.25, status: 'offline' }
      ]
    },
    null,
    2
  ),
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
 * HTTP配置更新处理
 */
const onHttpConfigUpdate = (newConfig: typeof httpConfig.value) => {
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
 * 🔥 应用遥测数据模板配置
 */
const applyTelemetryTemplate = () => {
  // 从 http-config.ts 获取遥测模板配置
  const telemetryTemplate = HTTP_CONFIG_TEMPLATES.find(template => template.name === '设备遥测数据')

  if (telemetryTemplate) {
    console.log('📊 应用遥测数据模板:', telemetryTemplate.config)
    console.log('📊 模板中的params:', telemetryTemplate.config.params)
    console.log('📊 应用前httpConfig.value:', JSON.stringify(httpConfig.value, null, 2))

    // 直接应用模板配置到 httpConfig
    httpConfig.value = {
      ...httpConfig.value,
      ...telemetryTemplate.config,
      // 确保数组字段被正确复制
      headers: [...(telemetryTemplate.config.headers || [])],
      params: [...(telemetryTemplate.config.params || [])],
      // 🔥 新增：确保 pathParameter 字段被正确复制
      pathParameter: telemetryTemplate.config.pathParameter ? { ...telemetryTemplate.config.pathParameter } : undefined
    }

    console.log('📊 应用后httpConfig.value:', JSON.stringify(httpConfig.value, null, 2))
    console.log('📊 应用后params数量:', httpConfig.value.params?.length || 0)
    console.log('📊 应用后preRequestScript存在吗?:', !!httpConfig.value.preRequestScript)

    // 触发 onHttpConfigUpdate 确保所有状态同步
    onHttpConfigUpdate(httpConfig.value)
    console.log('📊 onHttpConfigUpdate调用完成')

    // 🔍 验证调用后httpConfig是否仍然完整
    setTimeout(() => {
      console.log('📊 [验证] 500ms后httpConfig.value params数量:', httpConfig.value.params?.length || 0)
      console.log('📊 [验证] 500ms后preRequestScript存在吗?:', !!httpConfig.value.preRequestScript)
    }, 500)

    message.success('遥测数据模板已应用')
  } else {
    console.error(
      '❌ 未找到遥测数据模板，可用模板:',
      HTTP_CONFIG_TEMPLATES.map(t => t.name)
    )
    message.error('未找到遥测数据模板')
  }
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
 * 处理弹窗关闭
 */
const handleClose = () => {
  emit('update:show', false)
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
    console.error('数据预览失败:', error)
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
      // 🔥 关键修复：保存新的 httpConfig 完整状态
      httpConfigData: formState.selectedMethod === 'http' ? httpConfig.value : undefined,
      // 处理配置
      processingConfig: {
        jsonPath: processingState.jsonPath.trim() || undefined,
        defaultValue: processingState.defaultValue.trim() || undefined,
        scriptCode: processingState.scriptCode.trim() || undefined
      }
    }

    console.log('💾 保存配置类型:', fullConfig.type)
    console.log('💾 httpConfigData存在吗?', !!fullConfig.httpConfigData)
    if (fullConfig.httpConfigData) {
      console.log('💾 httpConfigData.params长度:', fullConfig.httpConfigData.params?.length || 0)
      console.log('💾 httpConfigData.preRequestScript存在吗?', !!fullConfig.httpConfigData.preRequestScript)
    }

    emit('confirm', fullConfig)
    handleClose()
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
    console.warn('JSONPath执行失败:', error)
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
    console.error('数据处理失败:', error)
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
    console.error('处理预览失败:', error)
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
 * 监听录入方式变化，自动预览
 */
watch(
  () => formState.selectedMethod,
  () => {
    previewData.value = null
    processingPreviewData.value = null
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
      console.log('🔄 [RawDataConfigModal] HTTP配置已变更')
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
 */
const resetFormState = () => {
  console.log('🔄 [RawDataConfigModal] 重置表单状态')

  // 重置表单数据
  formState.selectedMethod = 'json'
  formState.jsonData = JSON.stringify(
    {
      temperature: 25.6,
      humidity: 68.3,
      pressure: 1013.25,
      timestamp: new Date().toISOString(),
      location: {
        building: 'A座',
        floor: 3,
        room: '301'
      },
      sensors: [
        { id: 'temp_001', value: 25.6, status: 'online' },
        { id: 'humi_001', value: 68.3, status: 'online' },
        { id: 'press_001', value: 1013.25, status: 'offline' }
      ]
    },
    null,
    2
  )
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
 * 🔥 修复：根据编辑数据加载状态
 * 接收来自父组件的编辑数据并填充表单
 */
const loadEditData = (editData: any) => {
  if (!editData) {
    console.log('🔄 [RawDataConfigModal] 无编辑数据，保持默认状态')
    return
  }

  console.log('📝 [RawDataConfigModal] 加载编辑数据 - type:', editData.type)
  console.log('📝 [RawDataConfigModal] editData keys:', Object.keys(editData))
  console.log('📝 [RawDataConfigModal] editData.httpConfigData存在吗?', !!editData.httpConfigData)
  if (editData.httpConfigData) {
    console.log('📝 [RawDataConfigModal] httpConfigData.params长度:', editData.httpConfigData.params?.length || 0)
    console.log(
      '📝 [RawDataConfigModal] httpConfigData.preRequestScript存在吗?',
      !!editData.httpConfigData.preRequestScript
    )
  }

  // 加载基本配置
  formState.selectedMethod = editData.type || 'json'

  // 根据类型加载对应数据
  switch (editData.type) {
    case 'json':
      if (editData.jsonData) {
        formState.jsonData = editData.jsonData
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

      // 🔥 关键修复：同时更新新的 httpConfig 状态
      if (editData.url) httpConfig.value.url = editData.url
      if (editData.method) httpConfig.value.method = editData.method
      if (editData.timeout) httpConfig.value.timeout = editData.timeout

      // 如果有已保存的复杂配置，完整加载它们
      if (editData.httpConfigData) {
        console.log('🔄 恢复完整httpConfig配置:', editData.httpConfigData)
        console.log('🔄 恢复的params:', editData.httpConfigData.params)
        httpConfig.value = {
          ...httpConfig.value,
          ...editData.httpConfigData,
          // 确保数组字段不为空
          headers: editData.httpConfigData.headers || [],
          params: editData.httpConfigData.params || [],
          // 🔥 关键修复：确保路径参数字段正确加载
          pathParameter: editData.httpConfigData.pathParameter
        }
        console.log('🔄 恢复后httpConfig.value:', JSON.stringify(httpConfig.value, null, 2))
      } else {
        console.log('⚠️ 没有找到httpConfigData，尝试从旧格式恢复')
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
        } catch (error) {
          console.warn('旧格式配置转换失败:', error)
        }
      }
      break
  }

  // 加载处理配置
  if (editData.processingConfig) {
    processingState.jsonPath = editData.processingConfig.jsonPath || ''
    processingState.defaultValue = editData.processingConfig.defaultValue || ''
    processingState.scriptCode = editData.processingConfig.scriptCode || ''
  }

  console.log('✅ [RawDataConfigModal] 编辑数据加载完成')
}

/**
 * 🔥 修复：监听弹窗显示状态，处理状态重置和数据加载
 */
watch(
  () => props.show,
  newShow => {
    if (newShow) {
      console.log('👁️ [RawDataConfigModal] 弹窗打开，编辑模式:', props.isEditMode)

      // 先重置状态
      resetFormState()

      // 如果是编辑模式且有编辑数据，则加载编辑数据
      if (props.isEditMode && props.editData) {
        nextTick(() => {
          loadEditData(props.editData)
        })
      }
    } else {
      console.log('👁️ [RawDataConfigModal] 弹窗关闭')
    }
  },
  { immediate: false }
)

/**
 * 暴露方法给父组件使用
 */
defineExpose({
  resetFormState,
  loadEditData
})
</script>

<template>
  <n-modal
    :show="props.show"
    :mask-closable="false"
    preset="card"
    title="原始数据配置"
    class="raw-data-config-modal"
    style="width: 70vw"
    @close="handleClose"
  >
    <!-- 左右分割布局 -->
    <div class="modal-content">
      <!-- 左侧区域 - 原始数据获取 -->
      <div class="left-panel">
        <!-- 上部分 - 录入表单 (2/3高度) -->
        <div class="input-form-section">
          <div class="form-content">
            <!-- Tag选择器录入方式 -->
            <div class="method-selector">
              <n-space>
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

                <!-- 预览按钮 -->
                <n-button type="primary" size="small" :loading="previewLoading" @click="executePreview">
                  预览数据
                </n-button>
              </n-space>

              <!-- JSON数据录入 -->
              <div v-if="formState.selectedMethod === 'json'" class="editor-container">
                <n-input
                  v-model:value="formState.jsonData"
                  type="textarea"
                  :rows="8"
                  placeholder="请输入JSON格式数据"
                  show-count
                  :input-props="{ style: 'font-family: Monaco, Consolas, monospace; font-size: 12px;' }"
                />
              </div>

              <!-- HTTP接口配置 -->
              <div v-if="formState.selectedMethod === 'http'" class="editor-container">
                <!-- 🔥 新增：遥测模板快速应用 -->
                <div class="template-actions mb-4">
                  <n-button type="primary" ghost size="small" @click="applyTelemetryTemplate">
                    📊 应用遥测数据模板
                  </n-button>
                  <n-text depth="3" style="margin-left: 8px; font-size: 12px">快速配置遥测数据接口参数</n-text>
                </div>

                <HttpConfigForm v-model:model-value="httpConfig" @update:model-value="onHttpConfigUpdate" />
              </div>

              <!-- 脚本录入 -->
              <div v-if="formState.selectedMethod === 'script'" class="editor-container">
                <SimpleScriptEditor
                  v-model:model-value="formState.scriptCode"
                  template-category="data-generation"
                  placeholder="请输入数据生成脚本，可通过 context 参数访问上下文..."
                  height="240px"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 下部分 - 获取数据预览 (1/3高度) -->
        <div class="data-preview-section">
          <div class="compact-header">
            <span>预览</span>
            <n-tag v-if="previewData" size="tiny" type="success">结果</n-tag>
          </div>
          <div class="data-preview-content">
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
              <n-empty description="点击预览按钮查看数据执行结果" size="small">
                <template #icon>
                  <span style="font-size: 24px">📊</span>
                </template>
              </n-empty>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧区域 - 原始数据处理 -->
      <div class="right-panel">
        <div class="processing-area">
          <!-- JSONPath过滤 -->
          <div class="processing-section">
            <div class="compact-header">
              <span>JSONPath</span>
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

            <div class="processing-content">
              <n-input
                v-model:value="processingState.jsonPath"
                placeholder="例如: $.temperature 或 $.sensors[0] (留空不过滤)"
                size="small"
              >
                <template #prefix>
                  <span class="input-prefix">路径:</span>
                </template>
              </n-input>

              <n-input
                v-model:value="processingState.defaultValue"
                placeholder="过滤失败时的默认值 (可选)"
                size="small"
                class="default-value-input"
              >
                <template #prefix>
                  <span class="input-prefix">默认:</span>
                </template>
              </n-input>
            </div>
          </div>

          <!-- 脚本处理 -->
          <div class="processing-section">
            <div class="compact-header">
              <span>脚本处理</span>
              <n-popover trigger="hover" placement="top">
                <template #trigger>
                  <span class="help-icon">❓</span>
                </template>
                <div>
                  <p>对数据进行自定义转换</p>
                  <p>
                    可用变量:
                    <code>data</code>
                    (输入数据)
                  </p>
                  <p>
                    必须:
                    <code>return</code>
                    返回处理后的数据
                  </p>
                  <p>留空表示不处理</p>
                </div>
              </n-popover>
            </div>

            <div class="processing-content">
              <SimpleScriptEditor
                v-model:model-value="processingState.scriptCode"
                template-category="data-processing"
                placeholder="请输入数据处理脚本，可通过 data 参数访问原始数据..."
                height="160px"
              />
            </div>
          </div>

          <!-- 处理预览 -->
          <div class="processing-section">
            <div class="compact-header">
              <span>处理预览</span>
              <span class="realtime-indicator">
                <span class="indicator-dot"></span>
                实时处理
              </span>
            </div>

            <div class="processing-preview">
              <!-- 处理结果 -->
              <div v-if="processingPreviewData" class="processing-result">
                <n-code
                  :code="JSON.stringify(processingPreviewData, null, 2)"
                  language="json"
                  :hljs="false"
                  word-wrap
                />
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
    </div>

    <template #footer>
      <n-space justify="end">
        <n-button @click="handleClose">取消</n-button>
        <n-button type="primary" :disabled="!previewData" @click="handleConfirm">确定</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<style scoped>
.raw-data-config-modal {
  max-width: 95vw;
  max-height: 90vh;
}

.modal-content {
  display: flex;
  gap: 12px;
  height: 600px;
  padding: 0;
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
</style>
