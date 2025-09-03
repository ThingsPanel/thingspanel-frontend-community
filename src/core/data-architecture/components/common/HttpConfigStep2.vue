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
import type { EnhancedParameter } from '../../types/parameter-editor'
import DynamicParameterEditor from './DynamicParameterEditor.vue'

interface Props {
  /** HTTP配置数据 */
  modelValue: Partial<HttpConfig>
  /** 当前选择的内部接口信息 */
  currentApiInfo?: any
}

interface Emits {
  (e: 'update:modelValue', value: Props['modelValue']): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

/**
 * 更新请求头配置 - 增强调试
 */
const updateHeaders = (headers: EnhancedParameter[]) => {
  console.log('🔥 [子组件Step2] updateHeaders 被调用!')
  console.log('🔥 [子组件Step2] 接收到的headers:', JSON.stringify(headers, null, 2))
  console.log('🔥 [子组件Step2] 当前props.modelValue:', JSON.stringify(props.modelValue, null, 2))

  const updatedValue = {
    ...props.modelValue,
    headers
  }
  console.log('🔥 [子组件Step2] 准备emit的updatedValue:', JSON.stringify(updatedValue, null, 2))

  emit('update:modelValue', updatedValue)
  console.log('🔥 [子组件Step2] emit事件已发射!')
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
      :current-api-info="currentApiInfo"
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
