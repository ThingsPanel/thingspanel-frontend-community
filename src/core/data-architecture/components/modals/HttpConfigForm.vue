<!--
  HTTP配置表单组件 - UI优化版（单栏布局）
  ✨ 优化亮点：
  1. 渐进式引导：未完成基础配置时其他Tab显示锁定提示
  2. 参数计数器：实时显示各类参数数量
-->
<script setup lang="ts">
/**
 * HttpConfigForm - HTTP接口配置表单（UI优化版）
 *
 * 🎯 优化：表单验证渐进式引导（Tab锁定图标、Hover提示、参数计数）
 */

import { ref, reactive, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage } from 'naive-ui'
import type {
  HttpHeader,
  HttpParam,
  HttpPathParam,
  HttpConfig,
  PathParameter
} from '@/core/data-architecture/types/http-config'
import { extractPathParamsFromUrl } from '@/core/data-architecture/types/http-config'
// 导入分步配置组件
import HttpConfigStep1 from '@/core/data-architecture/components/common/HttpConfigStep1.vue'
import HttpConfigStep2 from '@/core/data-architecture/components/common/HttpConfigStep2.vue'
import HttpConfigStep3 from '@/core/data-architecture/components/common/HttpConfigStep3.vue'
import HttpConfigStep4 from '@/core/data-architecture/components/common/HttpConfigStep4.vue'
// 导入图标
import { LockClosedOutline as LockIcon } from '@vicons/ionicons5'

// Props接口 - 支持v-model模式
interface Props {
  /** v-model绑定的HTTP配置 */
  modelValue?: Partial<HttpConfig>
  /** 🔥 新增：当前组件ID，用于属性绑定 */
  componentId?: string
}

// Emits接口
interface Emits {
  (e: 'update:modelValue', value: Props['modelValue']): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({
    url: '',
    method: 'GET',
    timeout: 10000,
    addressType: 'external', // 默认为外部地址
    selectedInternalAddress: '',
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
 * 当前Tab - 改用Tab切换替代步骤条
 * 'basic': 基础配置, 'headers': 请求头, 'params': 参数配置, 'scripts': 请求脚本
 */
const currentTab = ref<'basic' | 'headers' | 'params' | 'scripts'>('basic')

/**
 * 当前选择的内部接口信息 - 用于接口模板功能
 */
const currentApiInfo = ref(null)

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
 * 本地配置状态 - 包含地址类型状态
 */
const localConfig = reactive<HttpConfig>({
  url: '',
  method: 'GET',
  timeout: 10000,
  addressType: 'external',
  selectedInternalAddress: '',
  pathParameter: undefined,
  headers: [],
  params: [],
  pathParams: [],
  body: '',
  preRequestScript: ''
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
 * 处理接口信息更新（从Step1传递过来）
 */
const onApiInfoUpdate = (apiInfo: any) => {
  currentApiInfo.value = apiInfo
}

/**
 * Tab切换函数
 */
const switchToTab = (tab: 'basic' | 'headers' | 'params' | 'scripts') => {
  currentTab.value = tab
}

/**
 * 🎯 优化：Tab验证 - 基础配置是否完成
 */
const isBasicConfigValid = computed(() => {
  return localConfig.url && localConfig.method
})

/**
 * 🎯 优化：计算各类参数的数量（用于Tab计数显示）
 */
const headersCount = computed(() => {
  return localConfig.headers?.filter(h => h.enabled !== false).length || 0
})

const paramsCount = computed(() => {
  return localConfig.params?.filter(p => p.enabled !== false).length || 0
})

const pathParamsCount = computed(() => {
  return localConfig.pathParams?.filter(p => p.enabled !== false).length || 0
})

/**
 * 简化的配置更新函数 - 立即发射事件，不进行复杂转换
 */
const updateConfig = () => {
  // 🔥 关键修复：直接发射当前localConfig，让响应式系统正常工作

  const config = { ...localConfig }

  // 🔥 简化转换逻辑：只进行必要的格式转换
  if (config.headers) {
    config.headers = config.headers.map(header => ({
      ...header,
      isDynamic: header.valueMode === 'property',
      paramType: 'header' as const
    }))
  }

  if (config.params) {
    config.params = config.params.map(param => ({
      ...param,
      isDynamic: param.valueMode === 'property',
      paramType: 'query' as const
    }))
  }

  if (config.pathParams && config.pathParams.length > 0) {
    // 转换pathParams
    config.pathParams = config.pathParams.map(param => ({
      ...param,
      isDynamic: param.valueMode === 'property',
      paramType: 'path' as const
    }))

    // 保持向后兼容：设置pathParameter
    const firstParam = config.pathParams[0]
    if (process.env.NODE_ENV === 'development') {
    }

    config.pathParameter = {
      value: firstParam.value,
      isDynamic: firstParam.valueMode === 'component' || firstParam.selectedTemplate === 'component-property-binding',
      dataType: firstParam.dataType,
      variableName: firstParam.variableName || '',
      description: firstParam.description || '',
      // 🔥 关键修复：保存完整的字段，确保DataItemFetcher能正确识别
      selectedTemplate: firstParam.selectedTemplate,
      defaultValue: firstParam.defaultValue,
      key: firstParam.key,
      enabled: firstParam.enabled
    }

    if (process.env.NODE_ENV === 'development') {
    }
  } else {
    config.pathParameter = undefined
    config.pathParams = []
  }

  emit('update:modelValue', config)
}

/**
 * 防止循环更新的同步标识
 */
let isUpdatingFromProps = false
let isUpdatingToParent = false

/**
 * 安全的配置更新 - 防止循环更新
 */
const safeUpdateConfig = () => {
  if (isUpdatingFromProps || isUpdatingToParent) {
    return
  }

  isUpdatingToParent = true

  try {
    updateConfig()
  } finally {
    // 延迟重置，确保更新完成
    nextTick(() => {
      isUpdatingToParent = false
    })
  }
}

/**
 * 监听本地配置变化 - 使用防护机制
 */
watch(
  () => localConfig,
  () => {
    // 🔥 强制重置标志，确保参数更新不被阻止
    if (isUpdatingFromProps) {
      nextTick(() => {
        isUpdatingFromProps = false
        safeUpdateConfig()
      })
    } else {
      safeUpdateConfig()
    }
  },
  {
    deep: true,
    flush: 'post'
  }
)

/**
 * 监听props变化同步到本地状态 - 改进防护机制
 */
const syncPropsToLocal = (newValue: any) => {
  if (!newValue) return

  // 🔥 改进：只在必要时阻止同步，允许正常的数据回显
  if (isUpdatingToParent && !isUpdatingFromProps) {
    return
  }

  isUpdatingFromProps = true

  try {
    // 🔥 关键修复：优先保留现有值，只在新值明确提供时覆盖
    if (newValue.url !== undefined) localConfig.url = newValue.url
    if (newValue.method !== undefined) localConfig.method = newValue.method
    if (newValue.timeout !== undefined) localConfig.timeout = newValue.timeout

    // 🔥 地址类型相关字段的完整同步，确保回显正确
    if (newValue.addressType !== undefined) localConfig.addressType = newValue.addressType
    if (newValue.selectedInternalAddress !== undefined) {
      localConfig.selectedInternalAddress = newValue.selectedInternalAddress
    }
    if (newValue.enableParams !== undefined) localConfig.enableParams = newValue.enableParams
    if (newValue.pathParameter !== undefined) localConfig.pathParameter = newValue.pathParameter
    if (newValue.body !== undefined) localConfig.body = newValue.body
    if (newValue.preRequestScript !== undefined) {
      localConfig.preRequestScript = newValue.preRequestScript
    }

    // 数组数据转换
    localConfig.headers = newValue.headers ? newValue.headers.map(convertHttpToEnhanced) : []
    localConfig.params = newValue.params ? newValue.params.map(convertHttpToEnhanced) : []

    // 路径参数处理
    if (newValue.pathParams) {
      localConfig.pathParams = newValue.pathParams.map(convertHttpToEnhanced)
    } else if (newValue.pathParameter) {
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
    // 延迟重置，确保同步完成
    nextTick(() => {
      isUpdatingFromProps = false
    })
  }
}

watch(() => props.modelValue, syncPropsToLocal, { deep: true, immediate: true })
</script>

<template>
  <div class="http-config-form">
    <!-- 🎯 优化：Tab导航 - 带锁定提示和参数计数 -->
    <div class="tabs-section">
      <n-tabs v-model:value="currentTab" type="line" size="medium" :animated="true" @update:value="switchToTab">
        <!-- 基础配置Tab -->
        <n-tab-pane name="basic">
          <template #tab>
            <n-space :size="4" align="center">
              <span>{{ isBasicConfigValid ? '●' : '○' }}</span>
              <span>基础配置</span>
              <n-tag v-if="isBasicConfigValid" type="success" size="small" :bordered="false">✓</n-tag>
            </n-space>
          </template>
          <HttpConfigStep1
            :model-value="localConfig"
            :component-id="componentId"
            @update:model-value="
              value => {
                Object.assign(localConfig, value)
              }
            "
            @url-change="onUrlChange"
            @api-info-update="onApiInfoUpdate"
          />
        </n-tab-pane>

        <!-- 请求头Tab -->
        <n-tab-pane name="headers" :disabled="!isBasicConfigValid">
          <template #tab>
            <n-tooltip :disabled="isBasicConfigValid">
              <template #trigger>
                <n-space :size="4" align="center">
                  <n-icon v-if="!isBasicConfigValid" size="14"><lock-icon /></n-icon>
                  <span>请求头</span>
                  <n-tag v-if="headersCount > 0" type="info" size="small" :bordered="false">{{ headersCount }}</n-tag>
                </n-space>
              </template>
              请先完成基础配置（URL和请求方法）
            </n-tooltip>
          </template>
          <HttpConfigStep2
            :model-value="localConfig"
            :component-id="componentId"
            :current-api-info="currentApiInfo"
            @update:model-value="
              value => {
                Object.assign(localConfig, value)
              }
            "
          />
        </n-tab-pane>

        <!-- 参数配置Tab -->
        <n-tab-pane name="params" :disabled="!isBasicConfigValid">
          <template #tab>
            <n-tooltip :disabled="isBasicConfigValid">
              <template #trigger>
                <n-space :size="4" align="center">
                  <n-icon v-if="!isBasicConfigValid" size="14"><lock-icon /></n-icon>
                  <span>参数配置</span>
                  <n-tag v-if="paramsCount > 0" type="info" size="small" :bordered="false">{{ paramsCount }}</n-tag>
                </n-space>
              </template>
              请先完成基础配置（URL和请求方法）
            </n-tooltip>
          </template>
          <HttpConfigStep3
            :model-value="localConfig"
            :component-id="componentId"
            :current-api-info="currentApiInfo"
            @update:model-value="
              value => {
                // 🔧 强制重置循环保护标志，确保参数更新能通过
                if (isUpdatingFromProps) {
                  isUpdatingFromProps = false
                }

                // 🔥 强制响应式更新 - 使用直接赋值替代Object.assign
                localConfig.params = value.params || []

                // 🔥 强制刷新组件状态
                nextTick(() => {})
              }
            "
          />
        </n-tab-pane>

        <!-- 请求脚本Tab -->
        <n-tab-pane name="scripts" :disabled="!isBasicConfigValid">
          <template #tab>
            <n-tooltip :disabled="isBasicConfigValid">
              <template #trigger>
                <n-space :size="4" align="center">
                  <n-icon v-if="!isBasicConfigValid" size="14"><lock-icon /></n-icon>
                  <span>请求脚本</span>
                  <n-tag v-if="localConfig.preRequestScript" type="warning" size="small" :bordered="false">
                    已配置
                  </n-tag>
                </n-space>
              </template>
              请先完成基础配置（URL和请求方法）
            </n-tooltip>
          </template>
          <HttpConfigStep4
            :model-value="localConfig"
            :component-id="componentId"
            @update:model-value="
              value => {
                Object.assign(localConfig, value)
              }
            "
          />
        </n-tab-pane>
      </n-tabs>
    </div>

    <!-- 🎯 优化：配置状态提示 -->
    <div v-if="!isBasicConfigValid" class="config-tip">
      <n-alert type="info" style="margin-top: 16px">
        <template #header>
          <n-space align="center">
            <span>📝 配置进度</span>
          </n-space>
        </template>
        <n-space vertical size="small">
          <n-text depth="3">请先完成基础配置，然后可以配置其他选项</n-text>
          <n-progress
            type="line"
            :percentage="localConfig.url && localConfig.method ? 100 : localConfig.url || localConfig.method ? 50 : 0"
            :show-indicator="true"
            status="info"
          />
          <n-space size="small">
            <n-tag :type="localConfig.url ? 'success' : 'default'" size="small">
              {{ localConfig.url ? '✓' : '○' }} URL
            </n-tag>
            <n-tag :type="localConfig.method ? 'success' : 'default'" size="small">
              {{ localConfig.method ? '✓' : '○' }} 请求方法
            </n-tag>
          </n-space>
        </n-space>
      </n-alert>
    </div>
  </div>
</template>

<style scoped>
.http-config-form {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tabs-section {
  flex: 1;
  min-height: 500px;
  overflow: visible; /* 🔥 修复：确保下拉菜单不被外层容器裁剪 */
  position: relative;
}

/* Tab内容样式调整 */
.tabs-section :deep(.n-tab-pane) {
  min-height: 450px;
  max-height: 600px;
  overflow-y: visible; /* 🔥 修复：改为visible避免下拉菜单被裁剪 */
  padding: 16px 0;
  position: relative;
  z-index: 1;
}

/* Tab标签样式 */
.tabs-section :deep(.n-tabs-nav) {
  margin-bottom: 16px;
}

.config-tip {
  padding: 12px;
}

/* Tab标签增强样式 */
.tabs-section :deep(.n-tabs-tab) {
  padding: 8px 16px;
}

.tabs-section :deep(.n-tabs-tab--disabled) {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 锁定图标样式 */
.tabs-section :deep(.n-tabs-tab--disabled .n-icon) {
  color: var(--warning-color);
}
</style>
