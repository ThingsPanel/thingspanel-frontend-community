<!--
  HTTP配置第1步 - 基础配置组件
  配置URL、请求方法、超时时间和请求体
-->
<script setup lang="ts">
/**
 * HttpConfigStep1 - HTTP基础配置步骤
 * 包含URL、请求方法、超时时间、请求体配置
 */

import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { HttpConfig } from '../../types/http-config'
import DynamicParameterEditor from './DynamicParameterEditor.vue'
import { internalAddressOptions, getApiByValue } from '../../data/internal-address-data'
import type { InternalApiItem } from '../../types/internal-api'
import type { EnhancedParameter } from '../../types/parameter-editor'

interface Props {
  /** HTTP配置数据 */
  modelValue: Partial<HttpConfig>
}

interface Emits {
  (e: 'update:modelValue', value: Props['modelValue']): void
  (e: 'urlChange'): void
  (e: 'apiInfoUpdate', apiInfo: any): void // 新增：接口信息更新事件
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useI18n()

/**
 * 地址类型选择：直接从modelValue获取和设置
 */
const addressType = computed({
  get: () => props.modelValue.addressType || 'external',
  set: (value: 'internal' | 'external') => {
    updateConfig('addressType', value)
  }
})

/**
 * 获取选中的API信息
 */
const selectedApiInfo = computed(() => {
  if (!selectedInternalAddress.value) return null
  return getApiByValue(selectedInternalAddress.value)
})

/**
 * 选中的内部地址：直接从modelValue获取和设置
 */
const selectedInternalAddress = computed({
  get: () => props.modelValue.selectedInternalAddress || '',
  set: (value: string) => {
    updateConfig('selectedInternalAddress', value)
  }
})

/**
 * 是否启用传参
 */
const enableParams = ref(false)

/**
 * 传参配置
 */
const urlParams = ref<EnhancedParameter[]>([])

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
 * 是否显示请求体配置
 */
const showBody = computed(() => {
  return ['POST', 'PUT', 'PATCH'].includes(props.modelValue.method || '')
})

/**
 * 更新配置数据
 */
const updateConfig = (field: keyof HttpConfig, value: any) => {
  console.log(`🔄 [HttpConfigStep1] 更新HTTP配置 ${field}:`, JSON.stringify(value))
  console.log(`🔄 [HttpConfigStep1] 当前modelValue:`, props.modelValue)
  const newConfig = {
    ...props.modelValue,
    [field]: value
  }
  console.log('🔄 [HttpConfigStep1] 新配置对象:', newConfig)
  console.log('🔄 [HttpConfigStep1] 准备发射update:modelValue事件')
  emit('update:modelValue', newConfig)
  console.log('🔄 [HttpConfigStep1] update:modelValue事件已发射')
}

/**
 * 地址类型变化处理
 */
const onAddressTypeChange = (type: 'internal' | 'external') => {
  console.log('🔄 [HttpConfigStep1] 地址类型变化:', addressType.value, '->', type)

  addressType.value = type

  if (type === 'external') {
    // 切换到外部地址时，清空内部地址相关配置
    selectedInternalAddress.value = ''
    enableParams.value = false
    urlParams.value = []
  } else {
    // 切换到内部地址时，清空URL和所有相关状态
    selectedInternalAddress.value = ''
    enableParams.value = false
    urlParams.value = []
    updateConfig('url', '')
  }
}

/**
 * 内部地址选择处理
 */
const onInternalAddressSelect = (value: string, option: any) => {
  console.log('📊 选中内部地址:', value, option)
  selectedInternalAddress.value = value

  // 获取API详情信息
  const apiInfo = getApiByValue(value)
  if (apiInfo) {
    console.log('📊 找到API信息:', apiInfo)

    // 同时设置请求方法
    updateConfig('method', apiInfo.method)

    // 立即设置初始URL（无参数替换的版本）
    updateConfig('url', apiInfo.url)

    // 🔥 发射接口信息更新事件，让父组件知道当前选择的接口
    emit('apiInfoUpdate', apiInfo)

    // 🔥 修复：选择内部地址时不自动填充参数，只记录是否有参数
    if (apiInfo.hasPathParams && apiInfo.pathParamNames) {
      console.log('📊 检测到路径参数，但不自动填充:', apiInfo.pathParamNames)
      // 只清空现有参数，不自动生成新的
      urlParams.value = []
      enableParams.value = false
    } else {
      // 没有路径参数时，清空参数配置
      urlParams.value = []
      enableParams.value = false
    }
  } else {
    console.warn('⚠️ 未找到API信息，直接使用选择的值')
    // 如果没有找到API信息，直接使用选择的值
    updateConfig('url', value)
  }
}

/**
 * 传参启用状态变化
 */
const onEnableParamsChange = (enabled: boolean) => {
  enableParams.value = enabled
  if (!enabled) {
    urlParams.value = []
    // 禁用参数时，恢复到原始URL（不进行参数替换）
    const apiInfo = selectedApiInfo.value
    if (apiInfo) {
      updateConfig('url', apiInfo.url)
    }
  }
}

/**
 * 传参配置更新
 */
const onUrlParamsUpdate = (params: EnhancedParameter[]) => {
  console.log('📊 参数配置更新:', params)
  urlParams.value = params

  // 实时更新最终URL到HTTP配置中
  const apiInfo = selectedApiInfo.value
  if (apiInfo && enableParams.value) {
    let url = apiInfo.url
    console.log('📊 原始URL:', url)

    // 替换路径参数
    params.forEach(param => {
      if (param.enabled && param.key && param.value) {
        console.log(`📊 替换参数 {${param.key}} -> ${param.value}`)
        url = url.replace(`{${param.key}}`, param.value)
      }
    })

    console.log('📊 最终URL:', url)
    updateConfig('url', url)
  }
}

/**
 * URL变化时触发事件
 */
const onUrlChange = (value: string) => {
  console.log('🔄 [HttpConfigStep1] URL变化:', value)
  console.log('🔄 [HttpConfigStep1] 当前地址类型:', addressType.value)
  updateConfig('url', value)
  emit('urlChange')
}

/**
 * 格式化地址显示文本
 */
const formatAddressDisplayText = (apiInfo: InternalApiItem) => {
  return `${apiInfo.label} (${apiInfo.method} ${apiInfo.url})`
}

/**
 * 当前地址的显示文本（包含路径参数替换）
 */
const currentAddressDisplay = computed(() => {
  if (addressType.value === 'external') {
    return props.modelValue.url || ''
  }

  const apiInfo = selectedApiInfo.value
  if (apiInfo) {
    let url = apiInfo.url

    // 如果启用了参数配置，用实际参数值替换URL中的占位符
    if (enableParams.value && urlParams.value.length > 0) {
      urlParams.value.forEach(param => {
        if (param.enabled && param.key && param.value) {
          url = url.replace(`{${param.key}}`, param.value)
        }
      })
    }

    return `${apiInfo.label} (${apiInfo.method} ${url})`
  }

  return props.modelValue.url || ''
})

/**
 * 获取处理过路径参数的最终URL
 */
const getFinalUrl = computed(() => {
  if (addressType.value === 'external') {
    return props.modelValue.url || ''
  }

  const apiInfo = selectedApiInfo.value
  if (apiInfo) {
    let url = apiInfo.url

    // 替换路径参数
    if (enableParams.value && urlParams.value.length > 0) {
      urlParams.value.forEach(param => {
        if (param.enabled && param.key && param.value) {
          url = url.replace(`{${param.key}}`, param.value)
        }
      })
    }

    return url
  }

  return props.modelValue.url || ''
})
</script>

<template>
  <div class="http-config-step1">
    <n-form size="small" :show-feedback="false">
      <!-- 地址类型选择 -->
      <n-form-item label="地址类型" required>
        <n-radio-group :value="addressType" @update:value="onAddressTypeChange">
          <n-radio value="external">外部地址</n-radio>
          <n-radio value="internal">内部地址</n-radio>
        </n-radio-group>
      </n-form-item>

      <!-- 外部地址输入 -->
      <n-form-item v-if="addressType === 'external'" label="请求URL" required>
        <n-input :value="modelValue.url" placeholder="https://api.example.com/data" @update:value="onUrlChange" />
      </n-form-item>

      <!-- 内部地址选择 -->
      <n-form-item v-if="addressType === 'internal'" label="选择内部接口" required>
        <n-select
          :value="selectedInternalAddress"
          :options="internalAddressOptions"
          placeholder="请选择内部接口"
          @update:value="onInternalAddressSelect"
        />
      </n-form-item>

      <!-- 地址显示 -->
      <n-form-item v-if="modelValue.url" label="当前地址">
        <n-input :value="currentAddressDisplay" readonly placeholder="将显示选中的地址">
          <template #prefix>
            <span class="address-type-indicator">
              {{ addressType === 'internal' ? '💻' : '🌐' }}
            </span>
          </template>
          <template #suffix>
            <n-button text size="small" @click="() => navigator.clipboard?.writeText(getFinalUrl)">复制</n-button>
          </template>
        </n-input>
      </n-form-item>

      <!-- 是否启用传参 -->
      <n-form-item v-if="addressType === 'internal' && selectedApiInfo?.hasPathParams" label="URL传参">
        <n-space align="center">
          <n-switch :value="enableParams" @update:value="onEnableParamsChange" />
          <n-text depth="3" style="font-size: 12px">
            配置URL路径参数值
            <n-text v-if="selectedApiInfo?.pathParamNames" type="info" style="margin-left: 8px">
              (需要配置: {{ selectedApiInfo.pathParamNames.join(', ') }})
            </n-text>
          </n-text>
        </n-space>
      </n-form-item>

      <!-- 传参配置 -->
      <n-form-item v-if="addressType === 'internal' && enableParams && selectedApiInfo?.hasPathParams" label="参数配置">
        <DynamicParameterEditor
          :model-value="urlParams"
          parameter-type="path"
          title=""
          add-button-text="添加URL参数"
          key-placeholder="参数名（如：id）"
          value-placeholder="参数值"
          :max-parameters="1"
          :current-api-info="selectedApiInfo"
          @update:model-value="onUrlParamsUpdate"
        />
        <n-text v-if="urlParams.length === 0" depth="3" style="font-size: 12px; margin-top: 8px">
          💡 提示：配置参数值后将自动替换到上方地址的占位符中
        </n-text>
        <n-text v-else-if="urlParams.length > 0" depth="3" style="font-size: 12px; margin-top: 8px">
          ✅ 参数已配置，地址中的 {{ '{' + urlParams[0].key + '}' }} 将被替换为 "{{ urlParams[0].value }}"
        </n-text>
      </n-form-item>

      <n-form-item label="请求方法" required>
        <n-select
          :value="modelValue.method"
          :options="httpMethods"
          @update:value="value => updateConfig('method', value)"
        />
      </n-form-item>

      <n-form-item label="超时时间 (ms)">
        <n-input-number
          :value="modelValue.timeout"
          :min="1000"
          :max="60000"
          :step="1000"
          @update:value="value => updateConfig('timeout', value)"
        />
      </n-form-item>

      <n-form-item v-if="showBody" label="请求体">
        <n-input
          :value="modelValue.body"
          type="textarea"
          :rows="4"
          placeholder='{"key": "value"}'
          :input-props="{ style: 'font-family: monospace; font-size: 12px;' }"
          @update:value="value => updateConfig('body', value)"
        />
      </n-form-item>
    </n-form>
  </div>
</template>

<style scoped>
.http-config-step1 {
  width: 100%;
  padding: 12px;
}

/* 地址显示区域样式 */
.http-config-step1 :deep(.n-input--readonly) {
  background-color: var(--code-color);
  border: 1px solid var(--border-color);
}

.http-config-step1 :deep(.n-input--readonly .n-input__input) {
  color: var(--text-color);
  font-family: monospace;
  font-size: 13px;
  font-weight: 500;
}

.address-type-indicator {
  display: inline-flex;
  align-items: center;
  font-size: 14px;
  margin-right: 4px;
}
</style>
