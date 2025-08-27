<template>
  <div class="http-config-form">
    <!-- 基础配置：URL、方法和超时时间 -->
    <n-card title="基础配置" size="small" :bordered="true" class="compact-card">
      <div class="form-row">
        <div class="url-item">
          <n-input v-model:value="formData.url" placeholder="请输入请求地址" clearable @input="handleChange" />
        </div>
        <div class="method-item">
          <n-select v-model:value="formData.method" :options="methodOptions" @update:value="handleChange" />
        </div>
        <div class="timeout-item">
          <n-input-number
            v-model:value="formData.timeout"
            placeholder="超时时间(ms)"
            :min="1000"
            :max="300000"
            size="small"
            @update:value="handleChange"
          >
            <template #suffix>ms</template>
          </n-input-number>
        </div>

        <!-- 动态参数预览 Tooltip -->
        <n-tooltip
          v-if="dynamicParamSummary.length > 0"
          trigger="hover"
          placement="left"
          :show-arrow="true"
          class="dynamic-param-tooltip"
        >
          <template #trigger>
            <div class="tooltip-trigger">
              <n-icon><InformationCircleOutline /></n-icon>
              <span>动态参数预览</span>
            </div>
          </template>
          <div class="tooltip-content">
            <div class="tooltip-title">动态参数列表</div>
            <div class="tooltip-list">
              <div v-for="(param, index) in dynamicParamSummary" :key="`tooltip-${index}`" class="tooltip-item">
                <n-tag :bordered="false" type="info" size="small">
                  {{ param.name }}
                </n-tag>
                <span class="tooltip-description">{{ param.location }}</span>
                <n-tag :bordered="false" type="success" size="small">
                  {{ param.exampleValue }}
                </n-tag>
              </div>
            </div>
          </div>
        </n-tooltip>

        <!-- 测试连接按钮 -->
        <n-button type="primary" :loading="testLoading" :disabled="!isUrlValid" size="small" @click="testConnection">
          测试连接
        </n-button>
      </div>

      <!-- URL验证状态 -->
      <div v-if="urlValidation.message" class="url-validation">
        <n-alert :type="urlValidation.type" :title="urlValidation.message" size="small" :closable="false" />
      </div>
    </n-card>

    <!-- 标签页配置 -->
    <n-tabs v-model:value="activeTab" type="card" class="config-tabs">
      <!-- 请求头配置 -->
      <n-tab-pane name="headers" tab="请求头">
        <div class="tab-content">
          <n-card title="请求头配置" size="small" :bordered="true" class="compact-card">
            <div class="key-value-section">
              <div v-if="headerList.length === 0" class="empty-hint">暂无请求头</div>
              <div v-for="(header, index) in headerList" :key="`header-${index}`" class="compact-param-row">
                <n-input v-model:value="header.key" placeholder="请求头名称" class="param-key" @input="handleChange" />
                <n-input
                  v-if="!header.isDynamic"
                  v-model:value="header.value"
                  placeholder="请求头值"
                  class="param-value"
                  @input="handleChange"
                />
                <div v-else class="dynamic-inputs">
                  <n-input
                    v-model:value="header.dynamicName"
                    placeholder="动态参数名"
                    class="dynamic-name"
                    @input="handleChange"
                  />
                  <n-input
                    v-model:value="header.exampleValue"
                    placeholder="示例值"
                    class="example-value"
                    @input="handleChange"
                  />
                </div>
                <n-tooltip trigger="hover" placement="top">
                  <template #trigger>
                    <n-checkbox
                      v-model:checked="header.isDynamic"
                      class="dynamic-checkbox"
                      @update:checked="handleHeaderDynamicChange(index, $event)"
                    />
                  </template>
                  动态参数
                </n-tooltip>
                <n-button text type="error" size="small" @click="removeHeader(index)">
                  <n-icon size="14"><TrashOutline /></n-icon>
                </n-button>
              </div>
              <n-button type="primary" size="small" class="add-button" @click="addHeader">
                <n-icon><AddOutline /></n-icon>
                添加请求头
              </n-button>
            </div>
          </n-card>
        </div>
      </n-tab-pane>

      <!-- 请求参数配置 -->
      <n-tab-pane name="params" tab="请求参数">
        <div class="tab-content">
          <n-card title="查询参数" size="small" :bordered="true" class="compact-card">
            <div class="key-value-section">
              <div v-if="paramList.length === 0" class="empty-hint">暂无查询参数</div>
              <div v-for="(param, index) in paramList" :key="`param-${index}`" class="compact-param-row">
                <n-input v-model:value="param.key" placeholder="参数名" class="param-key" @input="handleChange" />
                <n-input
                  v-if="!param.isDynamic"
                  v-model:value="param.value"
                  placeholder="参数值"
                  class="param-value"
                  @input="handleChange"
                />
                <div v-else class="dynamic-inputs">
                  <n-input
                    v-model:value="param.dynamicName"
                    placeholder="动态参数名"
                    class="dynamic-name"
                    @input="handleChange"
                  />
                  <n-input
                    v-model:value="param.exampleValue"
                    placeholder="示例值"
                    class="example-value"
                    @input="handleChange"
                  />
                </div>
                <n-tooltip trigger="hover" placement="top">
                  <template #trigger>
                    <n-checkbox
                      v-model:checked="param.isDynamic"
                      class="dynamic-checkbox"
                      @update:checked="handleParamDynamicChange(index, $event)"
                    />
                  </template>
                  动态参数
                </n-tooltip>
                <n-button text type="error" size="small" @click="removeParam(index)">
                  <n-icon size="14"><TrashOutline /></n-icon>
                </n-button>
              </div>
              <n-button type="primary" size="small" class="add-button" @click="addParam">
                <n-icon><AddOutline /></n-icon>
                添加查询参数
              </n-button>
            </div>
          </n-card>

          <!-- 请求体配置 -->
          <n-card v-if="supportsRequestBody" title="请求体" size="small" :bordered="true" class="compact-card">
            <div class="body-section">
              <!-- 请求体类型选择 -->
              <n-form-item label="请求体类型" :show-require-mark="false">
                <n-radio-group v-model:value="formData.bodyType" @update:value="handleBodyTypeChange">
                  <n-space>
                    <n-radio value="json">JSON</n-radio>
                    <n-radio value="form">表单数据</n-radio>
                    <n-radio value="raw">原始数据</n-radio>
                    <n-radio value="none">无</n-radio>
                  </n-space>
                </n-radio-group>
              </n-form-item>

              <!-- JSON请求体 -->
              <div v-if="formData.bodyType === 'json'" class="body-content">
                <n-input
                  v-model:value="formData.body"
                  type="textarea"
                  placeholder='请输入JSON格式的请求体，如: {"key": "value"}'
                  :rows="6"
                  show-count
                  @input="handleChange"
                />
              </div>

              <!-- 表单数据请求体 -->
              <div v-if="formData.bodyType === 'form'" class="body-content">
                <div class="form-data-section">
                  <div v-if="formDataList.length === 0" class="empty-hint">暂无表单数据</div>
                  <div v-for="(item, index) in formDataList" :key="`formdata-${index}`" class="compact-param-row">
                    <n-input v-model:value="item.key" placeholder="字段名" class="param-key" @input="handleChange" />
                    <n-input
                      v-model:value="item.value"
                      placeholder="字段值"
                      class="param-value"
                      @input="handleChange"
                    />
                    <div class="param-type">
                      <n-select
                        v-model:value="item.type"
                        :options="formDataTypeOptions"
                        size="small"
                        @update:value="handleChange"
                      />
                    </div>
                    <n-button text type="error" size="small" @click="removeFormData(index)">
                      <n-icon size="14"><TrashOutline /></n-icon>
                    </n-button>
                  </div>
                  <n-button type="primary" size="small" class="add-button" @click="addFormData">
                    <n-icon><AddOutline /></n-icon>
                    添加表单字段
                  </n-button>
                </div>
              </div>

              <!-- 原始数据请求体 -->
              <div v-if="formData.bodyType === 'raw'" class="body-content">
                <n-input
                  v-model:value="formData.body"
                  type="textarea"
                  placeholder="请输入原始数据"
                  :rows="6"
                  show-count
                  @input="handleChange"
                />
              </div>
            </div>
          </n-card>
        </div>
      </n-tab-pane>

      <!-- 脚本配置 -->
      <n-tab-pane name="scripts" tab="脚本">
        <div class="tab-content">
          <!-- 前置脚本 -->
          <n-card title="前置脚本" size="small" :bordered="true" class="compact-card">
            <div class="script-editor-container">
              <div class="editor-toolbar">
                <n-button size="small" @click="insertPreScriptTemplate">插入模板</n-button>
                <n-button size="small" @click="clearPreScript">清空</n-button>
              </div>
              <n-input
                v-model:value="formData.preRequestScript"
                type="textarea"
                placeholder="请输入前置脚本，可以修改请求配置"
                :rows="8"
                class="script-textarea"
                @input="handleChange"
              />
            </div>
          </n-card>

          <!-- 响应脚本 -->
          <n-card title="响应脚本" size="small" :bordered="true" class="compact-card">
            <div class="script-editor-container">
              <div class="editor-toolbar">
                <n-button size="small" @click="insertResponseScriptTemplate">插入模板</n-button>
                <n-button size="small" @click="clearResponseScript">清空</n-button>
              </div>
              <n-input
                v-model:value="formData.responseScript"
                type="textarea"
                placeholder="请输入响应处理脚本，可以处理响应数据"
                :rows="8"
                class="script-textarea"
                @input="handleChange"
              />
            </div>
          </n-card>
        </div>
      </n-tab-pane>

      <!-- 高级配置 -->
      <n-tab-pane name="advanced" tab="高级">
        <div class="tab-content">
          <n-card title="高级配置" size="small" :bordered="true" class="compact-card">
            <n-space vertical :size="16">
              <!-- 重试配置 -->
              <n-form-item label="重试配置" :show-require-mark="false">
                <n-space>
                  <n-input-number
                    v-model:value="formData.retryCount"
                    :min="0"
                    :max="10"
                    placeholder="重试次数"
                    size="small"
                    @update:value="handleChange"
                  >
                    <template #suffix>次</template>
                  </n-input-number>
                  <n-input-number
                    v-model:value="formData.retryInterval"
                    :min="100"
                    :max="30000"
                    :step="100"
                    placeholder="重试间隔"
                    size="small"
                    @update:value="handleChange"
                  >
                    <template #suffix>ms</template>
                  </n-input-number>
                </n-space>
              </n-form-item>

              <!-- 其他选项 -->
              <n-form-item label="其他选项" :show-require-mark="false">
                <n-space>
                  <n-checkbox v-model:checked="formData.followRedirects" @update:checked="handleChange">
                    跟随重定向
                  </n-checkbox>
                  <n-checkbox v-model:checked="formData.validateSSL" @update:checked="handleChange">
                    验证SSL证书
                  </n-checkbox>
                  <n-checkbox v-model:checked="formData.enableCookies" @update:checked="handleChange">
                    启用Cookies
                  </n-checkbox>
                </n-space>
              </n-form-item>
            </n-space>
          </n-card>
        </div>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
/**
 * HTTP配置表单组件
 * 用于配置HTTP数据源的完整参数，包括动态参数支持
 */

import { ref, computed, watch, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { InformationCircleOutline, TrashOutline, AddOutline } from '@vicons/ionicons5'
import type { FormInst, TagType } from 'naive-ui'

// 导入数据源系统的类型
import type {
  HttpConfiguration,
  HttpMethod,
  KeyValuePair,
  SystemApiItem,
  TestConnectionResponse,
  ValidationResult
} from '../types'
import type { DynamicParam } from '@/core/data-source-system/types/dynamic-params'

// 组件接口定义
interface Props {
  /** HTTP配置数据 */
  modelValue: HttpConfiguration
  /** 是否显示系统API选择 */
  showSystemApiSelector?: boolean
  /** 系统API列表 */
  systemApis?: SystemApiItem[]
  /** 是否只读模式 */
  readonly?: boolean
}

interface Emits {
  /** 配置数据更新 */
  'update:modelValue': [value: HttpConfiguration]
  /** 连接测试结果 */
  'test-result': [result: TestConnectionResponse]
  /** 验证状态变化 */
  'validation-change': [result: ValidationResult]
  /** 配置变化 */
  change: [config: HttpConfiguration]
}

// Props 和 Emits
const props = withDefaults(defineProps<Props>(), {
  showSystemApiSelector: true,
  systemApis: () => [],
  readonly: false
})

const emit = defineEmits<Emits>()

// 基础配置
const { t } = useI18n()

// 表单引用
const formRef = ref<FormInst>()

// 内部表单数据
const formData = ref({
  method: 'GET' as HttpMethod,
  url: '',
  timeout: 30000,
  bodyType: 'json' as 'json' | 'form' | 'text' | 'raw',
  body: {
    json: '',
    form: [] as KeyValuePair[],
    text: '',
    raw: ''
  },
  preRequestScript: '',
  responseScript: '',
  retryCount: 3,
  retryDelay: 1000,
  followRedirect: true,
  sslVerify: true
})

// UI状态
const activeTab = ref('headers')
const testLoading = ref(false)
const showApiModal = ref(false)
const apiSearchText = ref('')

// 测试响应数据
const testResponse = reactive<{
  status?: number
  statusText?: string
  headers?: Record<string, string>
  body?: any
  responseTime?: number
  headersDisplay: string
  bodyDisplay: string
}>({
  headersDisplay: '',
  bodyDisplay: ''
})

// Headers和Params列表（扩展结构支持动态参数）
const headerList = ref<
  Array<{
    key: string
    value: string
    enabled: boolean
    isDynamic?: boolean
    dynamicName?: string
    exampleValue?: string
  }>
>([])

const paramList = ref<
  Array<{
    key: string
    value: string
    enabled: boolean
    isDynamic?: boolean
    dynamicName?: string
    exampleValue?: string
  }>
>([])

// URL验证状态
const urlValidation = ref<{
  type: TagType
  message: string
}>({
  type: 'default',
  message: ''
})

// HTTP方法选项
const methodOptions = computed(() => [
  { label: 'GET', value: 'GET' as HttpMethod },
  { label: 'POST', value: 'POST' as HttpMethod },
  { label: 'PUT', value: 'PUT' as HttpMethod },
  { label: 'DELETE', value: 'DELETE' as HttpMethod },
  { label: 'PATCH', value: 'PATCH' as HttpMethod },
  { label: 'HEAD', value: 'HEAD' as HttpMethod },
  { label: 'OPTIONS', value: 'OPTIONS' as HttpMethod }
])

// 过滤后的系统API列表
const filteredSystemApis = computed(() => {
  if (!apiSearchText.value) return props.systemApis

  const searchLower = apiSearchText.value.toLowerCase()
  return props.systemApis.filter(
    api =>
      api.name.toLowerCase().includes(searchLower) ||
      api.url.toLowerCase().includes(searchLower) ||
      (api.description && api.description.toLowerCase().includes(searchLower))
  )
})

// 是否允许请求体
const isBodyAllowed = computed(() => ['POST', 'PUT', 'PATCH'].includes(formData.value.method))

// 是否有测试响应
const hasTestResponse = computed(() => testResponse.status !== undefined)

// URL有效性检查
const isUrlValid = computed(() => {
  if (!formData.value.url) return false
  try {
    new URL(formData.value.url)
    return true
  } catch {
    return false
  }
})

// 动态参数汇总（从请求头和查询参数中提取）
const dynamicParamSummary = computed(() => {
  const dynamicParams: Array<{ name: string; location: string; exampleValue: string }> = []

  // 从请求头中收集动态参数
  headerList.value.forEach(header => {
    if (header.isDynamic && header.dynamicName && header.enabled) {
      dynamicParams.push({
        name: header.dynamicName,
        location: `请求头 ${header.key}`,
        exampleValue: header.exampleValue || ''
      })
    }
  })

  // 从查询参数中收集动态参数
  paramList.value.forEach(param => {
    if (param.isDynamic && param.dynamicName && param.enabled) {
      dynamicParams.push({
        name: param.dynamicName,
        location: `查询参数 ${param.key}`,
        exampleValue: param.exampleValue || ''
      })
    }
  })

  return dynamicParams
})

/**
 * 验证URL格式
 */
const validateUrl = async () => {
  if (!formData.value.url) {
    urlValidation.value.type = 'default'
    urlValidation.value.message = ''
    return
  }

  try {
    const url = new URL(formData.value.url)
    urlValidation.value.type = 'success'
    urlValidation.value.message = `URL有效 (${url.protocol})`
  } catch (error) {
    urlValidation.value.type = 'error'
    urlValidation.value.message = 'URL格式无效'
  }

  // 触发验证状态变化事件
  const validation: ValidationResult = {
    type: urlValidation.value.type,
    text: urlValidation.value.type === 'success' ? '有效' : '无效',
    detail: urlValidation.value.message
  }
  emit('validation-change', validation)
}

/**
 * 处理配置变化
 */
const handleChange = () => {
  const configData = toHttpConfiguration()
  emit('update:modelValue', configData)
  emit('change', configData)
}

/**
 * 转换为HttpConfiguration格式
 */
const toHttpConfiguration = (): HttpConfiguration => {
  // 处理请求头
  const headers = headerList.value.map(header => ({
    key: header.key,
    value: header.isDynamic ? `\${${header.dynamicName}}` : header.value,
    enabled: header.enabled
  }))

  // 处理查询参数
  const params = paramList.value.map(param => ({
    key: param.key,
    value: param.isDynamic ? `\${${param.dynamicName}}` : param.value,
    enabled: param.enabled
  }))

  return {
    method: formData.value.method,
    url: formData.value.url,
    headers,
    params,
    body: formData.value.body,
    bodyType: formData.value.bodyType,
    timeout: formData.value.timeout,
    retryCount: formData.value.retryCount,
    retryDelay: formData.value.retryDelay,
    followRedirect: formData.value.followRedirect,
    sslVerify: formData.value.sslVerify,
    preRequestScript: formData.value.preRequestScript,
    responseScript: formData.value.responseScript
  }
}

/**
 * 从 HttpConfiguration 格式加载
 */
const loadFromHttpConfiguration = (config: HttpConfiguration) => {
  if (!config) return

  // 基础配置
  formData.value.method = config.method || 'GET'
  formData.value.url = config.url || ''
  formData.value.timeout = config.timeout || 30000
  formData.value.bodyType = config.bodyType || 'json'
  formData.value.retryCount = config.retryCount || 3
  formData.value.retryDelay = config.retryDelay || 1000
  formData.value.followRedirect = config.followRedirect ?? true
  formData.value.sslVerify = config.sslVerify ?? true
  formData.value.preRequestScript = config.preRequestScript || ''
  formData.value.responseScript = config.responseScript || ''

  // 请求体
  if (config.body) {
    formData.value.body = { ...config.body }
  }

  // 处理请求头：检测动态参数
  headerList.value = (config.headers || []).map(header => {
    const isDynamic = /^\${(.+)}$/.test(header.value)
    const dynamicName = isDynamic ? header.value.match(/^\${(.+)}$/)?.[1] || '' : ''

    return {
      key: header.key,
      value: isDynamic ? '' : header.value,
      enabled: header.enabled ?? true,
      isDynamic,
      dynamicName,
      exampleValue: '' // 这里可以根据需要设置示例值
    }
  })

  // 处理查询参数：检测动态参数
  paramList.value = (config.params || []).map(param => {
    const isDynamic = /^\${(.+)}$/.test(param.value)
    const dynamicName = isDynamic ? param.value.match(/^\${(.+)}$/)?.[1] || '' : ''

    return {
      key: param.key,
      value: isDynamic ? '' : param.value,
      enabled: param.enabled ?? true,
      isDynamic,
      dynamicName,
      exampleValue: '' // 这里可以根据需要设置示例值
    }
  })
}

/**
 * 验证组件
 */
const validate = async (): Promise<boolean> => {
  if (!formData.value.url) return false
  if (!isUrlValid.value) return false
  return true
}

/**
 * 重置组件
 */
const reset = () => {
  formData.value = {
    method: 'GET',
    url: '',
    timeout: 30000,
    bodyType: 'json',
    body: {
      json: '',
      form: [],
      text: '',
      raw: ''
    },
    preRequestScript: '',
    responseScript: '',
    retryCount: 3,
    retryDelay: 1000,
    followRedirect: true,
    sslVerify: true
  }

  headerList.value = []
  paramList.value = []

  // 重置测试响应
  Object.assign(testResponse, {
    status: undefined,
    statusText: undefined,
    headers: undefined,
    body: undefined,
    responseTime: undefined,
    headersDisplay: '',
    bodyDisplay: ''
  })

  urlValidation.value.type = 'default'
  urlValidation.value.message = ''
  activeTab.value = 'headers'

  handleChange()
}

/**
 * 获取当前配置
 */
const getConfig = (): HttpConfiguration => {
  return toHttpConfiguration()
}

/**
 * 测试HTTP连接
 */
const testConnection = async () => {
  if (!isUrlValid.value) {
    window.$message?.warning('URL格式无效，无法测试连接')
    return
  }

  testLoading.value = true
  const startTime = Date.now()

  try {
    // 构建请求配置
    const requestConfig = buildRequestConfig()

    // 模拟HTTP请求（实际项目中这里应该调用真实的HTTP客户端）
    const response = await simulateHttpRequest(requestConfig)

    const responseTime = Date.now() - startTime

    // 更新测试响应数据
    testResponse.status = response.status
    testResponse.statusText = response.statusText
    testResponse.headers = response.headers
    testResponse.body = response.data
    testResponse.responseTime = responseTime

    // 格式化显示数据
    testResponse.headersDisplay = JSON.stringify(response.headers, null, 2)
    testResponse.bodyDisplay = JSON.stringify(response.data, null, 2)

    // 切换到预览标签页
    activeTab.value = 'preview'

    // 发送测试结果事件
    const testResult: TestConnectionResponse = {
      success: response.status >= 200 && response.status < 300,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      responseTime,
      error: undefined
    }
    emit('test-result', testResult)

    window.$message?.success(`连接测试成功 (${responseTime}ms)`)
  } catch (error: any) {
    const responseTime = Date.now() - startTime

    const testResult: TestConnectionResponse = {
      success: false,
      status: 0,
      statusText: 'Error',
      headers: {},
      data: null,
      responseTime,
      error: error.message || '连接测试失败'
    }
    emit('test-result', testResult)

    window.$message?.error(`连接测试失败: ${error.message}`)
  } finally {
    testLoading.value = false
  }
}

/**
 * 构建请求配置对象
 */
const buildRequestConfig = () => {
  // 构建有效的请求头
  const headers: Record<string, string> = {}
  headerList.value
    .filter(header => header.enabled && header.key && (header.value || header.exampleValue))
    .forEach(header => {
      headers[header.key] = header.isDynamic ? header.exampleValue || '' : header.value
    })

  // 构建URL参数
  const params: Record<string, string> = {}
  paramList.value
    .filter(param => param.enabled && param.key && (param.value || param.exampleValue))
    .forEach(param => {
      params[param.key] = param.isDynamic ? param.exampleValue || '' : param.value
    })

  // 构建请求体
  let body: any = undefined
  if (isBodyAllowed.value && formData.value.bodyType) {
    switch (formData.value.bodyType) {
      case 'json':
        if (formData.value.body.json) {
          try {
            body = JSON.parse(formData.value.body.json)
            headers['Content-Type'] = 'application/json'
          } catch {
            body = formData.value.body.json
          }
        }
        break
      case 'form':
        const formDataObj = new FormData()
        formData.value.body.form
          .filter(item => item.enabled && item.key)
          .forEach(item => formDataObj.append(item.key, item.value))
        body = formDataObj
        break
      case 'text':
        body = formData.value.body.text
        headers['Content-Type'] = 'text/plain'
        break
      case 'raw':
        body = formData.value.body.raw
        break
    }
  }

  return {
    method: formData.value.method,
    url: formData.value.url,
    headers,
    params,
    body,
    timeout: formData.value.timeout,
    retryCount: formData.value.retryCount,
    retryDelay: formData.value.retryDelay,
    followRedirect: formData.value.followRedirect,
    sslVerify: formData.value.sslVerify
  }
}

/**
 * 模拟HTTP请求
 */
const simulateHttpRequest = async (config: any): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))

  return {
    status: 200,
    statusText: 'OK',
    headers: {
      'content-type': 'application/json',
      server: 'nginx/1.18.0',
      date: new Date().toISOString(),
      'x-response-time': `${Math.floor(Math.random() * 100) + 50}ms`
    },
    data: {
      success: true,
      message: 'API调用成功',
      timestamp: new Date().toISOString(),
      requestConfig: {
        method: config.method,
        url: config.url,
        hasHeaders: Object.keys(config.headers).length > 0,
        hasParams: Object.keys(config.params).length > 0,
        hasBody: !!config.body
      }
    }
  }
}

/**
 * 获取响应状态标签类型
 */
const getResponseStatusType = (status: number): TagType => {
  if (status >= 200 && status < 300) return 'success'
  if (status >= 300 && status < 400) return 'info'
  if (status >= 400 && status < 500) return 'warning'
  return 'error'
}

/**
 * 获取HTTP方法标签类型
 */
const getMethodTagType = (method: HttpMethod): TagType => {
  switch (method) {
    case 'GET':
      return 'info'
    case 'POST':
      return 'success'
    case 'PUT':
      return 'warning'
    case 'DELETE':
      return 'error'
    case 'PATCH':
      return 'warning'
    default:
      return 'default'
  }
}

/**
 * Header操作方法
 */
const addHeader = () => {
  headerList.value.push({
    key: '',
    value: '',
    enabled: true,
    isDynamic: false,
    dynamicName: '',
    exampleValue: ''
  })
  handleChange()
}

const removeHeader = (index: number) => {
  headerList.value.splice(index, 1)
  handleChange()
}

const handleHeaderDynamicChange = (index: number, isDynamic: boolean) => {
  const header = headerList.value[index]
  header.isDynamic = isDynamic

  if (isDynamic) {
    header.dynamicName = header.key || 'headerParam'
    header.exampleValue = header.value || ''
  } else {
    header.dynamicName = ''
    header.exampleValue = ''
  }

  handleChange()
}

/**
 * Param操作方法
 */
const addParam = () => {
  paramList.value.push({
    key: '',
    value: '',
    enabled: true,
    isDynamic: false,
    dynamicName: '',
    exampleValue: ''
  })
  handleChange()
}

const removeParam = (index: number) => {
  paramList.value.splice(index, 1)
  handleChange()
}

const handleParamDynamicChange = (index: number, isDynamic: boolean) => {
  const param = paramList.value[index]
  param.isDynamic = isDynamic

  if (isDynamic) {
    param.dynamicName = param.key || 'queryParam'
    param.exampleValue = param.value || ''
  } else {
    param.dynamicName = ''
    param.exampleValue = ''
  }

  handleChange()
}

// FormData操作
const addFormData = () => {
  formDataList.value.push({
    key: '',
    value: '',
    type: 'text'
  })
  handleChange()
}

const removeFormData = (index: number) => {
  formDataList.value.splice(index, 1)
  handleChange()
}

/**
 * 处理请求体类型变化
 */
const handleBodyTypeChange = (bodyType: HttpBodyType) => {
  formData.value.bodyType = bodyType

  // 清空不相关的请求体数据
  if (bodyType !== 'json' && bodyType !== 'raw') {
    formData.value.body = ''
  }
  if (bodyType !== 'form') {
    formDataList.value = []
  }

  handleChange()
}

// 脚本模板
const preScriptTemplate = `// config对象包含: url, method, headers, params, body, timeout
// 您可以在此处修改config对象
// 必须 return config;
return config;`

const responseScriptTemplate = `// response对象包含: json, text, status, headers
// 您可以在此处处理响应数据  
// 必须 return 处理后的数据;
return response.json;`

const insertPreScriptTemplate = () => {
  formData.value.preRequestScript = preScriptTemplate
  handleChange()
}

const clearPreScript = () => {
  formData.value.preRequestScript = ''
  handleChange()
}

const insertResponseScriptTemplate = () => {
  formData.value.responseScript = responseScriptTemplate
  handleChange()
}

const clearResponseScript = () => {
  formData.value.responseScript = ''
  handleChange()
}

// 监听外部数据变化
watch(
  () => props.modelValue,
  newValue => {
    if (newValue) {
      loadFromHttpConfiguration(newValue)
    }
  },
  { deep: true, immediate: true }
)

// 导出方法供父组件调用
defineExpose({
  loadConfig: loadFromHttpConfiguration,
  reset,
  getConfig,
  validate
})
</script>

<style scoped>
/**
 * HTTP配置表单组件样式
 */

.http-config-form {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 16px;
}

/* 紧凑卡片样式 */
.compact-card {
  border-radius: 6px;
  box-shadow: none;
}

.compact-card :deep(.n-card-header) {
  padding: 8px 16px;
  min-height: 36px;
}

.compact-card :deep(.n-card-body) {
  padding: 16px;
}

/* 表单行布局 */
.form-row {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.url-item {
  flex: 1;
  min-width: 300px;
}

.method-item {
  width: 120px;
  flex-shrink: 0;
}

.timeout-item {
  width: 140px;
  flex-shrink: 0;
}

/* URL验证状态 */
.url-validation {
  margin-top: 12px;
}

/* 标签页样式 */
.config-tabs {
  flex: 1;
  overflow: hidden;
}

.config-tabs :deep(.n-tabs-content) {
  height: calc(100% - 42px);
  overflow: hidden;
}

.config-tabs :deep(.n-tab-pane) {
  height: 100%;
  overflow: auto;
  padding: 0;
}

.tab-content {
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 键值对编辑器样式 */
.key-value-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.compact-param-row {
  display: grid;
  grid-template-columns: 1fr 1.5fr auto auto;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--card-color);
}

.param-key {
  min-width: 140px;
}

.param-value {
  min-width: 160px;
}

.dynamic-inputs {
  display: flex;
  gap: 8px;
  min-width: 260px;
}

.dynamic-name,
.example-value {
  flex: 1;
  min-width: 120px;
}

.dynamic-checkbox {
  justify-self: center;
}

.empty-hint {
  text-align: center;
  padding: 24px;
  color: var(--text-color-3);
  font-size: 14px;
}

.add-button {
  width: 100%;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

/* 请求体相关样式 */
.body-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.body-content {
  margin-top: 12px;
}

.form-data-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.param-type {
  width: 100px;
}

/* 脚本编辑器样式 */
.script-editor-container {
  width: 100%;
}

.editor-toolbar {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 12px;
}

.script-textarea {
  font-family: 'Courier New', Courier, monospace;
  line-height: 1.5;
  font-size: 13px;
}

/* 动态参数预览Tooltip样式 */
.dynamic-param-tooltip {
  position: relative;
}

.tooltip-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--primary-color);
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  white-space: nowrap;
}

.tooltip-trigger:hover {
  background: var(--primary-color-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.tooltip-content {
  max-width: 320px;
  padding: 16px;
}

.tooltip-title {
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--text-color);
  font-size: 14px;
}

.tooltip-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tooltip-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid var(--divider-color);
}

.tooltip-item:last-child {
  border-bottom: none;
}

.tooltip-description {
  flex: 1;
  font-size: 12px;
  color: var(--text-color-2);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    align-items: stretch;
  }

  .url-item,
  .method-item,
  .timeout-item {
    width: 100%;
    min-width: unset;
  }

  .compact-param-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .dynamic-inputs {
    min-width: unset;
    flex-direction: column;
  }
}

/* 暗主题适配 */
[data-theme='dark'] .compact-param-row {
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.1);
}

[data-theme='dark'] .tooltip-trigger {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}
</style>
