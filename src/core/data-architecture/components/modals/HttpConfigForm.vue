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
import { extractPathParamsFromUrl } from '../../types/http-config'
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
  console.log('🔥 [父组件] 接收到接口信息更新:', apiInfo)
  currentApiInfo.value = apiInfo
}

/**
 * Tab切换函数
 */
const switchToTab = (tab: 'basic' | 'headers' | 'params' | 'scripts') => {
  console.log('🔄 切换到Tab:', tab)
  currentTab.value = tab
}

/**
 * Tab验证 - 基础配置是否完成
 */
const isBasicConfigValid = computed(() => {
  return localConfig.url && localConfig.method
})

/**
 * 简化的配置更新函数 - 立即发射事件，不进行复杂转换
 */
const updateConfig = () => {
  // 🔥 关键修复：直接发射当前localConfig，让响应式系统正常工作
  console.log('🔥 [父组件] HttpConfigForm updateConfig 被调用!')
  console.log('🔥 [父组件] localConfig.headers 当前值:', JSON.stringify(localConfig.headers, null, 2))
  console.log('🔥 [父组件] localConfig.params 当前值:', JSON.stringify(localConfig.params, null, 2))
  console.log('🔥 [父组件] 完整 localConfig:', JSON.stringify(localConfig, null, 2))

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
    config.pathParameter = {
      value: firstParam.value,
      isDynamic: firstParam.valueMode === 'property',
      dataType: firstParam.dataType,
      variableName: firstParam.variableName || '',
      description: firstParam.description || ''
    }
  } else {
    config.pathParameter = undefined
    config.pathParams = []
  }

  console.log('🔥 [父组件] HttpConfigForm 准备emit事件，最终config:', JSON.stringify(config, null, 2))
  emit('update:modelValue', config)
  console.log('🔥 [父组件] HttpConfigForm emit事件已发射!')
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
  console.log('🔥 [父组件] safeUpdateConfig 被调用!')
  console.log('🔥 [父组件] isUpdatingFromProps:', isUpdatingFromProps)
  console.log('🔥 [父组件] isUpdatingToParent:', isUpdatingToParent)

  if (isUpdatingFromProps || isUpdatingToParent) {
    console.log('⏸️ [父组件] HttpConfigForm 跳过更新 - 防止循环:', { isUpdatingFromProps, isUpdatingToParent })
    return
  }

  isUpdatingToParent = true
  console.log('🔄 [父组件] HttpConfigForm 开始安全更新配置')

  try {
    updateConfig()
  } finally {
    // 延迟重置，确保更新完成
    nextTick(() => {
      isUpdatingToParent = false
      console.log('🔄 [父组件] HttpConfigForm 安全更新完成，标志重置')
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
      console.log('🔧 [父组件] 检测到从Props更新，延迟触发safeUpdateConfig')
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
 * 监听props变化同步到本地状态 - 添加防护机制
 */
const syncPropsToLocal = (newValue: any) => {
  if (!newValue || isUpdatingToParent) return

  isUpdatingFromProps = true
  console.log('📥 HttpConfigForm syncPropsToLocal:', newValue)

  try {
    // 基础配置同步
    localConfig.url = newValue.url !== undefined ? newValue.url : localConfig.url
    localConfig.method = newValue.method || 'GET'
    localConfig.timeout = newValue.timeout || 10000
    localConfig.addressType = newValue.addressType || 'external'
    localConfig.selectedInternalAddress = newValue.selectedInternalAddress || ''
    localConfig.pathParameter = newValue.pathParameter || undefined
    localConfig.body = newValue.body !== undefined ? newValue.body : localConfig.body
    localConfig.preRequestScript =
      newValue.preRequestScript !== undefined ? newValue.preRequestScript : localConfig.preRequestScript

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
    <!-- Tab导航 - 替代步骤条 -->
    <div class="tabs-section">
      <n-tabs v-model:value="currentTab" type="line" size="small" :animated="true" @update:value="switchToTab">
        <n-tab-pane name="basic" tab="基础配置">
          <HttpConfigStep1
            :model-value="localConfig"
            @update:model-value="
              value => {
                console.log('🔥 [父组件] 接收到Step1更新:', value)
                Object.assign(localConfig, value)
              }
            "
            @url-change="onUrlChange"
            @api-info-update="onApiInfoUpdate"
          />
        </n-tab-pane>

        <n-tab-pane name="headers" tab="请求头" :disabled="!isBasicConfigValid">
          <HttpConfigStep2
            :model-value="localConfig"
            :current-api-info="currentApiInfo"
            @update:model-value="
              value => {
                console.log('🔥 [父组件] 接收到Step2更新:', value)
                Object.assign(localConfig, value)
              }
            "
          />
        </n-tab-pane>

        <n-tab-pane name="params" tab="参数配置" :disabled="!isBasicConfigValid">
          <HttpConfigStep3
            :model-value="localConfig"
            :current-api-info="currentApiInfo"
            @update:model-value="
              value => {
                console.log('🔥 [父组件] 接收到Step3更新:', value)
                console.log('🔄 [父组件] 更新前localConfig.params:', localConfig.params)
                console.log('🔄 [父组件] 当前状态标志:', { isUpdatingFromProps, isUpdatingToParent })

                // 🔧 强制重置循环保护标志，确保参数更新能通过
                if (isUpdatingFromProps) {
                  console.log('🔧 [父组件] 强制重置isUpdatingFromProps，允许参数更新')
                  isUpdatingFromProps = false
                }

                // 🔥 强制响应式更新 - 使用直接赋值替代Object.assign
                localConfig.params = value.params || []

                console.log('🔄 [父组件] 更新后localConfig.params:', localConfig.params)

                // 🔥 强制刷新组件状态
                nextTick(() => {
                  console.log('🔄 [父组件] nextTick - Step3参数更新完成')
                })
              }
            "
          />
        </n-tab-pane>

        <n-tab-pane name="scripts" tab="请求脚本" :disabled="!isBasicConfigValid">
          <HttpConfigStep4
            :model-value="localConfig"
            @update:model-value="
              value => {
                console.log('🔥 [父组件] 接收到Step4更新:', value)
                Object.assign(localConfig, value)
              }
            "
          />
        </n-tab-pane>
      </n-tabs>
    </div>

    <!-- 配置状态提示 -->
    <div v-if="!isBasicConfigValid" class="config-tip">
      <n-alert type="info" style="margin-top: 16px">📝 请先完成基础配置（URL和请求方法），然后可以配置其他选项</n-alert>
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
}

/* Tab内容样式调整 */
.tabs-section :deep(.n-tab-pane) {
  min-height: 450px;
  max-height: 600px;
  overflow-y: auto;
  padding: 16px 0;
}

/* Tab标签样式 */
.tabs-section :deep(.n-tabs-nav) {
  margin-bottom: 16px;
}

.config-tip {
  padding: 12px;
}
</style>
