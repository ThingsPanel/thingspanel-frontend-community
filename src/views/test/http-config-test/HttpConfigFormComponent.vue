<template>
  <div class="http-config-form-component">
    <n-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-placement="top"
      size="small"
      class="http-config-form"
    >
      <!-- 基础配置 -->
      <div class="form-section">
        <n-divider title-placement="left">基础配置</n-divider>

        <!-- URL和方法 -->
        <div class="form-row">
          <n-form-item label="请求URL" path="url" class="url-input">
            <n-input
              v-model:value="formData.url"
              placeholder="请输入API地址，如 https://api.example.com/users 或 /api/users"
              @blur="detectApiType"
            />
          </n-form-item>
          <n-form-item label="请求方法" path="method" class="method-select">
            <n-select v-model:value="formData.method" :options="methodOptions" @update:value="onMethodChange" />
          </n-form-item>
        </div>

        <!-- API类型提示 -->
        <div v-if="detectedApiType" class="api-type-hint">
          <n-tag :type="detectedApiType === 'internal' ? 'info' : 'default'" size="small">
            {{ detectedApiType === 'internal' ? '内部API' : '外部API' }}
          </n-tag>
        </div>
      </div>

      <!-- 请求头配置 -->
      <div class="form-section">
        <n-divider title-placement="left">请求头</n-divider>
        <div class="key-value-list">
          <div v-for="(header, index) in formData.headers" :key="'header-' + index" class="key-value-row">
            <n-input v-model:value="header.key" placeholder="请求头名称" class="key-input" />
            <n-input v-model:value="header.value" placeholder="请求头值" class="value-input" />
            <n-button text type="error" @click="removeHeader(index)">
              <template #icon>
                <n-icon><DeleteOutlined /></n-icon>
              </template>
            </n-button>
          </div>
          <n-button dashed class="add-button" @click="addHeader">
            <template #icon>
              <n-icon><PlusOutlined /></n-icon>
            </template>
            添加请求头
          </n-button>
        </div>
      </div>

      <!-- 查询参数配置 -->
      <div class="form-section">
        <n-divider title-placement="left">查询参数</n-divider>
        <div class="key-value-list">
          <div v-for="(param, index) in formData.params" :key="'param-' + index" class="key-value-row">
            <n-input v-model:value="param.key" placeholder="参数名称" class="key-input" />
            <n-input v-model:value="param.value" placeholder="参数值" class="value-input" />
            <n-button text type="error" @click="removeParam(index)">
              <template #icon>
                <n-icon><DeleteOutlined /></n-icon>
              </template>
            </n-button>
          </div>
          <n-button dashed class="add-button" @click="addParam">
            <template #icon>
              <n-icon><PlusOutlined /></n-icon>
            </template>
            添加查询参数
          </n-button>
        </div>
      </div>

      <!-- 请求体配置 -->
      <div v-if="shouldShowBody" class="form-section">
        <n-divider title-placement="left">请求体</n-divider>

        <!-- 请求体类型选择 -->
        <n-form-item label="请求体类型">
          <n-radio-group v-model:value="formData.bodyType">
            <n-radio value="json">JSON</n-radio>
            <n-radio value="form">表单数据</n-radio>
            <n-radio value="raw">原始数据</n-radio>
            <n-radio value="none">无请求体</n-radio>
          </n-radio-group>
        </n-form-item>

        <!-- JSON/Raw请求体 -->
        <n-form-item
          v-if="formData.bodyType && formData.bodyType !== 'none' && formData.bodyType !== 'form'"
          label="请求体内容"
        >
          <n-input v-model:value="formData.body" type="textarea" :placeholder="getBodyPlaceholder()" :rows="6" />
        </n-form-item>

        <!-- 表单数据 -->
        <div v-if="formData.bodyType === 'form'" class="form-data-section">
          <div class="key-value-list">
            <div v-for="(item, index) in formData.formData" :key="'form-' + index" class="form-data-row">
              <n-input v-model:value="item.key" placeholder="字段名称" class="key-input" />
              <n-input v-model:value="item.value" placeholder="字段值" class="value-input" />
              <n-select
                v-model:value="item.type"
                :options="[
                  { label: '文本', value: 'text' },
                  { label: '文件', value: 'file' }
                ]"
                class="type-select"
              />
              <n-button text type="error" @click="removeFormDataItem(index)">
                <template #icon>
                  <n-icon><DeleteOutlined /></n-icon>
                </template>
              </n-button>
            </div>
            <n-button dashed class="add-button" @click="addFormDataItem">
              <template #icon>
                <n-icon><PlusOutlined /></n-icon>
              </template>
              添加表单字段
            </n-button>
          </div>
        </div>
      </div>

      <!-- 高级配置 -->
      <div class="form-section">
        <n-divider title-placement="left">高级配置</n-divider>

        <div class="advanced-options">
          <!-- 超时和重试 -->
          <div class="option-row">
            <n-form-item label="超时时间(ms)">
              <n-input-number
                v-model:value="formData.timeout"
                :min="1000"
                :max="300000"
                :step="1000"
                class="number-input"
              />
            </n-form-item>
            <n-form-item label="重试次数">
              <n-input-number v-model:value="formData.retries" :min="0" :max="10" class="number-input" />
            </n-form-item>
          </div>

          <!-- 其他选项 -->
          <div class="option-checkboxes">
            <n-checkbox v-model:checked="formData.followRedirects">跟随重定向</n-checkbox>
            <n-checkbox v-model:checked="formData.validateSSL">验证SSL证书</n-checkbox>
            <n-checkbox v-model:checked="formData.enableCookies">启用Cookie</n-checkbox>
          </div>
        </div>
      </div>

      <!-- 脚本配置 -->
      <div class="form-section">
        <n-divider title-placement="left">脚本配置</n-divider>

        <!-- 前置脚本 -->
        <div class="script-section">
          <n-form-item>
            <template #label>
              <div class="script-label">
                <n-checkbox v-model:checked="formData.enablePreScript">启用前置脚本</n-checkbox>
              </div>
            </template>
            <n-input
              v-if="formData.enablePreScript"
              v-model:value="formData.preRequestScript"
              type="textarea"
              placeholder="请输入前置脚本代码，可修改请求配置"
              :rows="4"
            />
          </n-form-item>
        </div>

        <!-- 响应脚本 -->
        <div class="script-section">
          <n-form-item>
            <template #label>
              <div class="script-label">
                <n-checkbox v-model:checked="formData.enableResponseScript">启用响应脚本</n-checkbox>
              </div>
            </template>
            <n-input
              v-if="formData.enableResponseScript"
              v-model:value="formData.responseScript"
              type="textarea"
              placeholder="请输入响应处理脚本代码，可处理响应数据"
              :rows="4"
            />
          </n-form-item>
        </div>
      </div>

      <!-- 代理配置 -->
      <div class="form-section">
        <n-divider title-placement="left">代理配置</n-divider>

        <div class="proxy-section">
          <n-form-item>
            <n-checkbox v-model:checked="formData.useProxy">使用代理服务器</n-checkbox>
          </n-form-item>

          <div v-if="formData.useProxy" class="proxy-config">
            <div class="option-row">
              <n-form-item label="代理主机">
                <n-input v-model:value="formData.proxyHost" placeholder="代理服务器地址" />
              </n-form-item>
              <n-form-item label="代理端口">
                <n-input-number
                  v-model:value="formData.proxyPort"
                  :min="1"
                  :max="65535"
                  placeholder="8080"
                  class="number-input"
                />
              </n-form-item>
            </div>

            <div class="option-row">
              <n-form-item label="用户名">
                <n-input v-model:value="formData.proxyUsername" placeholder="可选" />
              </n-form-item>
              <n-form-item label="密码">
                <n-input
                  v-model:value="formData.proxyPassword"
                  type="password"
                  placeholder="可选"
                  show-password-on="click"
                />
              </n-form-item>
            </div>
          </div>
        </div>
      </div>
    </n-form>
  </div>
</template>

<script setup lang="ts">
/**
 * HTTP配置表单组件 - 测试专用版本
 * 用于测试页面，支持示例数据回显和完整配置
 */

import { ref, reactive, computed, watch } from 'vue'
import { PlusOutlined, DeleteOutlined } from '@vicons/antd'
import type { FormRules } from 'naive-ui'

// 导入类型定义
import type {
  HttpConfig,
  HttpConfigFormData,
  KeyValuePair,
  FormDataItem,
  HttpMethod,
  ApiType
} from '@/core/data-source-system/types/http-config'
import { HttpConfigConverter, HTTP_CONFIG_CONSTANTS } from '@/core/data-source-system/types/http-config'

// ========== 组件接口 ==========

interface Props {
  /** 初始配置数据 */
  modelValue?: HttpConfig
  /** 是否禁用表单 */
  disabled?: boolean
  /** 表单尺寸 */
  size?: 'small' | 'medium' | 'large'
}

interface Emits {
  (e: 'update:modelValue', value: HttpConfig): void
  (e: 'change', value: HttpConfig): void
  (e: 'validate', valid: boolean, errors: string[]): void
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  size: 'small'
})

const emit = defineEmits<Emits>()

// ========== 响应式数据 ==========

// 表单引用
const formRef = ref()

// 表单数据 - 使用表单专用的数据结构
const formData = reactive<HttpConfigFormData>(
  props.modelValue
    ? HttpConfigConverter.configToFormData(props.modelValue)
    : HttpConfigConverter.createDefaultFormData()
)

// 检测到的API类型
const detectedApiType = ref<ApiType | null>(null)

// 防止递归更新的标志
const isLoadingConfig = ref(false)

// ========== 计算属性 ==========

// HTTP方法选项
const methodOptions = computed(() =>
  HTTP_CONFIG_CONSTANTS.SUPPORTED_METHODS.map(method => ({
    label: method,
    value: method
  }))
)

// 是否显示请求体配置
const shouldShowBody = computed(() => ['POST', 'PUT', 'PATCH'].includes(formData.method))

// 表单验证规则
const formRules: FormRules = {
  url: [
    {
      required: true,
      message: '请输入请求URL',
      trigger: 'blur'
    },
    {
      validator: (rule, value: string) => {
        if (!value) return true // required 规则已检查

        // 如果是完整URL，验证格式
        if (value.startsWith('http://') || value.startsWith('https://')) {
          try {
            new URL(value)
            return true
          } catch {
            return new Error('URL格式无效')
          }
        }

        // 内部API路径验证
        if (value.startsWith('/')) {
          return true
        }

        return new Error('请输入有效的URL或API路径')
      },
      trigger: 'blur'
    }
  ],
  method: [
    {
      required: true,
      message: '请选择HTTP方法',
      trigger: 'change'
    }
  ]
}

// 表单验证状态
const isValidForm = computed(() => {
  const validation = HttpConfigConverter.validateConfig(convertToHttpConfig())
  return validation.valid
})

// 表单验证消息
const formValidationMessage = computed(() => {
  if (!formData.url) {
    return '请输入请求URL'
  }

  const validation = HttpConfigConverter.validateConfig(convertToHttpConfig())
  if (!validation.valid) {
    return validation.errors[0] || '配置验证失败'
  }

  return '配置验证通过'
})

// ========== 方法定义 ==========

/**
 * 检测API类型（内部/外部）
 */
const detectApiType = () => {
  if (!formData.url) {
    detectedApiType.value = null
    return
  }

  if (formData.url.startsWith('/')) {
    detectedApiType.value = 'internal'
  } else if (formData.url.startsWith('http://') || formData.url.startsWith('https://')) {
    detectedApiType.value = 'external'
  } else {
    detectedApiType.value = null
  }
}

/**
 * HTTP方法变化处理
 */
const onMethodChange = (method: HttpMethod) => {
  // 根据方法自动调整请求体类型
  if (!shouldShowBody.value) {
    formData.bodyType = 'none'
    formData.body = ''
  } else if (!formData.bodyType || formData.bodyType === 'none') {
    formData.bodyType = 'json'
  }

  emitChange()
}

/**
 * 获取请求体占位符文本
 */
const getBodyPlaceholder = () => {
  switch (formData.bodyType) {
    case 'json':
      return '请输入JSON格式的数据，如：\n{\n  "name": "张三",\n  "age": 25\n}'
    case 'raw':
      return '请输入原始数据内容'
    default:
      return '请输入请求体内容'
  }
}

// ========== 键值对管理 ==========

/**
 * 添加请求头
 */
const addHeader = () => {
  formData.headers.push({ key: '', value: '' })
}

/**
 * 移除请求头
 */
const removeHeader = (index: number) => {
  formData.headers.splice(index, 1)
  emitChange()
}

/**
 * 添加查询参数
 */
const addParam = () => {
  formData.params.push({ key: '', value: '' })
}

/**
 * 移除查询参数
 */
const removeParam = (index: number) => {
  formData.params.splice(index, 1)
  emitChange()
}

/**
 * 添加表单数据项
 */
const addFormDataItem = () => {
  if (!formData.formData) {
    formData.formData = []
  }
  formData.formData.push({ key: '', value: '', type: 'text' })
}

/**
 * 移除表单数据项
 */
const removeFormDataItem = (index: number) => {
  if (formData.formData) {
    formData.formData.splice(index, 1)
    emitChange()
  }
}

// ========== 数据转换和事件处理 ==========

/**
 * 将表单数据转换为HTTP配置
 */
const convertToHttpConfig = (): HttpConfig => {
  return HttpConfigConverter.formDataToConfig(formData)
}

/**
 * 触发变化事件
 */
const emitChange = () => {
  const httpConfig = convertToHttpConfig()
  const validation = HttpConfigConverter.validateConfig(httpConfig)

  emit('update:modelValue', httpConfig)
  emit('change', httpConfig)
  emit('validate', validation.valid, validation.errors)
}

/**
 * 加载HTTP配置到表单（用于示例回显）
 */
const loadConfig = (config: HttpConfig) => {
  // 设置加载标志，避免递归更新
  isLoadingConfig.value = true

  try {
    const newFormData = HttpConfigConverter.configToFormData(config)

    // 清空现有数组
    formData.headers.splice(0)
    formData.params.splice(0)
    if (formData.formData) {
      formData.formData.splice(0)
    }

    // 更新所有属性
    Object.assign(formData, newFormData)

    // 确保数组存在
    if (!formData.headers) formData.headers = []
    if (!formData.params) formData.params = []
    if (!formData.formData) formData.formData = []

    // 检测API类型
    detectApiType()

    // 直接触发验证，但不触发change事件（避免递归）
    const httpConfig = convertToHttpConfig()
    const validation = HttpConfigConverter.validateConfig(httpConfig)
    emit('validate', validation.valid, validation.errors)
  } finally {
    // 清除加载标志
    isLoadingConfig.value = false
  }
}

/**
 * 重置表单
 */
const reset = () => {
  const defaultData = HttpConfigConverter.createDefaultFormData()

  // 清空数组
  formData.headers.splice(0)
  formData.params.splice(0)
  if (formData.formData) {
    formData.formData.splice(0)
  }

  // 重置所有属性
  Object.assign(formData, defaultData)

  detectedApiType.value = null
  emitChange()
}

/**
 * 验证表单
 */
const validate = async (): Promise<{ valid: boolean; errors: string[] }> => {
  try {
    await formRef.value?.validate()
    const httpConfig = convertToHttpConfig()
    return HttpConfigConverter.validateConfig(httpConfig)
  } catch (errors) {
    return {
      valid: false,
      errors: Array.isArray(errors) ? errors.map(e => e.message) : ['表单验证失败']
    }
  }
}

// ========== 监听器 ==========

// 监听表单数据变化
watch(
  () => formData,
  () => {
    // 只有在非加载状态时才触发change事件
    if (!isLoadingConfig.value) {
      emitChange()
    }
  },
  { deep: true }
)

// 监听外部配置变化
watch(
  () => props.modelValue,
  newConfig => {
    if (newConfig && !isLoadingConfig.value) {
      loadConfig(newConfig)
    }
  },
  { deep: true }
)

// ========== 暴露的方法 ==========

defineExpose({
  loadConfig,
  reset,
  validate,
  convertToHttpConfig,
  formData,
  isValidForm,
  formValidationMessage
})
</script>

<style scoped>
.http-config-form-component {
  width: 100%;
}

.http-config-form {
  width: 100%;
}

.form-section {
  margin-bottom: 24px;
}

.form-section:last-child {
  margin-bottom: 0;
}

.form-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.url-input {
  flex: 1;
}

.method-select {
  flex: 0 0 120px;
}

.api-type-hint {
  margin-top: -8px;
  margin-bottom: 8px;
}

/* 键值对列表样式 */
.key-value-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.key-value-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.form-data-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.key-input {
  flex: 1;
  min-width: 120px;
}

.value-input {
  flex: 2;
}

.type-select {
  flex: 0 0 80px;
}

.add-button {
  width: 100%;
  margin-top: 4px;
}

/* 高级选项样式 */
.advanced-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.option-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.option-row .n-form-item {
  flex: 1;
}

.number-input {
  width: 100%;
}

.option-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

/* 脚本配置样式 */
.script-section {
  margin-bottom: 16px;
}

.script-section:last-child {
  margin-bottom: 0;
}

.script-label {
  display: flex;
  align-items: center;
}

/* 代理配置样式 */
.proxy-section .n-form-item {
  margin-bottom: 12px;
}

.proxy-config {
  margin-top: 12px;
  padding-left: 24px;
  border-left: 2px solid var(--border-color);
}

/* 响应式适配 */
@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
  }

  .method-select {
    flex: 1;
  }

  .option-row {
    flex-direction: column;
  }

  .key-value-row,
  .form-data-row {
    flex-direction: column;
    align-items: stretch;
  }

  .key-input,
  .value-input,
  .type-select {
    flex: 1;
  }
}
</style>
