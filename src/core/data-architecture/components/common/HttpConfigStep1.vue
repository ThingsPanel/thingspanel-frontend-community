<!--
  HTTP配置第1步 - 基础配置组件
  配置URL、请求方法、超时时间和请求体
-->
<script setup lang="ts">
/**
 * HttpConfigStep1 - HTTP基础配置步骤
 * 包含URL、请求方法、超时时间、请求体配置
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { HttpConfig } from '../../types/http-config'

interface Props {
  /** HTTP配置数据 */
  modelValue: Partial<HttpConfig>
}

interface Emits {
  (e: 'update:modelValue', value: Props['modelValue']): void
  (e: 'urlChange'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useI18n()

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
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value
  })
}

/**
 * URL变化时触发事件
 */
const onUrlChange = (value: string) => {
  updateConfig('url', value)
  emit('urlChange')
}
</script>

<template>
  <div class="http-config-step1">
    <n-form size="small" :show-feedback="false">
      <n-form-item label="请求URL" required>
        <n-input
          :value="modelValue.url"
          placeholder="https://api.example.com/data"
          @update:value="onUrlChange"
        />
      </n-form-item>

      <n-form-item label="请求方法" required>
        <n-select 
          :value="modelValue.method" 
          :options="httpMethods" 
          @update:value="(value) => updateConfig('method', value)" 
        />
      </n-form-item>

      <n-form-item label="超时时间 (ms)">
        <n-input-number
          :value="modelValue.timeout"
          :min="1000"
          :max="60000"
          :step="1000"
          @update:value="(value) => updateConfig('timeout', value)"
        />
      </n-form-item>

      <n-form-item v-if="showBody" label="请求体">
        <n-input
          :value="modelValue.body"
          type="textarea"
          :rows="4"
          placeholder='{"key": "value"}'
          :input-props="{ style: 'font-family: monospace; font-size: 12px;' }"
          @update:value="(value) => updateConfig('body', value)"
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
</style>