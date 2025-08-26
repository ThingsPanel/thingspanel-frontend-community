<template>
  <div class="simple-http-form">
    <!-- 最上面：请求地址 -->
    <n-card title="请求地址" class="compact-card">
      <div class="form-row">
        <div class="url-item">
          <n-input v-model:value="formData.url" placeholder="请输入请求地址" @input="handleChange" />
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
          />
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
              <n-icon name="InfoCircleOutline" />
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
      </div>
    </n-card>

    <!-- 下面分三个tab -->
    <n-tabs type="card" class="config-tabs">
      <!-- 请求头页签 -->
      <n-tab-pane name="headers" tab="请求头">
        <div class="tab-content">
          <n-card title="请求头" class="compact-card">
            <div class="key-value-section">
              <div v-if="headerList.length === 0" class="empty-hint">暂无请求头</div>
              <div v-for="(header, index) in headerList" :key="`header-${index}`" class="compact-param-row">
                <n-input v-model:value="header.key" placeholder="名称" class="param-key" @input="handleChange" />
                <n-input
                  v-if="!header.isDynamic"
                  v-model:value="header.value"
                  placeholder="值"
                  class="param-value"
                  @input="handleChange"
                />
                <div v-else class="dynamic-inputs">
                  <n-input
                    v-model:value="header.dynamicName"
                    placeholder="参数名"
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
                <n-checkbox
                  v-model:checked="header.isDynamic"
                  class="dynamic-checkbox"
                  @update:checked="handleHeaderDynamicChange(index, $event)"
                />
                <n-button text type="error" size="small" @click="removeHeader(index)">
                  <n-icon size="14"><DeleteOutlined /></n-icon>
                </n-button>
              </div>
              <n-button type="primary" size="small" class="add-button" @click="addHeader">添加请求头</n-button>
            </div>
          </n-card>
        </div>
      </n-tab-pane>

      <!-- 参数页签 -->
      <n-tab-pane name="params" tab="参数">
        <div class="tab-content">
          <n-card title="请求参数" class="compact-card">
            <div class="key-value-section">
              <div v-if="paramList.length === 0" class="empty-hint">暂无请求参数</div>
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
                    placeholder="参数名"
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
                <n-checkbox
                  v-model:checked="param.isDynamic"
                  class="dynamic-checkbox"
                  @update:checked="handleParamDynamicChange(index, $event)"
                />
                <n-button text type="error" size="small" @click="removeParam(index)">
                  <n-icon size="14"><DeleteOutlined /></n-icon>
                </n-button>
              </div>
              <n-button type="primary" size="small" class="add-button" @click="addParam">添加请求参数</n-button>
            </div>
          </n-card>

          <!-- 请求体 -->
          <n-card v-if="['POST', 'PUT', 'PATCH'].includes(formData.method)" title="请求体" class="compact-card">
            <n-input
              v-model:value="formData.body"
              type="textarea"
              placeholder="请输入请求体内容"
              :rows="4"
              @input="handleChange"
            />
          </n-card>
        </div>
      </n-tab-pane>

      <!-- 脚本页签 -->
      <n-tab-pane name="script" tab="脚本">
        <div class="tab-content">
          <!-- 前置脚本 -->
          <n-card title="前置脚本" class="compact-card">
            <div class="script-editor-container">
              <div class="editor-toolbar">
                <n-button size="small" @click="clearPreScript">清空</n-button>
              </div>
              <n-input
                v-model:value="formData.preRequestScript"
                type="textarea"
                placeholder="请输入前置脚本"
                :rows="6"
                class="script-textarea"
                @input="handleChange"
              />
            </div>
          </n-card>

          <!-- 响应脚本 -->
          <n-card title="响应脚本" class="compact-card">
            <div class="script-editor-container">
              <div class="editor-toolbar">
                <n-button size="small" @click="clearResponseScript">清空</n-button>
              </div>
              <n-input
                v-model:value="formData.responseScript"
                type="textarea"
                placeholder="请输入响应脚本"
                :rows="6"
                class="script-textarea"
                @input="handleChange"
              />
            </div>
          </n-card>
        </div>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { PlusOutlined, DeleteOutlined, CodeOutlined, QuestionCircleOutlined } from '@vicons/antd'
import type { HttpConfig } from '@/core/data-source-system/types/http-config'
import type { DynamicParam } from '@/core/data-source-system/types/dynamic-params'

const emit = defineEmits<{
  'update:modelValue': [value: HttpConfig]
  change: [value: HttpConfig]
  validate: [valid: boolean, errors: string[]]
}>()

// 表单数据
const formData = ref({
  url: '',
  method: 'GET',
  body: '',
  timeout: 10000,
  preRequestScript: '',
  responseScript: ''
})

// Headers和Params列表（扩展结构支持动态参数）
const headerList = ref<
  Array<{
    key: string
    value: string
    isDynamic?: boolean
    dynamicName?: string
    exampleValue?: string
  }>
>([])
const paramList = ref<
  Array<{
    key: string
    value: string
    isDynamic?: boolean
    dynamicName?: string
    exampleValue?: string
  }>
>([])

// 脚本编辑器引用
const preScriptRef = ref()
const responseScriptRef = ref()

// 方法选项
const methodOptions = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
  { label: 'PATCH', value: 'PATCH' }
]

// 是否显示请求体
const showBody = computed(() => ['POST', 'PUT', 'PATCH'].includes(formData.value.method))

// 动态参数汇总（从请求头和查询参数中提取）
const dynamicParamSummary = computed(() => {
  const dynamicParams: Array<{ name: string; location: string; exampleValue: string }> = []

  // 从请求头中收集动态参数
  headerList.value.forEach(header => {
    if (header.isDynamic && header.dynamicName) {
      dynamicParams.push({
        name: header.dynamicName,
        location: `请求头 ${header.key}`,
        exampleValue: header.exampleValue || ''
      })
    }
  })

  // 从查询参数中收集动态参数
  paramList.value.forEach(param => {
    if (param.isDynamic && param.dynamicName) {
      dynamicParams.push({
        name: param.dynamicName,
        location: `查询参数 ${param.key}`,
        exampleValue: param.exampleValue || ''
      })
    }
  })

  return dynamicParams
})

// Header操作
const addHeader = () => {
  headerList.value.push({
    key: '',
    value: '',
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

// 处理请求头动态参数开关
const handleHeaderDynamicChange = (index: number, isDynamic: boolean) => {
  const header = headerList.value[index]
  header.isDynamic = isDynamic

  if (isDynamic) {
    // 切换到动态模式：使用 key 作为默认的动态参数名
    header.dynamicName = header.key || 'headerParam'
    header.exampleValue = header.value || ''
  } else {
    // 切换到静态模式：清空动态相关字段
    header.dynamicName = ''
    header.exampleValue = ''
  }

  handleChange()
}

// Param操作
const addParam = () => {
  paramList.value.push({
    key: '',
    value: '',
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

// 处理查询参数动态参数开关
const handleParamDynamicChange = (index: number, isDynamic: boolean) => {
  const param = paramList.value[index]
  param.isDynamic = isDynamic

  if (isDynamic) {
    // 切换到动态模式：使用 key 作为默认的动态参数名
    param.dynamicName = param.key || 'queryParam'
    param.exampleValue = param.value || ''
  } else {
    // 切换到静态模式：清空动态相关字段
    param.dynamicName = ''
    param.exampleValue = ''
  }

  handleChange()
}

const validate = () => {
  const errors: string[] = []
  if (!formData.value.url || formData.value.url.trim() === '') {
    errors.push('请求URL不能为空')
  }

  const isValid = errors.length === 0
  emit('validate', isValid, errors)
}

// handleChange
const handleChange = () => {
  emit('change', toHttpConfig())
  validate()
}

// 脚本插入模板
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

const toHttpConfig = (): HttpConfig => {
  // 处理请求头：动态参数使用示例值，静态参数使用原值
  const headers = headerList.value.reduce(
    (acc, cur) => {
      if (cur.key) {
        if (cur.isDynamic && cur.dynamicName) {
          // 动态参数：使用示例值进行请求
          acc[cur.key] = cur.exampleValue || ''
        } else {
          // 静态参数：直接使用值
          acc[cur.key] = cur.value || ''
        }
      }
      return acc
    },
    {} as Record<string, string>
  )

  // 处理查询参数：动态参数使用示例值，静态参数使用原值
  const params = paramList.value.reduce(
    (acc, cur) => {
      if (cur.key) {
        if (cur.isDynamic && cur.dynamicName) {
          // 动态参数：使用示例值进行请求
          acc[cur.key] = cur.exampleValue || ''
        } else {
          // 静态参数：直接使用值
          acc[cur.key] = cur.value || ''
        }
      }
      return acc
    },
    {} as Record<string, string>
  )

  // 收集所有动态参数定义（用于运行时替换）
  const dynamicParams: DynamicParam[] = []

  // 从请求头收集动态参数
  headerList.value.forEach(header => {
    if (header.isDynamic && header.dynamicName) {
      dynamicParams.push({
        name: header.dynamicName,
        description: `请求头参数 ${header.key}`,
        exampleValue: header.exampleValue,
        type: 'string',
        required: false
      })
    }
  })

  // 从查询参数收集动态参数
  paramList.value.forEach(param => {
    if (param.isDynamic && param.dynamicName) {
      dynamicParams.push({
        name: param.dynamicName,
        description: `查询参数 ${param.key}`,
        exampleValue: param.exampleValue,
        type: 'string',
        required: false
      })
    }
  })

  return {
    ...formData.value,
    method: formData.value.method as any, // 类型断言
    headers,
    params,
    dynamicParams
  }
}

const loadConfig = (config: HttpConfig) => {
  if (!config) return

  formData.value.url = config.url || ''
  formData.value.method = config.method || 'GET'
  formData.value.body = config.body || ''
  formData.value.timeout = config.timeout === undefined ? 10000 : config.timeout
  formData.value.preRequestScript = config.preRequestScript || ''
  formData.value.responseScript = config.responseScript || ''

  // 处理请求头：检测是否包含动态参数占位符
  headerList.value = config.headers
    ? Object.entries(config.headers).map(([key, value]) => {
        const strValue = String(value)
        const isDynamic = /^\$\{(.+)\}$/.test(strValue)

        if (isDynamic) {
          const dynamicName = strValue.match(/^\$\{(.+)\}$/)?.[1] || ''
          // 查找对应的动态参数定义获取示例值
          const paramDef = config.dynamicParams?.find(p => p.name === dynamicName)
          return {
            key,
            value: '',
            isDynamic: true,
            dynamicName,
            exampleValue: paramDef?.exampleValue || ''
          }
        } else {
          return {
            key,
            value: strValue,
            isDynamic: false,
            dynamicName: '',
            exampleValue: ''
          }
        }
      })
    : []

  // 处理查询参数：检测是否包含动态参数占位符
  paramList.value = config.params
    ? Object.entries(config.params).map(([key, value]) => {
        const strValue = String(value)
        const isDynamic = /^\$\{(.+)\}$/.test(strValue)

        if (isDynamic) {
          const dynamicName = strValue.match(/^\$\{(.+)\}$/)?.[1] || ''
          // 查找对应的动态参数定义获取示例值
          const paramDef = config.dynamicParams?.find(p => p.name === dynamicName)
          return {
            key,
            value: '',
            isDynamic: true,
            dynamicName,
            exampleValue: paramDef?.exampleValue || ''
          }
        } else {
          return {
            key,
            value: strValue,
            isDynamic: false,
            dynamicName: '',
            exampleValue: ''
          }
        }
      })
    : []

  handleChange()
}

const reset = () => {
  formData.value.url = ''
  formData.value.method = 'GET'
  formData.value.body = ''
  formData.value.timeout = 10000
  formData.value.preRequestScript = ''
  formData.value.responseScript = ''
  headerList.value = []
  paramList.value = []
  handleChange()
}

// 暴露方法
defineExpose({
  loadConfig,
  toHttpConfig,
  reset
})
</script>

<style scoped>
.simple-http-form {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 页签样式 */
.config-tabs {
  height: 100%;
}

.config-tabs :deep(.n-tabs-content) {
  height: calc(100% - 40px);
  overflow: hidden;
}

.config-tabs :deep(.n-tab-pane) {
  height: 100%;
  overflow: auto;
  padding: 0;
}

.tab-content {
  padding: 8px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 紧凑卡片样式 */
.compact-card {
  border-radius: 6px;
  box-shadow: none;
  margin-bottom: 0;
}

.compact-card :deep(.n-card-header) {
  padding: 8px 12px;
  min-height: 32px;
}

.compact-card :deep(.n-card-body) {
  padding: 12px;
}

.form-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.url-item {
  flex-grow: 1;
}

.method-item {
  width: 100px;
  flex-shrink: 0;
}

.timeout-item {
  width: 100px;
  flex-shrink: 0;
}

.key-value-section,
.dynamic-param-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.key-value-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 参数区域样式 */
.params-section {
  margin-top: 8px;
}

.params-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.param-card {
  margin-bottom: 0;
}

/* 增强的参数行样式 */
.enhanced-param-row {
  display: grid;
  grid-template-columns: 1fr 2fr auto auto;
  gap: 12px;
  align-items: center;
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--card-color);
}

.compact-param-row {
  display: grid;
  grid-template-columns: 1fr 1.5fr auto auto;
  gap: 8px;
  align-items: center;
  padding: 6px 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--card-color);
  font-size: 12px;
}

.param-key-input {
  min-width: 140px;
}

.param-key {
  min-width: 140px;
}

.param-value-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.param-value-input {
  width: 100%;
}

.param-value {
  width: 100%;
}

.dynamic-param-config {
  display: flex;
  gap: 8px;
}

.dynamic-inputs {
  display: flex;
  gap: 8px;
}

.dynamic-name-input,
.example-value-input {
  flex: 1;
  min-width: 120px;
}

.dynamic-name {
  flex: 1;
  min-width: 120px;
}

.example-value {
  flex: 1;
  min-width: 120px;
}

.param-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
}

.dynamic-checkbox {
  margin-left: 8px;
}

.delete-btn {
  min-width: 32px;
}

.empty-hint {
  text-align: center;
  padding: 8px;
  font-size: 12px;
}

.add-button {
  width: 100%;
  height: 28px;
  font-size: 12px;
}

.help-icon {
  cursor: pointer;
  color: #999;
  font-size: 14px;
}

/* 动态参数预览 Tooltip 样式 */
.dynamic-param-tooltip {
  position: relative;
}

.tooltip-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: var(--primary-color);
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.tooltip-trigger:hover {
  background: var(--primary-color-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.tooltip-content {
  max-width: 280px;
  padding: 12px;
}

.tooltip-title {
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-color);
  font-size: 14px;
}

.tooltip-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tooltip-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  border-bottom: 1px solid var(--border-color);
}

.tooltip-item:last-child {
  border-bottom: none;
}

.tooltip-description {
  flex: 1;
  font-size: 12px;
  color: var(--text-color-secondary);
}

/* 参数行样式 */
.param-key {
  flex: 1;
}

.param-value {
  flex: 1;
}

.dynamic-inputs {
  display: flex;
  gap: 8px;
  flex: 2;
}

.dynamic-name {
  flex: 1;
}

.example-value {
  flex: 1;
}

.dynamic-checkbox {
  flex-shrink: 0;
}

/* 紧凑参数行样式 */
.compact-param-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr auto auto;
  gap: 8px;
  align-items: center;
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--card-color);
  margin-bottom: 8px;
}

.dynamic-param-help {
  max-width: 300px;
}

.dynamic-param-help h4 {
  margin: 0 0 8px 0;
}

.dynamic-param-help ul {
  padding-left: 20px;
  margin: 0;
}

.dynamic-param-help p {
  margin: 4px 0;
}

.script-help pre {
  background-color: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
}

.nested-card {
  margin-top: 12px;
}

.script-editor-container {
  width: 100%;
}

.script-editor {
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 6px;
}

.editor-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 6px;
}

.script-textarea {
  font-family: 'Courier New', Courier, monospace;
  line-height: 1.4;
  font-size: 12px;
}

.script-textarea {
  font-family: 'Courier New', Courier, monospace;
  line-height: 1.5;
}

.dynamic-param-item-new {
  display: grid;
  grid-template-columns: 150px 1fr 1fr;
  gap: 16px;
  align-items: center;
  margin-bottom: 12px;
}

.dynamic-param-item-new .param-name {
  font-weight: 500;
}

/* 动态参数概览样式 */
.dynamic-param-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: var(--code-color);
  border-radius: 4px;
  border: 1px solid var(--border-color);
  font-size: 12px;
}

.summary-location {
  font-size: 12px;
  padding: 2px 8px;
  background: var(--primary-color-suppl);
  border-radius: 4px;
  color: var(--primary-color);
  font-weight: 500;
}

.summary-example {
  font-size: 12px;
  font-family: monospace;
  margin-left: auto;
}
</style>
