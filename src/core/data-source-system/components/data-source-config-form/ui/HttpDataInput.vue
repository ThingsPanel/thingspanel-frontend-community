<template>
  <div class="http-data-input">
    <!-- HTTP配置表单 -->
    <n-form ref="formRef" :model="httpConfig" :rules="formRules" :show-require-mark="false" size="small">
      <!-- HTTP方法和URL配置 -->
      <n-card :title="$t('dataSource.http.basicConfig')" size="small" :bordered="true" class="mb-4">
        <n-space vertical :size="16">
          <!-- HTTP方法选择 -->
          <n-form-item :label="$t('dataSource.http.method')" path="method" :show-require-mark="true">
            <n-select
              v-model:value="httpConfig.method"
              :options="httpMethodOptions"
              :placeholder="$t('dataSource.http.selectMethod')"
              class="w-32"
            />
          </n-form-item>

          <!-- URL配置 -->
          <n-form-item :label="$t('dataSource.http.url')" path="url" :show-require-mark="true">
            <n-input-group>
              <n-input
                v-model:value="httpConfig.url"
                :placeholder="$t('dataSource.http.urlPlaceholder')"
                clearable
                class="flex-1"
                @blur="validateUrl"
              />
              <n-button type="primary" :loading="testLoading" :disabled="!isUrlValid" @click="testConnection">
                {{ $t('dataSource.http.testConnection') }}
              </n-button>
            </n-input-group>
          </n-form-item>

          <!-- URL验证状态 -->
          <div v-if="urlValidation.message" class="url-validation">
            <n-alert :type="urlValidation.type" :title="urlValidation.message" size="small" :closable="false" />
          </div>
        </n-space>
      </n-card>

      <!-- 标签页内容 -->
      <n-tabs v-model:value="activeTab" type="line" animated size="small">
        <!-- 请求头配置 -->
        <n-tab-pane name="headers" :tab="$t('dataSource.http.headers')">
          <div class="tab-content">
            <KeyValueEditor
              v-model="httpConfig.headers"
              :label="$t('dataSource.http.headersDescription')"
              :placeholder-key="$t('dataSource.http.headerKeyPlaceholder')"
              :placeholder-value="$t('dataSource.http.headerValuePlaceholder')"
              :enable-toggle="true"
              :show-import-export="true"
              @change="handleHeadersChange"
            />
          </div>
        </n-tab-pane>

        <!-- URL参数配置 -->
        <n-tab-pane name="params" :tab="$t('dataSource.http.parameters')">
          <div class="tab-content">
            <KeyValueEditor
              v-model="httpConfig.params"
              :label="$t('dataSource.http.parametersDescription')"
              :placeholder-key="$t('dataSource.http.paramKeyPlaceholder')"
              :placeholder-value="$t('dataSource.http.paramValuePlaceholder')"
              :enable-toggle="true"
              :show-import-export="true"
              @change="handleParamsChange"
            />
          </div>
        </n-tab-pane>

        <!-- 请求体配置 -->
        <n-tab-pane name="body" :tab="$t('dataSource.http.requestBody')" :disabled="!isBodyAllowed">
          <div class="tab-content">
            <!-- 请求体类型选择 -->
            <n-form-item :label="$t('dataSource.http.bodyType')">
              <n-radio-group v-model:value="httpConfig.bodyType" @update:value="handleBodyTypeChange">
                <n-space>
                  <n-radio value="json">{{ $t('dataSource.http.bodyTypes.json') }}</n-radio>
                  <n-radio value="form">{{ $t('dataSource.http.bodyTypes.form') }}</n-radio>
                  <n-radio value="text">{{ $t('dataSource.http.bodyTypes.text') }}</n-radio>
                  <n-radio value="raw">{{ $t('dataSource.http.bodyTypes.raw') }}</n-radio>
                </n-space>
              </n-radio-group>
            </n-form-item>

            <!-- JSON请求体 -->
            <div v-if="httpConfig.bodyType === 'json'" class="body-content">
              <JsonDataInput
                v-model="httpConfig.body.json"
                :show-label="false"
                :placeholder="$t('dataSource.http.jsonBodyPlaceholder')"
                :rows="8"
                :auto-validate="true"
                @validation-change="handleJsonBodyValidation"
              />
            </div>

            <!-- 表单数据请求体 -->
            <div v-if="httpConfig.bodyType === 'form'" class="body-content">
              <KeyValueEditor
                v-model="httpConfig.body.form"
                :label="$t('dataSource.http.formBodyDescription')"
                :placeholder-key="$t('dataSource.http.formKeyPlaceholder')"
                :placeholder-value="$t('dataSource.http.formValuePlaceholder')"
                :enable-toggle="true"
                @change="handleFormBodyChange"
              />
            </div>

            <!-- 文本请求体 -->
            <div v-if="httpConfig.bodyType === 'text'" class="body-content">
              <n-input
                v-model:value="httpConfig.body.text"
                type="textarea"
                :placeholder="$t('dataSource.http.textBodyPlaceholder')"
                :rows="8"
                show-count
              />
            </div>

            <!-- 原始请求体 -->
            <div v-if="httpConfig.bodyType === 'raw'" class="body-content">
              <n-input
                v-model:value="httpConfig.body.raw"
                type="textarea"
                :placeholder="$t('dataSource.http.rawBodyPlaceholder')"
                :rows="8"
                show-count
              />
            </div>
          </div>
        </n-tab-pane>

        <!-- 高级配置 -->
        <n-tab-pane name="advanced" :tab="$t('dataSource.http.advanced')">
          <div class="tab-content">
            <n-space vertical :size="16">
              <!-- 超时设置 -->
              <n-form-item :label="$t('dataSource.http.timeout')">
                <n-input-number
                  v-model:value="httpConfig.timeout"
                  :min="1000"
                  :max="60000"
                  :step="1000"
                  :placeholder="$t('dataSource.http.timeoutPlaceholder')"
                  class="w-full"
                >
                  <template #suffix>ms</template>
                </n-input-number>
              </n-form-item>

              <!-- 重试配置 -->
              <n-form-item :label="$t('dataSource.http.retryConfig')">
                <n-space>
                  <n-input-number
                    v-model:value="httpConfig.retryCount"
                    :min="0"
                    :max="10"
                    :placeholder="$t('dataSource.http.retryCountPlaceholder')"
                    class="w-32"
                  >
                    <template #suffix>{{ $t('dataSource.http.times') }}</template>
                  </n-input-number>
                  <n-input-number
                    v-model:value="httpConfig.retryDelay"
                    :min="100"
                    :max="10000"
                    :step="100"
                    :placeholder="$t('dataSource.http.retryDelayPlaceholder')"
                    class="w-32"
                  >
                    <template #suffix>ms</template>
                  </n-input-number>
                </n-space>
              </n-form-item>

              <!-- 跟随重定向 -->
              <n-form-item :label="$t('dataSource.http.followRedirect')">
                <n-switch v-model:value="httpConfig.followRedirect" :checked-value="true" :unchecked-value="false" />
              </n-form-item>

              <!-- SSL验证 -->
              <n-form-item :label="$t('dataSource.http.sslVerify')">
                <n-switch v-model:value="httpConfig.sslVerify" :checked-value="true" :unchecked-value="false" />
              </n-form-item>
            </n-space>
          </div>
        </n-tab-pane>

        <!-- 响应预览 -->
        <n-tab-pane name="preview" :tab="$t('dataSource.http.responsePreview')" :disabled="!hasTestResponse">
          <div class="tab-content">
            <n-space vertical :size="16">
              <!-- 响应状态 -->
              <div v-if="testResponse.status" class="response-status">
                <n-tag :type="getResponseStatusType(testResponse.status)" size="small">
                  {{ testResponse.status }} {{ testResponse.statusText }}
                </n-tag>
                <n-text depth="3" class="ml-2">
                  {{ $t('dataSource.http.responseTime') }}: {{ testResponse.responseTime }}ms
                </n-text>
              </div>

              <!-- 响应头 -->
              <n-collapse>
                <n-collapse-item :title="$t('dataSource.http.responseHeaders')" name="headers">
                  <JsonDataInput v-model="testResponse.headersDisplay" :show-label="false" :readonly="true" :rows="6" />
                </n-collapse-item>
              </n-collapse>

              <!-- 响应体 -->
              <div class="response-body">
                <n-text strong class="mb-2 block">{{ $t('dataSource.http.responseBody') }}</n-text>
                <JsonDataInput v-model="testResponse.bodyDisplay" :show-label="false" :readonly="true" :rows="12" />
              </div>
            </n-space>
          </div>
        </n-tab-pane>
      </n-tabs>
    </n-form>

    <!-- 系统API选择弹窗 -->
    <n-modal
      v-model:show="showApiModal"
      preset="card"
      :title="$t('dataSource.http.selectSystemApi')"
      size="large"
      :bordered="false"
      :segmented="false"
      class="api-selection-modal"
    >
      <div class="api-list">
        <n-input
          v-model:value="apiSearchText"
          :placeholder="$t('dataSource.http.searchApiPlaceholder')"
          clearable
          class="mb-4"
        >
          <template #prefix>
            <n-icon><SearchOutline /></n-icon>
          </template>
        </n-input>

        <n-space vertical :size="8">
          <div v-for="api in filteredSystemApis" :key="api.id" class="api-item" @click="selectSystemApi(api)">
            <n-card size="small" hoverable :bordered="true" class="cursor-pointer">
              <n-space justify="space-between" align="center">
                <div>
                  <n-tag :type="getMethodTagType(api.method)" size="small">
                    {{ api.method }}
                  </n-tag>
                  <n-text strong class="ml-2">{{ api.name }}</n-text>
                </div>
                <n-text depth="3" class="text-sm">{{ api.url }}</n-text>
              </n-space>
              <n-text depth="2" class="mt-1 text-sm">{{ api.description }}</n-text>
            </n-card>
          </div>
        </n-space>

        <n-empty v-if="filteredSystemApis.length === 0" :description="$t('dataSource.http.noApiFound')" size="small" />
      </div>

      <template #footer>
        <n-space justify="end">
          <n-button @click="showApiModal = false">
            {{ $t('common.cancel') }}
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
/**
 * HTTP数据输入组件
 * 提供完整的HTTP请求配置功能，包括方法选择、URL配置、请求头管理、参数配置和连接测试
 */

import { ref, reactive, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/store/modules/theme'
import { SearchOutline } from '@vicons/ionicons5'
import type { FormInst, FormRules, TagType } from 'naive-ui'
import type {
  HttpConfiguration,
  HttpMethod,
  KeyValuePair,
  SystemApiItem,
  TestConnectionResponse,
  ValidationResult
} from '../types'
import JsonDataInput from './JsonDataInput.vue'
import KeyValueEditor from './KeyValueEditor.vue'

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

// Props和Emits
const props = withDefaults(defineProps<Props>(), {
  showSystemApiSelector: true,
  systemApis: () => [],
  readonly: false
})

const emit = defineEmits<Emits>()

// 基础设置
const { t } = useI18n()
const themeStore = useThemeStore()

// 表单引用和验证
const formRef = ref<FormInst>()

// 本地状态管理
const httpConfig = reactive<HttpConfiguration>({
  method: 'GET',
  url: '',
  headers: [],
  params: [],
  body: {
    json: '',
    form: [],
    text: '',
    raw: ''
  },
  bodyType: 'json',
  timeout: 30000,
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

// URL验证状态
const urlValidation = reactive<{
  type: TagType
  message: string
}>({
  type: 'default',
  message: ''
})

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

// HTTP方法选项
const httpMethodOptions = computed(() => [
  { label: 'GET', value: 'GET' as HttpMethod },
  { label: 'POST', value: 'POST' as HttpMethod },
  { label: 'PUT', value: 'PUT' as HttpMethod },
  { label: 'DELETE', value: 'DELETE' as HttpMethod },
  { label: 'PATCH', value: 'PATCH' as HttpMethod },
  { label: 'HEAD', value: 'HEAD' as HttpMethod },
  { label: 'OPTIONS', value: 'OPTIONS' as HttpMethod }
])

// URL有效性检查
const isUrlValid = computed(() => {
  if (!httpConfig.url) return false
  try {
    new URL(httpConfig.url)
    return true
  } catch {
    return false
  }
})

// 是否允许请求体
const isBodyAllowed = computed(() => {
  return ['POST', 'PUT', 'PATCH'].includes(httpConfig.method)
})

// 是否有测试响应
const hasTestResponse = computed(() => {
  return testResponse.status !== undefined
})

// 过滤后的系统API列表
const filteredSystemApis = computed(() => {
  if (!apiSearchText.value) return props.systemApis

  const searchLower = apiSearchText.value.toLowerCase()
  return props.systemApis.filter(
    api =>
      api.name.toLowerCase().includes(searchLower) ||
      api.url.toLowerCase().includes(searchLower) ||
      api.description.toLowerCase().includes(searchLower)
  )
})

// 表单验证规则
const formRules: FormRules = {
  method: [{ required: true, message: t('dataSource.http.methodRequired'), trigger: 'change' }],
  url: [
    { required: true, message: t('dataSource.http.urlRequired'), trigger: 'blur' },
    {
      validator: (rule, value) => {
        if (!value) return true
        try {
          new URL(value)
          return true
        } catch {
          return new Error(t('dataSource.http.urlInvalid'))
        }
      },
      trigger: 'blur'
    }
  ]
}

/**
 * 初始化组件
 * 同步外部数据到内部状态
 */
const initializeConfig = () => {
  Object.assign(httpConfig, props.modelValue)
}

/**
 * 同步配置到父组件
 */
const syncToParent = () => {
  emit('update:modelValue', { ...httpConfig })
  emit('change', { ...httpConfig })
}

/**
 * 验证URL格式
 */
const validateUrl = async () => {
  if (!httpConfig.url) {
    urlValidation.type = 'default'
    urlValidation.message = ''
    return
  }

  try {
    const url = new URL(httpConfig.url)
    urlValidation.type = 'success'
    urlValidation.message = t('dataSource.http.urlValid', { protocol: url.protocol })
  } catch (error) {
    urlValidation.type = 'error'
    urlValidation.message = t('dataSource.http.urlInvalid')
  }

  // 触发验证状态变化事件
  const validation: ValidationResult = {
    type: urlValidation.type,
    text: urlValidation.type === 'success' ? t('common.valid') : t('common.invalid'),
    detail: urlValidation.message
  }
  emit('validation-change', validation)
}

/**
 * 测试HTTP连接
 */
const testConnection = async () => {
  if (!isUrlValid.value) {
    window.$message?.warning(t('dataSource.http.urlInvalidForTest'))
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

    window.$message?.success(t('dataSource.http.testSuccess', { time: responseTime }))
  } catch (error: any) {
    const responseTime = Date.now() - startTime

    // 处理错误响应
    const testResult: TestConnectionResponse = {
      success: false,
      status: 0,
      statusText: 'Error',
      headers: {},
      data: null,
      responseTime,
      error: error.message || t('dataSource.http.testFailed')
    }
    emit('test-result', testResult)

    window.$message?.error(t('dataSource.http.testError', { error: error.message }))
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
  httpConfig.headers
    .filter(header => header.enabled && header.key && header.value)
    .forEach(header => {
      headers[header.key] = header.value
    })

  // 构建URL参数
  const params: Record<string, string> = {}
  httpConfig.params
    .filter(param => param.enabled && param.key && param.value)
    .forEach(param => {
      params[param.key] = param.value
    })

  // 构建请求体
  let body: any = undefined
  if (isBodyAllowed.value && httpConfig.bodyType) {
    switch (httpConfig.bodyType) {
      case 'json':
        if (httpConfig.body.json) {
          try {
            body = JSON.parse(httpConfig.body.json)
            headers['Content-Type'] = 'application/json'
          } catch {
            // JSON解析失败，发送原始文本
            body = httpConfig.body.json
          }
        }
        break
      case 'form':
        const formData = new FormData()
        httpConfig.body.form
          .filter(item => item.enabled && item.key)
          .forEach(item => formData.append(item.key, item.value))
        body = formData
        break
      case 'text':
        body = httpConfig.body.text
        headers['Content-Type'] = 'text/plain'
        break
      case 'raw':
        body = httpConfig.body.raw
        break
    }
  }

  return {
    method: httpConfig.method,
    url: httpConfig.url,
    headers,
    params,
    body,
    timeout: httpConfig.timeout,
    retryCount: httpConfig.retryCount,
    retryDelay: httpConfig.retryDelay,
    followRedirect: httpConfig.followRedirect,
    sslVerify: httpConfig.sslVerify
  }
}

/**
 * 模拟HTTP请求（实际项目中应替换为真实HTTP客户端）
 */
const simulateHttpRequest = async (config: any): Promise<any> => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))

  // 模拟响应数据
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
 * 选择系统API
 */
const selectSystemApi = (api: SystemApiItem) => {
  httpConfig.method = api.method
  httpConfig.url = api.url

  // 设置默认请求头
  if (api.defaultHeaders?.length) {
    httpConfig.headers = api.defaultHeaders.map(header => ({
      ...header,
      enabled: true
    }))
  }

  // 设置默认参数
  if (api.defaultParams?.length) {
    httpConfig.params = api.defaultParams.map(param => ({
      ...param,
      enabled: true
    }))
  }

  showApiModal.value = false
  syncToParent()

  window.$message?.success(t('dataSource.http.apiSelected', { name: api.name }))
}

/**
 * 处理请求头变化
 */
const handleHeadersChange = (headers: KeyValuePair[]) => {
  httpConfig.headers = headers
  syncToParent()
}

/**
 * 处理URL参数变化
 */
const handleParamsChange = (params: KeyValuePair[]) => {
  httpConfig.params = params
  syncToParent()
}

/**
 * 处理请求体类型变化
 */
const handleBodyTypeChange = (bodyType: string) => {
  httpConfig.bodyType = bodyType as any

  // 如果切换到不支持的方法，重置请求体
  if (!isBodyAllowed.value) {
    httpConfig.body = {
      json: '',
      form: [],
      text: '',
      raw: ''
    }
  }

  syncToParent()
}

/**
 * 处理JSON请求体验证
 */
const handleJsonBodyValidation = (validation: ValidationResult) => {
  // 传递验证结果到父组件
  emit('validation-change', validation)
}

/**
 * 处理表单请求体变化
 */
const handleFormBodyChange = (formData: KeyValuePair[]) => {
  httpConfig.body.form = formData
  syncToParent()
}

/**
 * 组件验证
 */
const validate = async (): Promise<boolean> => {
  try {
    await formRef.value?.validate()
    return true
  } catch {
    return false
  }
}

/**
 * 重置组件
 */
const reset = () => {
  Object.assign(httpConfig, {
    method: 'GET',
    url: '',
    headers: [],
    params: [],
    body: {
      json: '',
      form: [],
      text: '',
      raw: ''
    },
    bodyType: 'json',
    timeout: 30000,
    retryCount: 3,
    retryDelay: 1000,
    followRedirect: true,
    sslVerify: true
  })

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

  urlValidation.type = 'default'
  urlValidation.message = ''
  activeTab.value = 'headers'

  syncToParent()
}

/**
 * 获取当前配置
 */
const getConfig = (): HttpConfiguration => {
  return { ...httpConfig }
}

/**
 * 打开系统API选择弹窗
 */
const openApiSelector = () => {
  if (props.systemApis.length === 0) {
    window.$message?.warning(t('dataSource.http.noSystemApi'))
    return
  }
  showApiModal.value = true
}

// 监听外部数据变化
watch(
  () => props.modelValue,
  newValue => {
    if (newValue && JSON.stringify(newValue) !== JSON.stringify(httpConfig)) {
      Object.assign(httpConfig, newValue)
    }
  },
  { deep: true, immediate: true }
)

// 监听配置变化，同步到父组件
watch(
  httpConfig,
  () => {
    syncToParent()
  },
  { deep: true }
)

// 监听HTTP方法变化，处理请求体限制
watch(
  () => httpConfig.method,
  newMethod => {
    if (!['POST', 'PUT', 'PATCH'].includes(newMethod)) {
      // 清空请求体数据
      httpConfig.body = {
        json: '',
        form: [],
        text: '',
        raw: ''
      }
    }
  }
)

// 导出方法供父组件调用
defineExpose({
  validate,
  reset,
  getConfig,
  openApiSelector,
  testConnection
})

// 初始化
initializeConfig()
</script>

<style scoped>
/**
 * HTTP数据输入组件样式
 */

.http-data-input {
  width: 100%;
}

/* 标签页内容样式 */
.tab-content {
  padding: 16px 0;
  min-height: 200px;
}

/* URL验证状态样式 */
.url-validation {
  margin-top: 8px;
}

/* 请求体内容样式 */
.body-content {
  margin-top: 16px;
}

/* API选择弹窗样式 */
.api-selection-modal {
  max-width: 800px;
}

.api-list {
  max-height: 500px;
  overflow-y: auto;
}

.api-item {
  transition: all 0.2s ease;
}

.api-item:hover {
  transform: translateY(-1px);
}

/* 响应状态样式 */
.response-status {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: var(--card-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
}

.response-body {
  margin-top: 16px;
}

/* 工具类 */
.w-32 {
  width: 8rem;
}

.w-full {
  width: 100%;
}

.flex-1 {
  flex: 1;
}

.cursor-pointer {
  cursor: pointer;
}

.text-sm {
  font-size: 0.875rem;
}

.mb-2 {
  margin-bottom: 0.5rem;
}

.mb-4 {
  margin-bottom: 1rem;
}

.mt-1 {
  margin-top: 0.25rem;
}

.ml-2 {
  margin-left: 0.5rem;
}

.block {
  display: block;
}

/* 暗主题适配 */
[data-theme='dark'] .response-status {
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .tab-content {
    padding: 12px 0;
  }

  .api-selection-modal {
    max-width: 95vw;
  }

  .response-status {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
