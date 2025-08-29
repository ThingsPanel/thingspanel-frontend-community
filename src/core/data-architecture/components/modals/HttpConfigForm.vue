<!--
  HTTP接口配置表单组件
  恢复tab布局，去掉图标，保持紧凑
-->
<script setup lang="ts">
/**
 * HttpConfigForm - HTTP接口配置表单
 * 恢复tab布局，去掉图标装饰
 */

import { ref, reactive, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage } from 'naive-ui'
import type { HttpHeader, HttpParam, HttpConfig } from '../../types/http-config'
import {
  generateVariableName,
  createDefaultHttpHeader,
  createDefaultHttpParam,
  HTTP_CONFIG_TEMPLATES
} from '../../types/http-config'
// 导入脚本编辑器
import SimpleScriptEditor from '@/core/script-engine/components/SimpleScriptEditor.vue'

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
    body: '',
    preRequestScript: '',
    postResponseScript: ''
  })
})

const emit = defineEmits<Emits>()
const { t } = useI18n()
const message = useMessage()

/**
 * 当前活跃的标签页
 */
const activeTab = ref('basic')

/**
 * 本地配置状态
 */
const localConfig = reactive<HttpConfig>({
  url: props.modelValue?.url || 'https://api.example.com/data',
  method: props.modelValue?.method || 'GET',
  timeout: props.modelValue?.timeout || 10000,
  headers: props.modelValue?.headers || [],
  params: props.modelValue?.params || [],
  body: props.modelValue?.body || '',
  preRequestScript: props.modelValue?.preRequestScript || '',
  postResponseScript: props.modelValue?.postResponseScript || ''
})

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
 * 数据类型选项
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
 * 添加新的Header
 */
const addHeader = () => {
  const newHeader = createDefaultHttpHeader()
  localConfig.headers.push(newHeader)
  updateConfig()
}

/**
 * 删除Header
 */
const removeHeader = (index: number) => {
  localConfig.headers.splice(index, 1)
  updateConfig()
}

/**
 * 处理Header key变化，自动更新variableName
 */
const onHeaderKeyChange = (header: HttpHeader) => {
  if (header.isDynamic && header.key) {
    header.variableName = generateVariableName(header.key)
    if (!header.description) {
      header.description = `动态${header.key}参数`
    }
  }
  updateConfig()
}

/**
 * 切换Header的动态状态
 */
const toggleHeaderDynamic = (header: HttpHeader) => {
  header.isDynamic = !header.isDynamic
  if (header.isDynamic) {
    header.variableName = generateVariableName(header.key)
    if (!header.description) {
      header.description = `动态${header.key}参数`
    }
  } else {
    header.variableName = ''
    header.description = header.description || ''
  }
  updateConfig()
}

/**
 * 添加新的参数
 */
const addParam = () => {
  const newParam = createDefaultHttpParam()
  localConfig.params.push(newParam)
  updateConfig()
}

/**
 * 删除参数
 */
const removeParam = (index: number) => {
  localConfig.params.splice(index, 1)
  updateConfig()
}

/**
 * 处理Param key变化，自动更新variableName
 */
const onParamKeyChange = (param: HttpParam) => {
  if (param.isDynamic && param.key) {
    param.variableName = generateVariableName(param.key)
    if (!param.description) {
      param.description = `动态${param.key}参数`
    }
  }
  updateConfig()
}

/**
 * 切换参数的动态状态
 */
const toggleParamDynamic = (param: HttpParam) => {
  param.isDynamic = !param.isDynamic
  if (param.isDynamic) {
    param.variableName = generateVariableName(param.key)
    if (!param.description) {
      param.description = `动态${param.key}参数`
    }
  } else {
    param.variableName = ''
    param.description = param.description || ''
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
  const config = { ...localConfig }
  emit('update:modelValue', config)
}

/**
 * 监听本地配置变化
 */
watch(() => localConfig, updateConfig, { deep: true })

/**
 * 监听props变化同步到本地状态
 */
watch(
  () => props.modelValue,
  newValue => {
    if (newValue) {
      Object.assign(localConfig, newValue)
    }
  },
  { deep: true, immediate: true }
)
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
              <n-input v-model:value="localConfig.url" placeholder="https://api.example.com/data" />
            </n-form-item>

            <n-form-item label="请求方法">
              <n-select v-model:value="localConfig.method" :options="httpMethods" />
            </n-form-item>

            <n-form-item label="超时时间 (ms)">
              <n-input-number v-model:value="localConfig.timeout" :min="1000" :max="60000" :step="1000" />
            </n-form-item>

            <n-form-item v-if="showBody" label="请求体">
              <n-input
                v-model:value="localConfig.body"
                type="textarea"
                :rows="3"
                placeholder='{"key": "value"}'
                :input-props="{ style: 'font-family: monospace; font-size: 12px;' }"
              />
            </n-form-item>
          </n-form>
        </div>
      </n-tab-pane>

      <!-- 请求头配置 -->
      <n-tab-pane name="headers" :tab="t('config.dataSource.http.tabs.headers')">
        <div class="config-section">
          <div class="section-header">
            <span>请求头配置</span>
            <n-button size="small" type="primary" @click="addHeader">添加</n-button>
          </div>

          <div v-if="localConfig.headers.length > 0" class="headers-list">
            <div v-for="(header, index) in localConfig.headers" :key="index" class="header-item">
              <div class="header-row">
                <n-checkbox v-model:checked="header.enabled" />
                <n-input
                  v-model:value="header.key"
                  placeholder="头部名称"
                  size="small"
                  style="width: 120px"
                  @update:value="() => onHeaderKeyChange(header)"
                />
                <n-input
                  v-model:value="header.value"
                  :placeholder="header.isDynamic ? '示例值' : '头部值'"
                  size="small"
                  style="flex: 1"
                />
                <n-select v-model:value="header.dataType" :options="dataTypeOptions" size="small" style="width: 80px" />
                <n-button
                  size="small"
                  :type="header.isDynamic ? 'primary' : 'default'"
                  @click="toggleHeaderDynamic(header)"
                >
                  {{ header.isDynamic ? '动态' : '静态' }}
                </n-button>
                <n-button size="small" type="error" ghost @click="removeHeader(index)">删除</n-button>
              </div>

              <!-- 动态参数配置 -->
              <div v-if="header.isDynamic" class="dynamic-config">
                <n-space vertical size="small">
                  <n-text depth="3" style="font-size: 11px">
                    变量名: {{ header.variableName || '请先输入头部名称' }}
                  </n-text>
                  <n-input v-model:value="header.description" placeholder="参数描述（必填）" size="small" />
                </n-space>
              </div>
            </div>
          </div>
        </div>
      </n-tab-pane>

      <!-- 参数配置 -->
      <n-tab-pane name="params" :tab="t('config.dataSource.http.tabs.params')">
        <div class="config-section">
          <div class="section-header">
            <span>查询参数配置</span>
            <n-button size="small" type="primary" @click="addParam">添加参数</n-button>
          </div>

          <div v-if="localConfig.params.length > 0" class="params-list">
            <div v-for="(param, index) in localConfig.params" :key="index" class="param-item">
              <div class="param-row">
                <n-checkbox v-model:checked="param.enabled" />
                <n-input
                  v-model:value="param.key"
                  placeholder="参数名"
                  size="small"
                  style="width: 120px"
                  @update:value="() => onParamKeyChange(param)"
                />
                <n-input
                  v-model:value="param.value"
                  :placeholder="param.isDynamic ? '示例值' : '参数值'"
                  size="small"
                  style="flex: 1"
                />
                <n-select v-model:value="param.dataType" :options="dataTypeOptions" size="small" style="width: 80px" />
                <n-button
                  size="small"
                  :type="param.isDynamic ? 'primary' : 'default'"
                  @click="toggleParamDynamic(param)"
                >
                  {{ param.isDynamic ? '动态' : '静态' }}
                </n-button>
                <n-button size="small" type="error" ghost @click="removeParam(index)">删除</n-button>
              </div>

              <!-- 动态参数配置 -->
              <div v-if="param.isDynamic" class="dynamic-config">
                <n-space vertical size="small">
                  <n-text depth="3" style="font-size: 11px">
                    变量名: {{ param.variableName || '请先输入参数名' }}
                  </n-text>
                  <n-input v-model:value="param.description" placeholder="参数描述（必填）" size="small" />
                </n-space>
              </div>
            </div>
          </div>
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

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 8px;
}

.headers-list,
.params-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.header-item,
.param-item {
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 8px;
  background: var(--card-color);
}

.header-row,
.param-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dynamic-config {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed var(--border-color);
}

/* 响应主题变化 */
[data-theme='dark'] .header-item,
[data-theme='dark'] .param-item {
  background: var(--card-color-dark);
  border-color: var(--border-color-dark);
}
</style>
