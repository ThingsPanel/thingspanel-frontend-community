<!--
  HTTP配置第2步 - 请求头配置组件
  使用DynamicParameterEditor配置HTTP请求头
-->
<script setup lang="ts">
/**
 * HttpConfigStep2 - HTTP请求头配置步骤
 * 使用通用的动态参数编辑器配置请求头
 */

import type { HttpConfig } from '../../types/http-config'
import DynamicParameterEditor from './DynamicParameterEditor.vue'

interface Props {
  /** HTTP配置数据 */
  modelValue: Partial<HttpConfig>
}

interface Emits {
  (e: 'update:modelValue', value: Props['modelValue']): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

/**
 * 更新请求头配置
 */
const updateHeaders = (headers: any[]) => {
  emit('update:modelValue', {
    ...props.modelValue,
    headers
  })
}
</script>

<template>
  <div class="http-config-step2">
    <DynamicParameterEditor
      :model-value="modelValue.headers || []"
      parameter-type="header"
      title="请求头配置"
      add-button-text="添加请求头"
      key-placeholder="头部名称（如：Content-Type）"
      value-placeholder="头部值（如：application/json）"
      @update:model-value="updateHeaders"
    />

  </div>
</template>

<style scoped>
.http-config-step2 {
  width: 100%;
  padding: 12px;
}
</style>