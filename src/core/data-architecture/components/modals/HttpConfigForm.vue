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
  extractPathParamsFromUrl
} from '../../types/http-config'
// 导入分步配置组件
import HttpConfigStep1 from '../common/HttpConfigStep1.vue'
import HttpConfigStep2 from '../common/HttpConfigStep2.vue'
import HttpConfigStep3 from '../common/HttpConfigStep3.vue'
import HttpConfigStep4 from '../common/HttpConfigStep4.vue'

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
 * 当前步骤 - 分步配置向导
 * 1: 配置地址, 2: 配置头部, 3: 配置参数, 4: 请求前脚本
 */
const currentStep = ref(1)
const totalSteps = 4

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
 * 更新配置并发射事件
 */
/**
 * 步骤导航函数
 */
const nextStep = () => {
  if (currentStep.value < totalSteps) {
    currentStep.value++
  }
}

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const goToStep = (step: number) => {
  if (step >= 1 && step <= totalSteps) {
    currentStep.value = step
  }
}

/**
 * 步骤验证
 */
const canNextStep = computed(() => {
  switch (currentStep.value) {
    case 1: // 基础配置验证
      return localConfig.url && localConfig.method
    case 2: // 请求头配置（可选）
      return true
    case 3: // 参数配置（可选）
      return true
    case 4: // 脚本配置（可选）
      return true
    default:
      return false
  }
})

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
    <!-- 步骤导航 -->
    <div class="steps-section">
      <n-steps :current="currentStep" size="small" class="compact-steps">
        <n-step title="基础配置" />
        <n-step title="请求头" />
        <n-step title="参数配置" />
        <n-step title="请求脚本" />
      </n-steps>
    </div>

    <!-- 步骤内容 -->
    <div class="step-content">
      <!-- 第1步：基础配置 -->
      <HttpConfigStep1
        v-if="currentStep === 1"
        v-model="localConfig"
        @url-change="onUrlChange"
      />

      <!-- 第2步：请求头配置 -->
      <HttpConfigStep2
        v-if="currentStep === 2"
        v-model="localConfig"
      />

      <!-- 第3步：参数配置 -->
      <HttpConfigStep3
        v-if="currentStep === 3"
        v-model="localConfig"
      />

      <!-- 第4步：请求前脚本 -->
      <HttpConfigStep4
        v-if="currentStep === 4"
        v-model="localConfig"
      />
    </div>

    <!-- 步骤导航按钮 -->
    <div class="step-navigation">
      <n-space justify="space-between">
        <n-button v-if="currentStep > 1" secondary @click="prevStep">上一步</n-button>
        <div v-else></div>

        <n-button
          v-if="currentStep < totalSteps"
          type="primary"
          :disabled="!canNextStep"
          @click="nextStep"
        >
          下一步
        </n-button>
        <div v-else></div>
      </n-space>
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


.steps-section {
  padding: 8px 0;
}

.compact-steps {
  margin: 0;
}

.compact-steps :deep(.n-step) {
  margin-bottom: 0;
}

.compact-steps :deep(.n-step-splitor) {
  margin: 0 8px;
}

.compact-steps :deep(.n-step-header) {
  font-size: 12px;
}

.step-content {
  flex: 1;
  min-height: 450px;
  max-height: 600px;
  overflow-y: auto;
  display: flex;
  align-items: flex-start;
}

.step-navigation {
  padding: 20px 0 8px 0;
  border-top: 1px solid var(--border-color);
  margin-top: auto;
  position: sticky;
  bottom: 0;
  background: var(--body-color);
  z-index: 10;
}

</style>
