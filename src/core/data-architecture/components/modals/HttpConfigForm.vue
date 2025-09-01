<!--
  HTTP接口配置表单组件
  恢复tab布局，去掉图标，保持紧凑
-->
<script setup lang="ts">
/**
 * HttpConfigForm - HTTP接口配置表单
 * 恢复tab布局，去掉图标装饰
 */

import { ref, reactive, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage } from 'naive-ui'
import type { HttpHeader, HttpParam, HttpPathParam, HttpConfig, PathParameter } from '../../types/http-config'
import {
  generateVariableName,
  createDefaultHttpHeader,
  createDefaultHttpParam,
  createDefaultHttpPathParam,
  createDefaultPathParameter,
  extractPathParamsFromUrl,
  replaceUrlPathParams
} from '../../types/http-config'
import { HTTP_CONFIG_TEMPLATES } from '../../templates/http-templates'
// 导入脚本编辑器
import SimpleScriptEditor from '@/core/script-engine/components/SimpleScriptEditor.vue'
// 导入通用动态参数编辑器
import DynamicParameterEditor from '../common/DynamicParameterEditor.vue'

// Props接口 - 支持v-model模式
interface Props {
  /** v-model绑定的HTTP配置 */
  modelValue?: Partial<HttpConfig>
}

// Emits接口
interface Emits {
  (e: 'update:modelValue', value: Props['modelValue']): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({
    url: 'https://api.example.com/data',
    method: 'GET',
    timeout: 10000,
    headers: [],
    params: [],
    pathParams: [],
    body: '',
    preRequestScript: '',
    postResponseScript: ''
  })
})

const emit = defineEmits<Emits>()
const { t } = useI18n()
const message = useMessage()

/**
 * 当前活跃的标签页 - 默认显示基础配置
 */
const activeTab = ref('basic')

/**
 * 数据转换帮助函数
 */
const convertHttpToEnhanced = (param: any) => ({
  key: param.key || '',
  value: param.value || '',
  enabled: param.enabled !== false,
  // 🔥 优先使用保存的 valueMode，回退到基于 isDynamic 推断
  valueMode: param.valueMode || (param.isDynamic ? 'property' : 'manual'),
  // 🔥 优先使用保存的 selectedTemplate，回退到基于 isDynamic 推断
  selectedTemplate: param.selectedTemplate || (param.isDynamic ? 'property-binding' : 'manual'),
  variableName: param.variableName || '',
  description: param.description || '',
  dataType: param.dataType || 'string'
})

/**
 * 本地配置状态 - 简化初始化
 */
const localConfig = reactive<HttpConfig>({
  url: 'https://api.example.com/data',
  method: 'GET',
  timeout: 10000,
  pathParameter: undefined,
  headers: [],
  params: [],
  pathParams: [],
  body: '',
  preRequestScript: '',
  postResponseScript: ''
})

/**
 * 初始化统一参数数组 - 兼容旧数据结构
 */
function initializeParameters(config?: HttpConfig): HttpParameter[] {
  const parameters: HttpParameter[] = []

  // 如果有新的parameters字段，直接使用
  if (config?.parameters && Array.isArray(config.parameters)) {
    return [...config.parameters]
  }

  // 兼容旧格式：合并 headers、params、pathParams
  if (config?.headers) {
    config.headers.forEach(header => {
      parameters.push({
        ...header,
        paramType: 'header'
      })
    })
  }

  if (config?.params) {
    config.params.forEach(param => {
      parameters.push({
        ...param,
        paramType: 'query'
      })
    })
  }

  if (config?.pathParams) {
    config.pathParams.forEach(pathParam => {
      parameters.push({
        key: pathParam.key,
        value: pathParam.value,
        enabled: pathParam.enabled,
        isDynamic: pathParam.isDynamic,
        dataType: pathParam.dataType,
        variableName: pathParam.variableName,
        description: pathParam.description,
        paramType: 'path'
      })
    })
  }

  return parameters
}

/**
 * HTTP方法选项
 */
const httpMethods = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
  { label: 'PATCH', value: 'PATCH' }
]

/**
 * 数据类型选项 - 保留一份供本组件内部使用
 */
const dataTypeOptions = [
  { label: '字符串', value: 'string' },
  { label: '数字', value: 'number' },
  { label: '布尔值', value: 'boolean' },
  { label: 'JSON', value: 'json' }
]

/**
 * 是否显示请求体
 */
const showBody = computed(() => {
  return ['POST', 'PUT', 'PATCH'].includes(localConfig.method)
})

/**
 * 统一参数管理 - 添加参数
 */
const addParameter = (paramType: 'path' | 'query' | 'header') => {
  const newParam = createDefaultHttpParameter(paramType)
  localConfig.parameters.push(newParam)
  updateConfig()
}

/**
 * 统一参数管理 - 删除参数
 */
const removeParameter = (index: number) => {
  localConfig.parameters.splice(index, 1)
  updateConfig()
}

/**
 * 统一参数管理 - 处理参数key变化
 */
const onParameterKeyChange = (param: HttpParameter) => {
  if (param.isDynamic && param.key) {
    param.variableName = generateVariableName(param.key)
    if (!param.description) {
      const typeNames = { path: '路径', query: '查询', header: '请求头' }
      param.description = `${typeNames[param.paramType]}参数：${param.key}`
    }
  }
  updateConfig()
}

/**
 * 统一参数管理 - 切换动态状态
 */
const toggleParameterDynamic = (param: HttpParameter) => {
  param.isDynamic = !param.isDynamic
  if (param.isDynamic) {
    param.variableName = generateVariableName(param.key)
    if (!param.description) {
      const typeNames = { path: '路径', query: '查询', header: '请求头' }
      param.description = `${typeNames[param.paramType]}参数：${param.key}`
    }
  } else {
    param.variableName = ''
  }
  updateConfig()
}

/**
 * 统一参数管理 - 计算属性
 */
const pathParameters = computed(() => localConfig.parameters.filter(p => p.paramType === 'path'))
const queryParameters = computed(() => localConfig.parameters.filter(p => p.paramType === 'query'))
const headerParameters = computed(() => localConfig.parameters.filter(p => p.paramType === 'header'))

// Headers 和 Params 相关函数已移至 DynamicParameterEditor 组件中

// 路径参数管理函数已移至 DynamicParameterEditor 组件中

// Params 相关函数已移至 DynamicParameterEditor 组件中

// 旧的路径参数函数已移至 DynamicParameterEditor 组件中

/**
 * URL变化时自动检测路径参数
 */
const onUrlChange = () => {
  // 从URL中提取路径参数
  const detectedParams = extractPathParamsFromUrl(localConfig.url)

  if (detectedParams.length > 0) {
    // 合并已存在的路径参数，避免重复
    const existingKeys = (localConfig.pathParams || []).map(p => p.key)
    const newParams = detectedParams.filter(p => !existingKeys.includes(p.key))

    if (newParams.length > 0) {
      localConfig.pathParams = localConfig.pathParams || []
      localConfig.pathParams.push(...newParams)
    }
  }

  updateConfig()
}

/**
 * HTTP配置模板（使用统一模板）
 */
const httpTemplates = HTTP_CONFIG_TEMPLATES

/**
 * 应用整体配置模板
 */
const applyTemplate = (template: (typeof httpTemplates)[0]) => {
  Object.assign(localConfig, template.config)
  updateConfig()
}

/**
 * 更新配置并发射事件
 */
const updateConfig = () => {
  if (isInternalUpdate) return // 防止内部更新时触发循环

  const config = { ...localConfig }

  // 🔥 兼容性处理：将EnhancedParameter转换回HttpParameter格式
  // 转换headers
  if (config.headers) {
    config.headers = config.headers.map(header => ({
      key: header.key,
      value: header.value,
      enabled: header.enabled,
      isDynamic: header.valueMode === 'property',
      dataType: header.dataType,
      variableName: header.variableName || '',
      description: header.description || '',
      paramType: 'header' as const,
      // 🔥 保存完整的模板信息
      valueMode: header.valueMode,
      selectedTemplate: header.selectedTemplate
    }))
  }

  // 转换params
  if (config.params) {
    config.params = config.params.map(param => ({
      key: param.key,
      value: param.value,
      enabled: param.enabled,
      isDynamic: param.valueMode === 'property',
      dataType: param.dataType,
      variableName: param.variableName || '',
      description: param.description || '',
      paramType: 'query' as const,
      // 🔥 保存完整的模板信息
      valueMode: param.valueMode,
      selectedTemplate: param.selectedTemplate
    }))
  }

  // 转换pathParams并保持向后兼容
  if (config.pathParams && config.pathParams.length > 0) {
    // 转换第一个路径参数作为pathParameter（保持向后兼容）
    const firstParam = config.pathParams[0]
    config.pathParameter = {
      value: firstParam.value,
      isDynamic: firstParam.valueMode === 'property',
      dataType: firstParam.dataType,
      variableName: firstParam.variableName || '',
      description: firstParam.description || ''
    }

    // 转换pathParams为HttpParameter格式
    config.pathParams = config.pathParams.map(param => ({
      key: param.key,
      value: param.value,
      enabled: param.enabled,
      isDynamic: param.valueMode === 'property',
      dataType: param.dataType,
      variableName: param.variableName || '',
      description: param.description || '',
      paramType: 'path' as const,
      // 🔥 保存完整的模板信息
      valueMode: param.valueMode,
      selectedTemplate: param.selectedTemplate
    }))
  } else {
    config.pathParameter = undefined
    config.pathParams = []
  }

  emit('update:modelValue', config)
}

/**
 * 监听本地配置变化 - 暂时禁用自动监听，避免循环
 */
// watch(() => localConfig, updateConfig, { deep: true, flush: 'post' })

/**
 * 监听props变化同步到本地状态 - 避免循环更新
 */
let isInternalUpdate = false

const syncPropsToLocal = (newValue: any) => {
  if (!newValue) return

  // 防止多次同步相同数据
  if (isInternalUpdate) return

  isInternalUpdate = true

  try {
    // 基础配置同步
    localConfig.url = newValue.url || 'https://api.example.com/data'
    localConfig.method = newValue.method || 'GET'
    localConfig.timeout = newValue.timeout || 10000
    localConfig.pathParameter = newValue.pathParameter || undefined
    localConfig.body = newValue.body || ''
    localConfig.preRequestScript = newValue.preRequestScript || ''
    localConfig.postResponseScript = newValue.postResponseScript || ''

    // 安全地转换数组数据，使用帮助函数
    localConfig.headers = newValue.headers ? newValue.headers.map(convertHttpToEnhanced) : []
    localConfig.params = newValue.params ? newValue.params.map(convertHttpToEnhanced) : []

    // 路径参数特殊处理
    if (newValue.pathParams) {
      localConfig.pathParams = newValue.pathParams.map(convertHttpToEnhanced)
    } else if (newValue.pathParameter) {
      // 兼容旧格式
      localConfig.pathParams = [
        convertHttpToEnhanced({
          key: 'pathParam',
          value: newValue.pathParameter.value,
          enabled: true,
          isDynamic: newValue.pathParameter.isDynamic,
          variableName: newValue.pathParameter.variableName,
          description: newValue.pathParameter.description,
          dataType: newValue.pathParameter.dataType
        })
      ]
    } else {
      localConfig.pathParams = []
    }
  } finally {
    // 延迟重置标志，确保所有更新完成
    nextTick(() => {
      isInternalUpdate = false
    })
  }
}

watch(() => props.modelValue, syncPropsToLocal, { deep: true, immediate: true })
</script>

<template>
  <div class="http-config-form">
    <!-- HTTP配置模板 -->
    <div class="template-section">
      <n-dropdown
        :options="httpTemplates.map(t => ({ label: t.name, key: t.name, template: t }))"
        @select="(key, option) => applyTemplate(option.template)"
      >
        <n-button size="small" secondary>模板</n-button>
      </n-dropdown>
    </div>

    <n-tabs v-model:value="activeTab" type="line" size="small">
      <!-- 基础配置 -->
      <n-tab-pane name="basic" :tab="t('config.dataSource.http.tabs.basic')">
        <div class="config-section">
          <n-form size="small" :show-feedback="false">
            <n-form-item label="请求URL">
              <n-input
                v-model:value="localConfig.url"
                placeholder="https://api.example.com/data"
                @update:value="onUrlChange"
              />
            </n-form-item>

            <n-form-item label="请求方法">
              <n-select v-model:value="localConfig.method" :options="httpMethods" @update:value="updateConfig" />
            </n-form-item>

            <n-form-item label="超时时间 (ms)">
              <n-input-number
                v-model:value="localConfig.timeout"
                :min="1000"
                :max="60000"
                :step="1000"
                @update:value="updateConfig"
              />
            </n-form-item>

            <!-- 路径参数使用通用编辑器 -->
            <n-form-item label="路径参数">
              <n-space vertical size="small">
                <DynamicParameterEditor
                  v-model="localConfig.pathParams"
                  parameter-type="path"
                  title=""
                  add-button-text="添加路径参数"
                  key-placeholder="参数名"
                  value-placeholder="参数值"
                  custom-class="path-params-editor"
                  @update:model-value="updateConfig"
                />

                <!-- 路径参数使用说明 -->
                <n-alert v-if="localConfig.pathParams.length > 0" type="info" size="small">
                  路径参数会直接拼接到URL后面，例如：URL为 "/api/device/" + 参数值 "DEV001" = "/api/device/DEV001"
                </n-alert>
              </n-space>
            </n-form-item>

            <n-form-item v-if="showBody" label="请求体">
              <n-input
                v-model:value="localConfig.body"
                type="textarea"
                :rows="3"
                placeholder='{"key": "value"}'
                :input-props="{ style: 'font-family: monospace; font-size: 12px;' }"
                @update:value="updateConfig"
              />
            </n-form-item>
          </n-form>
        </div>
      </n-tab-pane>

      <!-- 请求头配置 -->
      <n-tab-pane name="headers" :tab="t('config.dataSource.http.tabs.headers')">
        <div class="config-section">
          <DynamicParameterEditor
            v-model="localConfig.headers"
            parameter-type="header"
            title="请求头配置"
            add-button-text="添加请求头"
            key-placeholder="头部名称"
            value-placeholder="头部值"
            @update:model-value="updateConfig"
          />
        </div>
      </n-tab-pane>

      <!-- 参数配置 -->
      <n-tab-pane name="params" :tab="t('config.dataSource.http.tabs.params')">
        <div class="config-section">
          <DynamicParameterEditor
            v-model="localConfig.params"
            parameter-type="query"
            title="查询参数配置"
            add-button-text="添加参数"
            key-placeholder="参数名"
            value-placeholder="参数值"
            @update:model-value="updateConfig"
          />
        </div>
      </n-tab-pane>

      <!-- 请求脚本 -->
      <n-tab-pane name="request-script" :tab="t('config.dataSource.http.tabs.requestScript')">
        <div class="config-section">
          <SimpleScriptEditor
            v-model:model-value="localConfig.preRequestScript"
            template-category="http-pre-request"
            :placeholder="t('config.dataSource.http.preRequestScript.placeholder')"
            height="200px"
            @update:model-value="updateConfig"
          />
        </div>
      </n-tab-pane>

      <!-- 响应脚本 -->
      <n-tab-pane name="response-script" :tab="t('config.dataSource.http.tabs.responseScript')">
        <div class="config-section">
          <SimpleScriptEditor
            v-model:model-value="localConfig.postResponseScript"
            template-category="http-post-response"
            :placeholder="t('config.dataSource.http.postResponseScript.placeholder')"
            height="200px"
            @update:model-value="updateConfig"
          />
        </div>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<style scoped>
.http-config-form {
  width: 100%;
  height: 100%;
}

.config-section {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 路径参数编辑器的自定义样式 */
.path-params-editor {
  /* 可以在这里添加特殊的路径参数样式 */
}
</style>
